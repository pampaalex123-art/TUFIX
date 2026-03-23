import express from 'express';
import cors from 'cors';
import twilio from 'twilio';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfigJson from './firebase-applet-config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const adminApp = !admin.apps.length 
  ? admin.initializeApp({
      projectId: firebaseConfigJson.projectId,
    })
  : admin.app();

const db = getFirestore(adminApp, firebaseConfigJson.firestoreDatabaseId);
const messaging = admin.messaging();

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
