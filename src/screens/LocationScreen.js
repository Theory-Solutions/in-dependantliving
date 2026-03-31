/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const MOCK_TIMELINE = [
  { time: '8:00 AM',  icon: '🏠', label: 'Home',                   detail: '1234 E Sunrise Dr' },
  { time: '10:15 AM', icon: '🚶', label: 'Left home',              detail: 'Heading out' },
  { time: '10:30 AM', icon: '📍', label: 'Tucson YMCA',            detail: '60 W Alameda St' },
  { time: '12:00 PM', icon: '🏠', label: 'Returned home',          detail: '1234 E Sunrise Dr' },
  { time: '2:15 PM',  icon: '🚶', label: 'Left home',              detail: 'Heading out' },
  { time: '2:30 PM',  icon: '🏥', label: 'Tucson Medical Center',  detail: '5301 E Grant Rd' },
  { time: '3:45 PM',  icon: '🏠', label: 'Returned home',          detail: '1234 E Sunrise Dr' },
];

const CURRENT_STATUS = {
  icon: '🏠',
  label: 'Home',
  address: '1234 E Sunrise Dr, Tucson, AZ',
  updatedAgo: '12 min ago',
  sharing: true,
};

export default function LocationScreen({ navigation }) {
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
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>📍 Location</Text>
              <Text style={styles.headerSub}>Real-time whereabouts</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>

          {/* Current status card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.seniorAvatar}>
                <Text style={styles.seniorAvatarEmoji}>🧓</Text>
              </View>
              <View style={styles.seniorInfo}>
                <Text style={styles.seniorName}>Margaret</Text>
                <Text style={styles.seniorRelation}>Your loved one</Text>
              </View>
              <View style={[
                styles.sharingBadge,
                CURRENT_STATUS.sharing ? styles.sharingOn : styles.sharingOff,
              ]}>
                <Ionicons
                  name={CURRENT_STATUS.sharing ? 'location' : 'location-outline'}
                  size={13}
                  color={CURRENT_STATUS.sharing ? COLORS.success : COLORS.textMuted}
                />
                <Text style={[
                  styles.sharingBadgeText,
                  CURRENT_STATUS.sharing ? styles.sharingOnText : styles.sharingOffText,
                ]}>
                  {CURRENT_STATUS.sharing ? 'Sharing ON' : 'Sharing OFF'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <Text style={styles.statusIcon}>{CURRENT_STATUS.icon}</Text>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>{CURRENT_STATUS.label}</Text>
                <Text style={styles.statusAddress}>{CURRENT_STATUS.address}</Text>
              </View>
            </View>

            <View style={styles.updatedRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.updatedText}>Last updated {CURRENT_STATUS.updatedAgo}</Text>
            </View>
          </View>

          {/* Map placeholder */}
          <View style={styles.mapCard}>
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapEmoji}>🗺️</Text>
              <Text style={styles.mapTitle}>Map View Coming Soon</Text>
              <Text style={styles.mapSub}>
                Real-time GPS tracking will be available in the next update. We'll show an interactive map right here.
              </Text>
            </View>
            <View style={styles.mapChips}>
              <View style={styles.mapChip}>
                <Ionicons name="location" size={13} color={COLORS.primary} />
                <Text style={styles.mapChipText}>GPS Active</Text>
              </View>
              <View style={styles.mapChip}>
                <Ionicons name="wifi" size={13} color={COLORS.success} />
                <Text style={styles.mapChipText}>Connected</Text>
              </View>
              <View style={styles.mapChip}>
                <Ionicons name="shield-checkmark" size={13} color={COLORS.primary} />
                <Text style={styles.mapChipText}>Private</Text>
              </View>
            </View>
          </View>

          {/* Activity timeline */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🕐</Text>
              <Text style={styles.cardTitle}>Today's Activity</Text>
            </View>
            {MOCK_TIMELINE.map((entry, i) => (
              <View key={i} style={styles.timelineRow}>
                {/* Vertical line */}
                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineTime}>{entry.time}</Text>
                </View>
                <View style={styles.timelineLineWrap}>
                  <View style={[
                    styles.timelineDot,
                    i === MOCK_TIMELINE.length - 1 && styles.timelineDotActive,
                  ]} />
                  {i < MOCK_TIMELINE.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineRight}>
                  <Text style={styles.timelineIcon}>{entry.icon}</Text>
                  <View style={styles.timelineTextWrap}>
                    <Text style={styles.timelineLabel}>{entry.label}</Text>
                    <Text style={styles.timelineDetail}>{entry.detail}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Privacy note */}
          <View style={styles.privacyCard}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <Text style={styles.privacyText}>
              <Text style={styles.privacyBold}>Privacy protected.</Text> Only general location is shared — never precise GPS coordinates. Your loved one controls sharing in their Settings.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingTop: 16, paddingBottom: 24, paddingHorizontal: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },

  body: { padding: 18 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18, padding: 18, marginBottom: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  cardIcon: { fontSize: 22 },
  cardTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },

  // Senior info
  seniorAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  seniorAvatarEmoji: { fontSize: 26 },
  seniorInfo: { flex: 1 },
  seniorName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  seniorRelation: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  sharingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 100, paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 1.5,
  },
  sharingOn: { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder },
  sharingOff: { backgroundColor: COLORS.background, borderColor: COLORS.border },
  sharingBadgeText: { fontSize: 12, fontWeight: '700' },
  sharingOnText: { color: COLORS.success },
  sharingOffText: { color: COLORS.textMuted },

  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 14 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  statusIcon: { fontSize: 40 },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  statusAddress: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },

  updatedRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  updatedText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },

  // Map card
  mapCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18, padding: 18, marginBottom: 14,
    borderWidth: 1.5, borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  mapPlaceholder: {
    backgroundColor: COLORS.background,
    borderRadius: 14, padding: 24,
    alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  mapEmoji: { fontSize: 48, marginBottom: 10 },
  mapTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 6 },
  mapSub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  mapChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  mapChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.background, borderRadius: 100,
    paddingVertical: 6, paddingHorizontal: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  mapChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },

  // Timeline
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
  },
  timelineLeft: { width: 68, paddingTop: 2 },
  timelineTime: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textAlign: 'right' },
  timelineLineWrap: { width: 28, alignItems: 'center', paddingTop: 4 },
  timelineDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.border, borderWidth: 2, borderColor: COLORS.primary,
  },
  timelineDotActive: { backgroundColor: COLORS.primary },
  timelineLine: { width: 2, flex: 1, backgroundColor: COLORS.divider, minHeight: 28, marginTop: 2 },
  timelineRight: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingBottom: 14 },
  timelineIcon: { fontSize: 22, lineHeight: 26 },
  timelineTextWrap: { flex: 1 },
  timelineLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  timelineDetail: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },

  // Privacy
  privacyCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.primary + '33',
  },
  privacyText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  privacyBold: { fontWeight: '800', color: COLORS.textPrimary },
});
