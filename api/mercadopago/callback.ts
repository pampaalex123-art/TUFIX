import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const getDb = () => {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')) });
  }
  return getFirestore();
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query;
  const appId = process.env.MERCADO_PAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET;
  const redirectUri = process.env.MERCADO_PAGO_REDIRECT_URI;
  const baseUrl = process.env.APP_URL || 'https://tufix.vercel.app';

  if (!code || !state) {
    return res.redirect(`${baseUrl}?mp_error=missing_params`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: appId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('MP OAuth Error:', tokenData);
      return res.redirect(`${baseUrl}?mp_error=token_failed`);
    }

    const stateStr = String(state);
    const db = getDb();

    if (stateStr.includes('admin=true')) {
      // Save admin/holding account token
      await db.collection('config').doc('mercadopago').set({
        holdingAccount: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          userId: tokenData.user_id,
          linkedAt: new Date().toISOString(),
        }
      }, { merge: true });
      return res.redirect(`${baseUrl}?mp_success=admin`);
    } else {
      // Save worker token
      const workerId = stateStr.replace('workerId=', '');
      await db.collection('workers').doc(workerId).update({
        'payoutDetails.mercadoPago': {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          userId: tokenData.user_id,
          linkedAt: new Date().toISOString(),
        }
      });
      // Redirect back to app with success
      return res.redirect(`${baseUrl}?mp_success=worker&workerId=${workerId}`);
    }

  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    return res.redirect(`${baseUrl}?mp_error=${encodeURIComponent(error.message)}`);
  }
}