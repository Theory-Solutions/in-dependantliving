/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL
 */

import * as Notifications from 'expo-notifications';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permission and get push token
export async function registerForPushNotifications(userId) {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Get Expo push token (works with FCM under the hood)
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: '928831b6-53aa-4c7e-9130-241ffd9e8332',
  });
  const token = tokenData.data;

  // Save token to Firestore
  if (userId) {
    await updateDoc(doc(db, 'users', userId), {
      expoPushToken: token,
      updatedAt: new Date(),
    });
  }

  return token;
}

// Schedule a local medication reminder
export async function scheduleMedReminder(medName, timeOfDay, hour, minute) {
  const timeLabels = {
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'tonight',
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Medication Reminder',
      body: `Time to take your ${medName} — ${timeLabels[timeOfDay] || timeOfDay}`,
      data: { type: 'med_reminder', medName, timeOfDay },
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

// Cancel all scheduled medication reminders
export async function cancelAllMedReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Send push notification to another user via Expo Push API
export async function sendPushToUser(userId, title, body, data = {}) {
  // Get user's push token from Firestore
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return;

  const token = userDoc.data().expoPushToken;
  if (!token) return;

  // Send via Expo Push API (free, works for both iOS and Android)
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

// Send missed medication alert to all connected family members
export async function alertFamilyMissedMed(seniorUserId, medName, timeOfDay) {
  const userDoc = await getDoc(doc(db, 'users', seniorUserId));
  if (!userDoc.exists()) return;

  const userData = userDoc.data();
  const seniorName = userData.name || 'Your family member';
  const pairedWith = userData.pairedWith || [];

  for (const familyUid of pairedWith) {
    await sendPushToUser(
      familyUid,
      '⚠️ Missed Medication',
      `${seniorName} has not taken their ${medName} (${timeOfDay})`,
      { type: 'missed_med', seniorUid: seniorUserId, medName }
    );
  }
}

// Send daily wellness summary to family (call this each evening)
export async function sendDailyWellnessSummary(seniorUserId, summaryData) {
  const userDoc = await getDoc(doc(db, 'users', seniorUserId));
  if (!userDoc.exists()) return;

  const userData = userDoc.data();
  const seniorName = userData.name || 'Your family member';
  const pairedWith = userData.pairedWith || [];

  const { medsTaken, medsTotal, steps, checkedIn } = summaryData;
  const body = [
    `💊 Medications: ${medsTaken}/${medsTotal} taken`,
    `👟 Steps: ${steps?.toLocaleString() || 0}`,
    checkedIn ? `✅ Checked in today` : `⚠️ No check-in today`,
  ].join('  •  ');

  for (const familyUid of pairedWith) {
    await sendPushToUser(
      familyUid,
      `📊 ${seniorName}'s Day — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      body,
      { type: 'daily_summary', seniorUid: seniorUserId }
    );
  }
}

// Send low medication refill alert
export async function alertLowMedRefill(seniorUserId, medName, pillsRemaining) {
  // Alert the senior themselves
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Refill Needed Soon',
      body: `${medName}: only ${pillsRemaining} pills remaining. Time to request a refill.`,
      data: { type: 'low_refill', medName, pillsRemaining },
      sound: true,
    },
    trigger: null, // immediate
  });

  // Also alert family
  const userDoc = await getDoc(doc(db, 'users', seniorUserId));
  if (!userDoc.exists()) return;
  const userData = userDoc.data();
  const seniorName = userData.name || 'Your family member';

  for (const familyUid of userData.pairedWith || []) {
    await sendPushToUser(
      familyUid,
      '💊 Medication Refill Needed',
      `${seniorName} is running low on ${medName} (${pillsRemaining} pills left)`,
      { type: 'low_refill', seniorUid: seniorUserId, medName }
    );
  }
}
