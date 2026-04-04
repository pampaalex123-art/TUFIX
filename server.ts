import express from 'express';
import cors from 'cors';
import twilio from 'twilio';
import { MercadoPagoConfig, OAuth, Preference, Payment } from 'mercadopago';
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
    // Force the use of the project ID from your firebase-applet-config.json
    const projectId = firebaseConfigJson.projectId;
    console.log('Initializing Firebase Admin strictly with project ID:', projectId);
    
    const app = admin.initializeApp({
      projectId: projectId,
      credential: admin.credential.applicationDefault(),
    });
    
    console.log('Firebase Admin initialized successfully. Project ID:', app.options.projectId);
    return app;
  } catch (e: any) {
    console.error('Firebase Admin initialization failed:', e.message);
    throw e;
  }
}

const adminApp = await initializeFirebaseAdmin();
// Use the named database if provided, otherwise fallback to (default)
const firestoreDatabaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';
console.log('Primary Firestore Database ID:', firestoreDatabaseId);

let db = getFirestore(adminApp, firestoreDatabaseId);

// Test connection and fallback to (default) if needed
async function verifyFirestoreConnection() {
  try {
    console.log(`Testing connection to Firestore database: ${firestoreDatabaseId}...`);
    // Try to get a document from a common collection to verify the database exists
    await db.collection('users').limit(1).get();
    console.log(`Successfully connected to Firestore database: ${firestoreDatabaseId}`);
  } catch (err: any) {
    const errMsg = err.message?.toLowerCase() || '';
    console.warn(`Initial connection test failed for database ${firestoreDatabaseId}: ${err.message}`);
    
    // If the error suggests the database is not found or permission denied, try (default)
    if (firestoreDatabaseId !== '(default)' && 
        (errMsg.includes('not found') || errMsg.includes('5') || errMsg.includes('permission') || errMsg.includes('7'))) {
      console.log('Attempting fallback to (default) database...');
      try {
        const fallbackDb = getFirestore(adminApp, '(default)');
        await fallbackDb.collection('users').limit(1).get();
        console.log('Successfully connected to (default) database. Updating global db instance.');
        db = fallbackDb;
      } catch (defaultErr: any) {
        console.error('Fallback to (default) database also failed:', defaultErr.message);
        // We'll stick with the original db instance and let the listeners handle retries
      }
    }
  }
}

await verifyFirestoreConnection();

const messaging = adminApp.messaging();
const authAdmin = adminApp.auth();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Firestore Listener for Notifications with Robust Error Handling & Retries
  let notificationRetryCount = 0;
  const MAX_NOTIFICATION_RETRIES = 5;

  const setupNotificationListener = () => {
    if (notificationRetryCount >= MAX_NOTIFICATION_RETRIES) {
      console.error('CRITICAL: Max retries reached for notification listener. Stopping retries.');
      return;
    }

    console.log('Setting up Firestore notification listener...');
    
    // Test connection first
    db.collection('notifications').limit(1).get()
      .then(() => {
        console.log('Successfully connected to Firestore notifications collection.');
        notificationRetryCount = 0; // Reset counter on success
      })
      .catch(err => console.error('Initial connection test to notifications failed:', err.message));

    const unsubscribe = db.collection('notifications')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot((snapshot) => {
        console.log(`Notification snapshot received: ${snapshot.size} items`);
        notificationRetryCount = 0; // Reset counter on successful snapshot
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
        notificationRetryCount++;
        
        const errMsg = error.message?.toLowerCase() || '';
        if (errMsg.includes('permission') || errMsg.includes('7')) {
          console.error('CRITICAL: Permission denied for notification listener. This usually means the Service Account lacks access to the database.');
        }
        
        if (notificationRetryCount < MAX_NOTIFICATION_RETRIES) {
          const delay = 10000 * notificationRetryCount; // Exponential-ish backoff
          console.log(`Retrying notification listener in ${delay / 1000} seconds (Attempt ${notificationRetryCount}/${MAX_NOTIFICATION_RETRIES})...`);
          setTimeout(setupNotificationListener, delay);
        } else {
          console.error('CRITICAL: Max retries reached for notification listener.');
        }
      });
  };

  setupNotificationListener();

  // API Route to promote a user to admin
  app.post('/api/admin/promote', async (req, res) => {
    const { uid } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await authAdmin.verifyIdToken(idToken);
      const isSystemAdmin = decodedToken.email === 'admin@tufix.com' || 
                            decodedToken.email === 'pampa.alex123@gmail.com' ||
                            decodedToken.email === 'admin@admin';

      if (!isSystemAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only system admins can promote others' });
      }

      await authAdmin.setCustomUserClaims(uid, { admin: true });
      console.log(`User ${uid} promoted to admin successfully.`);
      
      // Also update the user document in Firestore
      const userRef = db.collection('users').doc(uid);
      const workerRef = db.collection('workers').doc(uid);
      
      const [userDoc, workerDoc] = await Promise.all([userRef.get(), workerRef.get()]);
      
      if (userDoc.exists) {
        await userRef.update({ userType: 'admin' });
      } else if (workerDoc.exists) {
        await workerRef.update({ userType: 'admin' });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Promote Admin Error:', error);
      res.status(500).json({ error: error.message || 'Failed to promote user' });
    }
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
  app.get('/api/mercadopago/auth-url', (req, res) => {
    const { workerId, isAdmin } = req.query;
    const appId = process.env.MERCADO_PAGO_APP_ID || process.env.MERCADO_PAGO_CLIENT_ID;
    const redirectUri = process.env.MERCADO_PAGO_REDIRECT_URI;

    if (!appId || !redirectUri) {
      return res.status(500).json({ error: 'Mercado Pago configuration missing (APP_ID or REDIRECT_URI)' });
    }

    const state = isAdmin === 'true' ? 'admin=true' : `workerId=${workerId}`;
    const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${appId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
    res.json({ url: authUrl });
  });

  // API Route to handle Mercado Pago Callback
  app.get('/api/mercadopago/callback', async (req, res) => {
    const { code, state } = req.query;
    const appId = process.env.MERCADO_PAGO_APP_ID || process.env.MERCADO_PAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET;
    const redirectUri = process.env.MERCADO_PAGO_REDIRECT_URI;

    if (!code || !appId || !clientSecret || !redirectUri) {
      return res.status(400).json({ error: 'Invalid request: missing code or configuration' });
    }

    try {
      const response = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: appId,
          client_secret: clientSecret,
          code: code as string,
          redirect_uri: redirectUri,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to exchange code for token');
      }

      // data contains: access_token, public_key, refresh_token, user_id, etc.
      const stateStr = state as string;
      
      if (stateStr === 'admin=true') {
        // Store in a global config or admin document
        await db.collection('config').doc('mercadopago').set({
          holdingAccount: {
            accessToken: data.access_token,
            publicKey: data.public_key,
            refreshToken: data.refresh_token,
            userId: data.user_id,
            updatedAt: new Date().toISOString(),
          }
        }, { merge: true });
        console.log('Mercado Pago tokens stored for Admin Holding Account');
      } else {
        const workerId = stateStr?.split('=')[1];
        if (workerId) {
          await db.collection('workers').doc(workerId).update({
            'payoutDetails.mercadoPago': {
              accessToken: data.access_token,
              publicKey: data.public_key,
              refreshToken: data.refresh_token,
              userId: data.user_id,
              updatedAt: new Date().toISOString(),
            },
          });
          console.log('Mercado Pago tokens stored for worker:', workerId);
        }
      }

      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f3f4f6;">
            <div style="background: white; padding: 2rem; border-radius: 1rem; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center;">
              <h2 style="color: #7c3aed;">¡Conexión Exitosa!</h2>
              <p>Tu cuenta de Mercado Pago ha sido vinculada correctamente.</p>
              <p style="font-size: 0.875rem; color: #6b7280;">Esta ventana se cerrará automáticamente.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                  setTimeout(() => window.close(), 2000);
                } else {
                  setTimeout(() => window.location.href = '/?mp_linked=true', 2000);
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('Mercado Pago OAuth Error:', error);
      res.status(500).send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fef2f2;">
            <div style="background: white; padding: 2rem; border-radius: 1rem; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center;">
              <h2 style="color: #dc2626;">Error de Conexión</h2>
              <p>${error.message || 'No se pudo vincular la cuenta de Mercado Pago.'}</p>
              <button onclick="window.close()" style="background: #dc2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem;">Cerrar</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Create Mercado Pago Payment Preference
  app.post('/api/mercadopago/create-preference', async (req, res) => {
    const { items, payer, external_reference, workerId } = req.body;
    
    try {
      // 1. Get Worker's Access Token (Seller)
      const workerDoc = await db.collection('workers').doc(workerId).get();
      const workerData = workerDoc.data();
      const workerAccessToken = workerData?.payoutDetails?.mercadoPago?.accessToken;
      
      // 2. Get Admin Holding Account Access Token (Marketplace)
      const configDoc = await db.collection('config').doc('mercadopago').get();
      const holdingAccount = configDoc.data()?.holdingAccount;
      
      // If worker hasn't linked, we can't do a marketplace split automatically.
      // For this implementation, we'll use the worker's token if available, 
      // or fallback to admin's token (but then the whole amount goes to admin).
      const sellerAccessToken = workerAccessToken || holdingAccount?.accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

      if (!sellerAccessToken) {
        throw new Error('No se pudo encontrar una cuenta de cobro válida. Por favor, contacte al administrador.');
      }

      // 3. Calculate Marketplace Fee (10%)
      const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.unit_price) * Number(item.quantity)), 0);
      const marketplaceFee = Math.round(totalAmount * 0.1 * 100) / 100; // 10% fee

      // 4. Create Preference using Mercado Pago SDK
      const client = new MercadoPagoConfig({ accessToken: sellerAccessToken });
      const preference = new Preference(client);

      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      
      const body: any = {
        items: items.map((item: any) => ({
          title: item.title,
          unit_price: Number(item.unit_price),
          quantity: Number(item.quantity),
          currency_id: item.currency_id || 'ARS'
        })),
        payer: {
          email: payer.email,
        },
        external_reference: external_reference,
        back_urls: {
          success: `${baseUrl}/payment-status?status=success&jobId=${external_reference}`,
          failure: `${baseUrl}/payment-status?status=failure&jobId=${external_reference}`,
          pending: `${baseUrl}/payment-status?status=pending&jobId=${external_reference}`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
      };

      // marketplace_fee only works if the accessToken belongs to a seller linked to the marketplace app
      if (workerAccessToken && marketplaceFee > 0) {
        body.marketplace_fee = marketplaceFee;
      }

      const result = await preference.create({ body });
      res.json({ 
  id: result.id, 
  init_point: result.init_point,
  mobile_init_point: result.mobile_init_point 
});

    } catch (error: any) {
      console.error('Mercado Pago Preference Error:', error.message || error);
      res.status(500).json({ 
        error: error.message || 'Error creating preference'
      });
    }
  });

  // Function to release funds to worker when both parties confirm
  const releaseWorkerFunds = async (jobId: string) => {
    console.log(`Attempting to release funds for job: ${jobId}`);
    
    try {
      const jobRef = db.collection('jobRequests').doc(jobId);
      const jobDoc = await jobRef.get();
      
      if (!jobDoc.exists) {
        console.error(`Job ${jobId} not found for fund release.`);
        return;
      }
      
      const jobData = jobDoc.data();
      const { client_confirmed, worker_confirmed, workerId, invoiceId } = jobData || {};
      
      if (!client_confirmed || !worker_confirmed) {
        console.log(`Funds for job ${jobId} not released yet. Client confirmed: ${client_confirmed}, Worker confirmed: ${worker_confirmed}`);
        return;
      }
      
      // Both confirmed! Proceed to release funds.
      console.log(`Both parties confirmed job ${jobId}. Releasing funds...`);
      
      // 1. Get the Payment ID (stored in the invoice or as transactionId)
      let paymentId = jobData?.paymentId;
      
      if (!paymentId && invoiceId) {
        const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
        paymentId = invoiceDoc.data()?.transactionId;
      }
      
      if (!paymentId) {
        console.error(`No payment ID found for job ${jobId}. Cannot capture/release funds.`);
        return;
      }
      
      // 2. Get Worker's Access Token to perform the capture
      const workerDoc = await db.collection('workers').doc(workerId).get();
      const workerAccessToken = workerDoc.data()?.payoutDetails?.mercadoPago?.accessToken;
      
      if (!workerAccessToken) {
        console.error(`Worker ${workerId} has no access token. Cannot capture funds.`);
        return;
      }
      
      // 3. Call Mercado Pago API to capture the payment
      const client = new MercadoPagoConfig({ accessToken: workerAccessToken });
      const payment = new Payment(client);
      
      try {
        // Capture the payment (this releases it from authorized/pending to approved)
        // Note: In Preferences, it might already be approved, but we follow the user's request for "capture/release"
        await payment.capture({ id: paymentId });
        console.log(`Payment ${paymentId} captured successfully via Mercado Pago.`);
      } catch (mpError: any) {
        console.error('Mercado Pago Capture Error:', mpError);
        // If it's already captured, we might get an error, but we should still update our status
        if (!mpError.message?.includes('already_captured')) {
          throw mpError;
        }
      }
      
      // 4. Update Firestore statuses
      const batch = db.batch();
      
      // Update Job Request
      batch.update(jobRef, { 
        status: 'paid_and_released',
        releasedAt: new Date().toISOString()
      });
      
      // Update Invoice if exists
      if (invoiceId) {
        batch.update(db.collection('invoices').doc(invoiceId), {
          status: 'released',
          releasedAt: new Date().toISOString()
        });
      }
      
      await batch.commit();
      console.log(`Job ${jobId} status updated to paid_and_released.`);
      
      // 5. Notify both parties
      const notifications = [
        {
          id: `notif-released-user-${Date.now()}`,
          userId: jobData?.user?.id,
          type: 'status_update',
          message: `Job completed! Funds have been released to the worker.`,
          isRead: false,
          timestamp: new Date().toISOString(),
          relatedEntityId: jobId
        },
        {
          id: `notif-released-worker-${Date.now()}`,
          userId: workerId,
          type: 'status_update',
          message: `Success! Your funds for job ${jobId} have been released to your account.`,
          isRead: false,
          timestamp: new Date().toISOString(),
          relatedEntityId: jobId
        }
      ];
      
      for (const notif of notifications) {
        await db.collection('notifications').doc(notif.id).set(notif);
      }
      
    } catch (error) {
      console.error(`Error in releaseWorkerFunds for job ${jobId}:`, error);
    }
  };

  // API Route to confirm job completion (Client or Worker)
  app.post('/api/jobs/:jobId/confirm', async (req, res) => {
    const { jobId } = req.params;
    const { role } = req.body; // 'client' or 'worker'
    
    if (role !== 'client' && role !== 'worker') {
      return res.status(400).json({ error: 'Invalid role. Must be client or worker.' });
    }
    
    try {
      const field = role === 'client' ? 'client_confirmed' : 'worker_confirmed';
      await db.collection('jobRequests').doc(jobId).update({
        [field]: true,
        [`${role}ConfirmedAt`]: new Date().toISOString()
      });
      
      console.log(`${role} confirmed job ${jobId}`);
      
      // Trigger fund release check
      await releaseWorkerFunds(jobId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Job Confirmation Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook to receive Mercado Pago Payment Notifications
  app.post(['/api/mercadopago/webhook', '/api/mercadopago/webhooks'], async (req, res) => {
    const { action, data, type } = req.body;
    console.log('Mercado Pago Webhook Received:', { action, data, type });

    // Handle both 'action' (newer) and 'type' (older) webhook formats
    const eventType = type || (action ? action.split('.')[0] : null);
    const eventAction = action || (type ? `${type}.updated` : null);

    if (eventType === 'payment') {
      const paymentId = data?.id || req.body.resource?.split('/').pop();
      
      if (paymentId) {
        try {
          // Fetch full payment details to get external_reference (jobId)
          // We need an access token. We'll use the admin's holding account token for general lookups
          const configDoc = await db.collection('config').doc('mercadopago').get();
          const adminAccessToken = configDoc.data()?.holdingAccount?.accessToken;
          
          if (adminAccessToken) {
            const client = new MercadoPagoConfig({ accessToken: adminAccessToken });
            const payment = new Payment(client);
            const paymentDetails = await payment.get({ id: paymentId });
            
            const jobId = paymentDetails.external_reference;
            const status = paymentDetails.status;
            
            console.log(`Payment ${paymentId} for Job ${jobId} is now ${status}`);
            
            if (jobId) {
              // Update Job Request with Payment ID and status
              const jobRef = db.collection('jobRequests').doc(jobId);
              const jobDoc = await jobRef.get();
              
              if (jobDoc.exists) {
                const updateData: any = { paymentId: paymentId };
                
                if (status === 'approved') {
                  // If it's approved, it might be the initial payment
                  // We don't release funds yet unless both confirmed
                  updateData.paymentStatus = 'approved';
                  
                  // Update invoice if exists
                  const invoiceId = jobDoc.data()?.invoiceId;
                  if (invoiceId) {
                    await db.collection('invoices').doc(invoiceId).update({
                      transactionId: paymentId,
                      status: 'held', // Money is held by MP/Platform until release
                      paidAt: new Date().toISOString()
                    });
                  }
                }
                
                await jobRef.update(updateData);
                
                // If payment was updated to approved, check if we should release funds
                if (status === 'approved') {
                  await releaseWorkerFunds(jobId);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing payment webhook:', error);
        }
      }
    }

    res.sendStatus(200);
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
        console.log('Token verified. Audience:', decodedToken.aud);
      } catch (verifyError: any) {
        console.error('ID Token Verification Failed:', verifyError.message);
        if (verifyError.message.includes('aud')) {
          console.error('Audience mismatch detected. Token aud:', idToken.split('.')[1]); // Log part of the token for debugging (careful with PII, but this is base64 header/payload)
        }
        return res.status(401).json({ error: `Authentication failed: ${verifyError.message}` });
      }
      
      const adminUid = decodedToken.uid;
      const isSystemAdmin = decodedToken.admin === true ||
                            decodedToken.email === 'admin@tufix.com' || 
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

      // Step 1: Delete any active "Bookings" or "Service Requests" associated with the user ID
      try {
        console.log(`Step 1: Deleting associated data for UID: ${uid} using writeBatch...`);
        const batch = db.batch();
        let deletionCount = 0;

        // Job Requests
        const jobsQuery = collectionName === 'users' 
          ? db.collection('jobRequests').where('user.id', '==', uid)
          : db.collection('jobRequests').where('workerId', '==', uid);
        
        const jobsSnapshot = await jobsQuery.get();
        jobsSnapshot.forEach(doc => { batch.delete(doc.ref); deletionCount++; });

        // Notifications
        const notifsSnapshot = await db.collection('notifications').where('userId', '==', uid).get();
        notifsSnapshot.forEach(doc => { batch.delete(doc.ref); deletionCount++; });

        // Messages
        const msgsAsSender = await db.collection('messages').where('senderId', '==', uid).get();
        const msgsAsReceiver = await db.collection('messages').where('receiverId', '==', uid).get();
        msgsAsSender.forEach(doc => { batch.delete(doc.ref); deletionCount++; });
        msgsAsReceiver.forEach(doc => { batch.delete(doc.ref); deletionCount++; });

        // Step 2: Delete the user's entry from the profiles or users table
        const userRef = db.collection(collectionName).doc(uid);
        batch.delete(userRef);
        deletionCount++;

        if (deletionCount > 0) {
          console.log(`Committing batch deletion of ${deletionCount} documents...`);
          await batch.commit();
          console.log('Batch deletion successful.');
        } else {
          console.log('No documents found for deletion.');
        }
      } catch (cascadeError: any) {
        console.error('Error during batch deletion:', cascadeError.message);
        return res.status(500).json({ error: `Firestore deletion failed: ${cascadeError.message}` });
      }

      // Step 3: Delete the user's actual login credentials
      try {
        console.log(`Step 3: Deleting user ${uid} from Firebase Auth...`);
        await authAdmin.deleteUser(uid);
        console.log(`User ${uid} deleted from Firebase Auth successfully.`);
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found') {
          console.log(`User ${uid} not found in Firebase Auth, skipping.`);
        } else {
          console.error('Error deleting from Firebase Auth:', authError.code, authError.message);
          return res.status(500).json({ error: `Auth deletion failed: ${authError.message}` });
        }
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
