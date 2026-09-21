import { GoogleAuthProvider, User, createUserWithEmailAndPassword, signInWithCredential, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { syncGoogleUserProfile } from '@/services/users';

export async function signInWithEmail(email: string, password: string): Promise<User> { return (await signInWithEmailAndPassword(auth, email.trim(), password)).user; }
export async function registerWithEmail(email: string, password: string): Promise<User> { return (await createUserWithEmailAndPassword(auth, email.trim(), password)).user; }
export async function signInWithGoogleIdToken(idToken: string): Promise<User> {
  const user = (await signInWithCredential(auth, GoogleAuthProvider.credential(idToken))).user;
  await syncGoogleUserProfile(user);
  return user;
}
export async function signOutUser(): Promise<void> { await signOut(auth); }
