/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const TERMS_TEXT = `Terms of Service — In-dependent Living

Last updated: April 1, 2026

These Terms of Service ("Terms") govern your use of the In-dependent Living mobile application ("App") operated by Theory Solutions LLC ("we," "us," or "our").

1. ACCEPTANCE OF TERMS
By downloading, installing, or using the App, you agree to be bound by these Terms. If you do not agree, do not use the App.

2. NOT MEDICAL ADVICE
In-dependent Living is a personal wellness and monitoring tool. It is NOT a medical device and does NOT provide medical advice, diagnosis, or treatment. The App is not intended to replace professional medical advice. Always consult a qualified healthcare provider for medical decisions. In an emergency, call 911.

3. USER ACCOUNT
You must create an account to use the App. You are responsible for maintaining the confidentiality of your credentials. You must be 13 years of age or older to use the App.

4. ACCEPTABLE USE
You agree to use the App only for lawful purposes. You may not attempt to reverse-engineer, hack, or misuse the App or its services. You may not use the App to harm, harass, or mislead others.

5. SUBSCRIPTION AND BILLING
The App is offered on a subscription basis. Subscriptions are billed through the Apple App Store or Google Play. You can cancel at any time from your device's subscription settings. Refunds are subject to the app store's refund policy.

6. DATA AND PRIVACY
Your use of the App is subject to our Privacy Policy, which is incorporated into these Terms by reference. We take your privacy seriously and will never sell your personal data.

7. FAMILY SHARING
When you connect with a family member or caregiver, you grant them view access to your wellness data as configured in the App. You may revoke this access at any time from Settings.

8. LIMITATION OF LIABILITY
To the fullest extent permitted by law, Theory Solutions LLC shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App. Our total liability to you shall not exceed the amount you paid for the App in the past 12 months.

9. CHANGES TO TERMS
We may update these Terms from time to time. We will notify you of material changes via the App or email. Continued use of the App after changes constitutes acceptance.

10. CONTACT
Theory Solutions LLC
support@in-dependentliving.com
in-dependentliving.com`;

const PRIVACY_TEXT = `Privacy Policy — In-dependent Living

Last updated: April 1, 2026

In-dependent Living ("we", "our", "the app") is operated by Theory Solutions LLC. This policy explains how we handle your information.

DATA WE COLLECT

• Account information: Email address and display name you provide at sign-up
• Medication data: Medication names, dosages, schedules, and intake records you enter
• Calendar events: Events you create in the app
• Activity data: Step counts and activity data from connected fitness devices (Apple Health, Fitbit) — only with your explicit permission
• Usage data: Anonymous crash reports and performance metrics

HOW WE USE YOUR DATA

• To provide the app's core functionality (medication reminders, family sharing, calendar)
• To send you notifications you've enabled (medication reminders, wellness summaries)
• To enable family members you've connected with to view your wellness information

DATA STORAGE AND SECURITY

Your data is stored securely using Google Firebase, which encrypts data in transit and at rest. We use industry-standard security practices. We do not sell your personal data to any third party.

HIPAA

In-dependent Living is a personal wellness app and is not a covered entity under HIPAA. We are not a healthcare provider. The app does not provide medical advice. Always consult your doctor for medical decisions.

FAMILY SHARING

When you connect with a family member or caregiver using a pairing code, they gain access to your wellness data (medication adherence, activity, calendar events marked as shared). You control this connection and can remove it at any time.

THIRD-PARTY SERVICES

• Google Firebase — database and authentication
• Google AdMob — advertising (free tier users only)
• Stripe — subscription billing
• Apple HealthKit / Fitbit — fitness data (only with your permission)

YOUR RIGHTS

You can delete your account and all associated data at any time from the Settings screen. Contact us at support@in-dependentliving.com with any privacy questions.

CONTACT

Theory Solutions LLC
support@in-dependentliving.com
in-dependentliving.com`;

function DocumentModal({ visible, title, content, onClose }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={modal.root}>
        <View style={modal.header}>
          <Text style={modal.title}>{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={modal.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={modal.scroll} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <Text style={modal.body}>{content}</Text>
        </ScrollView>
        <View style={modal.footer}>
          <TouchableOpacity style={modal.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={modal.doneBtnText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function TermsScreen({ navigation }) {
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const bothChecked = termsChecked && privacyChecked;

  const handleContinue = () => {
    if (bothChecked) {
      navigation.replace('Subscription');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Gradient banner */}
      <LinearGradient
        colors={['#0E4D7A', '#1A6FA3']}
        style={styles.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.bannerIconCircle}>
          <Text style={styles.bannerIcon}>🔒</Text>
        </View>
        <Text style={styles.bannerTitle}>Your Privacy &{'\n'}Health Matters</Text>
        <Text style={styles.bannerSubtitle}>
          Please review and agree to our policies before continuing.
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Before you continue, please agree to:</Text>

        {/* Terms of Service row */}
        <TouchableOpacity
          style={[styles.agreementRow, termsChecked && styles.agreementRowChecked]}
          onPress={() => setTermsChecked(v => !v)}
          activeOpacity={0.8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termsChecked }}
          accessibilityLabel="I agree to the Terms of Service"
        >
          <View style={[styles.checkbox, termsChecked && styles.checkboxChecked]}>
            {termsChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <View style={styles.agreementTextBlock}>
            <Text style={styles.agreementLabel}>I agree to the Terms of Service</Text>
            <TouchableOpacity
              onPress={() => setShowTermsModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="link"
              accessibilityLabel="Read Terms of Service"
            >
              <Text style={styles.readLink}>Read Terms of Service →</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Privacy Policy row */}
        <TouchableOpacity
          style={[styles.agreementRow, privacyChecked && styles.agreementRowChecked]}
          onPress={() => setPrivacyChecked(v => !v)}
          activeOpacity={0.8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: privacyChecked }}
          accessibilityLabel="I agree to the Privacy Policy"
        >
          <View style={[styles.checkbox, privacyChecked && styles.checkboxChecked]}>
            {privacyChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <View style={styles.agreementTextBlock}>
            <Text style={styles.agreementLabel}>I agree to the Privacy Policy</Text>
            <TouchableOpacity
              onPress={() => setShowPrivacyModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="link"
              accessibilityLabel="Read Privacy Policy"
            >
              <Text style={styles.readLink}>Read Privacy Policy →</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          We take your privacy seriously. Your health data is encrypted, never sold, and always under your control.
        </Text>
      </ScrollView>

      {/* Continue button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !bothChecked && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!bothChecked}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          accessibilityState={{ disabled: !bothChecked }}
        >
          <Text style={[styles.continueBtnText, !bothChecked && styles.continueBtnTextDisabled]}>
            Continue
          </Text>
          {bothChecked && (
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 6 }} />
          )}
        </TouchableOpacity>
      </View>

      {/* Document modals */}
      <DocumentModal
        visible={showTermsModal}
        title="Terms of Service"
        content={TERMS_TEXT}
        onClose={() => setShowTermsModal(false)}
      />
      <DocumentModal
        visible={showPrivacyModal}
        title="Privacy Policy"
        content={PRIVACY_TEXT}
        onClose={() => setShowPrivacyModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  banner: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  bannerIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bannerIcon: {
    fontSize: 38,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },

  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 14,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  agreementRowChecked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  agreementTextBlock: {
    flex: 1,
  },
  agreementLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 22,
  },
  readLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  disclaimer: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 20 : 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    paddingVertical: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  continueBtnDisabled: {
    backgroundColor: COLORS.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  continueBtnTextDisabled: {
    color: 'rgba(255,255,255,0.6)',
  },
});

const modal = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  body: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 24 : 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
});
