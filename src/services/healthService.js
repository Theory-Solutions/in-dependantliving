/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL
 */

// Apple HealthKit integration
// Note: expo-sensors provides basic pedometer access without native modules
// Full HealthKit requires react-native-health (dev build only)
// For now, use expo-sensors Pedometer for step counting

import { Pedometer } from 'expo-sensors';

let stepSubscription = null;

// Check if step counting is available
export async function isStepCountingAvailable() {
  return await Pedometer.isAvailableAsync();
}

// Get today's step count
export async function getTodaySteps() {
  const available = await Pedometer.isAvailableAsync();
  if (!available) return 0;

  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  try {
    const result = await Pedometer.getStepCountAsync(start, end);
    return result.steps || 0;
  } catch (e) {
    console.log('[IL] Step count error:', e.message);
    return 0;
  }
}

// Subscribe to live step updates
export function subscribeToSteps(callback) {
  stepSubscription = Pedometer.watchStepCount(result => {
    callback(result.steps || 0);
  });
  return () => {
    if (stepSubscription) {
      stepSubscription.remove();
      stepSubscription = null;
    }
  };
}

// Get step count for a date range
export async function getStepsForRange(startDate, endDate) {
  const available = await Pedometer.isAvailableAsync();
  if (!available) return 0;

  try {
    const result = await Pedometer.getStepCountAsync(startDate, endDate);
    return result.steps || 0;
  } catch (e) {
    return 0;
  }
}
