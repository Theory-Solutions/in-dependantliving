/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 */

import {
  doc, collection, setDoc, updateDoc, deleteDoc,
  onSnapshot, getDocs, query, orderBy,
  serverTimestamp, getDoc,
} from 'firebase/firestore';
import {
  ref, uploadBytes, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

// ─── MEDICATIONS ─────────────────────────────────────────────────────────────

// Listen to a senior's medications in real time
export function subscribeMedications(seniorUid, callback) {
  const colRef = collection(db, 'users', seniorUid, 'medications');
  const q = query(colRef, orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => {
    const meds = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(meds);
  });
}

// Add a medication
export async function addMedication(seniorUid, med) {
  const id = Date.now().toString();
  await setDoc(doc(db, 'users', seniorUid, 'medications', id), {
    ...med,
    id,
    taken: { morning: false, afternoon: false, evening: false, night: false },
    createdAt: serverTimestamp(),
  });
  return id;
}

// Mark medication taken/untaken
export async function markMedTaken(seniorUid, medId, timeSlot, taken) {
  await updateDoc(doc(db, 'users', seniorUid, 'medications', medId), {
    [`taken.${timeSlot}`]: taken,
    updatedAt: serverTimestamp(),
  });
}

// Delete a medication
export async function deleteMedication(seniorUid, medId) {
  await deleteDoc(doc(db, 'users', seniorUid, 'medications', medId));
}

// ─── CHECK-INS ────────────────────────────────────────────────────────────────

// Record a check-in
export async function recordCheckin(seniorUid) {
  const now = Date.now();
  await updateDoc(doc(db, 'users', seniorUid), {
    lastCheckin: now,
    updatedAt: serverTimestamp(),
  });
  // Also write to checkins subcollection for history
  await setDoc(doc(db, 'users', seniorUid, 'checkins', now.toString()), {
    timestamp: now,
    createdAt: serverTimestamp(),
  });
  return now;
}

// Listen to senior's check-in status (real time for family)
export function subscribeCheckin(seniorUid, callback) {
  return onSnapshot(doc(db, 'users', seniorUid), snap => {
    if (snap.exists()) {
      callback(snap.data().lastCheckin || null);
    }
  });
}

// ─── ACTIVITY DATA ────────────────────────────────────────────────────────────

// Update activity data (steps, last movement)
export async function updateActivity(seniorUid, activityData) {
  await updateDoc(doc(db, 'users', seniorUid), {
    activity: activityData,
    updatedAt: serverTimestamp(),
  });
}

// Listen to activity in real time
export function subscribeActivity(seniorUid, callback) {
  return onSnapshot(doc(db, 'users', seniorUid), snap => {
    if (snap.exists()) {
      callback(snap.data().activity || null);
    }
  });
}

// ─── PROFILE PHOTOS ──────────────────────────────────────────────────────────

// Upload profile photo to Firebase Storage
export async function uploadProfilePhoto(uid, localUri) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(storage, `profilePhotos/${uid}.jpg`);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  const downloadUrl = await getDownloadURL(storageRef);

  // Save URL to user profile
  await updateDoc(doc(db, 'users', uid), {
    profilePhotoUrl: downloadUrl,
    updatedAt: serverTimestamp(),
  });

  return downloadUrl;
}

// Get profile photo URL
export async function getProfilePhotoUrl(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data().profilePhotoUrl || null : null;
}

// ─── CALENDAR EVENTS ─────────────────────────────────────────────────────────

// Listen to a user's calendar events
export function subscribeCalendar(uid, callback) {
  const colRef = collection(db, 'users', uid, 'events');
  const q = query(colRef, orderBy('date', 'asc'));
  return onSnapshot(q, snap => {
    const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(events);
  });
}

// Add calendar event
export async function addCalendarEvent(uid, event) {
  const id = event.id || Date.now().toString();
  await setDoc(doc(db, 'users', uid, 'events', id), {
    ...event,
    id,
    createdAt: serverTimestamp(),
  });
  return id;
}

// Update calendar event
export async function updateCalendarEvent(uid, eventId, data) {
  await updateDoc(doc(db, 'users', uid, 'events', eventId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Delete calendar event
export async function deleteCalendarEvent(uid, eventId) {
  await deleteDoc(doc(db, 'users', uid, 'events', eventId));
}

// ─── FAMILY SNAPSHOT (what family sees) ──────────────────────────────────────

// Listen to senior's full status snapshot for family dashboard
export function subscribeSeniorStatus(seniorUid, callback) {
  return onSnapshot(doc(db, 'users', seniorUid), snap => {
    if (snap.exists()) callback(snap.data());
  });
}
