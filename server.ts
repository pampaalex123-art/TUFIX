import express from 'express';
import cors from 'cors';
import twilio from 'twilio';
import { MercadoPagoConfig, OAuth } from 'mercadopago';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfigJson from './firebase-applet-config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
async function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    console.log('Firebase Admin already initialized. Using existing app.');
    return admin.app();
  }

  try {
    console.log('Attempting default Firebase Admin initialization...');
    const app = admin.initializeApp();
    console.log('Firebase Admin initialized (default). Project ID:', app.options.projectId);
    return app;
  } catch (e: any) {
    console.log('Default initialization failed, attempting explicit initialization:', e.message);
    const app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebaseConfigJson.projectId,
    });
    console.log('Firebase Admin initialized (explicit). Project ID:', app.options.projectId);
    return app;
  }
}

const adminApp = await initializeFirebaseAdmin();
const db = getFirestore(adminApp, firebaseConfigJson.firestoreDatabaseId);
const messaging = adminApp.messaging();
const authAdmin = adminApp.auth();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Firestore Listener for Notifications
  db.collection('notifications').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const notification = change.doc.data();
        console.log('New notification added:', notification);

        try {
          // Find the user/worker to get their FCM token
          let recipientDoc = await db.collection('users').doc(notification.userId).get();
          if (!recipientDoc.exists) {
            recipientDoc = await db.collection('workers').doc(notification.userId).get();
          }

          if (recipientDoc.exists) {
            const recipientData = recipientDoc.data();
            const fcmToken = recipientData?.fcmToken;

            if (fcmToken) {
              const message = {
                notification: {
                  title: 'TUFIX Notification',
                  body: notification.message,
                },
                token: fcmToken,
              };

              await messaging.send(message);
              console.log('Push notification sent successfully to:', notification.userId);
            } else {
              console.log('No FCM token found for user:', notification.userId);
            }
          }
        } catch (error) {
          console.error('Error sending push notification:', error);
        }
      }
    });
  }, (error) => {
    console.error('Firestore onSnapshot error (notifications):', error);
  });

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

  // API Route to send OTP
  app.post('/api/send-otp', async (req, res) => {
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

      res.json({ success: true });
    } catch (error: any) {
      console.error('Twilio Error:', error);
      res.status(500).json({ error: error.message || 'Failed to send SMS' });
    }
  });

  // API Route to get Mercado Pago Auth URL
  app.get('/api/auth/mercadopago/url', (req, res) => {
    const { workerId } = req.query;
    const clientId = process.env.MERCADO_PAGO_CLIENT_ID;
    const redirectUri = process.env.MERCADO_PAGO_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: 'Mercado Pago configuration missing' });
    }

    const state = workerId ? `workerId=${workerId}` : '';
    const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
    res.json({ url: authUrl });
  });

  // API Route to create Mercado Pago Preference
  app.post('/api/create-preference', async (req, res) => {
    const { itemId, price, title, description } = req.body;
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    if (!accessToken) {
      return res.status(500).json({ error: 'Mercado Pago access token missing' });
    }

    try {
      const client = new MercadoPagoConfig({ accessToken });
      const { Preference } = await import('mercadopago');
      const preferenceClient = new Preference(client);

      const result = await preferenceClient.create({
        body: {
          items: [
            {
              id: itemId,
              title: title || 'Service Payment',
              description: description || 'Payment for service via TUFIX',
              quantity: 1,
              unit_price: Number(price),
              currency_id: 'ARS', // Defaulting to ARS for Mercado Pago Argentina, can be adjusted
            },
          ],
          back_urls: {
            success: `${appUrl}/confirmation?status=success&itemId=${itemId}`,
            failure: `${appUrl}/confirmation?status=failure&itemId=${itemId}`,
            pending: `${appUrl}/confirmation?status=pending&itemId=${itemId}`,
          },
          auto_return: 'approved',
          statement_descriptor: 'TUFIX SERVICE',
        },
      });

      res.json({ 
        id: result.id,
        init_point: result.init_point 
      });
    } catch (error: any) {
      console.error('Mercado Pago Preference Error:', error);
      res.status(500).json({ error: error.message || 'Failed to create preference' });
    }
  });

  // API Route to handle Mercado Pago Callback
  app.get('/api/auth/mercadopago/callback', async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.MERCADO_PAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET;
    const redirectUri = process.env.MERCADO_PAGO_REDIRECT_URI;

    if (!code || !clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    try {
      const response = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code: code as string,
          redirect_uri: redirectUri,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to exchange code for token');
      }

      // Store data.access_token and data.refresh_token in the database associated with the worker
      const workerId = (req.query.state as string)?.split('=')[1];
      if (workerId) {
        await db.collection('workers').doc(workerId).update({
          'payoutDetails.mercadoPago': {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            updatedAt: new Date().toISOString(),
          },
        });
      }
      console.log('Mercado Pago tokens stored for worker:', workerId);

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('Mercado Pago Error:', error);
      res.status(500).json({ error: error.message || 'Failed to link Mercado Pago' });
    }
  });

  // API Route to delete a user from Auth and Firestore
  app.get('/api/admin/debug-env', (req, res) => {
    res.json({
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
      FIREBASE_CONFIG: process.env.FIREBASE_CONFIG,
      configJsonProjectId: firebaseConfigJson.projectId,
      adminProjectId: admin.app().options.projectId,
      apps: admin.apps.map(a => a?.name),
    });
  });

  app.post('/api/admin/delete-user', async (req, res) => {
    const { uid, collectionName } = req.body;
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    console.log(`Received delete request for UID: ${uid}, Collection: ${collectionName}`);

    if (!uid || !collectionName) {
      return res.status(400).json({ error: 'UID and collection name are required' });
    }

    if (!idToken) {
      console.error('No ID token provided in request');
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
      console.log('Verifying ID token...');
      // Verify the ID token
      let decodedToken;
      try {
        decodedToken = await authAdmin.verifyIdToken(idToken);
      } catch (verifyError: any) {
        console.error('ID Token Verification Failed:', verifyError.message);
        if (verifyError.message.includes('aud')) {
          console.error('Audience mismatch detected. Token aud:', idToken.split('.')[1]); // Log part of the token for debugging (careful with PII, but this is base64 header/payload)
        }
        return res.status(401).json({ error: `Authentication failed: ${verifyError.message}` });
      }
      
      const adminUid = decodedToken.uid;
      const isSystemAdmin = decodedToken.email === 'admin@tufix.com' || 
                            decodedToken.email === 'pampa.alex123@gmail.com' ||
                            decodedToken.email === 'admin@admin';

      console.log('Token verified for admin:', adminUid, 'Email:', decodedToken.email, 'isSystemAdmin:', isSystemAdmin);

      if (!isSystemAdmin) {
        console.log('Checking admin role in Firestore for non-system admin...');
        try {
          // Check users collection first
          let adminDoc = await db.collection('users').doc(adminUid).get();
          let adminData = adminDoc.data();
          
          // If not found in users, check workers
          if (!adminDoc.exists || adminData?.userType !== 'admin') {
            console.log(`Admin role not found in users for ${adminUid}, checking workers...`);
            adminDoc = await db.collection('workers').doc(adminUid).get();
            adminData = adminDoc.data();
          }

          if (!adminDoc.exists || adminData?.userType !== 'admin') {
            console.warn(`Unauthorized deletion attempt by ${adminUid} (${decodedToken.email})`);
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
          }
          console.log('Admin role verified in Firestore for:', adminUid);
        } catch (dbError: any) {
          console.error('Error checking admin role in Firestore:', dbError.message);
          // If we can't check Firestore, we must deny access for safety, 
          // unless it's a system admin (which we already checked).
          return res.status(500).json({ error: `Failed to verify admin status: ${dbError.message}` });
        }
      } else {
        console.log('System admin verified via email, skipping Firestore check.');
      }

      console.log(`Admin ${adminUid} is deleting user ${uid} from ${collectionName}`);

      // 1. Delete from Firebase Auth
      try {
        console.log(`Attempting to delete user ${uid} from Firebase Auth...`);
        await authAdmin.deleteUser(uid);
        console.log(`User ${uid} deleted from Firebase Auth successfully`);
      } catch (authError: any) {
        // If user not found in Auth, we still want to try deleting from Firestore
        if (authError.code === 'auth/user-not-found') {
          console.log(`User ${uid} not found in Firebase Auth, proceeding to Firestore`);
        } else {
          console.error('Error deleting from Firebase Auth:', authError.code, authError.message);
          return res.status(500).json({ error: `Auth deletion failed: ${authError.message}` });
        }
      }

      // 2. Delete from Firestore
      try {
        console.log(`Attempting to delete user ${uid} from Firestore collection ${collectionName}...`);
        await db.collection(collectionName).doc(uid).delete();
        console.log(`User ${uid} deleted from Firestore collection ${collectionName} successfully`);
      } catch (firestoreError: any) {
        console.error('Error deleting from Firestore:', firestoreError.message);
        return res.status(500).json({ error: `Firestore deletion failed: ${firestoreError.message}` });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Unexpected Admin Delete Error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
