/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import * as healthService from '../services/healthService';

// ─── Mock 7-day history (will pull from Firebase later) ──────────────────────
const MOCK_HISTORY = [
  { date: 'Mon', steps: 4201, stand: 8, flights: 3 },
  { date: 'Tue', steps: 6812, stand: 10, flights: 5 },
  { date: 'Wed', steps: 3400, stand: 7, flights: 2 },
  { date: 'Thu', steps: 7523, stand: 11, flights: 6 },
  { date: 'Fri', steps: 5100, stand: 9, flights: 4 },
  { date: 'Sat', steps: 2800, stand: 6, flights: 1 },
  { date: 'Sun', steps: 1950, stand: 5, flights: 0 },
];

// Build history with accurate labels (today = last item)
function buildHistory() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }));
  }
  return MOCK_HISTORY.map((row, idx) => ({ ...row, date: days[idx] }));
}

// ─── Stat card (big number) ───────────────────────────────────────────────────
function StatCard({ icon, value, label, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 4 }]}>
      <Text style={[styles.statIcon]}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Wearable card ────────────────────────────────────────────────────────────
function WearableCard({ icon, name, connected, onConnect }) {
  return (
    <View style={styles.wearableCard}>
      <Text style={styles.wearableIcon}>{icon}</Text>
      <View style={styles.wearableInfo}>
        <Text style={styles.wearableName}>{name}</Text>
        <Text style={[styles.wearableStatus, { color: connected ? COLORS.success || '#059669' : COLORS.textMuted }]}>
          {connected ? '✓ Connected' : 'Not connected'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.wearableBtn, connected && styles.wearableBtnConnected]}
        onPress={onConnect}
        activeOpacity={0.8}
      >
        <Text style={[styles.wearableBtnText, connected && styles.wearableBtnTextConnected]}>
          {connected ? 'Manage' : '+ Add'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main ActivityScreen ──────────────────────────────────────────────────────
export default function ActivityScreen({ navigation }) {
  const [steps, setSteps] = useState(0);
  const [standHours] = useState(0); // HealthKit stand hours — not available via expo-sensors
  const [flights] = useState(0);    // HealthKit flights — not available via expo-sensors
  const [appleWatchConnected, setAppleWatchConnected] = useState(false);
  const [fitbitConnected, setFitbitConnected] = useState(false);
  const history = buildHistory();

  useEffect(() => {
    // Fetch today's steps from healthService
    healthService.getTodaySteps()
      .then(s => setSteps(s || 0))
      .catch(() => setSteps(0));
  }, []);

  const handleConnectAppleWatch = () => {
    if (appleWatchConnected) {
      Alert.alert('Apple Watch', 'Manage your Apple Watch connection.', [
        { text: 'Disconnect', style: 'destructive', onPress: () => setAppleWatchConnected(false) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Apple Watch', 'Connect your Apple Watch to sync activity data automatically.', [
        { text: 'Connect', onPress: () => setAppleWatchConnected(true) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleConnectFitbit = () => {
    if (fitbitConnected) {
      Alert.alert('Fitbit', 'Manage your Fitbit connection.', [
        { text: 'Disconnect', style: 'destructive', onPress: () => setFitbitConnected(false) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Fitbit', 'Connect your Fitbit account to sync steps and activity data.', [
        { text: 'Connect', onPress: () => setFitbitConnected(true) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#0E4D7A', '#1A6FA3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Activity</Text>
            <Text style={styles.headerSub}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Today</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Stats */}
        <Text style={styles.sectionTitle}>Today's Stats</Text>
        <View style={styles.statsRow}>
          <StatCard icon="🚶" value={steps} label="steps" color="#1A6FA3" />
          <StatCard icon="🧍" value={standHours} label="stand hrs" color="#059669" />
          <StatCard icon="🪜" value={flights} label="flights" color="#7C3AED" />
        </View>

        {/* Step goal progress */}
        <View style={styles.goalCard}>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Daily Step Goal</Text>
            <Text style={styles.goalValue}>{Math.min(Math.round((steps / 5000) * 100), 100)}%</Text>
          </View>
          <View style={styles.goalTrack}>
            <View style={[styles.goalFill, { width: `${Math.min((steps / 5000) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.goalSub}>{steps.toLocaleString()} / 5,000 steps</Text>
        </View>

        {/* 7-Day History */}
        <Text style={styles.sectionTitle}>Past 7 Days</Text>
        <View style={styles.historyCard}>
          {/* Column headers */}
          <View style={styles.historyHeaderRow}>
            <Text style={[styles.historyCell, styles.historyDateCell, styles.historyHeader]}>Date</Text>
            <Text style={[styles.historyCell, styles.historyHeader]}>🚶 Steps</Text>
            <Text style={[styles.historyCell, styles.historyHeader]}>🧍 Stand</Text>
            <Text style={[styles.historyCell, styles.historyHeader]}>🪜 Flights</Text>
          </View>
          {history.map((day, i) => (
            <View key={i} style={[styles.historyRow, i % 2 === 0 && styles.historyRowAlt]}>
              <Text style={[styles.historyCell, styles.historyDateCell]}>{day.date}</Text>
              <Text style={styles.historyCell}>{day.steps.toLocaleString()}</Text>
              <Text style={styles.historyCell}>{day.stand}h</Text>
              <Text style={styles.historyCell}>{day.flights}</Text>
            </View>
          ))}
        </View>

        {/* Connect Wearables */}
        <Text style={styles.sectionTitle}>Connect Wearables</Text>
        <View style={styles.wearablesCard}>
          <WearableCard
            icon="⌚"
            name="Apple Watch"
            connected={appleWatchConnected}
            onConnect={handleConnectAppleWatch}
          />
          <View style={styles.wearableDivider} />
          <WearableCard
            icon="📳"
            name="Fitbit"
            connected={fitbitConnected}
            onConnect={handleConnectFitbit}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  },

  // Stat cards row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Goal card
  goalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  goalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  goalValue: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  goalTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  goalFill: {
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    minWidth: 4,
  },
  goalSub: { fontSize: 13, color: COLORS.textMuted, textAlign: 'right' },

  // History table
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  historyRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  historyRowAlt: { backgroundColor: COLORS.background },
  historyCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  historyDateCell: {
    flex: 1.4,
    textAlign: 'left',
  },
  historyHeader: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },

  // Wearables
  wearablesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  wearableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  wearableDivider: {
    height: 1,
    backgroundColor: COLORS.divider || COLORS.border,
    marginHorizontal: 18,
  },
  wearableIcon: { fontSize: 32 },
  wearableInfo: { flex: 1 },
  wearableName: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  wearableStatus: { fontSize: 13, marginTop: 2 },
  wearableBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight || '#E8F4FD',
  },
  wearableBtnConnected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  wearableBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  wearableBtnTextConnected: {
    color: '#fff',
  },
});
