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
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/colors';
const FREQUENCIES = ['morning', 'afternoon', 'evening', 'night'];

const FREQ_ICONS = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
  night: '🌙',
};

const SLOT_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

const FREQUENCY_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

function getCurrentSlot() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

function dosageLabel(med) {
  const qty = med.quantity ?? 1;
  return `${med.dosage} × ${qty}`;
}

export default function MedicationScreen({ navigation }) {
  const { medications, addMedication, deleteMedication, markMedicationTaken } = useApp();
  const [form, setForm] = useState({ name: '', dosage: '', quantity: '1', frequency: [] });
  const [scanned, setScanned] = useState(false);

  const slot = getCurrentSlot();
  const currentMeds = medications.filter(m => m.frequency.includes(slot));
  const currentTaken = currentMeds.filter(m => m.taken?.[slot]).length;

  const handleScan = () => {
    if (navigation) {
      navigation.navigate('Scanner');
    }
  };

  const toggleFrequency = (s) => {
    setForm((prev) => {
      const freq = prev.frequency.includes(s)
        ? prev.frequency.filter((f) => f !== s)
        : [...prev.frequency, s];
      return { ...prev, frequency: freq };
    });
  };

  const handleAdd = () => {
    if (!form.name.trim()) {
      Alert.alert('Missing Info', 'Please enter a medication name.');
      return;
    }
    if (form.frequency.length === 0) {
      Alert.alert('Missing Info', 'Please select when to take it.');
      return;
    }
    addMedication({ name: form.name.trim(), dosage: form.dosage.trim(), frequency: form.frequency });
    setForm({ name: '', dosage: '', quantity: '1', frequency: [] });
    setScanned(false);
  };

  const handleDelete = (id) => {
    Alert.alert('Remove Medication', 'Remove this medication?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteMedication(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Fixed top section: Today's Medications */}
      <LinearGradient
        colors={['#0E4D7A', '#1A6FA3']}
        style={styles.topSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.topHeaderRow}>
          <Text style={styles.topTitle}>Today's Medications</Text>
          <View style={styles.slotChip}>
            <Text style={styles.slotChipText}>{FREQ_ICONS[slot]} {SLOT_LABELS[slot]}</Text>
          </View>
        </View>
        <Text style={styles.topProgress}>
          {currentTaken} of {currentMeds.length} taken
        </Text>
        {currentMeds.length > 0 && (
          <View style={styles.topProgressTrack}>
            <View style={[styles.topProgressFill, {
              width: `${currentMeds.length > 0 ? (currentTaken / currentMeds.length) * 100 : 0}%`
            }]} />
          </View>
        )}
      </LinearGradient>

      {/* Active med cards for current slot */}
      {currentMeds.length > 0 ? (
        <View style={styles.currentMedsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.currentMedsScroll}
          >
            {currentMeds.map(med => (
              <ActiveMedCard
                key={med.id}
                med={med}
                slot={slot}
                onToggle={() => markMedicationTaken(med.id, slot)}
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.noCurrentMeds}>
          <Text style={styles.noCurrentMedsText}>✅ No medications scheduled right now</Text>
        </View>
      )}

      {/* Scrollable manage section */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.manageSectionTitle}>Manage Medications</Text>

        {/* Scan section */}
        <View style={styles.scanCard}>
          <Text style={styles.scanTitle}>📷 Scan Prescription</Text>
          <Text style={styles.scanSub}>
            Point camera at your prescription bottle to auto-fill details
          </Text>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={handleScan}
            activeOpacity={0.85}
            accessibilityLabel="Scan prescription bottle"
            accessibilityRole="button"
          >
            <Text style={styles.scanBtnText}>📸  Open Scanner</Text>
          </TouchableOpacity>
        </View>

        {/* Entry form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>✏️ Add Manually</Text>

          <Text style={styles.label}>Medication Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Lisinopril"
            placeholderTextColor={COLORS.textMuted}
            value={form.name}
            onChangeText={(t) => setForm((prev) => ({ ...prev, name: t }))}
            autoCapitalize="words"
            accessibilityLabel="Medication name"
            returnKeyType="next"
          />

          <Text style={styles.label}>Dosage</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 10mg"
            placeholderTextColor={COLORS.textMuted}
            value={form.dosage}
            onChangeText={(t) => setForm((prev) => ({ ...prev, dosage: t }))}
            accessibilityLabel="Dosage"
            returnKeyType="done"
          />

          <Text style={styles.label}>When do you take it?</Text>
          <View style={styles.frequencyGrid}>
            {FREQUENCIES.map((s) => {
              const active = form.frequency.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.freqBtn, active && styles.freqBtnActive]}
                  onPress={() => toggleFrequency(s)}
                  activeOpacity={0.8}
                  accessibilityLabel={`${FREQUENCY_LABELS[s]}, ${active ? 'selected' : 'not selected'}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                >
                  <Text style={styles.freqBtnIcon}>{FREQ_ICONS[s]}</Text>
                  <Text style={[styles.freqBtnText, active && styles.freqBtnTextActive]}>
                    {FREQUENCY_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAdd}
            activeOpacity={0.85}
            accessibilityLabel="Add medication"
            accessibilityRole="button"
          >
            <Text style={styles.addBtnText}>＋  Add Medication</Text>
          </TouchableOpacity>
        </View>

        {/* Full medication list */}
        {medications.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>All Medications ({medications.length})</Text>
            {medications.map((med) => (
              <View key={med.id} style={styles.medRow}>
                <View style={styles.medRowDot} />
                <View style={styles.medRowInfo}>
                  <Text style={styles.medRowName}>{med.name}</Text>
                  <Text style={styles.medRowDosage}>{dosageLabel(med)}</Text>
                  <Text style={styles.medRowTimes}>
                    {med.frequency.map((f) => `${FREQ_ICONS[f]} ${FREQUENCY_LABELS[f]}`).join('  ·  ')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(med.id)}
                  accessibilityLabel={`Remove ${med.name}`}
                  accessibilityRole="button"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {medications.length === 0 && (
          <View style={styles.emptyList}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={styles.emptyText}>No medications added yet</Text>
            <Text style={styles.emptySubtext}>Use the form above to add your first medication</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActiveMedCard({ med, slot, onToggle }) {
  const taken = !!med.taken?.[slot];
  return (
    <View style={[styles.activeMedCard, taken && styles.activeMedCardDone]}>
      <TouchableOpacity
        style={[styles.bigCheckbox, taken ? styles.bigCheckboxDone : styles.bigCheckboxPending]}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: taken }}
        accessibilityLabel={taken ? `Undo ${med.name}` : `Confirm ${med.name} taken`}
      >
        <Text style={taken ? styles.bigCheckmarkDone : styles.bigCheckmarkPending}>
          {taken ? '✓' : 'tap'}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.activeMedName, taken && styles.activeMedNameDone]}>{med.name}</Text>
      <Text style={styles.activeMedDose}>{dosageLabel(med)}</Text>
      {taken ? (
        <View style={styles.takenBadge}>
          <Text style={styles.takenBadgeText}>Taken ✓</Text>
        </View>
      ) : (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>Pending</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // Top fixed section
  topSection: {
    paddingTop: 20,
    paddingBottom: 22,
    paddingHorizontal: 22,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  slotChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  slotChipText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  topProgress: { fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginBottom: 8 },
  topProgressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' },
  topProgressFill: { height: 8, backgroundColor: '#4ADE80', borderRadius: 4 },

  // Active med cards (horizontal scroll)
  currentMedsWrap: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
  },
  currentMedsScroll: { paddingHorizontal: 16, gap: 12 },

  activeMedCard: {
    width: 150,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  activeMedCardDone: {
    borderColor: COLORS.successBorder,
    backgroundColor: COLORS.successBg,
  },

  bigCheckbox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigCheckboxPending: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderStyle: 'dashed',
  },
  bigCheckboxDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
    borderStyle: 'solid',
  },
  bigCheckmarkDone: { fontSize: 32, color: '#fff', fontWeight: '800' },
  bigCheckmarkPending: { fontSize: 12, color: COLORS.primary, fontWeight: '800' },

  activeMedName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  activeMedNameDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  activeMedDose: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },

  takenBadge: {
    backgroundColor: COLORS.successBg,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: COLORS.successBorder,
  },
  takenBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.success },
  pendingBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#B3D7F0',
  },
  pendingBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  noCurrentMeds: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  noCurrentMedsText: { fontSize: 15, color: COLORS.textMuted, fontWeight: '600' },

  // Scroll content (manage section)
  scrollContent: { padding: 20, paddingBottom: 48 },

  manageSectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 18,
  },

  // Scan card
  scanCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    padding: 28,
    marginBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  scanTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  scanSub: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  scanBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
    minWidth: 200,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
  },
  scanBtnDisabled: { opacity: 0.75 },
  scanBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scanBtnText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  scannedBadge: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  scannedBadgeText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' },

  // Form card
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 24,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  formTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 18 },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 20,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    minHeight: 58,
  },

  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  freqBtn: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  freqBtnActive: { backgroundColor: COLORS.primary },
  freqBtnIcon: { fontSize: 28, marginBottom: 4 },
  freqBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  freqBtnTextActive: { color: '#FFFFFF' },

  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 64,
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },

  // Med list
  listSection: { marginBottom: 16 },
  listTitle: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginVertical: 5,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    minHeight: 80,
  },
  medRowDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    marginRight: 14,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  medRowInfo: { flex: 1 },
  medRowName: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  medRowDosage: { fontSize: 18, color: COLORS.textSecondary, marginTop: 2 },
  medRowTimes: { fontSize: 15, color: COLORS.textMuted, marginTop: 4 },
  deleteBtn: { padding: 10, marginLeft: 8 },
  deleteIcon: { fontSize: 24 },

  emptyList: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyIcon: { fontSize: 52, marginBottom: 10 },
  emptyText: { fontSize: 22, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  emptySubtext: { fontSize: 17, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24 },
});
