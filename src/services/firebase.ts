import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// Expo's React Native resolver provides this export. TypeScript follows the web
// declaration instead, so it cannot see the platform-specific symbol.
// @ts-expect-error React Native-only Firebase Auth export.
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBefMAZEnkdUBVLrBP_8rbObqDwaVZlBR0', authDomain: 'apporder-9a092.firebaseapp.com',
  projectId: 'apporder-9a092', storageBucket: 'apporder-9a092.firebasestorage.app',
  messagingSenderId: '175937838374', appId: '1:175937838374:web:ded9faf4919f0cb5caf5e7',
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = (() => {
  try {
    if (Platform.OS === 'web') {
      return getAuth(firebaseApp);
    }
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Safe during Fast Refresh, after Firebase Auth has already initialized.
    return getAuth(firebaseApp);
  }
})();
export const db = getFirestore(firebaseApp);
