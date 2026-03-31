import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/colors';
import { MOCK_PAIRING_CODE } from '../constants/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THRESHOLDS = [
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours' },
  { value: 6, label: '6 hours' },
  { value: 8, label: '8 hours' },
];

export default function SettingsScreen() {
  const { role, setRole, settings, updateSettings } = useApp();
  const [threshold, setThreshold] = useState(settings.alertThreshold);
  const [notifs, setNotifs] = useState({ ...settings.notifications });
  const [showCheckin, setShowCheckin] = useState(settings.showCheckin !== false);
  const [locationSharing, setLocationSharing] = useState(settings.locationSharing !== false);

  const handleThreshold = (val) => {
    setThreshold(val);
    updateSettings({ alertThreshold: val });
  };

  const handleNotifToggle = (key, val) => {
    const updated = { ...notifs, [key]: val };
    setNotifs(updated);
    updateSettings({ notifications: updated });
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.screenTitle}>Settings</Text>

        {/* Check-in toggle */}
        {role === 'senior' && (
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
        )}

        {/* Location Sharing */}
        {role === 'senior' && (
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
        )}

        {/* Inactivity threshold */}
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

        {/* Notification toggles */}
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

        {/* Pairing code */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔗 Connection Code</Text>
          <Text style={styles.cardSub}>
            Share this code with a family member to connect your accounts
          </Text>
          <View style={styles.codeRow}>
            {MOCK_PAIRING_CODE.split('').map((digit, i) => (
              <View key={i} style={styles.codeDigitBox}>
                <Text style={styles.codeDigit}>{digit}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.codeNote}>This code links your device with a family member's app</Text>
        </View>

        {/* Privacy */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔒 Privacy</Text>
          <Text style={styles.privacyText}>
            <Text style={styles.bold}>Your data stays on your device.</Text> In-dependent Living does not store, sell, or share your health information with any third party. All medications, check-ins, and activity data are stored locally on this phone only.
          </Text>
          <Text style={styles.privacyText}>
            For support: Theory Solutions LLC
          </Text>
        </View>

        {/* Current role indicator */}
        <View style={styles.roleCard}>
          <Text style={styles.roleLabel}>Currently using as:</Text>
          <Text style={styles.roleValue}>
            {role === 'senior' ? '🧓 Senior' : '👨‍👩‍👧 Family Member'}
          </Text>
        </View>

        {/* Danger zone */}
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

  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 24,
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

  // Clear button
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
