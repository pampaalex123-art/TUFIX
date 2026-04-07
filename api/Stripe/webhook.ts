import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const initFirebase = () => {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')) });
  }
  return getFirestore();
};

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2024-06-20' });
};

export const config = { api: { bodyParser: false } };

const getRawBody = (req: VercelRequest): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).json({ error: 'Webhook secret not configured' });

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'] as string;
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const db = initFirebase();

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const { invoiceId, jobId, workerId } = session.metadata || {};

      if (!invoiceId) {
        console.warn('No invoiceId in session metadata');
        return res.status(200).json({ received: true });
      }

      const transactionId = `stripe_${session.id}`;
      const now = new Date().toISOString();

      const batch = db.batch();

      // Update invoice to held/paid
      const invoiceRef = db.collection('invoices').doc(invoiceId);
      batch.update(invoiceRef, {
        status: 'held',
        paidAt: now,
        transactionId,
        stripeSessionId: session.id,
        stripePaymentIntent: session.payment_intent,
      });

      // Update job request
      if (jobId) {
        const jobRef = db.collection('jobRequests').doc(jobId);
        batch.update(jobRef, {
          paymentStatus: 'paid',
          paymentProvider: 'stripe',
          stripeSessionId: session.id,
          paidAt: now,
        });

        // Create transaction record
        const txRef = db.collection('transactions').doc(transactionId);
        batch.set(txRef, {
          id: transactionId,
          invoiceId,
          jobId,
          workerId: workerId || '',
          stripeSessionId: session.id,
          amount: (session.amount_total || 0) / 100,
          currency: session.currency?.toUpperCase() || 'USD',
          status: 'held',
          paidAt: now,
          provider: 'stripe',
        });

        // Notify worker
        const notifRef = db.collection('notifications').doc(`notif-stripe-${Date.now()}`);
        batch.set(notifRef, {
          userId: workerId,
          type: 'status_update',
          message: `¡Pago recibido vía tarjeta! Los fondos están asegurados y serán liberados cuando completen el trabajo.`,
          isRead: false,
          timestamp: now,
          relatedEntityId: jobId,
        });
      }

      await batch.commit();
      console.log(`✅ Stripe payment confirmed for invoice ${invoiceId}`);
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { invoiceId } = session.metadata || {};
      if (invoiceId) {
        await db.collection('invoices').doc(invoiceId).update({
          stripeSessionExpired: true,
          stripeSessionId: session.id,
        });
      }
    }

    return res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('Stripe webhook processing error:', error);
    return res.status(500).json({ error: error.message });
  }
}