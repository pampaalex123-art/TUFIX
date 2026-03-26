import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useFirestoreCollection<T extends { id: string }>(collectionName: string, initialValue: T[]): [T[], (value: T[] | ((val: T[]) => T[])) => void] {
  const [data, setData] = useState<T[]>(initialValue);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setData(initialValue);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
      console.log(`Firestore onSnapshot for ${collectionName}: ${snapshot.size} items`);
      if (snapshot.empty && initialValue.length > 0) {
        // Only seed if we are an admin to avoid permission errors for regular users
        const isAdmin = user?.email === 'admin@tufix.com' || 
                        user?.email === 'pampa.alex123@gmail.com' ||
                        user?.email === 'admin@admin';
        
        if (isAdmin) {
          const batch = writeBatch(db);
          console.log(`Seeding ${collectionName} with ${initialValue.length} items (Admin only)`);
          initialValue.forEach(item => {
            batch.set(doc(db, collectionName, item.id), item);
          });
          batch.commit().catch(err => console.error(`Error seeding ${collectionName}:`, err));
        } else {
          console.log(`Collection ${collectionName} is empty, but user is not admin. Skipping seed.`);
        }
        return;
      }
      const items = snapshot.docs.map(doc => ({ ...doc.data() as T, id: doc.id }));
      setData(items);
    }, (error) => {
      console.error(`onSnapshot error for ${collectionName}:`, error);
      handleFirestoreError(error, OperationType.LIST, collectionName);
    });
    return () => unsubscribe();
  }, [collectionName, isAuthReady, user]);

  const setValue = useCallback((value: T[] | ((val: T[]) => T[])) => {
    if (!auth.currentUser) {
      console.warn('Cannot write to Firestore: User not authenticated.');
      return;
    }

    setData(prevData => {
      const newData = typeof value === 'function' ? (value as any)(prevData) : value;
      
      // Fire and forget the Firestore updates
      (async () => {
        try {
          const batch = writeBatch(db);
          const currentUser = auth.currentUser;
          const isAdmin = currentUser?.email === 'admin@tufix.com' || 
                          currentUser?.email === 'pampa.alex123@gmail.com' ||
                          currentUser?.email === 'admin@admin';
          
          const newIds = new Set(newData.map((item: T) => item.id));
          prevData.forEach(item => {
            if (!newIds.has(item.id)) {
              // Only delete if we are the owner or admin
              // We also allow deleting 'admin-1' which is a legacy ID
              if (isAdmin || item.id === currentUser?.uid || item.id === 'admin-1') {
                batch.delete(doc(db, collectionName, item.id));
              }
            }
          });

          newData.forEach((item: T) => {
            const prevItem = prevData.find(p => p.id === item.id);
            if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
              // Only write if:
              // 1. It's a new item
              // 2. It's the current user's own item
              // 3. The current user is the admin
              const isOwner = item.id === currentUser?.uid || item.id === 'admin-1';
              
              if (!prevItem || isOwner || isAdmin) {
                batch.set(doc(db, collectionName, item.id), item);
              }
            }
          });

          console.log(`Committing batch for ${collectionName}`);
          await batch.commit();
          console.log(`Batch committed for ${collectionName}`);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, collectionName);
        }
      })();

      return newData;
    });
  }, [collectionName]);

  return [data, setValue];
}
