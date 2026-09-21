import { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { UserRole } from '@/types';

/** Creates a profile on first login without ever allowing the client to elevate its role. */
export async function syncUserProfile(user: User): Promise<UserRole> {
  const userRef = doc(db, 'Users', user.uid);
  const existing = await getDoc(userRef);
  await setDoc(userRef, {
    uid: user.uid,
    displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Sinh viên VKU',
    email: user.email ?? null,
    photoURL: user.photoURL ?? null,
    provider: user.providerData[0]?.providerId ?? 'password',
    emailVerified: user.emailVerified,
    lastLoginAt: serverTimestamp(),
    ...(existing.exists() ? {} : { createdAt: serverTimestamp(), role: 'student' }),
  }, { merge: true });
  return existing.data()?.role === 'admin' ? 'admin' : 'student';
}

export const syncGoogleUserProfile = syncUserProfile;
