import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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

    // Verify the admin's token
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    // Check if requester is admin
    const adminEmails = [
      'alejandro.finochietti@yahoo.com.ar',
    ];
    const isAdmin = decodedToken.admin === true || adminEmails.includes(decodedToken.email || '');

    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only admins can delete users' });
    }

    const { uid, collectionName } = req.body;

    if (!uid || !collectionName) {
      return res.status(400).json({ error: 'uid and collectionName are required' });
    }

    const validCollections = ['users', 'workers'];
    if (!validCollections.includes(collectionName)) {
      return res.status(400).json({ error: 'Invalid collection name' });
    }

    console.log(`Admin ${decodedToken.email} deleting ${collectionName} user: ${uid}`);

    // 1. Delete from Firebase Auth
  try {
    await auth.deleteUser(uid);
  } catch (authError: any) {
    if (authError.code !== 'auth/user-not-found') {
      throw authError;
    }
  console.log(`User ${uid} not in Firebase Auth, skipping auth deletion`);
}

  // 2. Delete from Firestore
  try {
    await db.collection(collectionName).doc(uid).delete();
  } catch (fsError: any) {
    // Firestore delete on a non-existent doc throws in some SDK versions
  console.warn(`Firestore doc ${uid} not found, may already be deleted`);
}

    // 3. Clean up related data
    const batch = db.batch();

    // Delete related job requests
    const jobsQuery = await db.collection('jobRequests')
      .where(collectionName === 'workers' ? 'workerId' : 'user.id', '==', uid)
      .get();
    jobsQuery.docs.forEach(doc => batch.delete(doc.ref));

    // Delete related notifications
    const notifsQuery = await db.collection('notifications')
      .where('userId', '==', uid)
      .get();
    notifsQuery.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
    console.log(`Cleaned up related data for user: ${uid}`);

    return res.status(200).json({ 
      success: true, 
      message: `${collectionName === 'workers' ? 'Worker' : 'User'} deleted successfully` 
    });

  } catch (error: any) {
    console.error('Delete User Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
}