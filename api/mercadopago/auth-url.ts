import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { workerId, isAdmin } = req.query;

  const appId = process.env.MERCADO_PAGO_CLIENT_ID;
  const redirectUri = process.env.MERCADO_PAGO_REDIRECT_URI;

  if (!appId || !redirectUri) {
    return res.status(500).json({ error: 'Mercado Pago configuration missing' });
  }

  const state = isAdmin === 'true' ? 'admin=true' : `workerId=${workerId}`;
  const authUrl = `https://auth.mercadopago.com/authorization?client_id=${appId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

  return res.status(200).json({ url: authUrl });
}