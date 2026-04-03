/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/context/AppContext';
import { COLORS } from './src/constants/colors';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import PairingScreen from './src/screens/PairingScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SeniorHomeScreen from './src/screens/SeniorHomeScreen';
import MedicationScreen from './src/screens/MedicationScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import AppsScreen from './src/screens/AppsScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import FamilyDashScreen from './src/screens/FamilyDashScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SOSScreen from './src/screens/SOSScreen';
import LocationScreen from './src/screens/LocationScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import WellnessSummaryScreen from './src/screens/WellnessSummaryScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import TermsScreen from './src/screens/TermsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_BAR_STYLE = {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#DDE1F0',
  paddingBottom: 10,
  paddingTop: 8,
  height: 80,
  shadowColor: '#1A1A3A',
  shadowOffset: { width: 0, height: -3 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 12,
  // Full width, equal spacing
  width: '100%',
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
};

const TAB_LABEL_STYLE = {
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 0.2,
  marginTop: 2,
};

// ── Stack navigators ───────────────────────────────────────────────────────

// Wraps the Home tab in a stack so WeatherScreen, SOS, etc. can be pushed from it
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={SeniorHomeScreen} />
      <Stack.Screen name="Weather" component={WeatherScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="WellnessSummary" component={WellnessSummaryScreen} />
      <Stack.Screen
        name="SOS"
        component={SOSScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}

// Wraps Medications tab so ScannerScreen can be pushed from it
function MedicationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MedicationsMain" component={MedicationScreen} />
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}

function SeniorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarLabelStyle: TAB_LABEL_STYLE,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Medications') iconName = focused ? 'medical' : 'medical-outline';
          else if (route.name === 'Calendar') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Apps') iconName = focused ? 'walk' : 'walk-outline';
          return <Ionicons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Medications"
        component={MedicationsStack}
        options={{ title: 'Medications' }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Tab.Screen
        name="Apps"
        component={ActivityScreen}
        options={{ title: 'Activity' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
      />
    </Tab.Navigator>
  );
}

// Wraps the Family Dashboard in a stack so LocationScreen can be pushed
function FamilyDashStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FamilyDashMain" component={FamilyDashScreen} />
      <Stack.Screen name="Location" component={LocationScreen} />
    </Stack.Navigator>
  );
}

function FamilyTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarLabelStyle: TAB_LABEL_STYLE,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={FamilyDashStack} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// ── Main app tabs (used as a screen in auth stack) ─────────────────────────
function AppTabs() {
  const { role } = useApp();
  return role === 'senior' ? <SeniorTabs /> : <FamilyTabs />;
}

// ── Root Navigator ─────────────────────────────────────────────────────────
function RootNavigator() {
  const { role, firebaseUser, isLoading, setRole } = useApp();
  const [onboardingComplete, setOnboardingComplete] = useState(null); // null = checking

  // Check onboarding flag from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('onboardingComplete').then(val => {
      setOnboardingComplete(val === 'true');
    }).catch(() => setOnboardingComplete(false));
  }, []);

  // Show splash/loading while auth state or onboarding flag resolves
  if (isLoading || onboardingComplete === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ── Authenticated users with a role set: go straight to app ──────────────
  if (role) {
    return (
      <NavigationContainer>
        {role === 'senior' ? <SeniorTabs /> : <FamilyTabs />}
      </NavigationContainer>
    );
  }

  // ── Onboarding not yet complete: Welcome → Terms → Subscription → Auth flow ──
  if (!onboardingComplete) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Pairing" component={PairingScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // ── Onboarding done, no role yet: show Auth flow ──────────────────────────
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Pairing" component={PairingScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
