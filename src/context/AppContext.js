/**
 * Always Near — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_MEDICATIONS, MOCK_LAST_CHECKIN, MOCK_ACTIVITY_STATUS, MOCK_STEP_COUNT } from '../constants/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [role, setRoleState] = useState(null);
  const [medications, setMedications] = useState(MOCK_MEDICATIONS);
  const [lastCheckin, setLastCheckin] = useState(MOCK_LAST_CHECKIN);
  const [activityData, setActivityData] = useState({
    status: MOCK_ACTIVITY_STATUS,
    stepCount: MOCK_STEP_COUNT,
    lastMovement: Date.now() - 45 * 60 * 1000,
  });
  const [settings, setSettings] = useState({
    alertThreshold: 4,
    showCheckin: true,   // "I'm OK" button on home screen
    notifications: {
      missedMeds: true,
      inactivity: true,
      checkinReminder: true,
    },
  });

  const setRole = async (newRole) => {
    setRoleState(newRole);
    await AsyncStorage.setItem('userRole', newRole);
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
