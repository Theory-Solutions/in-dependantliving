/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthChange } from '../services/authService';
import {
  subscribeMedications,
  addMedication as fbAddMed,
  markMedTaken as fbMarkTaken,
  deleteMedication as fbDeleteMed,
  recordCheckin as fbCheckin,
  subscribeCheckin,
  subscribeActivity,
  uploadProfilePhoto as fbUploadPhoto,
  getProfilePhotoUrl,
  subscribeCalendar,
  addCalendarEvent as fbAddEvent,
  updateCalendarEvent as fbUpdateEvent,
  deleteCalendarEvent as fbDeleteEvent,
  subscribeSeniorStatus,
} from '../services/syncService';
import { MOCK_MEDICATIONS } from '../constants/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = loading
  const [role, setRoleState] = useState(null);
  const [medications, setMedications] = useState(MOCK_MEDICATIONS);
  const [lastCheckin, setLastCheckin] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [profilePhotos, setProfilePhotos] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [connectedPeople, setConnectedPeople] = useState([]);
  const [settings, setSettings] = useState({
    alertThreshold: 4,
    showCheckin: true,
    notifications: {
      missedMeds: true,
      inactivity: true,
      checkinReminder: true,
    },
  });

  const unsubscribers = useRef([]);

  // ── Auth state listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Load role from AsyncStorage as fallback while Firestore loads
        const storedRole = await AsyncStorage.getItem('userRole');
        if (storedRole) setRoleState(storedRole);
      } else {
        setFirebaseUser(null);
      }
    });
    return () => unsub();
  }, []);

  // ── Subscribe to real-time data when user + role available ───────────────
  useEffect(() => {
    // Clear old subscriptions
    unsubscribers.current.forEach(fn => fn());
    unsubscribers.current = [];

    if (!firebaseUser || !role) return;

    const uid = firebaseUser.uid;

    if (role === 'senior') {
      // Subscribe to own medications
      const unsubMeds = subscribeMedications(uid, setMedications);
      unsubscribers.current.push(unsubMeds);

      // Subscribe to own calendar
      const unsubCal = subscribeCalendar(uid, setCalendarEvents);
      unsubscribers.current.push(unsubCal);

    } else if (role === 'family') {
      // Subscribe to calendar
      const unsubCal = subscribeCalendar(uid, setCalendarEvents);
      unsubscribers.current.push(unsubCal);
    }

    return () => {
      unsubscribers.current.forEach(fn => fn());
    };
  }, [firebaseUser, role]);

  // Subscribe to a specific senior's data (for family dashboard)
  const subscribeToSenior = (seniorUid) => {
    const unsubMeds = subscribeMedications(seniorUid, meds => {
      // Store under seniorUid key for multi-person support
      setMedications(prev => ({ ...prev, [seniorUid]: meds }));
    });
    const unsubCheckin = subscribeCheckin(seniorUid, ts => {
      setLastCheckin(prev => ({ ...(prev || {}), [seniorUid]: ts }));
    });
    const unsubActivity = subscribeActivity(seniorUid, data => {
      setActivityData(prev => ({ ...(prev || {}), [seniorUid]: data }));
    });

    unsubscribers.current.push(unsubMeds, unsubCheckin, unsubActivity);
  };

  // ── Role management ──────────────────────────────────────────────────────
  const setRole = async (newRole) => {
    setRoleState(newRole);
    if (newRole) await AsyncStorage.setItem('userRole', newRole);
    else await AsyncStorage.removeItem('userRole');
  };

  // ── Medications ──────────────────────────────────────────────────────────
  const addMedication = async (med) => {
    if (firebaseUser) {
      await fbAddMed(firebaseUser.uid, med);
    } else {
      // Offline fallback
      setMedications(prev => Array.isArray(prev) ? [
        ...prev,
        { ...med, id: Date.now().toString(), taken: { morning: false, afternoon: false, evening: false, night: false } }
      ] : prev);
    }
  };

  const deleteMedication = async (id) => {
    if (firebaseUser) {
      await fbDeleteMed(firebaseUser.uid, id);
    } else {
      setMedications(prev => Array.isArray(prev) ? prev.filter(m => m.id !== id) : prev);
    }
  };

  const markMedicationTaken = async (medId, timeOfDay) => {
    if (firebaseUser && Array.isArray(medications)) {
      const med = medications.find(m => m.id === medId);
      if (med) {
        const newVal = !med.taken?.[timeOfDay];
        await fbMarkTaken(firebaseUser.uid, medId, timeOfDay, newVal);
      }
    } else {
      setMedications(prev => Array.isArray(prev) ? prev.map(med =>
        med.id === medId
          ? { ...med, taken: { ...med.taken, [timeOfDay]: !med.taken?.[timeOfDay] } }
          : med
      ) : prev);
    }
  };

  // ── Check-in ─────────────────────────────────────────────────────────────
  const doCheckin = async () => {
    if (firebaseUser) {
      const ts = await fbCheckin(firebaseUser.uid);
      setLastCheckin(ts);
    } else {
      const now = Date.now();
      setLastCheckin(now);
      await AsyncStorage.setItem('lastCheckin', now.toString());
    }
  };

  // ── Settings ─────────────────────────────────────────────────────────────
  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // ── Profile photos ────────────────────────────────────────────────────────
  const setProfilePhoto = async (personId, uri) => {
    if (firebaseUser) {
      try {
        const url = await fbUploadPhoto(personId, uri);
        setProfilePhotos(prev => ({ ...prev, [personId]: url }));
      } catch (e) {
        // Fallback to local
        setProfilePhotos(prev => ({ ...prev, [personId]: uri }));
      }
    } else {
      setProfilePhotos(prev => ({ ...prev, [personId]: uri }));
      await AsyncStorage.setItem(`profilePhoto_${personId}`, uri);
    }
  };

  const getProfilePhoto = (personId) => profilePhotos[personId] || null;

  // ── Notification stubs (real impl needs dev build) ────────────────────────
  const sendMedReminder = async (medName, seniorName = 'Margaret') => {
    console.log(`[IL] Sending med reminder: ${seniorName} → ${medName}`);
    return { success: true };
  };

  const sendWellnessNudge = async (seniorName, message) => {
    console.log(`[IL] Sending wellness nudge to ${seniorName}`);
    return { success: true };
  };

  // ── Calendar ──────────────────────────────────────────────────────────────
  const addCalendarEvent = async (event) => {
    if (firebaseUser) {
      const id = await fbAddEvent(firebaseUser.uid, event);
      return id;
    }
    return null;
  };

  const updateCalendarEvent = async (eventId, data) => {
    if (firebaseUser) {
      await fbUpdateEvent(firebaseUser.uid, eventId, data);
    }
  };

  const deleteCalendarEvent = async (eventId) => {
    if (firebaseUser) {
      await fbDeleteEvent(firebaseUser.uid, eventId);
    }
  };

  // ── Meds as array (normalize for both Firebase + offline) ─────────────────
  const medsArray = Array.isArray(medications) ? medications : [];

  const isLoading = firebaseUser === undefined;

  return (
    <AppContext.Provider
      value={{
        // Auth
        firebaseUser,
        isLoading,
        // Role
        role,
        setRole,
        // Medications
        medications: medsArray,
        addMedication,
        deleteMedication,
        markMedicationTaken,
        // Check-in
        lastCheckin,
        doCheckin,
        // Activity
        activityData,
        // Settings
        settings,
        updateSettings,
        // Profile photos
        profilePhotos,
        setProfilePhoto,
        getProfilePhoto,
        // Notifications
        sendMedReminder,
        sendWellnessNudge,
        notifPermission: 'granted',
        // Calendar
        calendarEvents,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        // Connections
        connectedPeople,
        subscribeToSenior,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
