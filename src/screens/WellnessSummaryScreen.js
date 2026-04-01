/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { sendDailyWellnessSummary } from '../services/notificationService';

// Compute a wellness grade based on meds taken + activity
function computeGrade(medsTaken, medsTotal, steps, stepGoal = 3000, checkedIn = false) {
  let score = 0;
  let maxScore = 0;

  // Medications: up to 50 points
  if (medsTotal > 0) {
    score += (medsTaken / medsTotal) * 50;
    maxScore += 50;
  }

  // Steps: up to 30 points
  maxScore += 30;
  const stepRatio = Math.min((steps || 0) / stepGoal, 1);
  score += stepRatio * 30;

  // Check-in: 20 points
  maxScore += 20;
  if (checkedIn) score += 20;

  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;

  if (pct >= 90) return { grade: 'A', color: COLORS.success, label: 'Excellent day!' };
  if (pct >= 75) return { grade: 'B', color: '#2196F3', label: 'Good day' };
  if (pct >= 60) return { grade: 'C', color: COLORS.warning, label: 'Fair day' };
  return { grade: 'D', color: COLORS.alert, label: 'Needs attention' };
}

export default function WellnessSummaryScreen({ navigation, route }) {
  // Accept data from navigation params or props
  const params = route?.params || {};
  const {
    seniorUserId = null,
    seniorName = 'Wellness Report',
    date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    medications = [],       // [{ name, timeOfDay, taken: bool }]
    steps = 0,
    stepGoal = 3000,
    checkedIn = false,
    calendarEvents = [],    // [{ title, completed: bool }]
    isFamilyView = false,
  } = params;

  const medsTaken = medications.filter(m => m.taken).length;
  const medsTotal = medications.length;
  const gradeInfo = computeGrade(medsTaken, medsTotal, steps, stepGoal, checkedIn);
  const stepPercent = Math.min(Math.round((steps / stepGoal) * 100), 100);
  const completedEvents = calendarEvents.filter(e => e.completed).length;

  const handleShareWithFamily = async () => {
    if (!seniorUserId) {
      alert('Cannot share: no user ID provided.');
      return;
    }
    try {
      await sendDailyWellnessSummary(seniorUserId, {
        medsTaken,
        medsTotal,
        steps,
        checkedIn,
      });
      alert('Summary shared with your family! ✅');
    } catch (e) {
      alert('Failed to share. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isFamilyView ? `${seniorName}'s Report` : "Today's Wellness Report"}
          </Text>
          <Text style={styles.headerDate}>{date}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Grade card */}
        <View style={styles.gradeCard}>
          <View style={[styles.gradeCircle, { backgroundColor: gradeInfo.color }]}>
            <Text style={styles.gradeLetter}>{gradeInfo.grade}</Text>
          </View>
          <View style={styles.gradeInfo}>
            <Text style={styles.gradeLabel}>{gradeInfo.label}</Text>
            <Text style={styles.gradeSubtitle}>
              Based on meds, activity, and check-in
            </Text>
          </View>
        </View>

        {/* Medications section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Medications</Text>
            <View style={[
              styles.countBadge,
              medsTaken === medsTotal && medsTotal > 0
                ? styles.countBadgeSuccess
                : styles.countBadgeWarning,
            ]}>
              <Text style={styles.countBadgeText}>{medsTaken}/{medsTotal} taken</Text>
            </View>
          </View>

          {medications.length === 0 ? (
            <Text style={styles.emptyText}>No medications scheduled today.</Text>
          ) : (
            medications.map((med, i) => (
              <View key={i} style={styles.medRow}>
                <Ionicons
                  name={med.taken ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={med.taken ? COLORS.success : COLORS.alert}
                />
                <Text style={[styles.medName, !med.taken && styles.medNameMissed]}>
                  {med.name}
                </Text>
                <Text style={styles.medTime}>
                  {med.timeOfDay?.charAt(0).toUpperCase() + med.timeOfDay?.slice(1) || ''}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Activity section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="walk" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Activity</Text>
          </View>

          <View style={styles.stepsRow}>
            <Text style={styles.stepsCount}>{(steps || 0).toLocaleString()}</Text>
            <Text style={styles.stepsLabel}> / {stepGoal.toLocaleString()} steps</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${stepPercent}%`, backgroundColor: stepPercent >= 100 ? COLORS.success : COLORS.primary },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>{stepPercent}% of daily goal</Text>
        </View>

        {/* Calendar section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Calendar</Text>
            {calendarEvents.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {completedEvents}/{calendarEvents.length} done
                </Text>
              </View>
            )}
          </View>

          {calendarEvents.length === 0 ? (
            <Text style={styles.emptyText}>No events scheduled today.</Text>
          ) : (
            calendarEvents.map((event, i) => (
              <View key={i} style={styles.eventRow}>
                <Ionicons
                  name={event.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={event.completed ? COLORS.success : COLORS.textMuted}
                />
                <Text style={[
                  styles.eventTitle,
                  event.completed && styles.eventTitleDone,
                ]}>
                  {event.title}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Check-in section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Check-in Status</Text>
          </View>
          <View style={styles.checkinStatus}>
            <Ionicons
              name={checkedIn ? 'checkmark-circle' : 'alert-circle'}
              size={28}
              color={checkedIn ? COLORS.success : COLORS.warning}
            />
            <Text style={[
              styles.checkinLabel,
              { color: checkedIn ? COLORS.success : COLORS.warning },
            ]}>
              {checkedIn ? 'Checked in today ✅' : 'No check-in recorded'}
            </Text>
          </View>
        </View>

        {/* Share with family button */}
        {!isFamilyView && (
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShareWithFamily}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.shareBtnText}>Share with Family</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },

  // Grade card
  gradeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  gradeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gradeLetter: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
  },
  gradeInfo: {
    flex: 1,
  },
  gradeLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  gradeSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },

  // Sections
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  countBadge: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeSuccess: {
    backgroundColor: COLORS.successBg,
  },
  countBadgeWarning: {
    backgroundColor: COLORS.warningBg,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },

  // Medications
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  medName: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  medNameMissed: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  medTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Activity
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  stepsCount: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  stepsLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  progressTrack: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
  },

  // Calendar
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  eventTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  eventTitleDone: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },

  // Check-in
  checkinStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  checkinLabel: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Share button
  shareBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
