/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 * PROPRIETARY AND CONFIDENTIAL
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// TODO: Wire to expo-in-app-purchases or RevenueCat
// Product IDs: com.theorysolutions.independentliving.monthly
//              com.theorysolutions.independentliving.annual

const FEATURES = [
  { icon: 'heart', label: 'Real-time family dashboard' },
  { icon: 'medical', label: 'Medication reminders & alerts' },
  { icon: 'walk', label: 'Activity & steps monitoring' },
  { icon: 'calendar', label: 'Smart calendar with reminders' },
  { icon: 'alert-circle', label: 'Emergency SOS + family alerts' },
  { icon: 'bar-chart', label: 'Daily wellness summaries' },
];

export default function SubscriptionScreen({ navigation, onSubscribe, onSkip }) {
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // TODO: Wire to expo-in-app-purchases or RevenueCat
      // For now, just navigate through
      onSubscribe?.();
      navigation?.navigate('App');
    } catch (e) {
      Alert.alert('Purchase Error', 'Unable to complete purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = () => {
    Alert.alert(
      'Restore Purchases',
      'Looking for previous purchases...',
      [{ text: 'OK' }]
    );
    // TODO: Wire to expo-in-app-purchases or RevenueCat restore
  };

  const handleSkip = () => {
    Alert.alert(
      'Limited Features',
      'Without a subscription, you\'ll have access to basic check-ins only. You can upgrade anytime from Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue Anyway',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('subscribed', 'false');
            } catch (e) {
              console.log('[IL] Could not save subscription state:', e.message);
            }
            onSkip?.();
            if (navigation) {
              navigation.reset({ index: 0, routes: [{ name: 'App' }] });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header with gradient */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Back / close button */}
          {(navigation || onSkip) && (
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => navigation?.goBack() || onSkip?.()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="heart" size={36} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.headerTitle}>Unlock In-dependent Living</Text>
          <Text style={styles.headerSubtitle}>
            Peace of mind for the whole family
          </Text>
        </LinearGradient>

        {/* Features list */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Everything you need:</Text>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
              <Ionicons
                name={feature.icon}
                size={18}
                color={COLORS.primary}
                style={styles.featureIcon}
              />
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>

        {/* Pricing cards */}
        <View style={styles.pricingSection}>
          {/* Annual plan */}
          <TouchableOpacity
            style={[
              styles.pricingCard,
              selectedPlan === 'annual' && styles.pricingCardSelected,
            ]}
            onPress={() => setSelectedPlan('annual')}
            activeOpacity={0.8}
          >
            <View style={styles.pricingCardInner}>
              <View style={styles.pricingCardLeft}>
                <View style={styles.radioOuter}>
                  {selectedPlan === 'annual' && <View style={styles.radioInner} />}
                </View>
                <View>
                  <Text style={styles.planName}>Annual</Text>
                  <Text style={styles.planPrice}>$199 / year</Text>
                  <Text style={styles.planNote}>Just $16.58/month</Text>
                </View>
              </View>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save $100</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Monthly plan */}
          <TouchableOpacity
            style={[
              styles.pricingCard,
              selectedPlan === 'monthly' && styles.pricingCardSelected,
            ]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
          >
            <View style={styles.pricingCardInner}>
              <View style={styles.pricingCardLeft}>
                <View style={styles.radioOuter}>
                  {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
                </View>
                <View>
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planPrice}>$24.99 / month</Text>
                  <Text style={styles.planNote}>7-day free trial</Text>
                </View>
              </View>
              <View style={styles.trialBadge}>
                <Text style={styles.trialBadgeText}>Free Trial</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy note */}
        <Text style={styles.privacyNote}>
          Cancel anytime. No charge for 7 days.
        </Text>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
          onPress={handleSubscribe}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="lock-open" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.ctaButtonText}>
              {loading ? 'Processing…' : 'Start Free Trial'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Restore purchases */}
        <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
          <Text style={styles.restoreText}>Restore Purchase</Text>
        </TouchableOpacity>

        {/* Skip / continue without subscription */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Continue without subscription</Text>
        </TouchableOpacity>

        {/* Legal links placeholder */}
        <Text style={styles.legalText}>
          By subscribing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerBackBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
  },

  // Features
  featuresSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureIcon: {
    marginRight: 10,
    width: 20,
  },
  featureLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Pricing
  pricingSection: {
    marginHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  pricingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 16,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pricingCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  pricingCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricingCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 1,
  },
  planNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  saveBadge: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  saveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  trialBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trialBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // Privacy note
  privacyNote: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 14,
    marginHorizontal: 24,
  },

  // CTA
  ctaButton: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    paddingHorizontal: 24,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },

  // Restore
  restoreButton: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 4,
  },
  restoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Skip
  skipButton: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },

  // Legal
  legalText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 32,
    lineHeight: 16,
  },
});
