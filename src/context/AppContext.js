/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { MOCK_MEDICATIONS, MOCK_LAST_CHECKIN, MOCK_ACTIVITY_STATUS, MOCK_STEP_COUNT } from '../constants/mockData';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [role, setRoleState] = useState(null);
  const [medications, setMedications] = useState(MOCK_MEDICATIONS);
  const [lastCheckin, setLastCheckin] = useState(MOCK_LAST_CHECKIN);
  const [profilePhotos, setProfilePhotos] = useState({}); // { personId: uri }
  const [notifPermission, setNotifPermission] = useState(null);
  const [activityData, setActivityData] = useState({
    status: MOCK_ACTIVITY_STATUS,
    stepCount: MOCK_STEP_COUNT,
    lastMovement: Date.now() - 45 * 60 * 1000,
  });
  const [settings, setSettings] = useState({
    alertThreshold: 4,
    showCheckin: true,
    notifications: {
      missedMeds: true,
      inactivity: true,
      checkinReminder: true,
    },
  });

  // Request notification permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotifPermission(status);
    })();
  }, []);

  const setRole = async (newRole) => {
    setRoleState(newRole);
    if (newRole) await AsyncStorage.setItem('userRole', newRole);
  };

  const addMedication = (med) => {
    const newMed = {
      ...med,
      id: Date.now().toString(),
      taken: { morning: false, afternoon: false, evening: false, night: false },
    };
    setMedications((prev) => [...prev, newMed]);
  };

  const deleteMedication = (id) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const markMedicationTaken = (medId, timeOfDay) => {
    setMedications((prev) =>
      prev.map((med) =>
        med.id === medId
          ? { ...med, taken: { ...med.taken, [timeOfDay]: !med.taken[timeOfDay] } }
          : med
      )
    );
  };

  const doCheckin = () => {
    const now = Date.now();
    setLastCheckin(now);
    AsyncStorage.setItem('lastCheckin', now.toString());
  };

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Update profile photo for a person (by id or 'self')
  const setProfilePhoto = async (personId, uri) => {
    setProfilePhotos((prev) => ({ ...prev, [personId]: uri }));
    await AsyncStorage.setItem(`profilePhoto_${personId}`, uri);
  };

  const getProfilePhoto = (personId) => profilePhotos[personId] || null;

  // Send a medication reminder notification to the senior
  // In production this would send via FCM/APNs to the senior's device token
  // For prototype: sends a local notification on the current device
  const sendMedReminder = async (medName, seniorName = 'Margaret') => {
    if (notifPermission !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotifPermission(status);
      if (status !== 'granted') return { success: false, reason: 'permission_denied' };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 Medication Reminder`,
        body: `${seniorName}, it's time to take your ${medName}. Tap to confirm you've taken it.`,
        data: { type: 'med_reminder', medName },
        sound: true,
      },
      trigger: null, // send immediately
    });

    return { success: true };
  };

  // Send a general wellness check nudge
  const sendWellnessNudge = async (seniorName = 'Margaret', message) => {
    if (notifPermission !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotifPermission(status);
      if (status !== 'granted') return { success: false, reason: 'permission_denied' };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💙 In-dependent Living`,
        body: message || `Hi ${seniorName}, your family is thinking of you. How are you feeling today?`,
        data: { type: 'wellness_nudge' },
        sound: true,
      },
      trigger: null,
    });

    return { success: true };
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        medications,
        addMedication,
        deleteMedication,
        markMedicationTaken,
        lastCheckin,
        doCheckin,
        activityData,
        settings,
        updateSettings,
        profilePhotos,
        setProfilePhoto,
        getProfilePhoto,
        sendMedReminder,
        sendWellnessNudge,
        notifPermission,
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
