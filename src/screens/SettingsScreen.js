import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createPairingCode } from '../services/pairingService';
import * as healthService from '../services/healthService';

const THRESHOLDS = [
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours' },
  { value: 6, label: '6 hours' },
  { value: 8, label: '8 hours' },
];

export default function SettingsScreen({ navigation }) {
  const { role, setRole, settings, updateSettings, firebaseUser, connectedSeniors } = useApp();
  const [threshold, setThreshold] = useState(settings.alertThreshold);
  const [notifs, setNotifs] = useState({ ...settings.notifications });
  const [showCheckin, setShowCheckin] = useState(settings.showCheckin !== false);
  const [locationSharing, setLocationSharing] = useState(settings.locationSharing !== false);
  const [userPairingCode, setUserPairingCode] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  // Profile section state
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName || 'User');
  const [showEditName, setShowEditName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  // Wearables state
  const [appleWatchConnected, setAppleWatchConnected] = useState(false);
  const [fitbitConnected, setFitbitConnected] = useState(false);
  const [stepCountingAvailable, setStepCountingAvailable] = useState(false);

  useEffect(() => {
    healthService.isStepCountingAvailable()
      .then(v => setStepCountingAvailable(!!v))
      .catch(() => setStepCountingAvailable(false));
  }, []);

  // Subscribe to real pairing code from Firebase
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
      if (snap.exists()) {
        setUserPairingCode(snap.data().pairingCode || null);
      }
    });
    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  const handleThreshold = (val) => {
    setThreshold(val);
    updateSettings({ alertThreshold: val });
  };

  const handleNotifToggle = (key, val) => {
    const updated = { ...notifs, [key]: val };
    setNotifs(updated);
    updateSettings({ notifications: updated });
  };

  const handleGenerateCode = async () => {
    if (!firebaseUser?.uid) return;
    setGeneratingCode(true);
    try {
      const code = await createPairingCode(firebaseUser.uid);
      setUserPairingCode(code);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not generate code. Please try again.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will reset the app completely. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setRole(null);
          },
        },
      ]
    );
  };

  const displayCode = userPairingCode || '------';
  const codeDigits = displayCode.split('');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back / header bar */}
      <View style={styles.settingsHeader}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          <Text style={styles.backBtnText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Settings</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── PROFILE SECTION ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatarWrap}>
            <Text style={styles.profileAvatar}>
              {role === 'senior' ? '🧓' : '👨‍👩‍👧'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>
              {firebaseUser?.email || 'Not signed in'}
            </Text>
            <View style={styles.profileRoleBadge}>
              <Text style={styles.profileRoleBadgeText}>
                {role === 'senior' ? '🏠 Independent' : '👨‍👩‍👧 Family / Caregiver'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => { setEditNameValue(displayName); setShowEditName(true); }}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil" size={16} color={COLORS.primary} />
            <Text style={styles.editProfileBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Edit name modal */}
        <Modal visible={showEditName} animationType="fade" transparent onRequestClose={() => setShowEditName(false)}>
          <View style={styles.editNameOverlay}>
            <View style={styles.editNameModal}>
              <Text style={styles.editNameTitle}>Edit Display Name</Text>
              <TextInput
                style={styles.editNameInput}
                value={editNameValue}
                onChangeText={setEditNameValue}
                placeholder="Your name"
                placeholderTextColor={COLORS.textMuted}
                autoFocus
                autoCapitalize="words"
              />
              <View style={styles.editNameActions}>
                <TouchableOpacity
                  style={styles.editNameCancelBtn}
                  onPress={() => setShowEditName(false)}
                >
                  <Text style={styles.editNameCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editNameSaveBtn}
                  onPress={async () => {
                    const newName = editNameValue.trim();
                    if (!newName) return;
                    setDisplayName(newName);
                    setShowEditName(false);
                    // Save to Firestore if available
                    try {
                      if (firebaseUser?.uid) {
                        await updateDoc(doc(db, 'users', firebaseUser.uid), { displayName: newName });
                      }
                    } catch (e) { /* offline fallback */ }
                  }}
                >
                  <Text style={styles.editNameSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Role section header */}
        <View style={styles.sectionHeaderCard}>
          <Text style={styles.sectionHeaderText}>
            {role === 'senior' ? '👤 Independent Settings' : '👨‍👩‍👧 Caregiver Settings'}
          </Text>
        </View>

        {/* ── INDEPENDENT (SENIOR) SECTIONS ── */}
        {role === 'senior' && (
          <>
            {/* Pairing Code */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔗 Your Pairing Code</Text>
              <Text style={styles.cardSub}>
                Share this code with a family member or caregiver to connect your accounts
              </Text>
              <View style={styles.codeRow}>
                {codeDigits.map((digit, i) => (
                  <View key={i} style={styles.codeDigitBox}>
                    <Text style={styles.codeDigit}>{digit}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.codeNote}>This code links your account with a caregiver's app</Text>
              <TouchableOpacity
                style={[styles.generateCodeBtn, generatingCode && { opacity: 0.7 }]}
                onPress={handleGenerateCode}
                disabled={generatingCode}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={18} color="#fff" />
                <Text style={styles.generateCodeBtnText}>
                  {generatingCode ? 'Generating...' : 'Generate New Code'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.generateCodeBtn, { marginTop: 12, backgroundColor: '#22c55e' }]}
                onPress={async () => {
                  if (!userPairingCode) return;
                  const link = `https://in-dependentliving.com/connect/${userPairingCode}`;
                  Clipboard.setString(link);
                  Alert.alert('Link Copied!', 'Share this link with your family member:\n\n' + link);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="link-outline" size={18} color="#fff" />
                <Text style={styles.generateCodeBtnText}>Share Connection Link</Text>
              </TouchableOpacity>
            </View>

            {/* Check-in toggle */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✓ "I'm OK" Check-In</Text>
              <Text style={styles.cardSub}>
                Show the "I'm OK" button on your home screen. Turn this off if you prefer your family sees your activity through steps and calendar instead.
              </Text>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Show "I'm OK" button</Text>
                  <Text style={styles.toggleSub}>Appears at the bottom of your home screen</Text>
                </View>
                <Switch
                  value={showCheckin}
                  onValueChange={(v) => {
                    setShowCheckin(v);
                    updateSettings({ showCheckin: v });
                  }}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="#fff"
                  style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                />
              </View>
            </View>

            {/* Location Sharing */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📍 Location Sharing</Text>
              <Text style={styles.cardSub}>
                Share your general location with family. They'll see if you're home, out, or at an appointment — not your exact GPS coordinates.
              </Text>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Share my location</Text>
                  <Text style={styles.toggleSub}>Family will see your general whereabouts</Text>
                </View>
                <Switch
                  value={locationSharing}
                  onValueChange={(v) => {
                    setLocationSharing(v);
                    updateSettings({ locationSharing: v });
                  }}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="#fff"
                  style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                />
              </View>
            </View>

            {/* Inactivity threshold — only show if wearable/step counting is available */}
            {stepCountingAvailable && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>⏱ Inactivity Alert</Text>
                <Text style={styles.cardSub}>
                  Alert family if no activity is detected for:
                </Text>
                <View style={styles.thresholdGrid}>
                  {THRESHOLDS.map((t) => {
                    const active = threshold === t.value;
                    return (
                      <TouchableOpacity
                        key={t.value}
                        style={[styles.thresholdBtn, active && styles.thresholdBtnActive]}
                        onPress={() => handleThreshold(t.value)}
                        activeOpacity={0.8}
                        accessibilityLabel={`${t.label}, ${active ? 'selected' : ''}`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                      >
                        <Text style={[styles.thresholdText, active && styles.thresholdTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* ── CAREGIVER (FAMILY) SECTIONS ── */}
        {role === 'family' && (
          <>
            {/* Connected Accounts */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔗 Connected Accounts</Text>
              <Text style={styles.cardSub}>
                Independent users you're currently connected with
              </Text>
              {connectedSeniors && connectedSeniors.length > 0 ? (
                connectedSeniors.map((senior, i) => (
                  <View
                    key={senior.id || i}
                    style={[styles.connectedRow, i > 0 && styles.connectedRowBorder]}
                  >
                    <Text style={styles.connectedAvatar}>{senior.avatar || '🧓'}</Text>
                    <View style={styles.connectedInfo}>
                      <Text style={styles.connectedName}>{senior.name || 'Unknown'}</Text>
                      <Text style={styles.connectedRelation}>{senior.relation || 'Independent'}</Text>
                    </View>
                    <View style={styles.connectedBadge}>
                      <Text style={styles.connectedBadgeText}>✓ Connected</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noConnectionsText}>
                  No connections yet. Tap below to add one.
                </Text>
              )}
              <TouchableOpacity
                style={styles.addConnectionBtn}
                onPress={() => navigation?.navigate?.('Pairing')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.addConnectionBtnText}>Add Connection</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── CONNECTED APPS / WEARABLES (shown for all roles) ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⌚ Connected Apps</Text>
          <Text style={styles.cardSub}>
            Connect fitness wearables to sync activity data. Manage your connections in the Activity tab.
          </Text>
          {/* Apple Watch */}
          <View style={styles.wearableRow}>
            <Text style={styles.wearableRowIcon}>⌚</Text>
            <View style={styles.wearableRowInfo}>
              <Text style={styles.wearableRowName}>Apple Watch</Text>
              <Text style={[styles.wearableRowStatus, { color: appleWatchConnected ? (COLORS.success || '#059669') : COLORS.textMuted }]}>
                {appleWatchConnected ? '✓ Connected' : 'Not connected'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.wearableSmallBtn, appleWatchConnected && styles.wearableSmallBtnActive]}
              onPress={() => {
                if (appleWatchConnected) {
                  Alert.alert('Apple Watch', 'Disconnect Apple Watch?', [
                    { text: 'Disconnect', style: 'destructive', onPress: () => setAppleWatchConnected(false) },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                } else {
                  setAppleWatchConnected(true);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.wearableSmallBtnText, appleWatchConnected && styles.wearableSmallBtnTextActive]}>
                {appleWatchConnected ? 'Connected' : '+ Add'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.wearableDivider} />
          {/* Fitbit */}
          <View style={styles.wearableRow}>
            <Text style={styles.wearableRowIcon}>📳</Text>
            <View style={styles.wearableRowInfo}>
              <Text style={styles.wearableRowName}>Fitbit</Text>
              <Text style={[styles.wearableRowStatus, { color: fitbitConnected ? (COLORS.success || '#059669') : COLORS.textMuted }]}>
                {fitbitConnected ? '✓ Connected' : 'Not connected'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.wearableSmallBtn, fitbitConnected && styles.wearableSmallBtnActive]}
              onPress={() => {
                if (fitbitConnected) {
                  Alert.alert('Fitbit', 'Disconnect Fitbit?', [
                    { text: 'Disconnect', style: 'destructive', onPress: () => setFitbitConnected(false) },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                } else {
                  setFitbitConnected(true);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.wearableSmallBtnText, fitbitConnected && styles.wearableSmallBtnTextActive]}>
                {fitbitConnected ? 'Connected' : '+ Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification toggles — shown for all roles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔔 Notifications</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Missed Medications</Text>
              <Text style={styles.toggleSub}>Alert when meds aren't taken on time</Text>
            </View>
            <Switch
              value={notifs.missedMeds}
              onValueChange={(v) => handleNotifToggle('missedMeds', v)}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor={notifs.missedMeds ? COLORS.primary : COLORS.disabled}
              style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
            />
          </View>

          <View style={[styles.toggleRow, styles.toggleRowBorder]}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Inactivity Alerts</Text>
              <Text style={styles.toggleSub}>Alert when no movement is detected</Text>
            </View>
            <Switch
              value={notifs.inactivity}
              onValueChange={(v) => handleNotifToggle('inactivity', v)}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor={notifs.inactivity ? COLORS.primary : COLORS.disabled}
              style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
            />
          </View>

          <View style={[styles.toggleRow, styles.toggleRowBorder]}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Daily Check-In Reminder</Text>
              <Text style={styles.toggleSub}>Remind senior to check in each day</Text>
            </View>
            <Switch
              value={notifs.checkinReminder}
              onValueChange={(v) => handleNotifToggle('checkinReminder', v)}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor={notifs.checkinReminder ? COLORS.primary : COLORS.disabled}
              style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
            />
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔒 Privacy</Text>
          <Text style={styles.privacyText}>
            Your health and medication data is stored securely in Firebase (Google Cloud) and shared only with family members you've connected with via pairing codes. We use industry-standard encryption. We do not sell your data.
          </Text>
          <Text style={styles.privacyText}>
            For support: Theory Solutions LLC
          </Text>
        </View>

        {/* Current role indicator */}
        <View style={styles.roleCard}>
          <Text style={styles.roleLabel}>Currently using as:</Text>
          <Text style={styles.roleValue}>
            {role === 'senior' ? '🏠 Independent' : '👨‍👩‍👧 Independent Family/Care'}
          </Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => {
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign Out',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const { signOut } = require('firebase/auth');
                      const { auth } = require('../config/firebase');
                      await signOut(auth);
                    } catch (e) {}
                    await AsyncStorage.clear();
                    setRole(null);
                  },
                },
              ]
            );
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Clear data */}
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClearData}
          activeOpacity={0.85}
          accessibilityLabel="Clear all app data"
          accessibilityRole="button"
        >
          <Text style={styles.clearBtnText}>🗑  Clear All Data</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>In-dependent Living v1.0.0 · © 2026 Theory Solutions LLC</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, paddingBottom: 48 },

  // ── Profile card ──────────────────────────────────────────────────────────
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  profileAvatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight || '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profileAvatar: { fontSize: 30 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  profileEmail: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  profileRoleBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight || '#E8F4FD',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  profileRoleBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight || '#E8F4FD',
  },
  editProfileBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // Edit name modal
  editNameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  editNameModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  editNameTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  editNameInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    marginBottom: 20,
  },
  editNameActions: { flexDirection: 'row', gap: 12 },
  editNameCancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  editNameCancelText: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  editNameSaveBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  editNameSaveText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // ── Wearables in Settings card ────────────────────────────────────────────
  wearableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  wearableRowIcon: { fontSize: 28 },
  wearableRowInfo: { flex: 1 },
  wearableRowName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  wearableRowStatus: { fontSize: 13, marginTop: 2 },
  wearableSmallBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight || '#E8F4FD',
  },
  wearableSmallBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  wearableSmallBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  wearableSmallBtnTextActive: { color: '#fff' },
  wearableDivider: { height: 1, backgroundColor: COLORS.divider || COLORS.border },

  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    width: 70,
  },
  backBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },

  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  // Section header
  sectionHeaderCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  cardSub: {
    fontSize: 17,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 24,
  },

  // Threshold — full-width buttons, stacked 2x2
  thresholdGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  thresholdBtn: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    minHeight: 60,
    justifyContent: 'center',
  },
  thresholdBtnActive: {
    backgroundColor: COLORS.primary,
  },
  thresholdText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  thresholdTextActive: {
    color: '#FFFFFF',
  },

  // Toggle rows
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleRowBorder: {
    borderTopWidth: 1.5,
    borderTopColor: COLORS.border,
  },
  toggleInfo: { flex: 1, marginRight: 16 },
  toggleLabel: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  toggleSub: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 3,
    lineHeight: 20,
  },

  // Pairing code
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 16,
  },
  codeDigitBox: {
    width: 48,
    height: 60,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeDigit: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  codeNote: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  generateCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  generateCodeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Connected accounts (family)
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  connectedRowBorder: {
    borderTopWidth: 1.5,
    borderTopColor: COLORS.border,
  },
  connectedAvatar: {
    fontSize: 32,
  },
  connectedInfo: {
    flex: 1,
  },
  connectedName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  connectedRelation: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  connectedBadge: {
    backgroundColor: COLORS.successBg || '#D1FAE5',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  connectedBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success || '#059669',
  },
  noConnectionsText: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 22,
  },
  addConnectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  addConnectionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Privacy
  privacyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 25,
    marginBottom: 10,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Role indicator
  roleCard: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 17,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  roleValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Sign out / Clear buttons
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
  },
  signOutBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  clearBtn: {
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.alert,
    marginBottom: 28,
    minHeight: 64,
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.alert,
  },

  footer: {
    textAlign: 'center',
    fontSize: 15,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
});
