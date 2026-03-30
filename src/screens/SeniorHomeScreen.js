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
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/colors';
import { MOCK_SENIOR_NAME } from '../constants/mockData';

const MOCK_STEPS = 3241;
const STEP_GOAL = 10000;

const MOCK_SCHEDULE = [
  { time: '10:00 AM', label: 'Morning Walk',        icon: '🚶', type: 'activity' },
  { time: '2:30 PM',  label: 'Doctor Appointment',  icon: '🏥', type: 'appointment', detail: 'Dr. Smith — Annual Checkup' },
  { time: '6:00 PM',  label: 'Evening Medications', icon: '💊', type: 'meds' },
  { time: '8:00 PM',  label: 'Call with Family',    icon: '📞', type: 'social' },
];

const SCHEDULE_COLORS = {
  meds:        '#1A6FA3',
  appointment: '#7C3AED',
  activity:    '#059669',
  checkin:     '#0D9488',
  social:      '#DB2777',
};

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getGreeting(name) {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return `Good Morning, ${name}!`;
  if (h >= 12 && h < 17) return `Good Afternoon, ${name}!`;
  if (h >= 17 && h < 21) return `Good Evening, ${name}!`;
  return `Good Night, ${name}!`;
}

export default function SeniorHomeScreen({ navigation }) {
  const { medications, settings, doCheckin } = useApp();
  const [now, setNow] = useState(new Date());
  const [checkinDone, setCheckinDone] = useState(false);

  const showCheckin = settings?.showCheckin !== false; // default on, can disable in settings

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const handleCheckin = () => {
    doCheckin();
    setCheckinDone(true);
    setTimeout(() => setCheckinDone(false), 4000);
  };

  // Total dose events = each med × each time slot it appears in (e.g. Amoxicillin morning + evening = 2)
  const allDoseEvents = medications.flatMap(m =>
    m.frequency.map(s => ({ taken: !!m.taken?.[s] }))
  );
  const totalDoses = allDoseEvents.length;
  const takenDoses = allDoseEvents.filter(d => d.taken).length;

  const stepsPct = Math.min((MOCK_STEPS / STEP_GOAL) * 100, 100);
  const firstName = MOCK_SENIOR_NAME.split(' ')[0];

  // Navigate to a tab by name (works because this screen is inside HomeStack inside the tab navigator)
  const goToTab = (tabName) => {
    navigation.getParent()?.navigate(tabName);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Gradient header */}
        <LinearGradient
          colors={['#0E4D7A', '#1A6FA3']}
          style={styles.header}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{getGreeting(firstName)}</Text>
              <Text style={styles.headerDate}>{formatDate(now)}</Text>
            </View>
            {/* Settings sprocket — top right */}
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => goToTab('Settings')}
              accessibilityLabel="Settings"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={24} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.body}>

          {/* ── 1. TODAY'S SCHEDULE ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📅</Text>
              <Text style={styles.cardTitle}>Today's Schedule</Text>
              <TouchableOpacity
                onPress={() => goToTab('Calendar')}
                accessibilityRole="button"
              >
                <Text style={styles.cardAction}>See All →</Text>
              </TouchableOpacity>
            </View>
            {MOCK_SCHEDULE.map((event, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.scheduleRow, i === MOCK_SCHEDULE.length - 1 && styles.scheduleRowLast]}
                onPress={() => goToTab('Calendar')}
                activeOpacity={0.75}
              >
                <Text style={styles.scheduleTime}>{event.time}</Text>
                <View style={[styles.scheduleDot, { backgroundColor: SCHEDULE_COLORS[event.type] || COLORS.primary }]} />
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleLabel}>{event.icon}  {event.label}</Text>
                  {event.detail && <Text style={styles.scheduleDetail}>{event.detail}</Text>}
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ── 2. TODAY'S STEPS ── */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => goToTab('Apps')}
            accessibilityRole="button"
            accessibilityLabel="Today's steps — tap to open Apps"
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>👟</Text>
              <Text style={styles.cardTitle}>Today's Steps</Text>
              <Text style={styles.cardAction}>View Apps →</Text>
            </View>
            <Text style={styles.stepsCount}>{MOCK_STEPS.toLocaleString()}</Text>
            <Text style={styles.stepsGoal}>Daily goal: {STEP_GOAL.toLocaleString()} steps</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${stepsPct}%` }]} />
            </View>
            <View style={styles.stepsBottomRow}>
              <Text style={styles.stepsPct}>{Math.round(stepsPct)}% of goal</Text>
              <Text style={styles.stepsRemaining}>{(STEP_GOAL - MOCK_STEPS).toLocaleString()} steps to go</Text>
            </View>
          </TouchableOpacity>

          {/* ── 3. WEATHER ── */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Weather')}
            accessibilityRole="button"
            accessibilityLabel="Weather — tap for details"
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⛅</Text>
              <Text style={styles.cardTitle}>Weather</Text>
              <Text style={styles.cardAction}>Details →</Text>
            </View>
            <View style={styles.weatherHero}>
              <Text style={styles.weatherTemp}>78°F</Text>
              <View>
                <Text style={styles.weatherLocation}>Tucson, AZ</Text>
                <Text style={styles.weatherCondition}>Partly Cloudy ☁️</Text>
              </View>
            </View>
            <View style={styles.weatherChips}>
              {['💧 24% humidity', '💨 8 mph W', '☀️ UV 8 — Very High'].map((d, i) => (
                <View key={i} style={styles.weatherChip}>
                  <Text style={styles.weatherChipText}>{d}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* ── QUICK STATS (all hot buttons) ── */}
          <Text style={styles.statsHeading}>Quick Stats</Text>
          <View style={styles.statsRow}>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => goToTab('Medications')}
              activeOpacity={0.8}
              accessibilityLabel="Medications today"
            >
              <Text style={styles.statIcon}>💊</Text>
              <Text style={styles.statValue}>{takenDoses}/{totalDoses}</Text>
              <Text style={styles.statLabel}>Doses today</Text>
              <Text style={styles.statArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => goToTab('Apps')}
              activeOpacity={0.8}
              accessibilityLabel="Steps today"
            >
              <Text style={styles.statIcon}>👟</Text>
              <Text style={styles.statValue}>{MOCK_STEPS.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Steps</Text>
              <Text style={styles.statArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => goToTab('Calendar')}
              activeOpacity={0.8}
              accessibilityLabel="Events today"
            >
              <Text style={styles.statIcon}>📅</Text>
              <Text style={styles.statValue}>{MOCK_SCHEDULE.length}</Text>
              <Text style={styles.statLabel}>Events</Text>
              <Text style={styles.statArrow}>›</Text>
            </TouchableOpacity>

          </View>

          {/* ── I'M OK — small, at bottom, only if enabled in settings ── */}
          {showCheckin && (
            <TouchableOpacity
              style={[styles.checkinBtn, checkinDone && styles.checkinBtnDone]}
              onPress={handleCheckin}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="I'm OK"
            >
              <Text style={styles.checkinBtnText}>
                {checkinDone ? '✅  Check-In Sent' : '✓  I\'m OK'}
              </Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 22 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft: { flex: 1, paddingRight: 12 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#fff', lineHeight: 32 },
  headerDate: { fontSize: 15, color: 'rgba(255,255,255,0.72)', marginTop: 4, fontWeight: '500' },

  // Settings sprocket
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },

  body: { padding: 18 },

  // Card base
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18, padding: 18, marginBottom: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  cardIcon: { fontSize: 22 },
  cardTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  cardAction: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // Schedule
  scheduleRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
    gap: 10,
  },
  scheduleRowLast: { borderBottomWidth: 0 },
  scheduleTime: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, width: 62, paddingTop: 2 },
  scheduleDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  scheduleInfo: { flex: 1 },
  scheduleLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  scheduleDetail: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  // Steps
  stepsCount: { fontSize: 44, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -1, marginBottom: 2 },
  stepsGoal: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 10 },
  progressTrack: { height: 10, backgroundColor: COLORS.divider, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 10, backgroundColor: COLORS.success, borderRadius: 5 },
  stepsBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepsPct: { fontSize: 13, color: COLORS.success, fontWeight: '700' },
  stepsRemaining: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },

  // Weather
  weatherHero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  weatherTemp: { fontSize: 48, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -1 },
  weatherLocation: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  weatherCondition: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600' },
  weatherChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  weatherChip: {
    backgroundColor: COLORS.background, borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  weatherChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },

  // Quick stats
  statsHeading: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14,
    alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    position: 'relative',
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  statArrow: { fontSize: 18, color: COLORS.primary, fontWeight: '800', marginTop: 4 },

  // I'm OK — small, bottom
  checkinBtn: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: 8,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  checkinBtnDone: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.success,
  },
  checkinBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
