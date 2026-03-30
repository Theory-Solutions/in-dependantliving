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
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const STATUS_COLORS = {
  green: COLORS.statusGreen,
  yellow: COLORS.statusYellow,
  red: COLORS.statusRed,
  active: COLORS.statusGreen,
  warning: COLORS.statusYellow,
  alert: COLORS.statusRed,
};

export default function StatusCard({ status = 'green', children, style }) {
  const borderColor = STATUS_COLORS[status] || COLORS.statusGreen;

  return (
    <View style={[styles.card, { borderLeftColor: borderColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderLeftWidth: 6,
    padding: 18,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
