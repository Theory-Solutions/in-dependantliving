/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';

const FORECAST = [
  { day: 'Mon', high: 81, low: 62, icon: '☀️', label: 'Sunny' },
  { day: 'Tue', high: 84, low: 64, icon: '🌤️', label: 'Mostly Sunny' },
  { day: 'Wed', high: 77, low: 58, icon: '⛅', label: 'Partly Cloudy' },
  { day: 'Thu', high: 72, low: 55, icon: '🌥️', label: 'Cloudy' },
  { day: 'Fri', high: 79, low: 61, icon: '☀️', label: 'Sunny' },
];

export default function WeatherScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient
        colors={['#0E4D7A', '#1A6FA3']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weather</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Current weather hero */}
        <View style={styles.heroCard}>
          <Text style={styles.locationText}>📍 Tucson, AZ</Text>
          <Text style={styles.heroIcon}>⛅</Text>
          <Text style={styles.heroTemp}>78°F</Text>
          <Text style={styles.heroCondition}>Partly Cloudy</Text>
          <View style={styles.heroDetailRow}>
            <View style={styles.heroDetailItem}>
              <Text style={styles.heroDetailLabel}>Feels like</Text>
              <Text style={styles.heroDetailValue}>76°F</Text>
            </View>
            <View style={styles.heroDetailDivider} />
            <View style={styles.heroDetailItem}>
              <Text style={styles.heroDetailLabel}>High / Low</Text>
              <Text style={styles.heroDetailValue}>81° / 62°</Text>
            </View>
          </View>
        </View>

        {/* Details grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>☀️</Text>
            <Text style={styles.detailValue}>8</Text>
            <Text style={styles.detailLabel}>UV Index</Text>
            <Text style={styles.detailSub}>Very High</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>💧</Text>
            <Text style={styles.detailValue}>24%</Text>
            <Text style={styles.detailLabel}>Humidity</Text>
            <Text style={styles.detailSub}>Very Dry</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>💨</Text>
            <Text style={styles.detailValue}>8 mph</Text>
            <Text style={styles.detailLabel}>Wind</Text>
            <Text style={styles.detailSub}>West</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailIcon}>👁️</Text>
            <Text style={styles.detailValue}>10 mi</Text>
            <Text style={styles.detailLabel}>Visibility</Text>
            <Text style={styles.detailSub}>Clear</Text>
          </View>
        </View>

        {/* Sunrise / Sunset */}
        <View style={styles.sunCard}>
          <View style={styles.sunItem}>
            <Text style={styles.sunIcon}>🌅</Text>
            <Text style={styles.sunLabel}>Sunrise</Text>
            <Text style={styles.sunTime}>6:14 AM</Text>
          </View>
          <View style={styles.sunDivider} />
          <View style={styles.sunItem}>
            <Text style={styles.sunIcon}>🌇</Text>
            <Text style={styles.sunLabel}>Sunset</Text>
            <Text style={styles.sunTime}>7:42 PM</Text>
          </View>
        </View>

        {/* 5-day forecast */}
        <Text style={styles.sectionTitle}>5-Day Forecast</Text>
        {FORECAST.map((day, index) => (
          <View key={index} style={styles.forecastRow}>
            <Text style={styles.forecastDay}>{day.day}</Text>
            <Text style={styles.forecastIcon}>{day.icon}</Text>
            <Text style={styles.forecastCondition}>{day.label}</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>{day.high}°</Text>
              <Text style={styles.forecastLow}>{day.low}°</Text>
            </View>
          </View>
        ))}

        <Text style={styles.attribution}>Weather data for Tucson, AZ</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 22, color: '#fff', fontWeight: '700' },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  headerSpacer: { width: 44 },

  content: { padding: 18, paddingBottom: 48 },

  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  locationText: { fontSize: 16, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8 },
  heroIcon: { fontSize: 72, marginBottom: 4 },
  heroTemp: { fontSize: 64, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -2 },
  heroCondition: { fontSize: 22, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 20 },
  heroDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    gap: 24,
  },
  heroDetailItem: { alignItems: 'center' },
  heroDetailLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  heroDetailValue: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  heroDetailDivider: { width: 1, height: 36, backgroundColor: COLORS.border },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  detailIcon: { fontSize: 32, marginBottom: 6 },
  detailValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  detailLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },
  detailSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  sunCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 32,
  },
  sunItem: { alignItems: 'center' },
  sunIcon: { fontSize: 36, marginBottom: 4 },
  sunLabel: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  sunTime: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  sunDivider: { width: 1, height: 56, backgroundColor: COLORS.border },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },

  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  forecastDay: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    width: 48,
  },
  forecastIcon: { fontSize: 28, width: 44, textAlign: 'center' },
  forecastCondition: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  forecastTemps: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  forecastHigh: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  forecastLow: { fontSize: 18, fontWeight: '600', color: COLORS.textMuted },

  attribution: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 12,
    marginBottom: 8,
  },
});
