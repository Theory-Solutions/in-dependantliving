/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 */

import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Generate a random 6-digit pairing code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Create a pairing code for a senior ────────────────────────────────────
export async function createPairingCode(seniorUid) {
  let code;
  let attempts = 0;

  // Ensure code is unique
  do {
    code = generateCode();
    const existing = await getPairingByCode(code);
    attempts++;
    if (attempts > 10) throw new Error('Could not generate unique pairing code');
  } while (existing);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48hr expiry

  await setDoc(doc(db, 'pairingCodes', code), {
    code,
    seniorUid,
    createdAt: serverTimestamp(),
    expiresAt: expiresAt.toISOString(),
    used: false,
  });

  // Save code on user's profile
  await updateDoc(doc(db, 'users', seniorUid), {
    pairingCode: code,
    updatedAt: serverTimestamp(),
  });

  return code;
}

// ── Look up a pairing code ─────────────────────────────────────────────────
export async function getPairingByCode(code) {
  const snap = await getDoc(doc(db, 'pairingCodes', code));
  return snap.exists() ? snap.data() : null;
}

// ── Family member enters code to connect ──────────────────────────────────
export async function connectWithCode(familyUid, code) {
  const pairing = await getPairingByCode(code);

  if (!pairing) throw new Error('Invalid pairing code. Please check and try again.');
  if (pairing.used) throw new Error('This code has already been used.');
  if (new Date(pairing.expiresAt) < new Date()) throw new Error('This code has expired. Ask them to generate a new one.');

  const seniorUid = pairing.seniorUid;

  // Mark code as used
  await updateDoc(doc(db, 'pairingCodes', code), { used: true });

  // Add each to the other's pairedWith list
  const familyRef = doc(db, 'users', familyUid);
  const seniorRef = doc(db, 'users', seniorUid);

  const [familySnap, seniorSnap] = await Promise.all([
    getDoc(familyRef),
    getDoc(seniorRef),
  ]);

  const familyData = familySnap.data();
  const seniorData = seniorSnap.data();

  const updatedFamilyPaired = [...new Set([...(familyData.pairedWith || []), seniorUid])];
  const updatedSeniorPaired = [...new Set([...(seniorData.pairedWith || []), familyUid])];

  await Promise.all([
    updateDoc(familyRef, { pairedWith: updatedFamilyPaired, updatedAt: serverTimestamp() }),
    updateDoc(seniorRef, { pairedWith: updatedSeniorPaired, updatedAt: serverTimestamp() }),
  ]);

  return { seniorUid, seniorName: seniorData.name };
}

// ── Get all people this user is connected to ──────────────────────────────
export async function getConnectedUsers(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return [];

  const pairedWith = snap.data().pairedWith || [];
  if (pairedWith.length === 0) return [];

  const profiles = await Promise.all(
    pairedWith.map(id => getDoc(doc(db, 'users', id)))
  );

  return profiles
    .filter(s => s.exists())
    .map(s => s.data());
}
