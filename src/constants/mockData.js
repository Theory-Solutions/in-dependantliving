/**
 * Always Near — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 */

export const MOCK_SENIOR_NAME = 'Margaret';

export const MOCK_MEDICATIONS = [
  {
    id: '1',
    name: 'Lisinopril',
    dosage: '10mg',
    quantity: 1,
    frequency: ['morning'],
    purpose: 'High blood pressure',
    directions: 'Take 1 tablet by mouth every morning. Do not stop taking without consulting your doctor.',
    pillsRemaining: 24,
    pillsTotal: 30,
    daysSupply: 30,
    refillsRemaining: 5,
    taken: { morning: false, afternoon: false, evening: false, night: false },
  },
  {
    id: '2',
    name: 'Metformin',
    dosage: '500mg',
    quantity: 2,
    frequency: ['morning', 'evening'],
    purpose: 'Type 2 diabetes',
    directions: 'Take 2 tablets by mouth twice daily with meals. Take with food to reduce stomach upset.',
    pillsRemaining: 38,
    pillsTotal: 60,
    daysSupply: 30,
    refillsRemaining: 3,
    taken: { morning: false, afternoon: false, evening: false, night: false },
  },
  {
    id: '3',
    name: 'Amoxicillin',
    dosage: '500mg',
    quantity: 1,
    frequency: ['morning', 'evening'],
    purpose: 'Bacterial infection',
    directions: 'Take 1 capsule every 12 hours for 10 days. Finish all medication even if you feel better.',
    pillsRemaining: 8,
    pillsTotal: 20,
    daysSupply: 10,
    refillsRemaining: 0,
    taken: { morning: true, afternoon: false, evening: false, night: false },
  },
];

export const MOCK_LAST_CHECKIN = Date.now() - 2 * 60 * 60 * 1000;
export const MOCK_ACTIVITY_STATUS = 'active';
export const MOCK_LAST_MOVEMENT = Date.now() - 45 * 60 * 1000;
export const MOCK_STEP_COUNT = 3241;
export const MOCK_PAIRING_CODE = '847291';

export const FREQUENCY_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

export const FREQUENCY_ICONS = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
  night: '🌙',
};

export const MOCK_PEOPLE = [
  {
    id: '1',
    name: 'Margaret',
    relation: 'Mother',
    avatar: '👩',
    lastCheckin: Date.now() - 2 * 60 * 60 * 1000,
    lastMovement: Date.now() - 45 * 60 * 1000,
    stepCount: 3241,
    pairingCode: '847291',
    meds: [
      { name: 'Lisinopril', dosage: '10mg', quantity: 1, time: 'Morning', taken: true,  purpose: 'High blood pressure', directions: 'Take 1 tablet every morning.', pillsRemaining: 24, pillsTotal: 30, refillsRemaining: 5 },
      { name: 'Metformin',  dosage: '500mg', quantity: 2, time: 'Morning', taken: true,  purpose: 'Type 2 diabetes',     directions: 'Take 2 tablets with meals.', pillsRemaining: 38, pillsTotal: 60, refillsRemaining: 3 },
      { name: 'Metformin',  dosage: '500mg', quantity: 2, time: 'Evening', taken: false, purpose: 'Type 2 diabetes',     directions: 'Take 2 tablets with meals.', pillsRemaining: 38, pillsTotal: 60, refillsRemaining: 3 },
      { name: 'Amoxicillin',dosage: '500mg', quantity: 1, time: 'Morning', taken: true,  purpose: 'Bacterial infection', directions: 'Take 1 capsule every 12 hours for 10 days.', pillsRemaining: 8, pillsTotal: 20, refillsRemaining: 0 },
    ],
  },
  {
    id: '2',
    name: 'Robert',
    relation: 'Father',
    avatar: '👴',
    lastCheckin: Date.now() - 5 * 60 * 60 * 1000,
    lastMovement: Date.now() - 3 * 60 * 60 * 1000,
    stepCount: 812,
    pairingCode: '334512',
    meds: [
      { name: 'Atorvastatin', dosage: '20mg', quantity: 1, time: 'Evening', taken: false, purpose: 'High cholesterol', directions: 'Take 1 tablet in the evening.', pillsRemaining: 12, pillsTotal: 30, refillsRemaining: 2 },
      { name: 'Metoprolol',   dosage: '25mg',  quantity: 1, time: 'Morning', taken: false, purpose: 'Heart rate control', directions: 'Take 1 tablet every morning with food.', pillsRemaining: 5, pillsTotal: 30, refillsRemaining: 1 },
      { name: 'Warfarin',     dosage: '5mg',   quantity: 1, time: 'Night',   taken: false, purpose: 'Blood thinner',     directions: 'Take 1 tablet at bedtime.', pillsRemaining: 18, pillsTotal: 30, refillsRemaining: 4 },
    ],
  },
];
