/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL
 */

import {
  doc, getDoc, setDoc, updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Generate a random 6-digit pairing code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Check if a code already exists ────────────────────────────────────────
async function codeExists(code) {
  try {
    const snap = await getDoc(doc(db, 'pairingCodes', code));
    return snap.exists();
  } catch (e) {
    // If we can't check, assume it doesn't exist (safe to generate new one)
    return false;
  }
}

// ── Create a pairing code for a senior ────────────────────────────────────
export async function createPairingCode(seniorUid) {
  if (!seniorUid) throw new Error('User not authenticated. Please sign in again.');

  let code;
  let attempts = 0;

  // Generate a unique code
  do {
    code = generateCode();
    attempts++;
    if (attempts > 20) {
      // Just use a timestamp-based code as fallback
      code = String(Date.now()).slice(-6);
      break;
    }
  } while (await codeExists(code));

  try {
    // Write the pairing code document
    await setDoc(doc(db, 'pairingCodes', code), {
      code,
      seniorUid,
      createdAt: serverTimestamp(),
      used: false,
      useCount: 0,
    });

    // Save code on user's profile
    await updateDoc(doc(db, 'users', seniorUid), {
      pairingCode: code,
      updatedAt: serverTimestamp(),
    });

    return code;
  } catch (e) {
    console.log('[IL] createPairingCode error:', e.message);
    throw new Error('Could not create pairing code. Please check your connection and try again.');
  }
}

// ── Look up a pairing code ─────────────────────────────────────────────────
export async function getPairingByCode(code) {
  try {
    const snap = await getDoc(doc(db, 'pairingCodes', code));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.log('[IL] getPairingByCode error:', e.message);
    return null;
  }
}

// ── Family member enters code to connect ──────────────────────────────────
export async function connectWithCode(familyUid, code) {
  if (!familyUid) throw new Error('You must be signed in to connect accounts.');
  if (!code || code.length !== 6) throw new Error('Invalid code format. Please enter all 6 digits.');

  const pairing = await getPairingByCode(code.trim());

  if (!pairing) throw new Error('Code not found. Please check the code and try again.');
  if (pairing.used && pairing.useCount >= 2) throw new Error('This code has already been used the maximum number of times.');

  const seniorUid = pairing.seniorUid;
  if (seniorUid === familyUid) throw new Error('You cannot pair with yourself.');

  try {
    const [familySnap, seniorSnap] = await Promise.all([
      getDoc(doc(db, 'users', familyUid)),
      getDoc(doc(db, 'users', seniorUid)),
    ]);

    if (!familySnap.exists()) throw new Error('Your account was not found. Please sign out and sign in again.');
    if (!seniorSnap.exists()) throw new Error('The Independent account was not found. Please try again.');

    const familyData = familySnap.data();
    const seniorData = seniorSnap.data();

    // Enforce max 2 caregivers per senior
    const seniorPaired = seniorData.pairedWith || [];
    if (seniorPaired.length >= 2) {
      throw new Error('This account already has 2 caregivers connected. The maximum is 2.');
    }

    // Check if already connected
    if (seniorPaired.includes(familyUid)) {
      return { seniorUid, seniorName: seniorData.name || 'Your loved one' };
    }

    const updatedFamilyPaired = [...new Set([...(familyData.pairedWith || []), seniorUid])];
    const updatedSeniorPaired = [...new Set([...seniorPaired, familyUid])];
    const newUseCount = (pairing.useCount || 0) + 1;

    await Promise.all([
      updateDoc(doc(db, 'users', familyUid), {
        pairedWith: updatedFamilyPaired,
        updatedAt: serverTimestamp(),
      }),
      updateDoc(doc(db, 'users', seniorUid), {
        pairedWith: updatedSeniorPaired,
        updatedAt: serverTimestamp(),
      }),
      updateDoc(doc(db, 'pairingCodes', code), {
        used: newUseCount >= 2,
        useCount: newUseCount,
        lastUsedAt: serverTimestamp(),
      }),
    ]);

    return { seniorUid, seniorName: seniorData.name || 'Your loved one' };
  } catch (e) {
    if (e.message.includes('Maximum') || e.message.includes('already') || e.message.includes('not found') || e.message.includes('yourself')) {
      throw e;
    }
    console.log('[IL] connectWithCode error:', e.message);
    throw new Error('Connection failed. Please check your internet and try again.');
  }
}

// ── Get all people this user is connected to ──────────────────────────────
export async function getConnectedUsers(uid) {
  try {
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
  } catch (e) {
    console.log('[IL] getConnectedUsers error:', e.message);
    return [];
  }
}
