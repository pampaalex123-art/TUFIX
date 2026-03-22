import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';

// Twilio Client (Lazy Initialization)
let twilioClient: twilio.Twilio | null = null;
const getTwilio = () => {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required');
    }
    twilioClient = twilio(sid, token);
  }
  return twilioClient;
};

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

  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    return res.status(400).json({ error: 'Phone number and code are required' });
  }

  try {
    const client = getTwilio();
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!from) {
      throw new Error('TWILIO_PHONE_NUMBER is required');
    }

    await client.messages.create({
      body: `TUFIX Verification Code: ${code}`,
      from,
      to: phoneNumber,
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Twilio Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send SMS' });
  }
}
