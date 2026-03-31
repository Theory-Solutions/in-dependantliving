import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';

const { height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { setRole } = useApp();
  // useNavigation is safe here — screen is always inside a NavigationContainer
  let navigation;
  try {
    navigation = useNavigation();
  } catch (_) {
    navigation = null;
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0E4D7A', '#1A6FA3', '#2E8BC4']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safe}>
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

        {/* Bottom sheet style card */}
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>How will you use this?</Text>
          <Text style={styles.sheetSub}>Choose your role to get started</Text>

          {/* Monitored user */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => setRole('senior')}
            activeOpacity={0.85}
            accessibilityLabel="Independent"
            accessibilityRole="button"
          >
            <View style={styles.roleIconWrap}>
              <Text style={styles.roleEmoji}>🏠</Text>
            </View>
            <View style={styles.roleText}>
              <Text style={styles.roleTitle}>Independent</Text>
              <Text style={styles.roleSub}>For anyone living independently who wants to stay connected and on track</Text>
            </View>
            <View style={styles.roleArrow}>
              <Text style={styles.roleArrowText}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Caregiver */}
          <TouchableOpacity
            style={[styles.roleCard, styles.roleCardSecondary]}
            onPress={() => setRole('family')}
            activeOpacity={0.85}
            accessibilityLabel="Independent Family / Care"
            accessibilityRole="button"
          >
            <View style={[styles.roleIconWrap, styles.roleIconWrapSecondary]}>
              <Text style={styles.roleEmoji}>👥</Text>
            </View>
            <View style={styles.roleText}>
              <Text style={[styles.roleTitle, styles.roleTitleSecondary]}>Independent Family / Care</Text>
              <Text style={styles.roleSub}>For family members or caregivers supporting a loved one</Text>
            </View>
            <View style={[styles.roleArrow, styles.roleArrowSecondary]}>
              <Text style={[styles.roleArrowText, styles.roleArrowTextSecondary]}>›</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.privacyNote}>🔒  Your data stays on your device — always</Text>

          {/* Sign in link for users who already have an account */}
          {navigation ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Auth')}
              style={styles.signInLinkWrap}
              activeOpacity={0.7}
            >
              <Text style={styles.signInLinkText}>
                Already have an account?{' '}
                <Text style={styles.signInLinkHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.copyright}>© 2026 Theory Solutions LLC</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },
  gradient: { ...StyleSheet.absoluteFillObject },
  safe: { flex: 1 },

  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    letterSpacing: 0.3,
  },

  // Bottom sheet
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
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
  sheetTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 20,
  },

  // Role card — primary (filled)
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  roleCardSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconWrapSecondary: {
    backgroundColor: COLORS.primaryLight,
  },
  roleEmoji: { fontSize: 26 },
  roleText: { flex: 1 },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  roleTitleSecondary: { color: COLORS.textPrimary },
  roleSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 18,
  },
  roleArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleArrowSecondary: {
    backgroundColor: COLORS.primaryLight,
  },
  roleArrowText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  roleArrowTextSecondary: { color: COLORS.primary },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1.5, backgroundColor: COLORS.divider },
  dividerText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },

  privacyNote: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 6,
  },
  signInLinkWrap: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  signInLinkText: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  signInLinkHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.disabled,
  },
});
