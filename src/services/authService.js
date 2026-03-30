/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// ── Register new user ──────────────────────────────────────────────────────
export async function registerUser({ email, password, name, role }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  // Create user profile in Firestore
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    name,
    email,
    role,            // 'senior' | 'family'
    pairingCode: null,
    pairedWith: [],  // array of uids this user is connected to
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return cred.user;
}

// ── Sign in ────────────────────────────────────────────────────────────────
export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ── Sign out ───────────────────────────────────────────────────────────────
export async function logoutUser() {
  await signOut(auth);
}

// ── Get user profile from Firestore ───────────────────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ── Password reset ─────────────────────────────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ── Auth state listener ────────────────────────────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export const currentUser = () => auth.currentUser;
