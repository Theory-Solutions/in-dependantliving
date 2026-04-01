/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loginUser, registerUser, resetPassword } from '../services/authService';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/colors';

const { height } = Dimensions.get('window');

// ── Sub-component: Tab pill ────────────────────────────────────────────────
function TabBar({ activeTab, onTabChange }) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tabItem, activeTab === 'signin' && styles.tabItemActive]}
        onPress={() => onTabChange('signin')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabLabel, activeTab === 'signin' && styles.tabLabelActive]}>
          Sign In
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabItem, activeTab === 'signup' && styles.tabItemActive]}
        onPress={() => onTabChange('signup')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabLabel, activeTab === 'signup' && styles.tabLabelActive]}>
          Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Sub-component: Input field ─────────────────────────────────────────────
function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  textContentType,
  hasError,
  rightIcon,
  onRightIconPress,
}) {
  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View style={[styles.inputWrap, hasError && styles.inputWrapError]}>
        <TextInput
          style={styles.inputField}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
          autoComplete={autoComplete}
          textContentType={textContentType}
          autoCorrect={false}
        />
        {rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.inputRightBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={rightIcon} size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ── Sign In Form ───────────────────────────────────────────────────────────
function SignInForm({ onGuestPress }) {
  const { setRole } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      // AppContext auth listener will detect the user and navigate
    } catch (err) {
      Alert.alert('Sign In Failed', err.message || 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.prompt(
      'Reset Password',
      'Enter your email address to receive a reset link.',
      async (inputEmail) => {
        if (!inputEmail) return;
        try {
          await resetPassword(inputEmail.trim());
          Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
        } catch (err) {
          Alert.alert('Error', err.message || 'Could not send reset email.');
        }
      },
      'plain-text',
      email,
      'email-address',
    );
  };

  const handleGuest = async () => {
    onGuestPress();
  };

  return (
    <View>
      <InputField
        label="Email"
        value={email}
        onChangeText={t => { setEmail(t); setErrors(p => ({ ...p, email: null })); }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        hasError={!!errors.email}
      />
      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

      <InputField
        label="Password"
        value={password}
        onChangeText={t => { setPassword(t); setErrors(p => ({ ...p, password: null })); }}
        placeholder="••••••••"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        hasError={!!errors.password}
        rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowPassword(v => !v)}
      />
      {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

      <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotWrap}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.btnDisabled]}
        onPress={handleSignIn}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#FFFFFF" size="small" />
          : <Text style={styles.primaryBtnText}>Sign In</Text>
        }
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.outlineBtn}
        onPress={handleGuest}
        activeOpacity={0.85}
      >
        <Ionicons name="person-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
        <Text style={styles.outlineBtnText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Role Selector ──────────────────────────────────────────────────────────
function RoleSelector({ selectedRole, onSelect }) {
  return (
    <View style={styles.roleRow}>
      <TouchableOpacity
        style={[styles.roleOption, selectedRole === 'senior' && styles.roleOptionActive]}
        onPress={() => onSelect('senior')}
        activeOpacity={0.8}
      >
        <Text style={styles.roleEmoji}>🏠</Text>
        <Text style={[styles.roleOptionText, selectedRole === 'senior' && styles.roleOptionTextActive]}>
          Independent
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.roleOption, selectedRole === 'family' && styles.roleOptionActive]}
        onPress={() => onSelect('family')}
        activeOpacity={0.8}
      >
        <Text style={styles.roleEmoji}>👥</Text>
        <Text style={[styles.roleOptionText, selectedRole === 'family' && styles.roleOptionTextActive]}>
          Independent Family / Care
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Sign Up Form ───────────────────────────────────────────────────────────
function SignUpForm({ onRegistered }) {
  const { setRole } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!selectedRole) e.role = 'Please select your role';
    if (!termsAccepted) e.terms = 'Please accept the Terms of Service';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await registerUser({ email: email.trim(), password, name: name.trim(), role: selectedRole });
      // DON'T set role yet — let PairingScreen handle it after pairing completes
      if (onRegistered) onRegistered(selectedRole);
      // AppContext auth listener will detect the user
    } catch (err) {
      Alert.alert('Sign Up Failed', err.message || 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <InputField
        label="Full Name"
        value={name}
        onChangeText={t => { setName(t); setErrors(p => ({ ...p, name: null })); }}
        placeholder="Margaret Williams"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        hasError={!!errors.name}
      />
      {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

      <InputField
        label="Email"
        value={email}
        onChangeText={t => { setEmail(t); setErrors(p => ({ ...p, email: null })); }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        hasError={!!errors.email}
      />
      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

      <InputField
        label="Password"
        value={password}
        onChangeText={t => { setPassword(t); setErrors(p => ({ ...p, password: null })); }}
        placeholder="Min. 6 characters"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        hasError={!!errors.password}
        rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowPassword(v => !v)}
      />
      {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

      <InputField
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={t => { setConfirmPassword(t); setErrors(p => ({ ...p, confirmPassword: null })); }}
        placeholder="Re-enter password"
        secureTextEntry={!showConfirm}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        hasError={!!errors.confirmPassword}
        rightIcon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowConfirm(v => !v)}
      />
      {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

      <Text style={styles.inputLabel}>Your Role</Text>
      <RoleSelector selectedRole={selectedRole} onSelect={r => { setSelectedRole(r); setErrors(p => ({ ...p, role: null })); }} />
      {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}

      {/* Terms checkbox */}
      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => { setTermsAccepted(v => !v); setErrors(p => ({ ...p, terms: null })); }}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
          {termsAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>
      {errors.terms ? <Text style={styles.errorText}>{errors.terms}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.btnDisabled]}
        onPress={handleRegister}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#FFFFFF" size="small" />
          : <Text style={styles.primaryBtnText}>Create Account</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
export default function AuthScreen({ navigation }) {
  const { setRole } = useApp();
  const [activeTab, setActiveTab] = useState('signin');

  const handleGuest = async () => {
    // Navigate to onboarding for role selection (existing guest flow)
    if (navigation) {
      navigation.navigate('Onboarding');
    }
  };

  const handleRegistered = async (selectedRole) => {
    // DON'T set the role yet — navigate to pairing first
    // Role gets set after pairing completes (or user skips)
    // Store role temporarily so PairingScreen knows which view to show
    await AsyncStorage.setItem('pendingRole', selectedRole);
    if (navigation) {
      navigation.navigate('Pairing');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.root}>
        {/* Gradient header */}
        <LinearGradient
          colors={['#0E4D7A', '#1A6FA3', '#2E8BC4']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <SafeAreaView style={styles.safe} edges={['top']}>
          {/* Logo area */}
          <View style={styles.logoArea}>
            <View style={styles.logoRing}>
              <View style={styles.logoInner}>
                <Text style={styles.logoEmoji}>💙</Text>
              </View>
            </View>
            <Text style={styles.appName}>In-dependent Living</Text>
            <Text style={styles.tagline}>Live independently. Stay connected.</Text>
          </View>

          {/* Bottom sheet card */}
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

              {activeTab === 'signin'
                ? <SignInForm onGuestPress={handleGuest} />
                : <SignUpForm onRegistered={handleRegistered} />
              }

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

  logoArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  logoRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 32 },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    letterSpacing: 0.2,
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
    marginBottom: 20,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabItemActive: {
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Input
  inputGroup: { marginBottom: 6 },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
  },
  inputWrapError: {
    borderColor: COLORS.alert,
    backgroundColor: COLORS.alertBg,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 12,
  },
  inputRightBtn: {
    paddingLeft: 8,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.alert,
    marginBottom: 4,
    marginLeft: 2,
    fontWeight: '500',
  },

  // Forgot password
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Buttons
  primaryBtn: {
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
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  outlineBtn: {
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

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1.5, backgroundColor: COLORS.divider },
  dividerText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },

  // Role selector
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
    marginBottom: 8,
  },
  roleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: 6,
  },
  roleOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleEmoji: { fontSize: 22 },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  roleOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 14,
    marginBottom: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.disabled,
    marginTop: 20,
  },
});
