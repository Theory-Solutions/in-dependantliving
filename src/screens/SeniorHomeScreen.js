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
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/colors';
import { getTodaySteps, isStepCountingAvailable } from '../services/healthService';
// User name comes from Firebase auth or defaults to 'Friend'

const STEP_GOAL = 10000;

// No mock schedule — show empty state when no real events

const SCHEDULE_COLORS = {
  meds:        '#1A6FA3',
  appointment: '#7C3AED',
  activity:    '#059669',
  checkin:     '#0D9488',
  social:      '#DB2777',
};

const RELATION_OPTIONS = ['Son', 'Daughter', 'Spouse', 'Doctor', 'Friend', 'Other'];

const CONTACTS_STORAGE_KEY = 'senior_family_contacts';

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

function getAvatarEmoji(relation) {
  const map = {
    Son: '👦', Daughter: '👧', Spouse: '💑',
    Doctor: '👨‍⚕️', Friend: '😊', Other: '👤',
  };
  return map[relation] || '👤';
}

export default function SeniorHomeScreen({ navigation }) {
  const { medications, settings, doCheckin, firebaseUser, calendarEvents } = useApp();
  const [now, setNow] = useState(new Date());
  const [checkinDone, setCheckinDone] = useState(false);

  // Check for pending subscription (user skipped pairing)
  useEffect(() => {
    (async () => {
      const pending = await AsyncStorage.getItem('pendingSubscription');
      if (pending === 'true') {
        await AsyncStorage.removeItem('pendingSubscription');
        // Navigate to subscription screen on first load
        setTimeout(() => {
          navigation?.navigate?.('Subscription');
        }, 500);
      }
    })();
  }, []);

  // Contacts state
  const [contacts, setContacts] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', relation: 'Son', phone: '' });

  // Steps state
  const [realSteps, setRealSteps] = useState(0);
  const [stepsAvailable, setStepsAvailable] = useState(false);

  // Load contacts from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
        if (stored) setContacts(JSON.parse(stored));
      } catch (e) {
        console.log('[IL] Could not load contacts:', e.message);
      }
    })();
  }, []);

  // Load steps
  useEffect(() => {
    (async () => {
      const available = await isStepCountingAvailable();
      setStepsAvailable(available);
      if (available) {
        const steps = await getTodaySteps();
        setRealSteps(steps);
      }
    })();
    // Refresh every 5 minutes
    const interval = setInterval(async () => {
      const steps = await getTodaySteps();
      setRealSteps(steps);
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleCall = (contact) => {
    Alert.alert(
      `Call ${contact.name}?`,
      `${contact.relation} — ${contact.phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '📞 Voice Call', onPress: () => Linking.openURL(`tel:${contact.phone}`) },
        { text: '📹 Video Call', onPress: () => {
          Linking.openURL(`facetime:${contact.phone}`).catch(() =>
            Linking.openURL(`tel:${contact.phone}`)
          );
        }},
      ]
    );
  };

  const handleSaveContact = async () => {
    if (!newContact.name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for this contact.');
      return;
    }
    if (!newContact.phone.trim()) {
      Alert.alert('Missing Phone', 'Please enter a phone number.');
      return;
    }
    const contact = {
      id: Date.now().toString(),
      name: newContact.name.trim(),
      relation: newContact.relation,
      phone: newContact.phone.trim(),
      avatar: getAvatarEmoji(newContact.relation),
    };
    const updated = [...contacts, contact];
    setContacts(updated);
    try {
      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log('[IL] Could not save contacts:', e.message);
    }
    setShowAddContact(false);
    setNewContact({ name: '', relation: 'Son', phone: '' });
  };

  const handleCancelContact = () => {
    setShowAddContact(false);
    setNewContact({ name: '', relation: 'Son', phone: '' });
  };

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

  const stepsPct = Math.min((realSteps / STEP_GOAL) * 100, 100);
  const firstName = firebaseUser?.displayName?.split(' ')[0] || 'Friend';

  // Get today's calendar events from Firebase — recomputes whenever calendarEvents changes
  const todayStr = now.toISOString().split('T')[0];
  const todayEvents = (calendarEvents || [])
    .filter(e => e.date === todayStr)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    .slice(0, 4); // show max 4 on home screen

  // No mock fallback — show empty state when no real events
  const scheduleToShow = todayEvents;

  // Navigate to a tab by name (works because this screen is inside HomeStack inside the tab navigator)
  const goToTab = (tabName) => {
    navigation.getParent()?.navigate(tabName);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>

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
            <View style={styles.headerButtons}>
              {/* SOS — top right, next to settings */}
              <TouchableOpacity
                style={styles.sosHeaderBtn}
                onPress={() => navigation.navigate('SOS')}
                accessibilityLabel="Emergency SOS"
                accessibilityRole="button"
              >
                <Text style={styles.sosHeaderText}>SOS</Text>
              </TouchableOpacity>
              {/* Settings sprocket */}
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => goToTab('Settings')}
                accessibilityLabel="Settings"
                accessibilityRole="button"
              >
                <Ionicons name="settings-outline" size={24} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </View>
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
            {scheduleToShow.length > 0 ? scheduleToShow.map((event, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.scheduleRow, i === scheduleToShow.length - 1 && styles.scheduleRowLast]}
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
            )) : (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 }}>
                  No events today — tap + in Calendar to add one
                </Text>
              </View>
            )}
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
            {stepsAvailable && realSteps > 0 ? (
              <>
                <Text style={styles.stepsCount}>{realSteps.toLocaleString()}</Text>
                <Text style={styles.stepsGoal}>Daily goal: {STEP_GOAL.toLocaleString()} steps</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${stepsPct}%` }]} />
                </View>
                <View style={styles.stepsBottomRow}>
                  <Text style={styles.stepsPct}>{Math.round(stepsPct)}% of goal</Text>
                  <Text style={styles.stepsRemaining}>{(STEP_GOAL - realSteps).toLocaleString()} steps to go</Text>
                </View>
              </>
            ) : (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <Text style={styles.stepsCount}>0</Text>
                {!stepsAvailable && (
                  <Text style={{ fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, marginTop: 4 }}>
                    Connect a fitness tracker to see your steps
                  </Text>
                )}
              </View>
            )}
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

          {/* ── CALL FAMILY ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📞</Text>
              <Text style={styles.cardTitle}>Call Family</Text>
            </View>

            {/* Add Contact inline form */}
            {showAddContact && (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.addContactForm}>
                  <Text style={styles.addContactFormTitle}>Add Family Contact</Text>

                  <TextInput
                    style={styles.formInput}
                    placeholder="Name"
                    placeholderTextColor={COLORS.textMuted}
                    value={newContact.name}
                    onChangeText={t => setNewContact(p => ({ ...p, name: t }))}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />

                  <TextInput
                    style={styles.formInput}
                    placeholder="Phone number"
                    placeholderTextColor={COLORS.textMuted}
                    value={newContact.phone}
                    onChangeText={t => setNewContact(p => ({ ...p, phone: t }))}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                  />

                  <Text style={styles.formLabel}>Relation</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {RELATION_OPTIONS.map(r => (
                        <TouchableOpacity
                          key={r}
                          style={[styles.relationChip, newContact.relation === r && styles.relationChipActive]}
                          onPress={() => setNewContact(p => ({ ...p, relation: r }))}
                        >
                          <Text style={[styles.relationChipText, newContact.relation === r && styles.relationChipTextActive]}>
                            {r}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <View style={styles.formBtns}>
                    <TouchableOpacity style={styles.formCancelBtn} onPress={handleCancelContact}>
                      <Text style={styles.formCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.formSaveBtn} onPress={handleSaveContact}>
                      <Text style={styles.formSaveBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            )}

            {contacts.length > 0 ? (
              <>
                <Text style={styles.callSubtext}>One tap to connect with your loved ones</Text>
                <View style={styles.callGrid}>
                  {contacts.map(contact => (
                    <TouchableOpacity
                      key={contact.id}
                      style={styles.callCard}
                      onPress={() => handleCall(contact)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.callAvatar}>{contact.avatar}</Text>
                      <Text style={styles.callName}>{contact.name}</Text>
                      <Text style={styles.callRelation}>{contact.relation}</Text>
                      <View style={styles.callBtn}>
                        <Ionicons name="videocam" size={18} color="#fff" />
                        <Text style={styles.callBtnText}>Video</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {!showAddContact && (
                    <TouchableOpacity
                      style={styles.addContactCard}
                      activeOpacity={0.8}
                      onPress={() => setShowAddContact(true)}
                    >
                      <Ionicons name="add-circle-outline" size={32} color={COLORS.textMuted} />
                      <Text style={styles.addContactText}>Add Contact</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              !showAddContact && (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 }}>
                    Add your family contacts below
                  </Text>
                  <TouchableOpacity
                    style={styles.addContactCard}
                    activeOpacity={0.8}
                    onPress={() => setShowAddContact(true)}
                  >
                    <Ionicons name="add-circle-outline" size={32} color={COLORS.textMuted} />
                    <Text style={styles.addContactText}>Add Contact</Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>

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
              <Text style={styles.statValue}>{realSteps.toLocaleString()}</Text>
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
              <Text style={styles.statValue}>{scheduleToShow.length}</Text>
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

      {/* SOS button moved to header — no floating button */}

      </View>
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

  // Header right buttons
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },

  // SOS button in header
  sosHeaderBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  sosHeaderText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.5,
  },

  // Settings sprocket
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
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

  // Call Family
  callSubtext: { fontSize: 14, color: COLORS.textMuted, marginBottom: 14 },
  callGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  callCard: {
    width: '30%', backgroundColor: COLORS.background, borderRadius: 14,
    padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border,
  },
  callAvatar: { fontSize: 36, marginBottom: 6 },
  callName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  callRelation: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, borderRadius: 100,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  callBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  addContactCard: {
    width: '30%', backgroundColor: COLORS.background, borderRadius: 14,
    padding: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed',
    minHeight: 120,
  },
  addContactText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginTop: 6 },

  // Add Contact Form
  addContactForm: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '55',
  },
  addContactFormTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  formInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  relationChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  relationChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  relationChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  relationChipTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  formBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  formCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  formCancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  formSaveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  formSaveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },

  // SOS float styles removed — button is now in header

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
