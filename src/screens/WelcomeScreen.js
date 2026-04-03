/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'welcome',
    isHero: true,
    icon: '💙',
    title: 'Welcome to\nIn-dependent Living',
    subtitle: 'Live independently. Stay connected with the people who care about you.',
    gradient: ['#0A3D62', '#1A6FA3'],
  },
  {
    key: 'medications',
    isHero: false,
    icon: '💊',
    title: 'Smart Medication\nTracking',
    subtitle: 'Scan your prescription bottles, set reminders, and never miss a dose. Your family stays informed.',
    gradient: ['#0E4D7A', '#1A6FA3'],
    accentColor: '#2196F3',
  },
  {
    key: 'connected',
    isHero: false,
    icon: '👥',
    title: 'Connected Care',
    subtitle: 'Share your wellness with family members. They see your activity, medications, and calendar — on their terms.',
    gradient: ['#1A3A5C', '#1A6FA3'],
    accentColor: '#1976D2',
  },
  {
    key: 'calendar',
    isHero: false,
    icon: '📅',
    title: 'Smart Calendar',
    subtitle: 'Track appointments, activities, and reminders. Print your schedule. Voice entry makes it easy.',
    gradient: ['#0D3349', '#1565C0'],
    accentColor: '#1E88E5',
  },
  {
    key: 'emergency',
    isHero: false,
    icon: '🆘',
    title: 'One-Tap Emergency',
    subtitle: 'SOS button calls 911 or family instantly. Location shared automatically.',
    gradient: ['#1A1A3A', '#1A6FA3'],
    accentColor: '#DC2626',
    isLast: true,
  },
];

export default function WelcomeScreen({ navigation }) {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSkip = () => {
    navigation.replace('Terms');
  };

  const handleLoginLink = () => {
    navigation.replace('Auth');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      navigation.replace('Terms');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  });

  const renderSlide = ({ item, index }) => {
    const isLast = item.isLast;
    return (
      <LinearGradient
        colors={item.gradient}
        style={styles.slide}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {item.isHero ? (
          // Hero slide layout
          <View style={styles.heroContent}>
            <View style={styles.logoRing}>
              <View style={styles.logoInner}>
                <Text style={styles.heroIcon}>{item.icon}</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>{item.title}</Text>
            <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
          </View>
        ) : (
          // Feature slide layout — white card
          <View style={styles.featureContent}>
            <View style={styles.featureCard}>
              <View style={[styles.iconCircle, { backgroundColor: (item.accentColor || COLORS.primary) + '18' }]}>
                <Text style={styles.featureIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      </LinearGradient>
    );
  };

  const currentSlide = SLIDES[currentIndex];
  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      {/* Top overlay: login link + skip */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <TouchableOpacity
          onPress={handleLoginLink}
          style={styles.loginLink}
          accessibilityRole="link"
          accessibilityLabel="Already a user? Log in"
        >
          <Text style={styles.loginLinkText}>Already a user? Log in</Text>
        </TouchableOpacity>
        {!isLastSlide && (
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipBtn}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        scrollEventThrottle={16}
      />

      {/* Bottom overlay: dots + button */}
      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={handleNext}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? 'Continue to terms' : 'Next slide'}
        >
          <Text style={styles.ctaBtnText}>
            {currentIndex === 0 ? 'Get Started' : isLastSlide ? 'Continue' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0E4D7A',
  },

  // Top overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    paddingBottom: 8,
  },
  loginLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textDecorationLine: 'underline',
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
  },

  // Slides
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero slide
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingTop: 60,
  },
  logoRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 56,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },

  // Feature slides
  featureContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 160,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  featureIcon: {
    fontSize: 56,
  },
  featureTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  featureSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },

  // Bottom overlay
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'android' ? 20 : 8,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  // CTA button
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A6FA3',
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
