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
import {
  View, Text, Modal, TouchableOpacity,
  StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { COLORS } from '../constants/colors';

const { height } = Dimensions.get('window');

function PillCountBar({ remaining, total }) {
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const color = pct > 40 ? COLORS.success : pct > 15 ? COLORS.warning : COLORS.alert;
  const bgColor = pct > 40 ? COLORS.successBg : pct > 15 ? COLORS.warningBg : COLORS.alertBg;
  const borderColor = pct > 40 ? COLORS.successBorder : pct > 15 ? COLORS.warningBorder : COLORS.alertBorder;

  return (
    <View style={[styles.pillCountCard, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.pillCountRow}>
        <View>
          <Text style={[styles.pillCountNum, { color }]}>{remaining}</Text>
          <Text style={styles.pillCountLabel}>pills remaining</Text>
        </View>
        <View style={styles.pillCountRight}>
          <Text style={[styles.pillCountPct, { color }]}>{Math.round(pct)}%</Text>
          <Text style={styles.pillCountLabel}>of {total} total</Text>
        </View>
      </View>
      <View style={styles.pillBar}>
        <View style={[styles.pillBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      {remaining <= 7 && (
        <View style={[styles.refillAlert, { borderColor }]}>
          <Text style={[styles.refillAlertText, { color }]}>
            {remaining === 0
              ? '⚠️ Out of medication — contact pharmacy now'
              : `⚠️ Only ${remaining} pills left — refill soon`}
          </Text>
        </View>
      )}
    </View>
  );
}

// Normalise both data shapes (senior context vs family dashboard)
function normaliseMed(med) {
  if (!med) return null;
  // frequency can be array ['morning','evening'] OR a string time label 'Morning'
  const freq = Array.isArray(med.frequency)
    ? med.frequency
    : med.time
      ? [med.time.toLowerCase()]
      : [];

  const qty = med.quantity ?? 1;

  return { ...med, frequency: freq, quantity: qty };
}

export default function MedDetailModal({ visible, medication, onClose }) {
  const med = normaliseMed(medication);
  if (!med) return null;

  // Always show "Xmg × N" regardless of quantity
  const qty = med.quantity ?? 1;
  const doseValue = parseInt(med.dosage) || 0;
  const totalMg = doseValue * qty;
  const doseDisplay = `${med.dosage} × ${qty}${totalMg > 0 && qty > 1 ? `  (${totalMg}mg total)` : ''}`;

  // Days remaining estimate
  const dosesPerDay = med.frequency.length || 1;
  const pillsPerDay = dosesPerDay * qty;
  const daysLeft = med.pillsRemaining && pillsPerDay > 0
    ? Math.floor(med.pillsRemaining / pillsPerDay)
    : null;

  const SLOT_ICONS = { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medDosage}>{doseDisplay}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            {/* Purpose — what it's for */}
            <View style={styles.purposeCard}>
              <Text style={styles.purposeIcon}>💊</Text>
              <View style={styles.purposeTextBlock}>
                <Text style={styles.purposeLabel}>WHAT IT'S FOR</Text>
                <Text style={styles.purposeValue}>
                  {med.purpose || 'No purpose recorded'}
                </Text>
              </View>
            </View>

            {/* Directions from bottle */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionIcon}>📋</Text>
                <Text style={styles.sectionTitle}>Directions</Text>
              </View>
              <View style={styles.directionsCard}>
                <Text style={styles.directionsText}>
                  {med.directions || 'No directions recorded. Tap "Scan Bottle" to add directions from the prescription label.'}
                </Text>
              </View>
            </View>

            {/* Schedule */}
            {med.frequency.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionIcon}>🕐</Text>
                  <Text style={styles.sectionTitle}>Schedule</Text>
                </View>
                <View style={styles.scheduleGrid}>
                  {med.frequency.map((slot, i) => (
                    <View key={i} style={styles.scheduleChip}>
                      <Text style={styles.scheduleChipText}>
                        {SLOT_ICONS[slot] || '💊'}{'  '}
                        {slot.charAt(0).toUpperCase() + slot.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Pill count */}
            {med.pillsRemaining !== undefined && med.pillsTotal !== undefined && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionIcon}>🔢</Text>
                  <Text style={styles.sectionTitle}>Pill Count</Text>
                </View>
                <PillCountBar remaining={med.pillsRemaining} total={med.pillsTotal} />
                {daysLeft !== null && (
                  <View style={styles.daysLeftRow}>
                    <Text style={styles.daysLeftIcon}>📅</Text>
                    <Text style={styles.daysLeftText}>
                      Approximately{' '}
                      <Text style={styles.daysLeftBold}>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</Text>
                      {' '}of medication remaining
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Refills */}
            {med.refillsRemaining !== undefined && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionIcon}>🔄</Text>
                  <Text style={styles.sectionTitle}>Refills</Text>
                </View>
                <View style={[
                  styles.refillCard,
                  med.refillsRemaining === 0 && styles.refillCardAlert,
                  med.refillsRemaining > 0 && med.refillsRemaining <= 2 && styles.refillCardWarning,
                ]}>
                  <Text style={[
                    styles.refillNum,
                    { color: med.refillsRemaining === 0 ? COLORS.alert : med.refillsRemaining <= 2 ? COLORS.warning : COLORS.success }
                  ]}>
                    {med.refillsRemaining}
                  </Text>
                  <View style={styles.refillTextBlock}>
                    <Text style={styles.refillTitle}>
                      {med.refillsRemaining === 0
                        ? 'No refills remaining'
                        : `Refill${med.refillsRemaining !== 1 ? 's' : ''} remaining`}
                    </Text>
                    <Text style={styles.refillSub}>
                      {med.refillsRemaining === 0
                        ? 'Contact your doctor for a new prescription'
                        : med.refillsRemaining <= 2
                          ? 'Consider requesting a refill soon'
                          : 'Prescription is current'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Days supply note */}
            {med.daysSupply && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionIcon}>🏥</Text>
                  <Text style={styles.sectionTitle}>Prescription Info</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Days supply</Text>
                  <Text style={styles.infoValue}>{med.daysSupply} days</Text>
                </View>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.88,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 24,
  },
  handle: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  headerLeft: { flex: 1 },
  medName: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  medDosage: { fontSize: 15, color: COLORS.primary, marginTop: 3, fontWeight: '700' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    marginLeft: 12,
  },
  closeBtnText: { fontSize: 16, color: COLORS.textMuted, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20 },

  // Purpose card
  purposeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16, padding: 18, marginBottom: 20,
    borderWidth: 1.5, borderColor: COLORS.primary + '33',
  },
  purposeIcon: { fontSize: 36 },
  purposeTextBlock: { flex: 1 },
  purposeLabel: {
    fontSize: 11, fontWeight: '800', color: COLORS.primary,
    letterSpacing: 1, marginBottom: 4,
  },
  purposeValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 26 },

  // Section
  section: { marginBottom: 22 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 0.2 },

  // Directions
  directionsCard: {
    backgroundColor: COLORS.background, borderRadius: 14,
    padding: 18, borderWidth: 1.5, borderColor: COLORS.border,
  },
  directionsText: { fontSize: 17, color: COLORS.textPrimary, lineHeight: 27 },

  // Schedule
  scheduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scheduleChip: {
    backgroundColor: COLORS.primaryLight, borderRadius: 100,
    paddingVertical: 9, paddingHorizontal: 18,
    borderWidth: 1.5, borderColor: COLORS.primary + '44',
  },
  scheduleChipText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },

  // Pill count bar
  pillCountCard: {
    borderRadius: 16, padding: 18, borderWidth: 1.5,
  },
  pillCountRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  pillCountNum: { fontSize: 48, fontWeight: '800', lineHeight: 50 },
  pillCountRight: { alignItems: 'flex-end' },
  pillCountPct: { fontSize: 28, fontWeight: '800' },
  pillCountLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginTop: 2 },
  pillBar: {
    height: 10, backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 5, overflow: 'hidden', marginBottom: 10,
  },
  pillBarFill: { height: 10, borderRadius: 5 },
  refillAlert: { borderRadius: 8, borderWidth: 1.5, padding: 10, marginTop: 4 },
  refillAlertText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },

  // Days left
  daysLeftRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10,
    backgroundColor: COLORS.background, borderRadius: 12,
    padding: 14, borderWidth: 1.5, borderColor: COLORS.border,
  },
  daysLeftIcon: { fontSize: 22 },
  daysLeftText: { fontSize: 15, color: COLORS.textSecondary, flex: 1, lineHeight: 22 },
  daysLeftBold: { fontWeight: '800', color: COLORS.textPrimary },

  // Refill card
  refillCard: {
    flexDirection: 'row', alignItems: 'center', gap: 18,
    backgroundColor: COLORS.successBg, borderRadius: 16,
    padding: 20, borderWidth: 1.5, borderColor: COLORS.successBorder,
  },
  refillCardWarning: { backgroundColor: COLORS.warningBg, borderColor: COLORS.warningBorder },
  refillCardAlert: { backgroundColor: COLORS.alertBg, borderColor: COLORS.alertBorder },
  refillNum: { fontSize: 54, fontWeight: '800', lineHeight: 56 },
  refillTextBlock: { flex: 1 },
  refillTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  refillSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, lineHeight: 20 },

  // Info row
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: 12,
    padding: 14, borderWidth: 1.5, borderColor: COLORS.border,
  },
  infoLabel: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  infoValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
});
