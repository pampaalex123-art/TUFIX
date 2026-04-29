import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const initFirebase = () => {
  if (!getApps().length) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')),
    });
  }
  return { db: getFirestore(), auth: getAuth() };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { db, auth } = initFirebase();

    // Verify admin token
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const adminEmails = ['admin@tufix.com', 'pampa.alex123@gmail.com', 'admin@admin'];
    const isAdmin = decodedToken.admin === true || adminEmails.includes(decodedToken.email || '');
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden: Admins only' });

    const { jobId, action } = req.body; // action: 'approve' or 'reject'
    if (!jobId || !action) return res.status(400).json({ error: 'jobId and action are required' });

    const jobRef = db.collection('jobRequests').doc(jobId);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) return res.status(404).json({ error: 'Job not found' });

    const jobData = jobDoc.data()!;

    if (action === 'reject') {
      await jobRef.update({ adminPayoutStatus: 'rejected', adminReviewedAt: new Date().toISOString() });
      return res.status(200).json({ success: true, message: 'Payout rejected' });
    }

    if (action === 'approve') {
      // Get invoice for payment details
      const invoiceDoc = await db.collection('invoices').doc(jobData.invoiceId).get();
      const invoiceData = invoiceDoc.data();

      if (!invoiceData) return res.status(404).json({ error: 'Invoice not found' });

      const total = invoiceData.total;
      const workerAmount = Math.round(total * 0.9 * 100) / 100;
      const tufixFee = Math.round(total * 0.1 * 100) / 100;

      // Get TUFIX holding account token
      const configDoc = await db.collection('config').doc('mercadopago').get();
      const holdingToken = configDoc.data()?.holdingAccount?.accessToken || process.env.MP_ACCESS_TOKEN;

      if (!holdingToken) return res.status(500).json({ error: 'No holding account configured' });

      const client = new MercadoPagoConfig({ accessToken: holdingToken });
      const payment = new Payment(client);

      // Get worker MP details
      const workerDoc = await db.collection('workers').doc(jobData.workerId).get();
      const workerMP = workerDoc.data()?.payoutDetails?.mercadoPago;

      let payoutResult: any = { manual: true };

      if (workerMP?.accessToken) {
        // Automatic transfer to worker via MP
        try {
          const transfer = await (payment as any).create({
            body: {
              transaction_amount: workerAmount,
              currency_id: invoiceData.currency || 'ARS',
              description: `Pago TUFIX - Trabajo #${jobId.slice(-6)}`,
              payment_method_id: 'account_money',
              payer: { id: workerMP.userId },
            }
          });
          payoutResult = { automatic: true, transferId: transfer.id };
        } catch (mpError: any) {
          console.error('Auto transfer failed, marking as manual:', mpError.message);
          payoutResult = { manual: true, error: mpError.message };
        }
      }

      // Update all records
      const batch = db.batch();

      batch.update(jobRef, {
        adminPayoutStatus: 'approved',
        adminReviewedAt: new Date().toISOString(),
        adminPayoutResult: payoutResult,
        workerAmount,
        tufixFee,
      });

      batch.update(db.collection('invoices').doc(jobData.invoiceId), {
        status: 'released',
        releasedAt: new Date().toISOString(),
      });

      // Notify worker
      batch.set(db.collection('notifications').doc(`payout-${jobId}-${Date.now()}`), {
        userId: jobData.workerId,
        type: 'status_update',
        message: `¡Tu pago de ${workerAmount} ${invoiceData.currency} por el trabajo #${jobId.slice(-6)} ha sido aprobado!`,
        isRead: false,
        timestamp: new Date().toISOString(),
        relatedEntityId: jobId,
      });

      await batch.commit();

      return res.status(200).json({
        success: true,
        workerAmount,
        tufixFee,
        payoutResult,
        message: payoutResult.manual
          ? `Payout marked as approved. Send ${workerAmount} manually to worker.`
          : `Automatic transfer of ${workerAmount} sent to worker.`
      });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error: any) {
    console.error('Payout Approval Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process payout' });
  }
}