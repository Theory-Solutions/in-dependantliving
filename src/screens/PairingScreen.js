/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createPairingCode, connectWithCode } from '../services/pairingService';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/colors';

// ── Senior View: Show pairing code ────────────────────────────────────────
function SeniorPairingView({ onSkip }) {
  const { firebaseUser } = useApp();
  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadCode = async () => {
    if (!firebaseUser?.uid) {
      // Wait a moment for auth to resolve then retry
      setTimeout(loadCode, 1000);
      return;
    }
    try {
      const newCode = await createPairingCode(firebaseUser.uid);
      setCode(newCode);
    } catch (err) {
      console.log('[IL] Pairing code error:', err.message);
      Alert.alert('Error', err.message || 'Could not generate pairing code.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCode();
  }, [firebaseUser?.uid]); // re-run when uid becomes available

  const handleGenerateNew = async () => {
    setGenerating(true);
    try {
      const newCode = await createPairingCode(firebaseUser.uid);
      setCode(newCode);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not generate new code.');
    } finally {
      setGenerating(false);
    }
  };

  // Format as XXX-XXX
  const formattedCode = code ? `${code.slice(0, 3)}-${code.slice(3)}` : '--- ---';

  return (
    <View style={styles.pairingContent}>
      <View style={styles.iconCircle}>
        <Ionicons name="qr-code-outline" size={48} color={COLORS.primary} />
      </View>

      <Text style={styles.pairingTitle}>Your Pairing Code</Text>
      <Text style={styles.pairingSubtitle}>
        Share this code with your family member or caregiver to connect your accounts.
      </Text>

      <View style={styles.codeCard}>
        {loading
          ? <ActivityIndicator color={COLORS.primary} size="large" />
          : (
            <Text style={styles.codeText}>{formattedCode}</Text>
          )
        }
        <Text style={styles.codeExpiry}>Valid for 48 hours</Text>
      </View>

      <View style={styles.codeHintRow}>
        <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
        <Text style={styles.codeHintText}>
          Once used, this code will become invalid. Generate a new one if needed.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.outlineBtn, generating && styles.btnDisabled]}
        onPress={handleGenerateNew}
        activeOpacity={0.85}
        disabled={generating}
      >
        {generating
          ? <ActivityIndicator color={COLORS.primary} size="small" />
          : (
            <>
              <Ionicons name="refresh-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.outlineBtnText}>Generate New Code</Text>
            </>
          )
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip for Now</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Family View: Enter pairing code ───────────────────────────────────────
function FamilyPairingView({ onSkip, onSuccess, onNoCode }) {
  const { firebaseUser } = useApp();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRefs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDigitChange = (text, index) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(null);

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConnect = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits');
      shake();
      return;
    }

    if (!firebaseUser) {
      Alert.alert('Error', 'You must be signed in to pair accounts.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await connectWithCode(firebaseUser.uid, code);
      onSuccess(result.seniorName);
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  // Auto-connect from deep link (URL-based pairing)
  const handleAutoConnect = async (code) => {
    if (!firebaseUser) {
      // Store code and wait for auth to complete
      await AsyncStorage.setItem('pendingConnectCode', code);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await connectWithCode(firebaseUser.uid, code);
      onSuccess(result.seniorName);
      await AsyncStorage.removeItem('pendingConnectCode');
    } catch (err) {
      setError(err.message || 'Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.pairingContent}>
      <View style={styles.iconCircle}>
        <Ionicons name="people-outline" size={48} color={COLORS.primary} />
      </View>

      <Text style={styles.pairingTitle}>Enter Pairing Code</Text>
      <Text style={styles.pairingSubtitle}>
        Ask your loved one for their 6-digit code to connect your accounts.
      </Text>

      <Animated.View style={[styles.digitRow, { transform: [{ translateX: shakeAnim }] }]}>
        {digits.map((digit, i) => (
          <TextInput
            key={i}
            ref={ref => { inputRefs.current[i] = ref; }}
            style={[styles.digitBox, error && styles.digitBoxError]}
            value={digit}
            onChangeText={text => handleDigitChange(text, i)}
            onKeyPress={e => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            textAlign="center"
          />
        ))}
      </Animated.View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={16} color={COLORS.alert} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.btnDisabled]}
        onPress={handleConnect}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#FFFFFF" size="small" />
          : <Text style={styles.primaryBtnText}>Connect</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={onNoCode || onSkip} style={styles.noCodeBtn}>
        <Ionicons name="card-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
        <Text style={styles.noCodeText}>I don't have a code — Subscribe instead</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Success State ──────────────────────────────────────────────────────────
function SuccessView({ connectedName, onContinue }) {
  return (
    <View style={[styles.pairingContent, { alignItems: 'center' }]}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark-circle" size={72} color={COLORS.success} />
      </View>
      <Text style={styles.successTitle}>Connected!</Text>
      <Text style={styles.successSubtitle}>
        You are now connected to{'\n'}
        <Text style={styles.successName}>{connectedName}</Text>
      </Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={onContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── "Have a code?" choice screen ──────────────────────────────────────────
function CodeChoiceView({ onHaveCode, onNoCode }) {
  return (
    <View style={styles.pairingContent}>
      <View style={styles.iconCircle}>
        <Text style={{ fontSize: 48 }}>🔗</Text>
      </View>
      <Text style={styles.pairingTitle}>Connect with Family</Text>
      <Text style={styles.pairingSubtitle}>
        Do you have a pairing code from an Independent Living user?
      </Text>

      <TouchableOpacity style={[styles.primaryBtn, { flexDirection: 'row' }]} onPress={onHaveCode} activeOpacity={0.85}>
        <Ionicons name="key-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.primaryBtnText}>Yes, I have a code</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={onNoCode} activeOpacity={0.85}>
        <Ionicons name="card-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
        <Text style={styles.secondaryBtnText}>No code — Subscribe to get started</Text>
      </TouchableOpacity>

      <Text style={styles.codeHintText} style={{ marginTop: 16, textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
        A pairing code is shared by the Independent user from their Settings screen
      </Text>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
export default function PairingScreen({ navigation, route }) {
  const { role, setRole, firebaseUser } = useApp();
  const [connectedName, setConnectedName] = useState(null);
  const [pendingRole, setPendingRole] = useState(role);
  const [familyStep, setFamilyStep] = useState('choice'); // 'choice' | 'enter'

  // Read pending role and connect code from AsyncStorage
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('pendingRole');
      if (stored) setPendingRole(stored);
      
      // Check for pending connect code from deep link
      const connectCode = await AsyncStorage.getItem('pendingConnectCode');
      if (connectCode) {
        setDigits(connectCode.split(''));
        setFamilyStep('enter');
        // Auto-submit after a brief delay
        setTimeout(() => handleAutoConnect(connectCode), 500);
      }
    })();
  }, []);

  const isSenior = pendingRole === 'senior';

  const commitRoleAndNavigate = async (destination) => {
    // Now actually set the role — this triggers RootNavigator to show the main app
    const finalRole = pendingRole || 'senior';
    await AsyncStorage.removeItem('pendingRole');
    await setRole(finalRole);
    // The RootNavigator will automatically switch to the app
  };

  const handleSkip = async () => {
    // No pairing code entered — go to subscription FIRST, then set role after they subscribe/skip
    const finalRole = pendingRole || 'senior';
    await AsyncStorage.removeItem('pendingRole');
    await AsyncStorage.setItem('pendingSubscription', 'true');
    await setRole(finalRole);
    // RootNavigator will show the app, but we'll check for pendingSubscription 
    // to show the paywall on first load
  };

  const handleSuccess = (name) => {
    setConnectedName(name);
  };

  const handleContinue = async () => {
    // Paired successfully — set role, app loads automatically
    await commitRoleAndNavigate('App');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.root}>
        <LinearGradient
          colors={['#0E4D7A', '#1A6FA3', '#2E8BC4']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <SafeAreaView style={styles.safe} edges={['top']}>
          {/* Header bar */}
          <View style={styles.headerBar}>
            <Text style={styles.headerStep}>Setup · Step 2 of 2</Text>
            <Text style={styles.headerTitle}>Connect Accounts</Text>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              {connectedName ? (
                <SuccessView connectedName={connectedName} onContinue={handleContinue} />
              ) : isSenior ? (
                <SeniorPairingView onSkip={handleSkip} />
              ) : familyStep === 'choice' ? (
                <CodeChoiceView
                  onHaveCode={() => setFamilyStep('enter')}
                  onNoCode={handleSkip}
                />
              ) : (
                <FamilyPairingView
                  onSkip={() => setFamilyStep('choice')}
                  onSuccess={handleSuccess}
                />
              )}

              <Text style={styles.copyright}>© 2026 Theory Solutions LLC</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },
  gradient: { ...StyleSheet.absoluteFillObject },
  safe: { flex: 1 },

  headerBar: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  headerStep: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  sheetScroll: { flex: 1 },
  sheetContent: { flexGrow: 1, justifyContent: 'flex-end' },

  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 24,
  },

  pairingContent: {
    alignItems: 'center',
  },

  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  pairingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  pairingSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
    marginBottom: 28,
  },

  // Senior code display
  codeCard: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '33',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  codeText: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 8,
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  codeExpiry: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  codeHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  codeHintText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  // Family digit boxes
  digitRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  digitBox: {
    width: 48,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  digitBoxError: {
    borderColor: COLORS.alert,
    backgroundColor: COLORS.alertBg,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.alert,
    fontWeight: '500',
  },

  // Buttons
  primaryBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  secondaryBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 12,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  outlineBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },

  skipBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  skipText: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  noCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  noCodeText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Success state
  successCircle: {
    marginBottom: 20,
    marginTop: 8,
  },
  successTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.success,
    marginBottom: 10,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  successName: {
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.disabled,
    marginTop: 24,
  },
});
