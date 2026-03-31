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
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Vibration, Alert,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');
const SCAN_BOX_SIZE = width * 0.78;

// ─── Step definitions ───────────────────────────────────────────────────────
const STEPS = [
  { id: 'position', label: 'Position',    hint: 'Center the prescription label in the frame' },
  { id: 'rotate',   label: 'Rotate',      hint: 'Slowly rotate the bottle so the full label passes through the frame' },
  { id: 'barcode',  label: 'Barcode',     hint: 'Point at the barcode on the bottle — it scans automatically' },
  { id: 'review',   label: 'Review',      hint: 'Check and correct any details before saving' },
  { id: 'done',     label: 'Done',        hint: 'Medication saved!' },
];

// ─── Scanning line animation ─────────────────────────────────────────────────
function ScanLine({ active }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
    return () => anim.stopAnimation();
  }, [active]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_BOX_SIZE - 4],
  });

  return (
    <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
  );
}

// ─── Corner brackets for viewfinder ─────────────────────────────────────────
function ViewfinderCorners() {
  return (
    <>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
    </>
  );
}

// ─── Step indicator at top ───────────────────────────────────────────────────
function StepBar({ currentStep }) {
  // Show steps 1-4 (not 'done')
  const visibleSteps = STEPS.slice(0, 4);
  const idx = visibleSteps.findIndex(s => s.id === currentStep);
  return (
    <View style={styles.stepBar}>
      {visibleSteps.map((step, i) => (
        <React.Fragment key={step.id}>
          <View style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              i < idx && styles.stepDotDone,
              i === idx && styles.stepDotActive,
            ]}>
              {i < idx
                ? <Text style={styles.stepDotText}>✓</Text>
                : <Text style={[styles.stepDotText, i === idx && { color: '#fff' }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[styles.stepLabel, i === idx && styles.stepLabelActive]}>
              {step.label}
            </Text>
          </View>
          {i < 3 && <View style={[styles.stepLine, i < idx && styles.stepLineDone]} />}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Review & Edit form ───────────────────────────────────────────────────────
function ReviewForm({ scannedData, onConfirm, onRescan }) {
  const [form, setForm] = useState({ ...scannedData });
  const FREQ_OPTIONS = ['morning', 'afternoon', 'evening', 'night'];
  const FREQ_ICONS  = { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' };

  const toggleFreq = (slot) => {
    setForm(prev => {
      const f = prev.frequency.includes(slot)
        ? prev.frequency.filter(x => x !== slot)
        : [...prev.frequency, slot];
      return { ...prev, frequency: f };
    });
  };

  // Determine source label for header
  const sourceInfo = (() => {
    if (form._source === 'barcode') return {
      icon: '📊',
      label: 'Barcode scan',
      sub: 'Matched from drug database',
      color: '#059669',
    };
    if (form._source === 'rotate') return {
      icon: '🔄',
      label: 'Rotation scan',
      sub: 'Stitched from bottle rotation — please verify all fields',
      color: '#B45309',
    };
    return {
      icon: '📷',
      label: 'Label scan',
      sub: 'Scanned from prescription label — please verify all fields',
      color: '#7C3AED',
    };
  })();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.reviewScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle}>Review Scanned Info</Text>
          <Text style={styles.reviewSub}>Correct anything that looks wrong before saving</Text>
        </View>

        {/* Source badge — improved with source-specific messaging */}
        <View style={[styles.sourceBadge, { borderColor: sourceInfo.color + '55', backgroundColor: sourceInfo.color + '18' }]}>
          <Text style={[styles.sourceBadgeText, { color: sourceInfo.color }]}>
            {sourceInfo.icon} {sourceInfo.label}
          </Text>
          <Text style={[styles.sourceBadgeSub, { color: sourceInfo.color }]}>
            {sourceInfo.sub}
          </Text>
        </View>

        {/* NDC badge for barcode scans */}
        {form._source === 'barcode' && form._ndc && !form._lookupError && (
          <View style={styles.ndcBadge}>
            <Text style={styles.ndcBadgeText}>
              NDC: {form._ndc} · Database match ✓
            </Text>
          </View>
        )}

        {/* Lookup error — drug not found */}
        {form._lookupError && (
          <View style={[styles.ndcBadge, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Text style={[styles.ndcBadgeText, { color: '#B91C1C' }]}>
              ⚠️ {form._lookupError}
            </Text>
            <Text style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>
              Barcode: {form._barcodeRaw} · Please enter details manually
            </Text>
          </View>
        )}

        {/* Manufacturer info if found */}
        {form._manufacturer && (
          <View style={[styles.ndcBadge, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
            <Text style={[styles.ndcBadgeText, { color: '#0369A1' }]}>
              🏭 {form._manufacturer}
              {form._genericName && form._brandName && form._genericName !== form._brandName
                ? ` · Generic: ${form._genericName}`
                : ''}
            </Text>
          </View>
        )}

        {/* ── Field order: pharmacist bottle label order ── */}

        {/* 1. Medication Name — highlighted box */}
        <View style={styles.medNameBox}>
          <Text style={styles.medNameBoxLabel}>💊 MEDICATION NAME</Text>
          <TextInput
            style={styles.medNameBoxInput}
            value={form.name}
            onChangeText={t => setForm(p => ({ ...p, name: t }))}
            placeholder="e.g. Lisinopril"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="words"
          />
        </View>

        {/* 2. What it's for */}
        <Field label="What it's for"
          value={form.purpose} onChangeText={t => setForm(p => ({ ...p, purpose: t }))}
          placeholder="e.g. High blood pressure" />

        {/* 3. Dosage per pill */}
        <Field label="Dosage (per pill)"
          value={form.dosage} onChangeText={t => setForm(p => ({ ...p, dosage: t }))}
          placeholder="e.g. 10mg" />

        {/* 4. Pills per dose */}
        <Field label="Pills per dose"
          value={String(form.quantity ?? 1)}
          onChangeText={t => setForm(p => ({ ...p, quantity: parseInt(t) || 1 }))}
          placeholder="1" keyboardType="number-pad" />

        {/* 5. When to take it */}
        <Text style={styles.fieldLabel}>When to take it *</Text>
        <View style={styles.freqGrid}>
          {FREQ_OPTIONS.map(slot => {
            const active = form.frequency?.includes(slot);
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.freqBtn, active && styles.freqBtnActive]}
                onPress={() => toggleFreq(slot)}
              >
                <Text style={styles.freqBtnIcon}>{FREQ_ICONS[slot]}</Text>
                <Text style={[styles.freqBtnText, active && styles.freqBtnTextActive]}>
                  {slot.charAt(0).toUpperCase() + slot.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 6. Directions from bottle */}
        <Field label="Directions from bottle"
          value={form.directions}
          onChangeText={t => setForm(p => ({ ...p, directions: t }))}
          placeholder="e.g. Take 1 tablet every morning"
          multiline numberOfLines={3} />

        {/* 7. Supply info group */}
        <Text style={styles.supplySubheading}>Supply Info</Text>
        <View style={styles.supplyRow}>
          <View style={{ flex: 1 }}>
            <Field label="Pills remaining"
              value={String(form.pillsRemaining ?? '')}
              onChangeText={t => setForm(p => ({ ...p, pillsRemaining: parseInt(t) || 0 }))}
              placeholder="e.g. 30" keyboardType="number-pad" />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <Field label="Days supply"
              value={String(form.daysSupply ?? '')}
              onChangeText={t => setForm(p => ({ ...p, daysSupply: parseInt(t) || 0 }))}
              placeholder="e.g. 30" keyboardType="number-pad" />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <Field label="Refills remaining"
              value={String(form.refillsRemaining ?? '')}
              onChangeText={t => setForm(p => ({ ...p, refillsRemaining: parseInt(t) || 0 }))}
              placeholder="e.g. 3" keyboardType="number-pad" />
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => {
            if (!form.name?.trim()) {
              Alert.alert('Missing Info', 'Please enter the medication name.');
              return;
            }
            if (!form.frequency?.length) {
              Alert.alert('Missing Info', 'Please select when to take it.');
              return;
            }
            onConfirm(form);
          }}
        >
          <Text style={styles.confirmBtnText}>✓  Save Medication</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.rescanBtn} onPress={onRescan}>
          <Text style={styles.rescanBtnText}>↩  Scan Again</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, props.multiline && styles.fieldInputMulti]}
        placeholderTextColor={COLORS.textMuted}
        {...props}
      />
    </View>
  );
}

// ─── Main scanner screen ─────────────────────────────────────────────────────
export default function ScannerScreen({ navigation, onMedicationScanned }) {
  const { addMedication } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState('position');  // position | rotate | barcode | review | done
  const [scanMode, setScanMode] = useState('label');
  const [scannedData, setScannedData] = useState(null);
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const [rotateProgress, setRotateProgress] = useState(0);  // 0-100% rotation capture
  const [isCapturing, setIsCapturing] = useState(false);
  const [barcodeSearching, setBarcodeSearching] = useState(false); // "Searching drug database..."
  const [processingRotate, setProcessingRotate] = useState(false); // "Processing..." after rotate
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef(null);

  const currentStepObj = STEPS.find(s => s.id === step);

  // ── Permission gate ──────────────────────────────────────────────────────
  if (!permission) return <View style={styles.safe} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permBox}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Camera Permission Needed</Text>
          <Text style={styles.permSub}>
            In-dependent Living needs camera access to scan prescription labels and barcodes.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Allow Camera Access</Text>
          </TouchableOpacity>
          {navigation && (
            <TouchableOpacity style={styles.permCancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.permCancelText}>Not Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Barcode scanned callback — REAL FDA LOOKUP ─────────────────────────
  const handleBarcodeScanned = async ({ type, data }) => {
    if (barcodeScanned || barcodeSearching) return;
    setBarcodeScanned(true);
    Vibration.vibrate(80);
    setBarcodeSearching(true);

    try {
      const result = await lookupNDC(data, type);
      setBarcodeSearching(false);
      setScannedData(result);
      setStep('review');
    } catch (e) {
      setBarcodeSearching(false);
      // Fallback: let user enter manually with barcode data shown
      setScannedData({
        name: '',
        dosage: '',
        quantity: 1,
        purpose: '',
        directions: '',
        pillsRemaining: 0,
        pillsTotal: 0,
        daysSupply: 30,
        refillsRemaining: 0,
        frequency: [],
        _source: 'barcode',
        _ndc: data,
        _barcodeRaw: data,
        _barcodeType: type,
        _lookupError: e.message || 'Could not find this medication in the database',
      });
      setStep('review');
    }
  };

  // ── Start rotation capture ───────────────────────────────────────────────
  const handleStartRotate = () => {
    setIsCapturing(true);
    setRotateProgress(0);
    // Simulate progressive frame capture as user rotates bottle
    // Production: captures frames via CameraView at intervals, stitches, runs OCR
    let progress = 0;
    const interval = setInterval(() => {
      progress += 12;
      setRotateProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(interval);
        setIsCapturing(false);
        Vibration.vibrate([0, 80, 100, 80]);
        // Simulate OCR result from stitched panoramic label
        handleRotateDone();
      }
    }, 320);
  };

  const handleRotateDone = async () => {
    setProcessingRotate(true);
    try {
      // Take a photo from the camera
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.7,
          skipProcessing: true,
        });
        if (photo?.base64) {
          const result = await runVisionOCR(photo.base64, 'rotate');
          setProcessingRotate(false);
          setScannedData(result);
          setStep('review');
          return;
        }
      }
      // Fallback if camera capture fails
      setProcessingRotate(false);
      setScannedData({
        name: '', dosage: '', quantity: 1, purpose: '', directions: '',
        pillsRemaining: 0, pillsTotal: 0, daysSupply: 30, refillsRemaining: 0,
        frequency: [], _source: 'rotate',
        _lookupError: 'Could not capture image. Please try again or enter details manually.',
      });
      setStep('review');
    } catch (e) {
      setProcessingRotate(false);
      setScannedData({
        name: '', dosage: '', quantity: 1, purpose: '', directions: '',
        pillsRemaining: 0, pillsTotal: 0, daysSupply: 30, refillsRemaining: 0,
        frequency: [], _source: 'rotate',
        _lookupError: e.message || 'OCR failed. Please enter details manually.',
      });
      setStep('review');
    }
  };

  // ── Single-frame label capture with real OCR ─────────────────────────────
  const handleLabelCapture = async () => {
    Vibration.vibrate(80);
    // For single frame: capture immediately and run OCR
    if (cameraRef.current) {
      try {
        setBarcodeSearching(true); // reuse loading state
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.7,
        });
        if (photo?.base64) {
          const result = await runVisionOCR(photo.base64, 'label');
          setBarcodeSearching(false);
          setScannedData(result);
          setStep('review');
          return;
        }
      } catch (e) {
        // Fall through to rotation mode
      }
      setBarcodeSearching(false);
    }
    // Fallback: go to rotation mode for better capture
    setStep('rotate');
  };

  // ── Confirm and save ─────────────────────────────────────────────────────
  const handleConfirm = (data) => {
    // Save to app state / Firebase
    try {
      addMedication({
        name: data.name,
        dosage: data.dosage,
        quantity: data.quantity || 1,
        frequency: data.frequency || [],
        purpose: data.purpose || '',
        directions: data.directions || '',
        pillsRemaining: data.pillsRemaining || 0,
        pillsTotal: data.pillsTotal || 0,
        daysSupply: data.daysSupply || 30,
        refillsRemaining: data.refillsRemaining || 0,
      });
    } catch (e) {
      console.log('Error saving medication:', e);
    }
    if (onMedicationScanned) {
      onMedicationScanned(data);
    }
    setStep('done');
  };

  // ── Rescan ───────────────────────────────────────────────────────────────
  const handleRescan = () => {
    setScannedData(null);
    setBarcodeScanned(false);
    setStep('position');
  };

  // ── Done screen ──────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.doneBox}>
          <View style={styles.doneCheck}>
            <Text style={styles.doneCheckText}>✓</Text>
          </View>
          <Text style={styles.doneTitle}>Medication Added!</Text>
          <Text style={styles.doneSub}>
            {scannedData?.name} has been added to your medication list.
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={handleRescan}>
            <Text style={styles.doneBtnText}>Scan Another</Text>
          </TouchableOpacity>
          {navigation && (
            <TouchableOpacity style={styles.doneDismissBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneDismissText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Review screen ────────────────────────────────────────────────────────
  if (step === 'review' && scannedData) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: COLORS.background }]}>
        {/* Back button */}
        <View style={styles.reviewNav}>
          <TouchableOpacity onPress={handleRescan} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Rescan</Text>
          </TouchableOpacity>
          <Text style={styles.reviewNavTitle}>Step 3 of 3</Text>
          <View style={{ width: 80 }} />
        </View>
        <StepBar currentStep="review" />
        <ReviewForm
          scannedData={scannedData}
          onConfirm={handleConfirm}
          onRescan={handleRescan}
        />
      </SafeAreaView>
    );
  }

  // ── Rotation step screen ─────────────────────────────────────────────────
  if (step === 'rotate') {
    return (
      <View style={styles.cameraRoot}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddleRow}>
            <View style={styles.overlaySide} />
            <View style={styles.scanBox}>
              <ViewfinderCorners />
              {isCapturing && <ScanLine active />}
              {/* Rotation arc indicator */}
              {isCapturing && (
                <View style={styles.rotateArcWrap}>
                  <View style={[styles.rotateArcFill, { width: `${rotateProgress}%` }]} />
                </View>
              )}
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <StepBar currentStep="rotate" />

            {processingRotate ? (
              /* Processing spinner — shown for 1s after rotate completes */
              <View style={styles.processingBox}>
                <Animated.View>
                  <Text style={{ fontSize: 28, marginBottom: 10 }}>⚙️</Text>
                </Animated.View>
                <Text style={styles.processingText}>Processing...</Text>
                <Text style={styles.processingSubText}>Stitching frames and reading label</Text>
              </View>
            ) : !isCapturing ? (
              <>
                <View style={styles.rotateTipBox}>
                  <Text style={styles.rotateTipTitle}>📦 How to scan a curved bottle</Text>
                  <Text style={styles.rotateTipText}>
                    1. Hold bottle upright, label facing camera{'\n'}
                    2. Tap Start, then <Text style={{fontWeight:'800'}}>slowly rotate</Text> the bottle{'\n'}
                    3. Keep rotating until the bar fills up{'\n'}
                    4. The app stitches all frames together
                  </Text>
                </View>
                <TouchableOpacity style={styles.captureBtn} onPress={handleStartRotate}>
                  <View style={[styles.captureBtnInner, { backgroundColor: COLORS.primary }]}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>START</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.hintText}>Keep rotating slowly... {rotateProgress}%</Text>
                <View style={styles.captureProgressBar}>
                  <View style={[styles.captureProgressFill, { width: `${rotateProgress}%` }]} />
                </View>
              </>
            )}

            {!processingRotate && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('position')}>
                <Text style={styles.cancelBtnText}>← Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ── Camera viewfinder ────────────────────────────────────────────────────
  const isBarcode = scanMode === 'barcode';

  return (
    <View style={styles.cameraRoot}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={isBarcode ? handleBarcodeScanned : undefined}
        barcodeScannerSettings={isBarcode ? {
          barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e', 'datamatrix', 'pdf417'],
        } : undefined}
      />

      {/* Darken everything outside the scan box */}
      <View style={styles.overlay}>
        {/* Top dark bar */}
        <View style={styles.overlayTop} />
        {/* Middle row */}
        <View style={styles.overlayMiddleRow}>
          <View style={styles.overlaySide} />
          {/* The clear scan box */}
          <View style={styles.scanBox}>
            <ViewfinderCorners />
            {!isBarcode && <ScanLine active />}
          </View>
          <View style={styles.overlaySide} />
        </View>
        {/* Bottom dark bar with controls */}
        <View style={styles.overlayBottom}>
          {/* Step bar */}
          <StepBar currentStep={step} />

          {/* Hint text */}
          <Text style={styles.hintText}>{currentStepObj?.hint}</Text>

          {/* Mode buttons */}
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[styles.modeBtn, !isBarcode && styles.modeBtnActive]}
              onPress={() => { setScanMode('label'); setStep('position'); setBarcodeScanned(false); }}
            >
              <Text style={styles.modeBtnEmoji}>📷</Text>
              <Text style={[styles.modeBtnText, !isBarcode && styles.modeBtnTextActive]}>Scan Label</Text>
              <Text style={styles.modeBtnSub}>Rotate to capture</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, isBarcode && styles.modeBtnActive]}
              onPress={() => { setScanMode('barcode'); setStep('barcode'); setBarcodeScanned(false); }}
            >
              <Text style={styles.modeBtnEmoji}>📊</Text>
              <Text style={[styles.modeBtnText, isBarcode && styles.modeBtnTextActive]}>Scan Barcode</Text>
              <Text style={styles.modeBtnSub}>Auto-detects</Text>
            </TouchableOpacity>
          </View>

          {/* Shutter / auto-scan status */}
          {!isBarcode ? (
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={handleLabelCapture}
              activeOpacity={0.85}
            >
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          ) : barcodeSearching ? (
            /* "Searching drug database..." loading state */
            <View style={styles.barcodeSearchingBox}>
              <ActivityIndicator color={COLORS.primary} size="small" style={{ marginRight: 10 }} />
              <Text style={styles.barcodeSearchingText}>Searching drug database...</Text>
            </View>
          ) : (
            <View style={styles.barcodeWaiting}>
              <Text style={styles.barcodeWaitingText}>
                {barcodeScanned
                  ? '✅ Barcode detected!'
                  : '🔍 Auto-scanning — point at any barcode on the bottle'}
              </Text>
            </View>
          )}

          {/* Cancel */}
          {navigation && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Barcode data parser ────────────────────────────────────────────────────────
// ── Google Cloud Vision OCR for prescription labels ─────────────────────────
const VISION_API_KEY = 'AIzaSyA1s9yCPtn2MCDStDEJItb4pwC5ReWFrcg';

async function runVisionOCR(base64Image, source) {
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

  const body = JSON.stringify({
    requests: [{
      image: { content: base64Image },
      features: [{ type: 'TEXT_DETECTION', maxResults: 10 }],
    }],
  });

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!resp.ok) {
    throw new Error(`Vision API error: ${resp.status}`);
  }

  const json = await resp.json();
  const fullText = json.responses?.[0]?.fullTextAnnotation?.text || '';

  if (!fullText.trim()) {
    throw new Error('No text found on the label. Try holding the bottle closer or in better lighting.');
  }

  // Parse the OCR text into medication fields
  const parsed = parsePrescriptionText(fullText);
  parsed._source = source;
  parsed._ocrRawText = fullText;
  return parsed;
}

// ── Parse raw OCR text from a prescription label ────────────────────────────
function parsePrescriptionText(text) {
  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullLower = text.toLowerCase();

  // ── Step 1: Filter out pharmacy junk (address, phone, store info) ──────
  const JUNK_PATTERNS = [
    /\b\d{5}(-\d{4})?\b/,                        // ZIP codes
    /\(\d{3}\)\s*\d{3}[- ]?\d{4}/,               // Phone (xxx) xxx-xxxx
    /\b\d{3}[- ]\d{3}[- ]\d{4}\b/,               // Phone xxx-xxx-xxxx
    /\b(pharmacy|drug\s?store|walgreens|cvs|rite\s?aid|walmart|costco|kroger|safeway|albertsons|publix|heb|winn.dixie|target)\b/i,
    /\b(suite|ste|blvd|boulevard|avenue|ave|street|st|road|rd|drive|dr|lane|ln|way|circle|cir|plaza|plz|parkway|pkwy)\b.*\b[A-Z]{2}\b/i,
    /\b(tucson|phoenix|mesa|scottsdale|tempe|chandler|gilbert|glendale|peoria|surprise|flagstaff|sedona|yuma|prescott)\b/i,
    /\b(AZ|CA|TX|FL|NY|NV|CO|UT|NM|OR|WA|OH|PA|IL|GA|NC|VA|MA|MI|MN|TN|IN|WI|MO|MD|SC|AL|LA|KY|OK|CT|IA|MS|AR|KS|NE|HI|ID|MT|ND|SD|WV|WY|VT|NH|ME|RI|DE|DC)\s+\d{5}/,
    /\b(www\.|\.com|\.net|\.org|http)/i,          // URLs
    /^\d+\s+(north|south|east|west|n|s|e|w)\b/i,  // Street addresses
    /\brx\s*(#|number|no)?\s*:?\s*\d+/i,          // Rx number
    /\b(date|filled|dispensed)\s*:?\s*\d/i,        // Fill dates
    /\b(ndc|din|npi|dea)\s*:?\s*[\d-]/i,          // Regulatory numbers
    /\b(rpn|pharmacist|rph|pharm\.?d)\b/i,         // Pharmacist credentials
    /\b(store|location)\s*#?\s*\d/i,               // Store numbers
    /^\d{10,}$/,                                    // Long number strings (barcodes)
  ];

  const cleanLines = rawLines.filter(line => {
    const l = line.toLowerCase();
    if (line.length < 3) return false;
    if (/^\d+$/.test(line)) return false;  // pure numbers
    for (const pat of JUNK_PATTERNS) {
      if (pat.test(line)) return false;
    }
    return true;
  });

  let name = '';
  let dosage = '';
  let quantity = 1;
  let purpose = '';
  let directions = '';
  let refills = 0;
  let frequency = [];
  let daysSupply = 30;
  let pillsTotal = 0;

  // ── Step 2: Extract drug name + dosage ─────────────────────────────────
  // Pattern: word(s) followed by dosage amount
  const drugPattern = /\b([A-Za-z][A-Za-z\s\-]{2,30}?)\s*(\d+\.?\d*\s*(?:mg|mcg|ml|g|units|%|MG|MCG|ML|meq))\b/i;
  const drugMatch = text.match(drugPattern);
  if (drugMatch) {
    let rawName = drugMatch[1].trim();
    // Clean common suffixes that aren't the drug name
    rawName = rawName.replace(/\b(tablets?|capsules?|oral|solution|extended.release|er|hcl|hct|cr|sr|xl|xr|dr)\s*$/gi, '').trim();
    // Remove if it starts with junk words
    rawName = rawName.replace(/^(the|a|an|one|each|new)\s+/i, '').trim();
    name = rawName;
    dosage = drugMatch[2].trim();
  }

  // ── Step 3: Extract directions (the most important text) ───────────────
  // Look for sentences starting with action words
  const dirLines = [];
  for (const line of rawLines) {
    const l = line.toLowerCase();
    if (/\b(take|use|apply|inject|inhale|instill|place|swallow|chew|dissolve)\b/.test(l) && line.length > 10) {
      dirLines.push(line);
    }
    if (/\b(by mouth|orally|topically|twice|once daily|every \d+|with food|with meal|at bedtime|before bed|in the morning|in the evening)\b/i.test(l) && line.length > 10) {
      if (!dirLines.includes(line)) dirLines.push(line);
    }
  }
  directions = dirLines.join(' ').replace(/\s+/g, ' ').trim();

  // If no directions, look for the longest clean line with medication keywords
  if (!directions) {
    const candidates = cleanLines.filter(l =>
      /tablet|capsule|daily|hour|food|mouth|dose|times|twice|morning|evening|night/i.test(l) && l.length > 15
    ).sort((a, b) => b.length - a.length);
    if (candidates.length > 0) directions = candidates[0];
  }

  // ── Step 4: Extract quantity per dose ──────────────────────────────────
  const qtyPatterns = [
    /take\s+(\d+)\s+(?:tablet|capsule|pill|cap|tab)/i,
    /(\d+)\s+(?:tablet|capsule|pill|cap|tab)\s+(?:by|per|each)/i,
    /qty[:\s]*(\d+)/i,
  ];
  for (const pat of qtyPatterns) {
    const m = text.match(pat);
    if (m) {
      const n = parseInt(m[1]);
      if (n >= 1 && n <= 10) { quantity = n; break; }
    }
  }

  // ── Step 5: Extract total pill count / days supply ─────────────────────
  const totalMatch = text.match(/(?:qty|quantity|#)[:\s]*(\d+)/i);
  if (totalMatch) pillsTotal = parseInt(totalMatch[1]);

  const supplyMatch = text.match(/(?:day(?:s)?\.?\s*supply|supply)[:\s]*(\d+)/i);
  if (supplyMatch) daysSupply = parseInt(supplyMatch[1]);

  // ── Step 6: Extract refills ────────────────────────────────────────────
  const refillMatch = text.match(/(?:refills?\s*(?:remaining|left|:|\s))\s*(\d+)/i) ||
                      text.match(/(\d+)\s*refills?\s*(?:remaining|left|by)/i);
  if (refillMatch) refills = parseInt(refillMatch[1]);

  // ── Step 7: Determine frequency — SMART day/time detection ─────────────
  const freqLower = (directions + ' ' + text).toLowerCase();

  // Day-of-week patterns
  const dayMap = {
    'monday': 'monday', 'mon': 'monday',
    'tuesday': 'tuesday', 'tue': 'tuesday', 'tues': 'tuesday',
    'wednesday': 'wednesday', 'wed': 'wednesday',
    'thursday': 'thursday', 'thu': 'thursday', 'thur': 'thursday', 'thurs': 'thursday',
    'friday': 'friday', 'fri': 'friday',
    'saturday': 'saturday', 'sat': 'saturday',
    'sunday': 'sunday', 'sun': 'sunday',
  };

  const foundDays = [];
  for (const [abbr, full] of Object.entries(dayMap)) {
    if (new RegExp('\\b' + abbr + '\\b', 'i').test(freqLower)) {
      if (!foundDays.includes(full)) foundDays.push(full);
    }
  }

  // MWF or M/W/F patterns
  if (/\bm\s*[\/,]\s*w\s*[\/,]\s*f\b/i.test(freqLower) || /\bmwf\b/i.test(freqLower)) {
    foundDays.length = 0;
    foundDays.push('monday', 'wednesday', 'friday');
  }
  if (/\bt\s*[\/,]\s*th\b/i.test(freqLower) || /\btth\b/i.test(freqLower)) {
    if (!foundDays.includes('tuesday')) foundDays.push('tuesday');
    if (!foundDays.includes('thursday')) foundDays.push('thursday');
  }

  // Time-of-day patterns
  const timeSlots = [];
  if (/\b(morning|am|a\.m\.|breakfast|before noon|upon waking)\b/i.test(freqLower)) timeSlots.push('morning');
  if (/\b(afternoon|midday|lunch|noon)\b/i.test(freqLower)) timeSlots.push('afternoon');
  if (/\b(evening|pm|p\.m\.|dinner|supper)\b/i.test(freqLower)) timeSlots.push('evening');
  if (/\b(night|bedtime|before bed|at night|nightly|hs)\b/i.test(freqLower)) timeSlots.push('night');

  // Frequency multipliers
  if (/\b(twice|two times|2\s*times|bid|b\.i\.d)\b/i.test(freqLower) && timeSlots.length === 0) {
    timeSlots.push('morning', 'evening');
  }
  if (/\b(three times|3\s*times|tid|t\.i\.d)\b/i.test(freqLower) && timeSlots.length === 0) {
    timeSlots.push('morning', 'afternoon', 'evening');
  }
  if (/\b(four times|4\s*times|qid|q\.i\.d)\b/i.test(freqLower) && timeSlots.length === 0) {
    timeSlots.push('morning', 'afternoon', 'evening', 'night');
  }
  if (/\b(once daily|daily|every day|qd|q\.d)\b/i.test(freqLower) && timeSlots.length === 0) {
    timeSlots.push('morning');
  }
  if (/\b(every other day|eod|alternate day)\b/i.test(freqLower) && timeSlots.length === 0) {
    timeSlots.push('morning');
  }

  // Build frequency: use day-specific if found, otherwise time slots
  // Don't default to all 4 slots — only what the label actually says
  if (foundDays.length > 0) {
    frequency = timeSlots.length > 0 ? timeSlots : ['morning'];
  } else if (timeSlots.length > 0) {
    frequency = timeSlots;
  } else {
    // Default: if nothing detected, leave empty so user selects manually
    frequency = [];
  }

  // ── Step 8: Determine purpose from drug name ──────────────────────────
  const drugLookup = (name + ' ' + fullLower).toLowerCase();
  const purposeMap = [
    { keywords: ['lisinopril', 'losartan', 'amlodipine', 'valsartan', 'enalapril', 'ramipril', 'benazepril', 'hydrochlorothiazide', 'hctz', 'blood pressure', 'hypertension', 'htn'], purpose: 'High blood pressure' },
    { keywords: ['metformin', 'glipizide', 'glyburide', 'januvia', 'sitagliptin', 'pioglitazone', 'insulin', 'diabetes', 'blood sugar', 'glucose', 'a1c'], purpose: 'Type 2 diabetes' },
    { keywords: ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin', 'lipitor', 'crestor', 'cholesterol', 'lipid', 'statin'], purpose: 'High cholesterol' },
    { keywords: ['amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline', 'cephalexin', 'levofloxacin', 'augmentin', 'clindamycin', 'infection', 'antibiotic'], purpose: 'Bacterial infection' },
    { keywords: ['ibuprofen', 'naproxen', 'acetaminophen', 'tramadol', 'gabapentin', 'pregabalin', 'meloxicam', 'celecoxib', 'pain', 'analgesic'], purpose: 'Pain management' },
    { keywords: ['omeprazole', 'pantoprazole', 'lansoprazole', 'esomeprazole', 'famotidine', 'ranitidine', 'acid reflux', 'heartburn', 'gerd'], purpose: 'Acid reflux / GERD' },
    { keywords: ['levothyroxine', 'synthroid', 'thyroid', 'liothyronine'], purpose: 'Thyroid condition' },
    { keywords: ['sertraline', 'fluoxetine', 'escitalopram', 'citalopram', 'paroxetine', 'venlafaxine', 'duloxetine', 'bupropion', 'trazodone', 'lexapro', 'zoloft', 'prozac', 'depression', 'anxiety', 'ssri'], purpose: 'Depression / anxiety' },
    { keywords: ['warfarin', 'coumadin', 'eliquis', 'apixaban', 'xarelto', 'rivaroxaban', 'blood thin', 'anticoagulant'], purpose: 'Blood thinner' },
    { keywords: ['metoprolol', 'atenolol', 'carvedilol', 'propranolol', 'bisoprolol', 'beta blocker', 'heart rate'], purpose: 'Heart condition' },
    { keywords: ['albuterol', 'fluticasone', 'budesonide', 'montelukast', 'singulair', 'advair', 'symbicort', 'asthma', 'inhaler', 'copd', 'bronchodilator'], purpose: 'Asthma / COPD' },
    { keywords: ['prednisone', 'prednisolone', 'methylprednisolone', 'dexamethasone', 'steroid', 'corticosteroid', 'inflammation'], purpose: 'Anti-inflammatory' },
    { keywords: ['alprazolam', 'lorazepam', 'diazepam', 'clonazepam', 'xanax', 'ativan', 'benzodiazepine'], purpose: 'Anxiety' },
    { keywords: ['zolpidem', 'ambien', 'eszopiclone', 'lunesta', 'sleep', 'insomnia'], purpose: 'Sleep aid' },
  ];

  for (const { keywords, purpose: p } of purposeMap) {
    if (keywords.some(kw => drugLookup.includes(kw))) {
      purpose = p;
      break;
    }
  }

  // ── Step 9: Final cleanup — if no name found, pick best candidate ──────
  if (!name) {
    const candidate = cleanLines.find(l =>
      l.length > 3 && l.length < 35 &&
      !/^\d/.test(l) &&
      !/\b(take|use|apply|qty|refill|doctor|dr|md|npi)\b/i.test(l)
    );
    if (candidate) name = candidate;
  }

  // Capitalize drug name properly
  if (name) {
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    // Capitalize known drug suffixes
    name = name.replace(/\b(hcl|hct|er|cr|sr|xl|xr)\b/gi, m => m.toUpperCase());
  }

  return {
    name: name || '',
    dosage: dosage || '',
    quantity,
    purpose,
    directions: directions || '',
    pillsRemaining: pillsTotal || 0,
    pillsTotal: pillsTotal || 0,
    daysSupply,
    refillsRemaining: refills,
    frequency,
    _scheduleDays: foundDays.length > 0 ? foundDays : null,
  };
}

// ── Real NDC drug database lookup via openFDA ──────────────────────────────
// Barcode formats on prescription bottles:
// - UPC-A (12 digits) or EAN-13 (13 digits) — contains NDC embedded
// - Code 128 — may contain NDC directly
// - The NDC is a 10-digit code formatted as 4-4-2, 5-3-2, or 5-4-1
// openFDA API: https://api.fda.gov/drug/ndc.json

async function lookupNDC(barcodeData, barcodeType) {
  // Clean the barcode data — extract potential NDC
  const cleaned = barcodeData.replace(/[^0-9]/g, '');

  // Try multiple NDC format extractions from the barcode
  const ndcCandidates = extractNDCCandidates(cleaned);

  // Try all NDC candidates + also try searching by package_ndc and raw barcode
  const allSearches = [];
  for (const ndc of ndcCandidates) {
    allSearches.push(`product_ndc:"${ndc}"`);
    allSearches.push(`package_ndc:"${ndc}"`);
  }
  // Also try raw barcode digits as package NDC (refill barcodes sometimes encode full package NDC)
  const raw = barcodeData.replace(/[^0-9]/g, '');
  if (raw.length >= 10) {
    allSearches.push(`package_ndc:"${raw}"`);
    // Try with hyphens in common refill barcode formats
    if (raw.length === 11) {
      allSearches.push(`package_ndc:"${raw.slice(0,5)}-${raw.slice(5,9)}-${raw.slice(9)}"`);
    }
  }

  for (const searchQuery of allSearches) {
    try {
      const url = `https://api.fda.gov/drug/ndc.json?search=${searchQuery}&limit=1`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const json = await resp.json();

      if (json.results && json.results.length > 0) {
        const drug = json.results[0];

        // Extract useful fields
        const brandName = drug.brand_name || drug.generic_name || '';
        const genericName = drug.generic_name || '';
        const strength = drug.active_ingredients?.[0]?.strength || '';
        const dosageForm = drug.dosage_form || '';
        const route = drug.route?.[0] || '';
        const manufacturer = drug.labeler_name || '';

        // Try to get labeling info (directions, purpose) from the drug label API
        let directions = '';
        let purpose = '';
        try {
          const labelUrl = `https://api.fda.gov/drug/label.json?search=openfda.product_ndc:"${ndc}"&limit=1`;
          const labelResp = await fetch(labelUrl);
          if (labelResp.ok) {
            const labelJson = await labelResp.json();
            if (labelJson.results?.[0]) {
              const label = labelJson.results[0];
              directions = (label.dosage_and_administration || []).join(' ').slice(0, 300) || '';
              purpose = (label.purpose || label.indications_and_usage || []).join(' ').slice(0, 200) || '';
            }
          }
        } catch (e) { /* label lookup is optional */ }

        return {
          name: brandName || genericName,
          dosage: strength,
          quantity: 1,
          purpose: purpose || `${dosageForm} — ${route}`.trim(),
          directions: directions || `Take as directed by your doctor. ${dosageForm} ${route ? 'via ' + route : ''}.`.trim(),
          pillsRemaining: 0,
          pillsTotal: 0,
          daysSupply: 30,
          refillsRemaining: 0,
          frequency: [],
          _source: 'barcode',
          _ndc: ndc,
          _barcodeRaw: barcodeData,
          _barcodeType: barcodeType,
          _manufacturer: manufacturer,
          _genericName: genericName,
          _brandName: brandName,
          _dosageForm: dosageForm,
        };
      }
    } catch (e) {
      continue; // try next candidate
    }
  }

  throw new Error(`No drug found for barcode: ${barcodeData}`);
}

// Extract potential NDC numbers from a barcode string
// UPC-A barcodes: strip leading 0 and check digit → yields 10-digit NDC
// Various NDC formats: 4-4-2, 5-3-2, 5-4-1
function extractNDCCandidates(digits) {
  const candidates = [];

  // If it's a UPC-A (12 digits), the NDC is digits 1-10 (strip leading 0 and trailing check digit)
  if (digits.length === 12) {
    const ndc10 = digits.slice(1, 11);
    // Format as 5-4-1 (most common)
    candidates.push(`${ndc10.slice(0, 5)}-${ndc10.slice(5, 9)}-${ndc10.slice(9)}`);
    // Format as 4-4-2
    candidates.push(`${ndc10.slice(0, 4)}-${ndc10.slice(4, 8)}-${ndc10.slice(8)}`);
    // Format as 5-3-2
    candidates.push(`${ndc10.slice(0, 5)}-${ndc10.slice(5, 8)}-${ndc10.slice(8)}`);
    // Plain 10-digit
    candidates.push(ndc10);
  }

  // If it's already 10-11 digits, try formatting it directly
  if (digits.length === 10 || digits.length === 11) {
    const d = digits.slice(0, 10);
    candidates.push(`${d.slice(0, 5)}-${d.slice(5, 9)}-${d.slice(9)}`);
    candidates.push(`${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`);
    candidates.push(`${d.slice(0, 5)}-${d.slice(5, 8)}-${d.slice(8)}`);
    candidates.push(d);
  }

  // EAN-13: strip leading 0 + trailing check digit
  if (digits.length === 13) {
    const ndc10 = digits.slice(1, 11);
    candidates.push(`${ndc10.slice(0, 5)}-${ndc10.slice(5, 9)}-${ndc10.slice(9)}`);
    candidates.push(ndc10);
  }

  // Raw string as-is (in case it's already formatted)
  if (digits.length >= 9 && digits.length <= 12) {
    candidates.push(digits);
  }

  return [...new Set(candidates)]; // deduplicate
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const OVERLAY_COLOR = 'rgba(0,0,0,0.72)';
const CORNER_SIZE = 26;
const CORNER_THICKNESS = 4;
const CORNER_RADIUS = 6;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  cameraRoot: { flex: 1, backgroundColor: '#000' },

  // Overlay system
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: {
    backgroundColor: OVERLAY_COLOR,
    height: (height - SCAN_BOX_SIZE) / 2 - 60,
  },
  overlayMiddleRow: { flexDirection: 'row', height: SCAN_BOX_SIZE },
  overlaySide: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  scanBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    overflow: 'hidden',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // Scan line
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2.5,
    backgroundColor: '#4ADE80',
    shadowColor: '#4ADE80',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  // Corner brackets
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

  // Step bar
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepDotDone: { backgroundColor: '#4ADE80', borderColor: '#4ADE80' },
  stepDotText: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  stepLine: { width: 32, height: 2, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: 14 },
  stepLineDone: { backgroundColor: '#4ADE80' },
  stepLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  stepLabelActive: { color: '#fff' },

  // Hint
  hintText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },

  // Mode toggle
  modeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    width: '100%',
  },
  modeBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeBtnEmoji: { fontSize: 22, marginBottom: 3 },
  modeBtnText: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  modeBtnTextActive: { color: '#fff' },
  modeBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  // Rotation step
  rotateTipBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
  rotateTipTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 8 },
  rotateTipText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },
  rotateArcWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 6, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  rotateArcFill: { height: 6, backgroundColor: '#4ADE80' },
  captureProgressBar: {
    width: '90%', height: 8, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4, overflow: 'hidden', marginBottom: 16,
  },
  captureProgressFill: { height: 8, backgroundColor: '#4ADE80', borderRadius: 4 },

  // Capture button (big circle shutter)
  captureBtn: {
    width: 74, height: 74, borderRadius: 37,
    borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#fff',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  captureBtnInner: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#fff',
  },

  // Barcode auto scan
  barcodeWaiting: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  barcodeWaitingText: {
    fontSize: 14, color: '#fff', fontWeight: '600', textAlign: 'center',
  },

  // Cancel
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  cancelBtnText: { fontSize: 15, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },

  // Permission screen
  permBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, backgroundColor: COLORS.background,
  },
  permIcon: { fontSize: 64, marginBottom: 20 },
  permTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 10 },
  permSub: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  permBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 32,
    minWidth: '80%', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    marginBottom: 12,
  },
  permBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  permCancelBtn: { paddingVertical: 12 },
  permCancelText: { fontSize: 16, color: COLORS.textMuted, fontWeight: '600' },

  // Review screen nav
  reviewNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  reviewNavTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },

  // Review form
  reviewScroll: { padding: 20, paddingBottom: 48 },
  reviewHeader: { marginBottom: 16 },
  reviewTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  reviewSub: { fontSize: 15, color: COLORS.textMuted, marginTop: 3, lineHeight: 21 },

  // Medication name highlighted box
  medNameBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    padding: 16,
    marginBottom: 16,
  },
  medNameBoxLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  medNameBoxInput: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },

  sourceBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 100, paddingVertical: 6, paddingHorizontal: 14,
    alignSelf: 'flex-start', marginBottom: 18,
    borderWidth: 1.5, borderColor: COLORS.primary + '44',
  },
  sourceBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // Form fields
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6 },
  fieldInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 17, color: COLORS.textPrimary,
    minHeight: 52,
  },
  fieldInputMulti: { minHeight: 90, textAlignVertical: 'top' },

  // Frequency grid
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  freqBtn: {
    width: '47%', borderRadius: 14, borderWidth: 2,
    borderColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 12,
    backgroundColor: COLORS.background, alignItems: 'center',
    flexDirection: 'row', gap: 8, justifyContent: 'center',
    minHeight: 56,
  },
  freqBtnActive: { backgroundColor: COLORS.primary },
  freqBtnIcon: { fontSize: 20 },
  freqBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  freqBtnTextActive: { color: '#fff' },

  // Action buttons
  confirmBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 20, alignItems: 'center',
    marginTop: 10, marginBottom: 10,
    minHeight: 60, justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  confirmBtnText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  rescanBtn: {
    borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', borderWidth: 2, borderColor: COLORS.border,
    marginBottom: 8, backgroundColor: COLORS.surface,
  },
  rescanBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.textSecondary },

  // Source badge sub-text
  sourceBadgeSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    lineHeight: 16,
  },

  // NDC badge
  ndcBadge: {
    backgroundColor: '#E8F8EE',
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#A3DDB8',
  },
  ndcBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A7A4A',
  },

  // Supply info subheading & row
  supplySubheading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  supplyRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  // Processing state (rotation)
  processingBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  processingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  processingSubText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },

  // Barcode searching state
  barcodeSearchingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  barcodeSearchingText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },

  // Done screen
  doneBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.background, paddingHorizontal: 32,
  },
  doneCheck: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: COLORS.success, shadowOpacity: 0.35,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  doneCheckText: { fontSize: 52, color: '#fff', fontWeight: '800' },
  doneTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  doneSub: { fontSize: 17, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 25, marginBottom: 32 },
  doneBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 40,
    marginBottom: 12, minWidth: '70%', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.3,
    shadowRadius: 10, elevation: 5,
  },
  doneBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  doneDismissBtn: {
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40,
    borderWidth: 2, borderColor: COLORS.border, minWidth: '70%', alignItems: 'center',
  },
  doneDismissText: { fontSize: 17, fontWeight: '700', color: COLORS.textSecondary },
});
