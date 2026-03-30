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
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/colors';
import { MOCK_PEOPLE } from '../constants/mockData';
import MedDetailModal from '../components/MedDetailModal';

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function getStatus(p) {
  const hCheckin = (Date.now() - p.lastCheckin) / 3600000;
  const hMove = (Date.now() - p.lastMovement) / 3600000;
  const pending = p.meds.filter(m => !m.taken).length;
  if (hCheckin > 6 || hMove > 4) return 'alert';
  if (hCheckin > 3 || pending > 0) return 'warning';
  return 'ok';
}

const STATUS = {
  ok:      { color: COLORS.success, bg: COLORS.successBg, border: COLORS.successBorder, emoji: '✅', label: 'All Good',        gradient: ['#1A7A4A', '#22A05E'] },
  warning: { color: COLORS.warning, bg: COLORS.warningBg, border: COLORS.warningBorder, emoji: '⚠️', label: 'Check In',        gradient: ['#B85C00', '#E07B00'] },
  alert:   { color: COLORS.alert,   bg: COLORS.alertBg,   border: COLORS.alertBorder,   emoji: '🚨', label: 'Needs Attention', gradient: ['#B91C1C', '#DC2626'] },
};

export default function FamilyDashScreen() {
  const { settings, updateSettings } = useApp();
  const [selectedId, setSelectedId] = useState(MOCK_PEOPLE[0].id);
  const [notif, setNotif] = useState(settings.notifications.missedMeds);
  const [selectedMed, setSelectedMed] = useState(null);

  const person = MOCK_PEOPLE.find(p => p.id === selectedId) || MOCK_PEOPLE[0];
  const status = getStatus(person);
  const cfg = STATUS[status];
  const takenCount = person.meds.filter(m => m.taken).length;
  const [sendingReminder, setSendingReminder] = useState(null); // medName being sent
  const [reminderSent, setReminderSent] = useState({}); // { medName: true }

  const handleNotif = (v) => {
    setNotif(v);
    updateSettings({ notifications: { ...settings.notifications, missedMeds: v } });
  };

  // Photo upload handler
  const handlePhotoUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setProfilePhoto(person.id, result.assets[0].uri);
      Alert.alert('Photo Updated', `${person.name}'s profile photo has been updated.`);
    }
  };

  // Camera capture handler
  const handlePhotoCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setProfilePhoto(person.id, result.assets[0].uri);
      Alert.alert('Photo Updated', `${person.name}'s profile photo has been updated.`);
    }
  };

  // Photo picker sheet
  const handlePhotoPress = () => {
    Alert.alert(
      `Update ${person.name}'s Photo`,
      'Choose a photo source',
      [
        { text: 'Camera', onPress: handlePhotoCamera },
        { text: 'Photo Library', onPress: handlePhotoUpload },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Send med reminder notification
  const handleSendReminder = async (med) => {
    setSendingReminder(med.name);
    const result = await sendMedReminder(med.name, person.name);
    setSendingReminder(null);
    if (result.success) {
      setReminderSent(prev => ({ ...prev, [med.name]: true }));
      Alert.alert(
        '✅ Reminder Sent',
        `A notification has been sent to ${person.name} to take their ${med.name}.`,
        [{ text: 'OK' }]
      );
      setTimeout(() => setReminderSent(prev => ({ ...prev, [med.name]: false })), 5000);
    } else {
      Alert.alert('Could not send', 'Notification permission was denied. Please enable notifications in Settings.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient
          colors={['#0E4D7A', '#1A6FA3']}
          style={styles.header}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>{MOCK_PEOPLE.length} people connected</Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Person selector tabs */}
          <View style={styles.personTabs}>
            {MOCK_PEOPLE.map(p => {
              const s = getStatus(p);
              const active = p.id === selectedId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.personTab, active && styles.personTabActive]}
                  onPress={() => setSelectedId(p.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.personTabAvatar}>{p.avatar}</Text>
                  <Text style={[styles.personTabName, active && styles.personTabNameActive]}>{p.name}</Text>
                  <Text style={styles.personTabEmoji}>{STATUS[s].emoji}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Add person */}
            <TouchableOpacity style={styles.addTab} activeOpacity={0.8}>
              <Text style={styles.addTabText}>＋</Text>
            </TouchableOpacity>
          </View>

          {/* Status hero card */}
          <View style={[styles.heroCard, { borderColor: cfg.border }]}>
            <LinearGradient
              colors={cfg.gradient}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroTop}>
                {/* Profile photo with upload tap */}
                <TouchableOpacity onPress={handlePhotoPress} style={styles.avatarWrap} activeOpacity={0.85}>
                  {getProfilePhoto(person.id) ? (
                    <Image source={{ uri: getProfilePhoto(person.id) }} style={styles.avatarPhoto} />
                  ) : (
                    <View style={styles.avatarEmoji}>
                      <Text style={styles.heroAvatar}>{person.avatar}</Text>
                    </View>
                  )}
                  <View style={styles.avatarEditBadge}>
                    <Ionicons name="camera" size={12} color="#fff" />
                  </View>
                </TouchableOpacity>
                <View style={styles.heroInfo}>
                  <Text style={styles.heroName}>{person.name}</Text>
                  <Text style={styles.heroRelation}>{person.relation}</Text>
                  <TouchableOpacity onPress={handlePhotoPress} style={styles.changePhotoBtn}>
                    <Text style={styles.changePhotoText}>📷 Change photo</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeEmoji}>{cfg.emoji}</Text>
                  <Text style={styles.heroBadgeLabel}>{cfg.label}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatItem icon="🕐" value={timeAgo(person.lastCheckin)} label="Check-In" />
              <View style={styles.statDivider} />
              <StatItem icon="💊" value={`${takenCount}/${person.meds.length}`} label="Meds" />
              <View style={styles.statDivider} />
              <StatItem icon="🏃" value={timeAgo(person.lastMovement)} label="Active" />
              <View style={styles.statDivider} />
              <StatItem icon="👟" value={person.stepCount.toLocaleString()} label="Steps" />
            </View>
          </View>

          {/* Medication breakdown */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Today's Medications</Text>
                <Text style={styles.sectionSub}>{person.name} · {takenCount} of {person.meds.length} taken</Text>
              </View>
              {takenCount < person.meds.length && (
                <TouchableOpacity
                  style={styles.remindAllBtn}
                  onPress={() => {
                    const pending = person.meds.filter(m => !m.taken);
                    Alert.alert(
                      'Remind All',
                      `Send a reminder to ${person.name} for all ${pending.length} missed medication(s)?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Send All', onPress: () => pending.forEach(m => handleSendReminder(m)) },
                      ]
                    );
                  }}
                >
                  <Ionicons name="notifications" size={14} color="#fff" />
                  <Text style={styles.remindAllBtnText}>Remind All</Text>
                </TouchableOpacity>
              )}
            </View>
            {person.meds.map((med, i) => (
              <View key={i}>
                <TouchableOpacity
                  style={[styles.medRow, med.taken && styles.medRowDone]}
                  onPress={() => setSelectedMed(med)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.medCheck, med.taken && styles.medCheckDone]}>
                    <Text style={styles.medCheckText}>{med.taken ? '✓' : ' '}</Text>
                  </View>
                  <View style={styles.medInfo}>
                    <Text style={[styles.medName, med.taken && styles.medNameDone]}>{med.name}</Text>
                    <Text style={styles.medTime}>
                      {med.dosage} × {med.quantity ?? 1}  ·  {med.time}
                    </Text>
                    {med.pillsRemaining !== undefined && med.pillsRemaining <= 7 && (
                      <Text style={styles.lowPillsText}>⚠️ {med.pillsRemaining} pills left</Text>
                    )}
                  </View>
                  <View style={styles.medRowRight}>
                    <View style={[styles.medPill, { backgroundColor: med.taken ? COLORS.successBg : COLORS.warningBg, borderColor: med.taken ? COLORS.successBorder : COLORS.warningBorder }]}>
                      <Text style={[styles.medPillText, { color: med.taken ? COLORS.success : COLORS.warning }]}>
                        {med.taken ? 'Taken' : 'Pending'}
                      </Text>
                    </View>
                    <Text style={styles.detailArrow}>›</Text>
                  </View>
                </TouchableOpacity>

                {/* Reminder button — only show for pending meds */}
                {!med.taken && (
                  <TouchableOpacity
                    style={[
                      styles.reminderBtn,
                      reminderSent[med.name] && styles.reminderBtnSent,
                    ]}
                    onPress={() => handleSendReminder(med)}
                    disabled={!!sendingReminder || reminderSent[med.name]}
                    activeOpacity={0.8}
                  >
                    {sendingReminder === med.name ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Ionicons
                        name={reminderSent[med.name] ? 'checkmark-circle' : 'notifications-outline'}
                        size={16}
                        color={reminderSent[med.name] ? COLORS.success : COLORS.primary}
                      />
                    )}
                    <Text style={[styles.reminderBtnText, reminderSent[med.name] && styles.reminderBtnTextSent]}>
                      {reminderSent[med.name]
                        ? 'Reminder Sent ✓'
                        : sendingReminder === med.name
                          ? 'Sending...'
                          : `Remind ${person.name.split(' ')[0]} to take ${med.name}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Alert settings */}
          <View style={styles.alertCard}>
            <Text style={styles.alertCardTitle}>🔔 Alert Settings</Text>
            <View style={styles.alertRow}>
              <View style={styles.alertInfo}>
                <Text style={styles.alertLabel}>Missed Medication Alerts</Text>
                <Text style={styles.alertSub}>Notify if meds aren't taken on time</Text>
              </View>
              <Switch
                value={notif}
                onValueChange={handleNotif}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Med detail modal */}
        <MedDetailModal
          visible={!!selectedMed}
          medication={selectedMed}
          onClose={() => setSelectedMed(null)}
        />

        {/* Pairing code */}
          <View style={styles.pairingCard}>
            <Text style={styles.pairingLabel}>Connected via code</Text>
            <Text style={styles.pairingCode}>{person.pairingCode}</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ icon, value, label }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 22 },
  headerTitle: { fontSize: 30, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 3 },

  body: { padding: 18, paddingBottom: 48 },

  // Person tabs
  personTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  personTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  personTabActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  personTabAvatar: { fontSize: 18 },
  personTabName: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },
  personTabNameActive: { color: COLORS.primary },
  personTabEmoji: { fontSize: 14 },
  addTab: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addTabText: { fontSize: 18, color: COLORS.textMuted, fontWeight: '700' },

  // Hero card
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1.5,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  heroGradient: { padding: 20 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroAvatar: { fontSize: 42 },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroRelation: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroBadgeEmoji: { fontSize: 20, marginBottom: 2 },
  heroBadgeLabel: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center', gap: 3 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  statDivider: { width: 1, height: 36, backgroundColor: COLORS.divider },

  // Section
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  sectionSub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },

  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginVertical: 3,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 12,
    minHeight: 68,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  medRowDone: { borderColor: COLORS.successBorder, backgroundColor: COLORS.successBg },
  medCheck: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  medCheckDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  medCheckText: { fontSize: 18, color: '#fff', fontWeight: '800' },
  medInfo: { flex: 1 },
  medName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  medNameDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  medTime: { fontSize: 13, color: COLORS.textMuted, marginTop: 1 },
  medRowRight: { alignItems: 'flex-end', gap: 4 },
  medPill: {
    borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1.5,
  },
  medPillText: { fontSize: 12, fontWeight: '700' },
  detailArrow: { fontSize: 18, color: COLORS.textMuted, fontWeight: '700' },
  lowPillsText: { fontSize: 12, color: COLORS.warning, fontWeight: '700', marginTop: 2 },

  // Alert card
  alertCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  alertCardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  alertRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertInfo: { flex: 1, marginRight: 16 },
  alertLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  alertSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  // Pairing
  pairingCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '44',
  },
  pairingLabel: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },
  pairingCode: { fontSize: 26, fontWeight: '800', color: COLORS.primary, letterSpacing: 5 },

  // Profile photo
  avatarWrap: {
    position: 'relative',
    marginRight: 4,
  },
  avatarPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  avatarEmoji: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changePhotoBtn: {
    marginTop: 4,
  },
  changePhotoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },

  // Med section header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Remind all button
  remindAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginTop: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  remindAllBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },

  // Per-med reminder button
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 6,
    marginTop: -2,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '44',
  },
  reminderBtnSent: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.successBorder,
  },
  reminderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
  },
  reminderBtnTextSent: {
    color: COLORS.success,
  },
});
