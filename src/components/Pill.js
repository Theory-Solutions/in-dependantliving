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
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const VARIANTS = {
  success: { bg: COLORS.successBg, border: COLORS.successBorder, text: COLORS.success },
  warning: { bg: COLORS.warningBg, border: COLORS.warningBorder, text: COLORS.warning },
  alert: { bg: COLORS.alertBg, border: COLORS.alertBorder, text: COLORS.alert },
  primary: { bg: COLORS.primaryLight, border: COLORS.primary, text: COLORS.primary },
  neutral: { bg: COLORS.divider, border: COLORS.border, text: COLORS.textMuted },
};

export default function Pill({ label, variant = 'neutral', icon, style }) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <View style={[styles.pill, { backgroundColor: v.bg, borderColor: v.border }, style]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.label, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 100,
    borderWidth: 1.5,
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 5,
  },
  icon: { fontSize: 13 },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
});
