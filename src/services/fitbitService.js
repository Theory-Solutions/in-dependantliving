/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL
 */

import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fitbit OAuth configuration
// Client ID and Secret to be provided by user at dev.fitbit.com
const FITBIT_CLIENT_ID = ''; // Set after registration
const FITBIT_REDIRECT_URI = 'https://in-dependentliving.com/fitbit/callback';
const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';

// Check if Fitbit is connected
export async function isFitbitConnected() {
  const token = await AsyncStorage.getItem('fitbit_access_token');
  return !!token;
}

// Start OAuth flow — opens Fitbit login in browser
export async function connectFitbit() {
  if (!FITBIT_CLIENT_ID) {
    throw new Error('Fitbit integration coming soon. Stay tuned!');
  }

  const scope = 'activity heartrate sleep profile';
  const authUrl = `${FITBIT_AUTH_URL}?response_type=code&client_id=${FITBIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(FITBIT_REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&expires_in=604800`;

  await Linking.openURL(authUrl);
}

// Exchange auth code for access token (called after redirect back)
export async function handleFitbitCallback(code) {
  // Exchange code for token
  const response = await fetch(FITBIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${FITBIT_CLIENT_ID}:`),
    },
    body: `client_id=${FITBIT_CLIENT_ID}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(FITBIT_REDIRECT_URI)}&code=${code}`,
  });

  const data = await response.json();
  if (data.access_token) {
    await AsyncStorage.setItem('fitbit_access_token', data.access_token);
    await AsyncStorage.setItem('fitbit_refresh_token', data.refresh_token);
    await AsyncStorage.setItem('fitbit_user_id', data.user_id);
    return true;
  }
  throw new Error('Failed to connect Fitbit');
}

// Get today's step count from Fitbit
export async function getFitbitSteps() {
  const token = await AsyncStorage.getItem('fitbit_access_token');
  if (!token) return null;

  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(`https://api.fitbit.com/1/user/-/activities/date/${today}.json`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.summary?.steps || 0;
}

// Get heart rate data
export async function getFitbitHeartRate() {
  const token = await AsyncStorage.getItem('fitbit_access_token');
  if (!token) return null;

  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(`https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d.json`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) return null;
  const data = await response.json();
  const zones = data['activities-heart']?.[0]?.value;
  return zones?.restingHeartRate || null;
}

// Disconnect Fitbit
export async function disconnectFitbit() {
  await AsyncStorage.removeItem('fitbit_access_token');
  await AsyncStorage.removeItem('fitbit_refresh_token');
  await AsyncStorage.removeItem('fitbit_user_id');
}
