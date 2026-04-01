/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Switch, Animated, Dimensions,
  KeyboardAvoidingView, Platform, Alert, Vibration, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../constants/colors';
import parseEventText from '../utils/parseEventText';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

// ─── Mock data ──────────────────────────────────────────────────────────────

const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
const nextMonth = new Date(today); nextMonth.setMonth(today.getMonth() + 1);
const threeMonths = new Date(today); threeMonths.setMonth(today.getMonth() + 3);
const sixMonths = new Date(today); sixMonths.setMonth(today.getMonth() + 6);

function dateLabel(key) {
  if (key === 'today') return today.toISOString().split('T')[0];
  if (key === 'tomorrow') return tomorrow.toISOString().split('T')[0];
  if (key === 'next_week') return nextWeek.toISOString().split('T')[0];
  if (key === 'next_month') return nextMonth.toISOString().split('T')[0];
  if (key === 'three_months') return threeMonths.toISOString().split('T')[0];
  if (key === 'six_months') return sixMonths.toISOString().split('T')[0];
  return key;
}

// No mock events — calendar starts empty, users add their own
const MOCK_EVENTS = [];

// ─── Category definitions ────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'meds',        emoji: '💊', label: 'Meds',        color: '#1A6FA3', titlePre: 'Medication' },
  { key: 'appointment', emoji: '🏥', label: 'Doctor',      color: '#7C3AED', titlePre: 'Doctor Appointment' },
  { key: 'hair',        emoji: '✂️', label: 'Hair',        color: '#F59E0B', titlePre: 'Hair Appointment' },
  { key: 'activity',   emoji: '💪', label: 'Exercise',    color: '#059669', titlePre: 'Exercise' },
  { key: 'family',      emoji: '📞', label: 'Family Call', color: '#0D9488', titlePre: 'Family Call' },
  { key: 'errand',      emoji: '🚗', label: 'Errand',      color: '#B45309', titlePre: 'Errand' },
  { key: 'dining',      emoji: '🍽',  label: 'Dining',      color: '#DC2626', titlePre: 'Dining' },
  { key: 'social',      emoji: '🎭', label: 'Social',      color: '#DB2777', titlePre: 'Social Event' },
];

// ─── Date helpers ────────────────────────────────────────────────────────────

function formatGroupLabel(dateStr) {
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Convert any date string to ISO YYYY-MM-DD
function toISODate(dateStr) {
  if (!dateStr) return '';
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Keyword aliases
  const resolved = dateLabel(dateStr);
  if (/^\d{4}-\d{2}-\d{2}$/.test(resolved)) return resolved;
  // Try parsing natural language like "April 30, 2026" or "April 30"
  const thisYear = new Date().getFullYear();
  const withYear = dateStr.includes(',') ? dateStr : `${dateStr}, ${thisYear}`;
  const parsed = new Date(withYear);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return dateStr; // fallback — return as-is
}

function groupEventsByDate(events) {
  const groups = {};
  const todayStr = new Date().toISOString().split('T')[0];
  const sorted = [...events].sort((a, b) => {
    const da = toISODate(a.date);
    const db = toISODate(b.date);
    if (da !== db) return da < db ? -1 : 1;
    return (a.time || '').localeCompare(b.time || '');
  });
  for (const ev of sorted) {
    const key = toISODate(ev.date);
    if (!key) continue;
    // Events with no time on past days roll to today at midnight
    // Events with a time stay on their scheduled date
    if (!groups[key]) groups[key] = [];
    groups[key].push({ ...ev, date: key }); // normalize date in place
  }
  return groups;
}

function getWeekDates() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

// ─── Pulsing circle animation for voice modal ────────────────────────────────

function PulsingCircle() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.4, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1,   duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.15, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6,  duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.pulseMic}>
        <Text style={{ fontSize: 36 }}>🎤</Text>
      </View>
    </View>
  );
}

// ─── Event card ──────────────────────────────────────────────────────────────

function EventCard({ event, onPress, isExpanded, onEdit }) {
  const cat = CATEGORIES.find(c => c.key === event.category);
  const color = event.color || cat?.color || COLORS.primary;

  return (
    <TouchableOpacity
      style={[styles.eventCard, { borderLeftColor: color, borderLeftWidth: 5 }]}
      onPress={() => onPress(event)}
      activeOpacity={0.82}
    >
      <View style={styles.eventCardRow}>
        <View style={styles.eventCardLeft}>
          <Text style={styles.eventTime}>{event.time}</Text>
          <Text style={[styles.eventTitle, event.isPrivate && styles.eventTitlePrivate]}>
            {event.isPrivate ? '🔒 ' : ''}{event.title}
          </Text>
          {event.location ? (
            <Text style={styles.eventLocation}>📍 {event.location}</Text>
          ) : null}
        </View>
        <View style={styles.eventCardBadges}>
          {event.needsRide && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🚗 Ride</Text>
            </View>
          )}
          {event.recurring && (
            <View style={[styles.badge, { backgroundColor: COLORS.primaryLight }]}>
              <Text style={[styles.badgeText, { color: COLORS.primary }]}>🔁</Text>
            </View>
          )}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.textMuted}
          />
        </View>
      </View>

      {isExpanded && (
        <View style={styles.eventDetail}>
          <View style={styles.eventDetailDivider} />

          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailLabel}>Privacy</Text>
            <Text style={styles.eventDetailValue}>
              {event.isPrivate
                ? '🔒 Private — family sees "Busy"'
                : '👨‍👩‍👧 Visible to family'}
            </Text>
          </View>

          {event.category === 'meds' && (
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>Note</Text>
              <Text style={[styles.eventDetailValue, { color: COLORS.primary, fontStyle: 'italic' }]}>
                Medication events are always shared for safety
              </Text>
            </View>
          )}

          {event.recurring && (
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>Repeat</Text>
              <Text style={styles.eventDetailValue}>
                🔁 {event.recurring.charAt(0).toUpperCase() + event.recurring.slice(1)}
              </Text>
            </View>
          )}

          {event.reminder && (
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>Reminder</Text>
              <Text style={styles.eventDetailValue}>⏰ {event.reminder} before</Text>
            </View>
          )}

          {event.needsRide && (
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>Transportation</Text>
              <Text style={[styles.eventDetailValue, { color: COLORS.warning }]}>
                🚗 Needs a ride — family notified
              </Text>
            </View>
          )}

          {event.notes && (
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>Notes</Text>
              <Text style={styles.eventDetailValue}>{event.notes}</Text>
            </View>
          )}

          <View style={styles.eventDetailActions}>
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.8} onPress={() => onEdit && onEdit(event)}>
              <Ionicons name="pencil" size={16} color={COLORS.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              activeOpacity={0.8}
              onPress={() => Alert.alert('Delete Event', `Delete "${event.title}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive' },
              ])}
            >
              <Ionicons name="trash" size={16} color={COLORS.alert} />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Week grid view ──────────────────────────────────────────────────────────

function WeekGrid({ events }) {
  const weekDays = getWeekDates();
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingTop: 12 }}>
        {weekDays.map((day, i) => {
          const dayStr = day.toISOString().split('T')[0];
          const dayEvents = events.filter(ev => toISODate(ev.date) === dayStr);
          const isToday = i === 0;

          return (
            <View key={dayStr} style={[styles.weekCol, isToday && styles.weekColToday]}>
              <Text style={[styles.weekDayLabel, isToday && styles.weekDayLabelToday]}>
                {dayNames[day.getDay()]}
              </Text>
              <Text style={[styles.weekDayNum, isToday && styles.weekDayNumToday]}>
                {day.getDate()}
              </Text>
              <View style={styles.weekEvents}>
                {dayEvents.map(ev => {
                  const cat = CATEGORIES.find(c => c.key === ev.category);
                  const color = ev.color || cat?.color || COLORS.primary;
                  return (
                    <View key={ev.id} style={[styles.weekEventBlock, { backgroundColor: color }]}>
                      <Text style={styles.weekEventTime}>{ev.time}</Text>
                      <Text style={styles.weekEventTitle} numberOfLines={2}>
                        {ev.isPrivate ? '🔒 ' : ''}{ev.title}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Add event form (bottom sheet modal) ────────────────────────────────────

const RECURRING_OPTIONS = ['None', 'Daily', 'Weekly', 'Monthly'];
const REMINDER_OPTIONS = ['None', '30 min', '1 hour', '2 hours', '1 day', '3 days', '1 week'];

const PICKER_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const PICKER_DAY_LABELS = ['S','M','T','W','T','F','S'];

// ─── Inline date picker (no native module needed) ─────────────────────────────
function InlineDatePicker({ value, onChange }) {
  const initDate = value ? new Date(value + 'T12:00:00') : new Date();
  const [pickerMonth, setPickerMonth] = useState(initDate.getMonth());
  const [pickerYear, setPickerYear] = useState(initDate.getFullYear());
  const [open, setOpen] = useState(false);

  const selectedISO = value; // YYYY-MM-DD
  const todayISO = new Date().toISOString().split('T')[0];

  const prevPickerMonth = () => {
    if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(y => y - 1); }
    else setPickerMonth(m => m - 1);
  };
  const nextPickerMonth = () => {
    if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(y => y + 1); }
    else setPickerMonth(m => m + 1);
  };

  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(pickerYear, pickerMonth, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const handleDayPress = (day) => {
    const iso = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(iso);
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <View style={pickerStyles.wrap}>
      {/* Tap to open picker */}
      <TouchableOpacity
        style={[pickerStyles.trigger, open && pickerStyles.triggerOpen]}
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.85}
      >
        <Ionicons name="calendar" size={20} color={open ? COLORS.primary : COLORS.textMuted} style={{ marginRight: 10 }} />
        <Text style={[pickerStyles.triggerText, !value && pickerStyles.triggerPlaceholder]}>
          {displayValue || 'Tap to select a date'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* Calendar panel */}
      {open && (
        <View style={pickerStyles.panel}>
          {/* Month nav */}
          <View style={pickerStyles.navRow}>
            <TouchableOpacity onPress={prevPickerMonth} style={pickerStyles.navBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={pickerStyles.navTitle}>{PICKER_MONTH_NAMES[pickerMonth]} {pickerYear}</Text>
            <TouchableOpacity onPress={nextPickerMonth} style={pickerStyles.navBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={pickerStyles.dayLabels}>
            {PICKER_DAY_LABELS.map((d, i) => (
              <Text key={i} style={pickerStyles.dayLabel}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={pickerStyles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`e-${i}`} style={pickerStyles.cell} />;
              const iso = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = iso === selectedISO;
              const isToday = iso === todayISO;
              const isPast = iso < todayISO;
              return (
                <TouchableOpacity
                  key={iso}
                  style={[
                    pickerStyles.cell,
                    isSelected && pickerStyles.cellSelected,
                    isToday && !isSelected && pickerStyles.cellToday,
                    isPast && pickerStyles.cellPast,
                  ]}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    pickerStyles.cellText,
                    isSelected && pickerStyles.cellTextSelected,
                    isToday && !isSelected && pickerStyles.cellTextToday,
                    isPast && pickerStyles.cellTextPast,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Today shortcut */}
          <TouchableOpacity
            style={pickerStyles.todayBtn}
            onPress={() => { onChange(todayISO); setOpen(false); }}
          >
            <Text style={pickerStyles.todayBtnText}>Go to Today</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  trigger: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, minHeight: 52,
  },
  triggerOpen: { borderColor: COLORS.primary },
  triggerText: { flex: 1, fontSize: 17, color: COLORS.textPrimary, fontWeight: '500' },
  triggerPlaceholder: { color: COLORS.textMuted },
  panel: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.primary,
    padding: 12, marginTop: 4,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 5,
  },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn: { padding: 4 },
  navTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  dayLabels: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellSelected: { backgroundColor: COLORS.primary, borderRadius: 100 },
  cellToday: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 100 },
  cellPast: { opacity: 0.38 },
  cellText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  cellTextSelected: { color: '#fff', fontWeight: '800' },
  cellTextToday: { color: COLORS.primary, fontWeight: '800' },
  cellTextPast: { color: COLORS.textMuted },
  todayBtn: {
    marginTop: 10, paddingVertical: 8, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  todayBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});

const KEYWORD_MAP = [
  { keywords: ['doctor', 'dr.', 'dr ', 'physician', 'clinic', 'hospital', 'checkup', 'appointment', 'dentist', 'dental', 'eye', 'optom'], category: 'appointment' },
  { keywords: ['hair', 'haircut', 'salon', 'barber', 'nails', 'manicure', 'pedicure', 'spa'], category: 'hair' },
  { keywords: ['gym', 'exercise', 'workout', 'yoga', 'swim', 'aerobics', 'walk', 'jog', 'run', 'pilates', 'class'], category: 'activity' },
  { keywords: ['lunch', 'dinner', 'breakfast', 'brunch', 'eat', 'restaurant', 'cafe', 'dining', 'food'], category: 'dining' },
  { keywords: ['call', 'phone', 'family', 'kids', 'grandkids', 'son', 'daughter', 'mom', 'dad'], category: 'family' },
  { keywords: ['bridge', 'bingo', 'book club', 'club', 'party', 'friend', 'social', 'visit', 'meet'], category: 'social' },
  { keywords: ['errand', 'grocery', 'store', 'shopping', 'bank', 'post office', 'dry cleaning', 'pickup', 'pick up'], category: 'errand' },
  { keywords: ['medication', 'medicine', 'pill', 'med', 'rx', 'pharmacy', 'prescription'], category: 'meds' },
];

function AddEventModal({ visible, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    title: '',
    category: null,
    date: '',
    time: '',
    location: '',
    notes: '',
    recurring: 'None',
    reminder: 'None',
    needsRide: false,
    isPrivate: false,
    ...initialData,
  });

  useEffect(() => {
    if (visible) {
      setForm({
        title: '',
        category: null,
        date: '',
        time: '',
        location: '',
        notes: '',
        recurring: 'None',
        reminder: 'None',
        needsRide: false,
        isPrivate: false,
        ...initialData,
      });
    }
  }, [visible]);

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleCategoryChip = (cat) => {
    setForm(prev => ({ ...prev, category: cat.key, _autoCategory: false }));
    if (!form.title || CATEGORIES.some(c => c.titlePre === form.title)) {
      setField('title', cat.titlePre);
    }
  };

  const handleTitleChange = (text) => {
    setField('title', text);
    // Only auto-detect if user hasn't manually selected a category
    if (!form.category || form._autoCategory) {
      const lower = text.toLowerCase();
      for (const { keywords, category } of KEYWORD_MAP) {
        if (keywords.some(kw => lower.includes(kw))) {
          const cat = CATEGORIES.find(c => c.key === category);
          setForm(prev => ({ ...prev, title: text, category, _autoCategory: true, color: cat?.color }));
          return;
        }
      }
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      Alert.alert('Missing Info', 'Please enter an event title.');
      return;
    }
    if (!form.date) {
      Alert.alert('Missing Info', 'Please select a date.');
      return;
    }
    const cat = CATEGORIES.find(c => c.key === form.category);
    const isoDate = toISODate(form.date);
    onSave({
      id: form.id || String(Date.now()),
      ...form,
      date: isoDate, // always save as YYYY-MM-DD
      color: cat?.color || form.color || COLORS.primary,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        {/* Header */}
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={onClose} style={styles.formHeaderCancel}>
            <Text style={styles.formHeaderCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.formHeaderTitle}>{initialData?.id ? 'Edit Event' : 'Add Event'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.formHeaderSave}>
            <Text style={styles.formHeaderSaveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Category chips */}
            <Text style={styles.formLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                {CATEGORIES.map(cat => {
                  const active = form.category === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.catChip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
                      onPress={() => handleCategoryChip(cat)}
                    >
                      <Text style={styles.catChipEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.catChipLabel, active && styles.catChipLabelActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Title */}
            <Text style={styles.formLabel}>Event Title *</Text>
            <TextInput
              style={styles.formInput}
              value={form.title}
              onChangeText={handleTitleChange}
              placeholder="What's happening?"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="sentences"
            />
            {form._autoCategory && form.category && (
              <View style={styles.autoDetectBadge}>
                <Text style={styles.autoDetectText}>✨ Auto-detected — tap a chip to change</Text>
              </View>
            )}

            {/* Date — inline calendar picker */}
            <Text style={styles.formLabel}>Date *</Text>
            <InlineDatePicker
              value={form.date}
              onChange={iso => setField('date', iso)}
            />

            {/* Time */}
            <Text style={styles.formLabel}>Time</Text>
            <TextInput
              style={styles.formInput}
              value={form.time}
              onChangeText={t => setField('time', t)}
              placeholder="e.g. 2:30 PM"
              placeholderTextColor={COLORS.textMuted}
            />

            {/* Location */}
            <Text style={styles.formLabel}>Location (optional)</Text>
            <TextInput
              style={styles.formInput}
              value={form.location}
              onChangeText={t => setField('location', t)}
              placeholder="e.g. Tucson Medical Center"
              placeholderTextColor={COLORS.textMuted}
            />

            {/* Notes */}
            <Text style={styles.formLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.formInput, styles.formInputMulti]}
              value={form.notes}
              onChangeText={t => setField('notes', t)}
              placeholder="Any other details..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />

            {/* Recurring */}
            <Text style={styles.formLabel}>Repeat</Text>
            <View style={styles.chipRow}>
              {RECURRING_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optChip, form.recurring === opt && styles.optChipActive]}
                  onPress={() => setField('recurring', opt)}
                >
                  <Text style={[styles.optChipText, form.recurring === opt && styles.optChipTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reminder */}
            <Text style={styles.formLabel}>Reminder</Text>
            <View style={styles.chipRow}>
              {REMINDER_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optChip, form.reminder === opt && styles.optChipActive]}
                  onPress={() => setField('reminder', opt)}
                >
                  <Text style={[styles.optChipText, form.reminder === opt && styles.optChipTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reminder Type */}
            <Text style={styles.formLabel}>Reminder Type</Text>
            <View style={[styles.chipRow, { marginBottom: 18 }]}>
              {['Event Reminder', 'Birthday', 'Renewal/Expiry', 'Errand', 'Task'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.optChip, form.reminderType === type && styles.optChipActive]}
                  onPress={() => setField('reminderType', type)}
                >
                  <Text style={[styles.optChipText, form.reminderType === type && styles.optChipTextActive]}>
                    {type === 'Birthday' ? '🎂 ' : type === 'Renewal/Expiry' ? '📋 ' : type === 'Errand' ? '🚗 ' : type === 'Task' ? '✅ ' : '⏰ '}{type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Transportation — tap entire row to toggle */}
            <TouchableOpacity
              style={[styles.toggleRow, form.needsRide && { backgroundColor: COLORS.primaryLight, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.primary + '44' }]}
              onPress={() => setField('needsRide', !form.needsRide)}
              activeOpacity={0.8}
            >
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>🚗 Transportation Needed</Text>
                <Text style={styles.toggleSub}>
                  {form.needsRide ? '✅ Family will be notified' : 'Visible to family when enabled'}
                </Text>
              </View>
              <Switch
                value={form.needsRide}
                onValueChange={v => setField('needsRide', v)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor="#fff"
                style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
              />
            </TouchableOpacity>

            {/* Privacy — tap entire row to toggle */}
            <TouchableOpacity
              style={[styles.toggleRow, { marginBottom: 32 }, form.isPrivate && form.category !== 'meds' && { backgroundColor: '#FDF2F8', borderRadius: 12, borderWidth: 1.5, borderColor: '#DB2777' + '44' }]}
              onPress={() => {
                if (form.category !== 'meds') {
                  setField('isPrivate', !form.isPrivate);
                } else {
                  Alert.alert('Always Visible', 'Medication events are always shared for safety.');
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>🔒 Keep Private from Family</Text>
                <Text style={styles.toggleSub}>
                  {form.category === 'meds'
                    ? 'Medication events are always shared for safety'
                    : form.isPrivate
                      ? '✅ Private — family will only see "Busy"'
                      : 'Family will see this time is busy but not the details'}
                </Text>
              </View>
              <Switch
                value={form.category === 'meds' ? false : form.isPrivate}
                onValueChange={v => {
                  if (form.category !== 'meds') {
                    setField('isPrivate', v);
                  } else {
                    Alert.alert('Always Visible', 'Medication events are always shared for safety.');
                  }
                }}
                trackColor={{ false: COLORS.border, true: '#DB2777' }}
                thumbColor="#fff"
                style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
              />
            </TouchableOpacity>

            {/* Save button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Event</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Voice entry modal ───────────────────────────────────────────────────────

function VoiceModal({ visible, onClose, onParsed }) {
  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState(null);

  const hints = [
    '"Girls Bridge, Saturday April 11th, 9am at 49er\'s"',
    '"Hair appointment, April 23rd, 11 in the morning"',
    '"Doctor Smith, Tuesday the 15th at 2:30"',
  ];

  const handleParse = () => {
    const result = parseEventText(inputText);
    if (!result.title && !result.date) {
      Alert.alert('Could not parse', 'Try typing something like: "Doctor Smith, Tuesday the 15th at 2:30"');
      return;
    }
    setParsed(result);
  };

  const handleClose = () => {
    setParsed(null);
    setInputText('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={styles.voiceHeader}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.voiceClose}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.voiceTitle}>Add by Voice</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.voiceContent} keyboardShouldPersistTaps="handled">
          <PulsingCircle />
          <Text style={styles.voiceListening}>Listening...</Text>
          <Text style={styles.voiceNote}>
            (Voice input requires a native module — use the text field below for now)
          </Text>

          <View style={styles.voiceHintsBox}>
            <Text style={styles.voiceHintsTitle}>Try saying:</Text>
            {hints.map((h, i) => (
              <Text key={i} style={styles.voiceHintItem}>{h}</Text>
            ))}
          </View>

          {parsed ? (
            <View style={styles.parsedPreview}>
              <Text style={styles.parsedTitle}>✨ Here's what I heard:</Text>
              {parsed.title ? <Text style={styles.parsedItem}>📌 {parsed.title}</Text> : null}
              {parsed.date ? <Text style={styles.parsedItem}>📅 {parsed.date}</Text> : null}
              {parsed.time ? <Text style={styles.parsedItem}>🕐 {parsed.time}</Text> : null}
              {parsed.location ? <Text style={styles.parsedItem}>📍 {parsed.location}</Text> : null}
              <View style={styles.parsedActions}>
                <TouchableOpacity
                  style={styles.parsedConfirm}
                  onPress={() => { onParsed(parsed); setParsed(null); setInputText(''); onClose(); }}
                >
                  <Text style={styles.parsedConfirmText}>✓ Looks right — Add Event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.parsedEdit}
                  onPress={() => { onParsed(parsed); setParsed(null); setInputText(''); onClose(); }}
                >
                  <Text style={styles.parsedEditText}>✏️ Edit details first</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.formLabel}>Or type it here</Text>
              <TextInput
                style={[styles.formInput, { marginHorizontal: 20, alignSelf: 'stretch' }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder='e.g. "Hair appointment, April 23rd, 11am"'
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="sentences"
                multiline
              />

              <TouchableOpacity
                style={[styles.saveBtn, { marginHorizontal: 20, marginTop: 16, opacity: inputText.trim() ? 1 : 0.5 }]}
                onPress={handleParse}
                disabled={!inputText.trim()}
              >
                <Text style={styles.saveBtnText}>Parse & Review</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Camera / card scanner modal ────────────────────────────────────────────

function CardScannerModal({ visible, onClose, onScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [captured, setCaptured] = useState(false);
  const cameraRef = useRef(null);

  const handleCapture = () => {
    Vibration.vibrate(80);
    setCaptured(true);
    // Mock OCR result
    setTimeout(() => {
      setCaptured(false);
      onScanned({
        title: 'Dr. Smith - Follow-up',
        date: 'April 15, 2026',
        time: '2:30 PM',
        location: 'Tucson Medical Center, 5301 E Grant Rd',
        category: 'appointment',
        isPrivate: false,
      });
      onClose();
    }, 1200);
  };

  if (!visible) return null;

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 64, marginBottom: 20 }}>📷</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 10 }}>Camera Needed</Text>
          <Text style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 28 }}>
            To scan appointment cards, please allow camera access.
          </Text>
          <TouchableOpacity
            style={[styles.saveBtn, { width: '90%' }]}
            onPress={requestPermission}
          >
            <Text style={styles.saveBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 12 }} onPress={onClose}>
            <Text style={{ fontSize: 16, color: COLORS.textMuted }}>Not Now</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        {/* Overlay */}
        <View style={StyleSheet.absoluteFill}>
          {/* Top bar */}
          <SafeAreaView>
            <View style={styles.scannerTopBar}>
              <TouchableOpacity onPress={onClose} style={styles.scannerCloseBtn}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.scannerTopTitle}>Scan Appointment Card</Text>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>

          {/* Hint */}
          <Text style={styles.scannerHint}>Hold the card flat — fill the frame</Text>

          {/* Flat viewfinder box */}
          <View style={styles.scannerViewfinder}>
            {/* Corners */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          {/* Status */}
          {captured && (
            <View style={styles.scannerCapturing}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.scannerCapturingText}>Reading card...</Text>
            </View>
          )}

          {/* Capture button */}
          <View style={styles.scannerBottom}>
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={handleCapture}
              disabled={captured}
              activeOpacity={0.85}
            >
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Month calendar view ─────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function MonthView({ events, onDayPress }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showJumper, setShowJumper] = useState(false);

  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
  };
  const nextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };
  const jumpTo = (year, month) => {
    setCurrentMonth(new Date(year, month, 1));
    setShowJumper(false);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build 3 years of jump targets: this year, next year, year after
  const thisYear = new Date().getFullYear();
  const jumpYears = [thisYear, thisYear + 1, thisYear + 2];

  return (
    <View style={{ flex: 1 }}>
      {/* Month navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        {/* Tap month name to open quick-jump */}
        <TouchableOpacity onPress={() => setShowJumper(v => !v)} style={styles.monthNavTitleBtn}>
          <Text style={styles.monthNavTitle}>{monthName}</Text>
          <Ionicons name={showJumper ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} style={{ marginLeft: 4, marginTop: 2 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Quick jump panel */}
      {showJumper && (
        <ScrollView style={styles.jumperPanel} showsVerticalScrollIndicator={false}>
          {jumpYears.map(y => (
            <View key={y}>
              <Text style={styles.jumperYear}>{y}</Text>
              <View style={styles.jumperMonthRow}>
                {MONTH_NAMES.map((name, mi) => {
                  const isActive = y === year && mi === month;
                  const isPast = new Date(y, mi + 1, 0) < new Date();
                  return (
                    <TouchableOpacity
                      key={mi}
                      style={[styles.jumperMonthBtn, isActive && styles.jumperMonthBtnActive, isPast && styles.jumperMonthBtnPast]}
                      onPress={() => jumpTo(y, mi)}
                    >
                      <Text style={[styles.jumperMonthText, isActive && styles.jumperMonthTextActive, isPast && styles.jumperMonthTextPast]}>
                        {name.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.jumperTodayBtn} onPress={() => { setCurrentMonth(new Date()); setShowJumper(false); }}>
            <Text style={styles.jumperTodayText}>↩ Back to Today</Text>
          </TouchableOpacity>
        </ScrollView>
      )}


      {/* Day labels */}
      <View style={styles.monthDayLabels}>
        {DAY_LABELS.map(d => (
          <Text key={d} style={styles.monthDayLabel}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.monthGrid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={styles.monthCell} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = events.filter(ev => toISODate(ev.date) === dateStr);
          const isToday = dateStr === todayStr;
          const isPast = new Date(dateStr) < new Date(todayStr);

          return (
            <TouchableOpacity
              key={dateStr}
              style={[styles.monthCell, isToday && styles.monthCellToday, isPast && styles.monthCellPast]}
              onPress={() => onDayPress && onDayPress(dateStr)}
              activeOpacity={0.7}
            >
              <Text style={[styles.monthCellDay, isToday && styles.monthCellDayToday, isPast && styles.monthCellDayPast]}>
                {day}
              </Text>
              <View style={styles.monthDots}>
                {dayEvents.slice(0, 3).map((ev, j) => (
                  <View key={j} style={[styles.monthDot, { backgroundColor: ev.color || COLORS.primary }]} />
                ))}
                {dayEvents.length > 3 && <Text style={styles.monthMoreText}>+{dayEvents.length - 3}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main CalendarScreen ─────────────────────────────────────────────────────

export default function CalendarScreen() {
  const [events, setEvents] = useState(
    MOCK_EVENTS.map(ev => ({ ...ev, date: toISODate(ev.date) }))
  );
  const [viewMode, setViewMode] = useState('agenda'); // 'agenda' | 'week' | 'month'
  const [expandedId, setExpandedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [addInitialData, setAddInitialData] = useState({});
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const toggleEvent = (ev) => {
    setExpandedId(prev => (prev === ev.id ? null : ev.id));
  };

  const handleAddEvent = (eventData) => {
    if (editingEvent) {
      setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? { ...ev, ...eventData, id: ev.id } : ev));
      setEditingEvent(null);
      Alert.alert('Updated', `"${eventData.title}" has been updated.`);
    } else {
      setEvents(prev => [...prev, eventData]);
      Alert.alert('Event Added', `"${eventData.title}" has been added to your calendar.`);
    }
  };

  const handleVoiceParsed = (parsed) => {
    setAddInitialData({
      title: parsed.title || '',
      date: parsed.date ? toISODate(parsed.date) : '',
      time: parsed.time || '',
      location: parsed.location || '',
    });
    setShowAddModal(true);
  };

  const handleScanned = (data) => {
    setAddInitialData(data);
    setShowAddModal(true);
  };

  const openAddModal = (prefill = {}) => {
    setAddInitialData(prefill);
    setShowAddModal(true);
  };

  const grouped = groupEventsByDate(events);

  // ── PDF Export ─────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    try {
      // Build HTML for the calendar
      const dateGroups = Object.entries(grouped);
      
      const eventsHtml = dateGroups.map(([dateStr, dayEvents]) => {
        const label = formatGroupLabel(dateStr);
        const eventRows = dayEvents.map(ev => {
          const cat = CATEGORIES.find(c => c.key === ev.category);
          const emoji = cat?.emoji || '📅';
          const privateBadge = ev.isPrivate ? ' 🔒' : '';
          const rideBadge = ev.needsRide ? ' 🚗' : '';
          return `
            <tr>
              <td style="padding:8px 12px;color:#666;font-size:13px;white-space:nowrap;">${ev.time || '—'}</td>
              <td style="padding:8px 4px;font-size:16px;">${emoji}</td>
              <td style="padding:8px 12px;">
                <strong style="font-size:15px;">${ev.title}${privateBadge}${rideBadge}</strong>
                ${ev.location ? `<br><span style="color:#888;font-size:12px;">📍 ${ev.location}</span>` : ''}
              </td>
              <td style="padding:8px 12px;">
                ${ev.reminder ? `<span style="background:#E8F4FD;color:#1A6FA3;padding:2px 8px;border-radius:10px;font-size:11px;">⏰ ${ev.reminder}</span>` : ''}
              </td>
            </tr>
          `;
        }).join('');
        
        return `
          <tr>
            <td colspan="4" style="background:#1A6FA3;color:white;padding:10px 14px;font-size:16px;font-weight:bold;border-radius:4px;">
              ${label}
            </td>
          </tr>
          ${eventRows}
          <tr><td colspan="4" style="height:8px;"></td></tr>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, Arial, sans-serif; margin: 32px; color: #111; }
            h1 { color: #1A6FA3; font-size: 24px; margin-bottom: 4px; }
            .subtitle { color: #888; font-size: 14px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; }
            .footer { margin-top: 32px; color: #bbb; font-size: 11px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>📅 My Calendar</h1>
          <div class="subtitle">Printed from In-dependent Living · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <table>
            ${eventsHtml || '<tr><td style="padding:20px;color:#888;">No upcoming events</td></tr>'}
          </table>
          <div class="footer">In-dependent Living · © 2026 Theory Solutions LLC</div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share or Print Calendar',
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Print.printAsync({ uri });
      }
    } catch (e) {
      Alert.alert('Export Failed', e.message || 'Could not generate PDF. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>My Calendar</Text>
            <Text style={styles.headerSub}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {/* Voice */}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setShowVoiceModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 20 }}>🎤</Text>
            </TouchableOpacity>

            {/* PDF Export */}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={handleExportPDF}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="document-text-outline" size={22} color="#fff" />
            </TouchableOpacity>

            {/* ADD EVENT — moved to header */}
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={() => openAddModal({})}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>

            {/* View toggle */}
            <TouchableOpacity
              style={styles.viewToggleBtn}
              onPress={() => setViewMode(m => m === 'agenda' ? 'week' : m === 'week' ? 'month' : 'agenda')}
            >
              <Ionicons
                name={viewMode === 'agenda' ? 'calendar-outline' : viewMode === 'week' ? 'grid-outline' : 'list-outline'}
                size={18}
                color="#fff"
              />
              <Text style={styles.viewToggleBtnText}>
                {viewMode === 'agenda' ? 'Week' : viewMode === 'week' ? 'Month' : 'Agenda'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick-add category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={styles.quickChip}
                onPress={() => openAddModal({ category: cat.key, title: cat.titlePre })}
              >
                <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                <Text style={styles.quickChipLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Content */}
      {viewMode === 'week' ? (
        <WeekGrid events={events} />
      ) : viewMode === 'month' ? (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <MonthView
            events={events}
            onDayPress={(dateStr) => setSelectedDay(prev => prev === dateStr ? null : dateStr)}
          />
          {selectedDay && (() => {
            const dayEvs = events.filter(ev => toISODate(ev.date) === selectedDay);
            return (
              <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <Text style={styles.agendaDateLabel}>{formatGroupLabel(selectedDay)}</Text>
                {dayEvs.length === 0 ? (
                  <Text style={{ color: COLORS.textMuted, fontSize: 15, paddingLeft: 4, marginBottom: 8 }}>No events this day</Text>
                ) : (
                  dayEvs.map(ev => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      onPress={toggleEvent}
                      isExpanded={expandedId === ev.id}
                      onEdit={(ev) => {
                        setEditingEvent(ev);
                        setAddInitialData(ev);
                        setShowAddModal(true);
                      }}
                    />
                  ))
                )}
              </View>
            );
          })()}
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.agendaScroll}
          contentContainerStyle={styles.agendaContent}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(grouped).map(([dateStr, dayEvents]) => (
            <View key={dateStr} style={styles.agendaGroup}>
              <Text style={styles.agendaDateLabel}>{formatGroupLabel(dateStr)}</Text>
              {dayEvents.map(ev => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onPress={toggleEvent}
                  isExpanded={expandedId === ev.id}
                  onEdit={(ev) => {
                    setEditingEvent(ev);
                    setAddInitialData(ev);
                    setShowAddModal(true);
                  }}
                />
              ))}
            </View>
          ))}

          {Object.keys(grouped).length === 0 && (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📅</Text>
              <Text style={styles.emptyStateTitle}>No upcoming events</Text>
              <Text style={styles.emptyStateSub}>Tap + to add your first event</Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* FAB removed — Add Event button moved to header */}

      {/* Modals */}
      <AddEventModal
        visible={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingEvent(null); }}
        onSave={handleAddEvent}
        initialData={addInitialData}
      />

      <VoiceModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onParsed={handleVoiceParsed}
      />

      <CardScannerModal
        visible={showScanModal}
        onClose={() => setShowScanModal(false)}
        onScanned={handleScanned}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const CORNER_RADIUS = 5;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    minHeight: 38,
  },
  viewToggleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Quick-add chips
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minHeight: 38,
  },
  quickChipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // Agenda
  agendaScroll: { flex: 1 },
  agendaContent: { paddingHorizontal: 16, paddingTop: 16 },
  agendaGroup: { marginBottom: 20 },
  agendaDateLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
    paddingLeft: 4,
  },

  // Event card
  eventCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: COLORS.shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eventCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    paddingLeft: 16,
    minHeight: 52,
  },
  eventCardLeft: { flex: 1 },
  eventCardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  eventTime: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 3,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 23,
  },
  eventTitlePrivate: {
    color: COLORS.textSecondary,
  },
  eventLocation: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  badge: {
    backgroundColor: COLORS.warningBg,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: COLORS.warning },

  // Event detail
  eventDetail: { paddingHorizontal: 16, paddingBottom: 14 },
  eventDetailDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  eventDetailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    width: 90,
    paddingTop: 1,
  },
  eventDetailValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  eventDetailActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    minHeight: 42,
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.alertBorder,
    backgroundColor: COLORS.alertBg,
    minHeight: 42,
  },
  deleteBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.alert },

  // Week grid
  weekCol: {
    width: 100,
    marginRight: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 10,
    minHeight: 300,
  },
  weekColToday: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  weekDayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 2,
  },
  weekDayLabelToday: { color: COLORS.primary },
  weekDayNum: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  weekDayNumToday: { color: COLORS.primary },
  weekEvents: { gap: 6 },
  weekEventBlock: {
    borderRadius: 8,
    padding: 6,
  },
  weekEventTime: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  weekEventTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    marginTop: 1,
    lineHeight: 14,
  },

  // Add event form
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  formHeaderCancel: { paddingVertical: 4 },
  formHeaderCancelText: { fontSize: 16, color: COLORS.textMuted, fontWeight: '600' },
  formHeaderTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  formHeaderSave: { paddingVertical: 4 },
  formHeaderSaveText: { fontSize: 16, color: COLORS.primary, fontWeight: '800' },

  formScroll: { padding: 20 },
  formLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: COLORS.textPrimary,
    minHeight: 52,
    marginBottom: 16,
  },
  formInputMulti: {
    minHeight: 88,
    textAlignVertical: 'top',
  },

  // Category chips in form
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    minHeight: 44,
  },
  catChipEmoji: { fontSize: 18 },
  catChipLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  catChipLabelActive: { color: '#fff' },

  // Option chips (recurring, reminder)
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  optChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    minHeight: 42,
    justifyContent: 'center',
  },
  optChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optChipText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  optChipTextActive: { color: '#fff' },

  // Toggle rows
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
    minHeight: 68,
  },
  toggleInfo: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  toggleSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 3, lineHeight: 18 },

  // Save button
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: 58,
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginBottom: 8,
  },
  saveBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },

  // Voice modal
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  voiceClose: { fontSize: 16, color: COLORS.textMuted, fontWeight: '600' },
  voiceTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },

  voiceContent: { paddingTop: 32, paddingBottom: 48, alignItems: 'center' },
  voiceListening: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 20,
    marginBottom: 6,
  },
  voiceNote: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  voiceHintsBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
    alignSelf: 'stretch',
  },
  voiceHintsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  voiceHintItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 5,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // Pulse animation
  pulseWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
  },
  pulseMic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },

  // Scanner modal
  scannerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scannerCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTopTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
  },
  scannerHint: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 8,
  },
  scannerViewfinder: {
    width: width * 0.85,
    height: width * 0.55,
    alignSelf: 'center',
    marginTop: 16,
    position: 'relative',
  },
  scannerCapturing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    marginTop: 16,
  },
  scannerCapturingText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  scannerBottom: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  // Camera corners (reused from scanner)
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: CORNER_RADIUS,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: CORNER_RADIUS,
  },

  // Capture button
  captureBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },

  // Header add button (replaced FAB)
  headerAddBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: 16,
    color: COLORS.textMuted,
  },

  // Auto-detect badge (Fix 3)
  autoDetectBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
  },
  autoDetectText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Month view (Fix 4)
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  monthNavBtn: { padding: 8 },
  monthNavTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  monthDayLabels: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
  },
  monthDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    backgroundColor: COLORS.surface,
  },
  monthCell: {
    width: '14.28%',
    aspectRatio: 0.85,
    padding: 3,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.divider,
  },
  monthCellToday: { backgroundColor: COLORS.primaryLight },
  monthCellPast: { opacity: 0.45 },
  monthCellDay: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  monthCellDayToday: { color: COLORS.primary },
  monthCellDayPast: { color: COLORS.textMuted },
  monthDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 2,
    justifyContent: 'center',
  },
  monthDot: { width: 6, height: 6, borderRadius: 3 },
  monthMoreText: { fontSize: 9, color: COLORS.textMuted, fontWeight: '700' },

  // Parsed preview (Fix 5)
  parsedPreview: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '44',
    alignSelf: 'stretch',
  },
  parsedTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  parsedItem: {
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 22,
  },
  parsedActions: {
    gap: 10,
    marginTop: 16,
  },
  parsedConfirm: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  parsedConfirmText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  parsedEdit: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  parsedEditText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // Month jump panel
  monthNavTitleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  jumperPanel: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 280,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  jumperYear: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  jumperMonthRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  jumperMonthBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minWidth: 52,
    alignItems: 'center',
  },
  jumperMonthBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  jumperMonthBtnPast: {
    opacity: 0.45,
  },
  jumperMonthText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  jumperMonthTextActive: {
    color: '#fff',
  },
  jumperMonthTextPast: {
    color: COLORS.textMuted,
  },
  jumperTodayBtn: {
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  jumperTodayText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
