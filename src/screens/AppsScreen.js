/**
 * Always Near — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';

const CONNECTED_BADGE = { label: 'Connected', bg: '#ECFDF5', border: '#059669', text: '#065F46', dot: '#059669' };

const APP_SECTIONS = [
  {
    title: 'Activity & Fitness',
    apps: [
      {
        icon: '🏃',
        name: 'Fitbit',
        description: 'Activity & sleep tracking',
        connected: true,
        data: '3,241 steps · Last sync: 45 min ago',
      },
      {
        icon: '❤️',
        name: 'Apple Health',
        description: 'Health & fitness data from your iPhone',
        connected: false,
      },
      {
        icon: '🏋️',
        name: 'Google Fit',
        description: 'Activity tracking & health metrics',
        connected: false,
      },
    ],
  },
  {
    title: 'Health Monitoring',
    apps: [
      {
        icon: '📊',
        name: 'Dexcom G7',
        description: 'Continuous glucose monitoring',
        connected: true,
        data: '124 mg/dL · In range',
      },
      {
        icon: '💉',
        name: 'Libre 3',
        description: 'Continuous glucose sensor',
        connected: false,
      },
      {
        icon: '🩺',
        name: 'Omron Blood Pressure',
        description: 'Blood pressure monitor sync',
        connected: false,
      },
    ],
  },
  {
    title: 'Medical',
    apps: [
      {
        icon: '🏥',
        name: 'MyChart',
        description: 'Patient portal & health records',
        connected: false,
      },
      {
        icon: '💊',
        name: 'Pillsy Smart Pill Cap',
        description: 'Smart pill bottle reminders',
        connected: false,
      },
    ],
  },
];

function AppCard({ app }) {
  return (
    <View style={[styles.appCard, app.connected && styles.appCardConnected]}>
      <View style={styles.appIconWrap}>
        <Text style={styles.appIcon}>{app.icon}</Text>
      </View>

      <View style={styles.appInfo}>
        <View style={styles.appNameRow}>
          <Text style={styles.appName}>{app.name}</Text>
          {app.connected && (
            <View style={[styles.badge, { backgroundColor: CONNECTED_BADGE.bg, borderColor: CONNECTED_BADGE.border }]}>
              <View style={[styles.badgeDot, { backgroundColor: CONNECTED_BADGE.dot }]} />
              <Text style={[styles.badgeText, { color: CONNECTED_BADGE.text }]}>{CONNECTED_BADGE.label}</Text>
            </View>
          )}
        </View>
        <Text style={styles.appDescription}>{app.description}</Text>
        {app.connected && app.data && (
          <View style={styles.dataPreview}>
            <Text style={styles.dataPreviewText}>{app.data}</Text>
          </View>
        )}
      </View>

      {!app.connected && (
        <TouchableOpacity
          style={styles.connectBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Connect ${app.name}`}
        >
          <Text style={styles.connectBtnText}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AppsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#0E4D7A', '#1A6FA3']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Connected Apps</Text>
        <Text style={styles.headerSub}>Sync your health data from your favorite apps</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {APP_SECTIONS.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.apps.map((app, aIdx) => (
              <AppCard key={aIdx} app={app} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingTop: 20,
    paddingBottom: 26,
    paddingHorizontal: 22,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '500' },

  content: { padding: 18, paddingBottom: 48 },

  section: { marginBottom: 26 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
    paddingLeft: 2,
  },

  appCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  appCardConnected: {
    borderColor: '#A7F3D0',
    backgroundColor: '#FAFFFE',
  },

  appIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    flexShrink: 0,
  },
  appIcon: { fontSize: 28 },

  appInfo: { flex: 1 },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    gap: 5,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  appDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
    lineHeight: 20,
  },

  dataPreview: {
    marginTop: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  dataPreviewText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  connectBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    flexShrink: 0,
  },
  connectBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
