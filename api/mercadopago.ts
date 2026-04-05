import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, payer, external_reference, workerId } = req.body;

  try {
    const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('MP_ACCESS_TOKEN no está configurado en las variables de entorno.');
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const baseUrl = process.env.APP_URL || 'https://tufix.vercel.app';

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + Number(item.unit_price) * Number(item.quantity),
      0
    );
    const marketplaceFee = Math.round(totalAmount * 0.1 * 100) / 100;

    const body: any = {
      items: items.map((item: any) => ({
        title: item.title,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        currency_id: item.currency_id || 'ARS',
      })),
      payer: {
        email: payer?.email || 'test@test.com',
      },
      external_reference,
      back_urls: {
        success: `${baseUrl}/payment-status?status=success&jobId=${external_reference}`,
        failure: `${baseUrl}/payment-status?status=failure&jobId=${external_reference}`,
        pending: `${baseUrl}/payment-status?status=pending&jobId=${external_reference}`,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
    };

    const result = await preference.create({ body }) as any;

    return res.status(200).json({
      id: result.id,
      init_point: result.init_point,
      mobile_init_point: result.mobile_init_point,
    });

  } catch (error: any) {
    console.error('MercadoPago Error:', error.message || error);
    return res.status(500).json({ error: error.message || 'Error creating payment preference' });
  }
}