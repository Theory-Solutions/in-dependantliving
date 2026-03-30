/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// ─── App catalog ──────────────────────────────────────────────────────────────

const APP_SECTIONS = [
  {
    title: '⌚ Wearables & Activity',
    subtitle: 'Connect your watch or fitness tracker',
    apps: [
      {
        id: 'apple_watch',
        icon: '⌚',
        name: 'Apple Watch',
        badge: 'Best for iPhone',
        badgeColor: '#1A6FA3',
        description: 'Steps, heart rate, fall detection, ECG, sleep, blood oxygen — all automatic via Apple Health',
        platform: 'iOS',
        connected: true,
        data: [
          { label: 'Steps', value: '3,241', icon: '👟' },
          { label: 'Heart Rate', value: '68 bpm', icon: '❤️' },
          { label: 'Sleep', value: '7h 12m', icon: '😴' },
        ],
        lastSync: '12 min ago',
        highlight: true,
      },
      {
        id: 'fitbit',
        icon: '🏃',
        name: 'Fitbit',
        badge: 'iOS & Android',
        badgeColor: '#00B0B9',
        description: 'Steps, sleep, heart rate, active minutes. Works on both iPhone and Android.',
        platform: 'both',
        connected: false,
      },
      {
        id: 'galaxy_watch',
        icon: '🌀',
        name: 'Galaxy Watch',
        badge: 'Best for Android',
        badgeColor: '#1A6FA3',
        description: 'Steps, heart rate, sleep, blood oxygen via Google Health Connect.',
        platform: 'Android',
        connected: false,
      },
      {
        id: 'apple_health',
        icon: '❤️',
        name: 'Apple Health',
        badge: 'iPhone built-in',
        badgeColor: '#FF2D55',
        description: 'Aggregates data from Apple Watch, iPhone, and any HealthKit-compatible device.',
        platform: 'iOS',
        connected: true,
        data: [
          { label: 'Steps today', value: '3,241', icon: '👟' },
          { label: 'Stand hours', value: '8 / 12', icon: '🧍' },
        ],
        lastSync: 'Live',
      },
      {
        id: 'google_fit',
        icon: '🏋️',
        name: 'Google Fit / Health Connect',
        badge: 'Android built-in',
        badgeColor: '#34A853',
        description: 'Aggregates data from Galaxy Watch, Pixel Watch, Fitbit, Garmin, and more on Android.',
        platform: 'Android',
        connected: false,
      },
      {
        id: 'garmin',
        icon: '🗺️',
        name: 'Garmin Connect',
        description: 'Activity, GPS, heart rate via Apple Health or Google Fit.',
        platform: 'both',
        connected: false,
      },
    ],
  },
  {
    title: '🩸 Health Monitoring',
    subtitle: 'Medical devices and continuous monitors',
    apps: [
      {
        id: 'dexcom',
        icon: '📊',
        name: 'Dexcom G7',
        badge: 'CGM',
        badgeColor: '#7C3AED',
        description: 'Continuous glucose monitoring. Alerts family if blood sugar goes out of range.',
        platform: 'both',
        connected: true,
        data: [
          { label: 'Glucose', value: '124 mg/dL', icon: '📊' },
          { label: 'Trend', value: '→ Stable', icon: '📈' },
        ],
        lastSync: '5 min ago',
      },
      {
        id: 'libre',
        icon: '💉',
        name: 'FreeStyle Libre 3',
        badge: 'CGM',
        badgeColor: '#7C3AED',
        description: 'Continuous glucose sensor — alternative to Dexcom.',
        platform: 'both',
        connected: false,
      },
      {
        id: 'omron',
        icon: '🩺',
        name: 'Omron Blood Pressure',
        description: 'Wireless blood pressure monitor sync via Bluetooth.',
        platform: 'both',
        connected: false,
      },
      {
        id: 'withings',
        icon: '⚖️',
        name: 'Withings Health',
        description: 'Smart scale, blood pressure, sleep tracker.',
        platform: 'both',
        connected: false,
      },
    ],
  },
  {
    title: '🏥 Medical & Safety',
    subtitle: 'Health records, patient portals, and safety',
    apps: [
      {
        id: 'mychart',
        icon: '🏥',
        name: 'MyChart (Epic)',
        description: 'Patient portal — appointments, lab results, messages to your doctor.',
        platform: 'both',
        connected: false,
      },
      {
        id: 'pillsy',
        icon: '💊',
        name: 'Pillsy Smart Pill Cap',
        description: 'Smart pill bottle lid that auto-logs when you open it. Eliminates manual check-ins.',
        platform: 'both',
        connected: false,
      },
      {
        id: 'life_alert',
        icon: '🆘',
        name: 'Life Alert / Medical Alert',
        description: 'Emergency response integration. Alerts family and 911 automatically.',
        platform: 'both',
        connected: false,
      },
    ],
  },
];

// ─── Connected app card ───────────────────────────────────────────────────────

function ConnectedCard({ app }) {
  return (
    <View style={[styles.appCard, styles.appCardConnected, app.highlight && styles.appCardHighlight]}>
      {app.highlight && (
        <LinearGradient
          colors={['#0E4D7A', '#1A6FA3']}
          style={styles.highlightBanner}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Text style={styles.highlightBannerText}>⭐ Recommended for most users</Text>
        </LinearGradient>
      )}
      <View style={styles.appCardTop}>
        <Text style={styles.appIcon}>{app.icon}</Text>
        <View style={styles.appInfo}>
          <View style={styles.appNameRow}>
            <Text style={styles.appName}>{app.name}</Text>
            {app.badge && (
              <View style={[styles.appBadge, { backgroundColor: app.badgeColor + '22', borderColor: app.badgeColor }]}>
                <Text style={[styles.appBadgeText, { color: app.badgeColor }]}>{app.badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.appDesc}>{app.description}</Text>
        </View>
        <View style={styles.connectedBadge}>
          <View style={styles.connectedDot} />
          <Text style={styles.connectedText}>Live</Text>
        </View>
      </View>

      {/* Data rows */}
      {app.data && (
        <View style={styles.dataGrid}>
          {app.data.map((d, i) => (
            <View key={i} style={styles.dataItem}>
              <Text style={styles.dataIcon}>{d.icon}</Text>
              <Text style={styles.dataValue}>{d.value}</Text>
              <Text style={styles.dataLabel}>{d.label}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.connectedFooter}>
        <Text style={styles.syncText}>🔄 Last sync: {app.lastSync}</Text>
        <TouchableOpacity style={styles.manageBtn}>
          <Text style={styles.manageBtnText}>Manage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Disconnected app card ────────────────────────────────────────────────────

function DisconnectedCard({ app }) {
  const handleConnect = () => {
    Alert.alert(
      `Connect ${app.name}`,
      `This will open ${app.name} to authorize the connection. In-Dependent will only read your activity and health data — never write or share it without your permission.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Connect', onPress: () => Alert.alert('Coming Soon', 'Live integrations are coming in the next update!') },
      ]
    );
  };

  const platformColor = app.platform === 'iOS' ? '#1A6FA3' : app.platform === 'Android' ? '#34A853' : COLORS.textMuted;
  const platformLabel = app.platform === 'iOS' ? '🍎 iPhone only' : app.platform === 'Android' ? '🤖 Android only' : '📱 iOS & Android';

  return (
    <View style={styles.appCard}>
      <View style={styles.appCardTop}>
        <Text style={styles.appIcon}>{app.icon}</Text>
        <View style={styles.appInfo}>
          <View style={styles.appNameRow}>
            <Text style={styles.appName}>{app.name}</Text>
            {app.badge && (
              <View style={[styles.appBadge, { backgroundColor: app.badgeColor + '22', borderColor: app.badgeColor }]}>
                <Text style={[styles.appBadgeText, { color: app.badgeColor }]}>{app.badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.appDesc}>{app.description}</Text>
          <Text style={[styles.platformLabel, { color: platformColor }]}>{platformLabel}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.connectBtn} onPress={handleConnect} activeOpacity={0.85}>
        <Ionicons name="link" size={16} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.connectBtnText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AppsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Header */}
        <LinearGradient
          colors={['#0E4D7A', '#1A6FA3']}
          style={styles.header}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Connected Apps</Text>
          <Text style={styles.headerSub}>Works with Apple Watch, Fitbit, Android wearables, and more</Text>
        </LinearGradient>

        {/* Platform note */}
        <View style={styles.platformNote}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.platformNoteText}>
            In-Dependent works with <Text style={styles.bold}>iPhone and Android</Text>. Apple Watch users get automatic HealthKit sync. Fitbit, Galaxy Watch, and Garmin users connect via their own apps.
          </Text>
        </View>

        {/* Sections */}
        {APP_SECTIONS.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.subtitle && <Text style={styles.sectionSub}>{section.subtitle}</Text>}
            {section.apps.map(app => (
              app.connected
                ? <ConnectedCard key={app.id} app={app} />
                : <DisconnectedCard key={app.id} app={app} />
            ))}
          </View>
        ))}

        {/* Bottom note */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyNoteText}>
            🔒 <Text style={styles.bold}>Your health data is yours.</Text> In-Dependent only reads data with your permission and never sells or shares it. All connections use official APIs from each platform.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 22 },
  headerTitle: { fontSize: 30, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 21 },

  platformNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    margin: 16,
    padding: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '33',
  },
  platformNoteText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  bold: { fontWeight: '700', color: COLORS.textPrimary },

  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2, marginTop: 10 },
  sectionSub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12, fontWeight: '500' },

  // App cards
  appCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  appCardConnected: {
    borderColor: COLORS.successBorder,
    backgroundColor: COLORS.successBg,
  },
  appCardHighlight: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  highlightBanner: {
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 14,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  highlightBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },

  appCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  appIcon: { fontSize: 36, marginTop: 2 },
  appInfo: { flex: 1 },
  appNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  appName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  appBadge: {
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1.5,
  },
  appBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  appDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  platformLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },

  // Connected state
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.successBg,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: COLORS.successBorder,
    alignSelf: 'flex-start',
  },
  connectedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  connectedText: { fontSize: 12, fontWeight: '800', color: COLORS.success },

  // Data grid for connected apps
  dataGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  dataItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  dataIcon: { fontSize: 20 },
  dataValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  dataLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },

  connectedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  manageBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: COLORS.success,
    backgroundColor: COLORS.surface,
  },
  manageBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.success },

  // Connect button
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  connectBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Privacy note at bottom
  privacyNote: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  privacyNoteText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
});
