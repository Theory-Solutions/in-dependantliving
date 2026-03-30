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
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { FREQUENCY_LABELS } from '../constants/mockData';

export default function MedItem({ medication, timeOfDay, onToggle, onDelete }) {
  const isTaken = medication.taken && medication.taken[timeOfDay];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.checkbox, isTaken && styles.checkboxChecked]}
        onPress={() => onToggle && onToggle(medication.id, timeOfDay)}
        activeOpacity={0.7}
        accessibilityLabel={isTaken ? 'Mark as not taken' : 'Mark as taken'}
      >
        {isTaken && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.name}>{medication.name}</Text>
        <Text style={styles.dosage}>{medication.dosage}</Text>
        {timeOfDay && (
          <Text style={styles.time}>{FREQUENCY_LABELS[timeOfDay] || timeOfDay}</Text>
        )}
        {!timeOfDay && medication.frequency && (
          <Text style={styles.time}>
            {medication.frequency.map((f) => FREQUENCY_LABELS[f] || f).join('  ')}
          </Text>
        )}
      </View>

      {onDelete && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(medication.id)}
          activeOpacity={0.7}
          accessibilityLabel="Delete medication"
        >
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: COLORS.surface,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dosage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  time: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
});
