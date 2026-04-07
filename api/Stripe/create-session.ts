import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key, { apiVersion: '2024-06-20' });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    amount,
    currency,
    invoiceId,
    jobId,
    workerId,
    description,
    customerEmail,
  } = req.body;

  if (!amount || !currency || !invoiceId) {
    return res.status(400).json({ error: 'amount, currency, and invoiceId are required' });
  }

  try {
    const stripe = getStripe();
    const baseUrl = process.env.APP_URL || 'https://tufix.vercel.app';

    // Stripe expects amounts in the smallest currency unit (cents)
    // USD: $10.00 = 1000 cents | BOB and ARS are also in cents
    const unitAmount = Math.round(Number(amount) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description || `Pago de Servicio TUFIX`,
              description: `Factura #${invoiceId.slice(-6)} — TUFIX`,
              images: ['https://tufix.vercel.app/favicon.ico'],
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail || undefined,
      metadata: {
        invoiceId,
        jobId: jobId || '',
        workerId: workerId || '',
        tufixReference: `TUFIX-${invoiceId.slice(-6)}`,
      },
      success_url: `${baseUrl}/payment-status?status=success&invoiceId=${invoiceId}&jobId=${jobId}&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment-status?status=cancelled&invoiceId=${invoiceId}&jobId=${jobId}&provider=stripe`,
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('Stripe create-session error:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to create Stripe session' });
  }
}