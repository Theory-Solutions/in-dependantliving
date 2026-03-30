/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAOX4VRVtRGMA09zw0_dzzUOQoU-FiQhdI',
  authDomain: 'in-dependant-living.firebaseapp.com',
  projectId: 'in-dependant-living',
  storageBucket: 'in-dependant-living.firebasestorage.app',
  messagingSenderId: '1059035900052',
  appId: '1:1059035900052:ios:01dce7dc367bb1d86dec81',
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth with AsyncStorage persistence (survives app restarts)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore database
export const db = getFirestore(app);

// Cloud Storage (profile photos)
export const storage = getStorage(app);

export default app;
