/**
 * Always Near — Independent Living Monitoring Application
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

import OnboardingScreen from './src/screens/OnboardingScreen';
import SeniorHomeScreen from './src/screens/SeniorHomeScreen';
import MedicationScreen from './src/screens/MedicationScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import AppsScreen from './src/screens/AppsScreen';
import WeatherScreen from './src/screens/WeatherScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import FamilyDashScreen from './src/screens/FamilyDashScreen';
import SettingsScreen from './src/screens/SettingsScreen';

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
};

const TAB_LABEL_STYLE = {
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 0.2,
  marginTop: 2,
};

// Wraps the Home tab in a stack so WeatherScreen can be pushed from it
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={SeniorHomeScreen} />
      <Stack.Screen name="Weather" component={WeatherScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
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
          else if (route.name === 'Apps') iconName = focused ? 'apps' : 'apps-outline';
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
        component={AppsScreen}
        options={{ title: 'Apps' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
      />
    </Tab.Navigator>
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
      <Tab.Screen name="Dashboard" component={FamilyDashScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { role, setRole } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('userRole').then((storedRole) => {
      if (storedRole) setRole(storedRole);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!role) {
    return (
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {role === 'senior' ? <SeniorTabs /> : <FamilyTabs />}
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
