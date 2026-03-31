/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const MOCK_LOCATION = 'Tucson, AZ  32.2226° N, 110.9747° W';

export default function SOSScreen({ navigation }) {
  const [helpSent, setHelpSent] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the big SOS icon
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Countdown after help sent
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const showConfirmation = (actionLabel) => {
    setHelpSent(true);
    setCountdown(30);
  };

  const handleCall911 = () => {
    Linking.openURL('tel:911');
    showConfirmation('Called 911');
  };

  const handleCallFamily = () => {
    Alert.alert(
      'Call Family',
      'Choose a family member to call:',
      [
        { text: '👨 David (Son)',      onPress: () => { Linking.openURL('tel:+15205551234'); showConfirmation('Called David'); } },
        { text: '👩 Sarah (Daughter)', onPress: () => { Linking.openURL('tel:+15205555678'); showConfirmation('Called Sarah'); } },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSendAlert = () => {
    Alert.alert(
      '📍 Alert Sent',
      `Your location has been shared with your family:\n\n${MOCK_LOCATION}\n\nMessage: "I need help — please check on me."`,
      [{ text: 'OK', onPress: () => showConfirmation('Alert Sent') }]
    );
  };

  if (helpSent) {
    return (
      <LinearGradient colors={['#7C3AED', '#4C1D95']} style={styles.fill}>
        <SafeAreaView style={styles.fill}>
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmEmoji}>🆘</Text>
            <Text style={styles.confirmTitle}>Help is on the way</Text>
            <Text style={styles.confirmSub}>
              Stay calm. Your family and emergency services have been notified.
            </Text>

            <View style={styles.confirmCard}>
              <Text style={styles.confirmCardTitle}>Your Location</Text>
              <Text style={styles.confirmCardText}>📍 {MOCK_LOCATION}</Text>
            </View>

            {countdown !== null && countdown > 0 && (
              <View style={styles.countdownWrap}>
                <Text style={styles.countdownLabel}>Estimated response in</Text>
                <Text style={styles.countdownNum}>{countdown}s</Text>
              </View>
            )}

            <Text style={styles.confirmReassure}>
              You are not alone. Help is coming.{'\n'}Keep this screen open.
            </Text>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>← Back to Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#7F1D1D', '#DC2626']} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={28} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          {/* Big icon */}
          <Animated.Text style={[styles.sosIcon, { transform: [{ scale: pulseAnim }] }]}>
            🆘
          </Animated.Text>

          <Text style={styles.sosTitle}>Emergency</Text>
          <Text style={styles.sosSub}>Are you sure you need emergency help?</Text>

          <View style={styles.locationBadge}>
            <Ionicons name="location" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.locationText}>{MOCK_LOCATION}</Text>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonsWrap}>

            {/* Call 911 — primary */}
            <TouchableOpacity
              style={styles.btn911}
              onPress={handleCall911}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={28} color="#DC2626" />
              <View style={styles.btnTextWrap}>
                <Text style={styles.btn911Title}>Call 911</Text>
                <Text style={styles.btn911Sub}>Immediate emergency response</Text>
              </View>
            </TouchableOpacity>

            {/* Call Family */}
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={handleCallFamily}
              activeOpacity={0.85}
            >
              <Ionicons name="people" size={26} color="#fff" />
              <View style={styles.btnTextWrap}>
                <Text style={styles.btnSecTitle}>Call Family</Text>
                <Text style={styles.btnSecSub}>Contact a family member directly</Text>
              </View>
            </TouchableOpacity>

            {/* Send Alert */}
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={handleSendAlert}
              activeOpacity={0.85}
            >
              <Ionicons name="send" size={24} color="#fff" />
              <View style={styles.btnTextWrap}>
                <Text style={styles.btnSecTitle}>Send Alert</Text>
                <Text style={styles.btnSecSub}>Share location + "I need help" with family</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelFlatBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelFlatText}>← I'm OK — Go Back</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },

  container: {
    padding: 24,
    paddingTop: 8,
    alignItems: 'center',
    paddingBottom: 48,
  },

  headerRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sosIcon: { fontSize: 72, marginBottom: 12 },
  sosTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sosSub: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
    lineHeight: 26,
  },

  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },

  buttonsWrap: { alignSelf: 'stretch', gap: 14, marginBottom: 24 },

  // Call 911 — big white button
  btn911: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 22,
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  btnTextWrap: { flex: 1 },
  btn911Title: { fontSize: 22, fontWeight: '900', color: '#DC2626' },
  btn911Sub: { fontSize: 14, color: '#7F1D1D', fontWeight: '600', marginTop: 2 },

  // Secondary buttons
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 22,
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  btnSecTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  btnSecSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginTop: 2 },

  cancelFlatBtn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFlatText: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },

  // Confirmation screen
  confirmContainer: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmEmoji: { fontSize: 72, marginBottom: 16 },
  confirmTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmSub: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 28,
  },
  confirmCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  confirmCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  confirmCardText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 22,
  },
  countdownWrap: { alignItems: 'center', marginBottom: 24 },
  countdownLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  countdownNum: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
  },
  confirmReassure: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 36,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
