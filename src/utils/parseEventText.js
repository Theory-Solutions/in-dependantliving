/**
 * In-dependent Living — Independent Living Monitoring Application
 * Copyright © 2026 Theory Solutions LLC. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the exclusive property of Theory Solutions LLC.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited.
 */

/**
 * parseEventText — NLP event parser
 * Extracts title, date, time, and location from natural language strings.
 *
 * Test cases:
 *   "Girls Bridge, Saturday April 11th, 9am at 49er's"
 *     → { title: "Girls Bridge", date: "April 11, 2026", time: "9:00 AM", location: "49er's" }
 *   "Hair, April 23, 11:00"
 *     → { title: "Hair", date: "April 23, 2026", time: "11:00 AM" }
 *   "Doctor Smith, Tuesday the 15th at 2:30"
 *     → { title: "Doctor Smith", date: "April 15, 2026", time: "2:30 PM" }
 */

const MONTHS = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december'
];
const MONTH_ABBR = [
  'jan','feb','mar','apr','may','jun',
  'jul','aug','sep','oct','nov','dec'
];
const WEEKDAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

// Get the next occurrence of a weekday (0=Sun, 6=Sat)
function nextWeekday(dayIndex) {
  const today = new Date();
  const diff = (dayIndex - today.getDay() + 7) % 7 || 7;
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return result;
}

// Get next occurrence of a month+day
function resolveDateFromMonthDay(monthIndex, day) {
  const today = new Date();
  const year = today.getFullYear();
  let date = new Date(year, monthIndex, day);
  if (date < today) {
    date = new Date(year + 1, monthIndex, day);
  }
  return date;
}

// Format a Date as "Month D, YYYY"
function formatDate(date) {
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Parse ordinal suffixes: "11th" → 11, "23rd" → 23, "the 15th" → 15
function parseOrdinal(str) {
  const m = str.match(/\b(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/i);
  return m ? parseInt(m[1]) : null;
}

// Format time: normalizes hour+minute+ampm into "H:MM AM/PM"
function formatTime(hour, minute, meridiem) {
  const h = parseInt(hour);
  const m = parseInt(minute) || 0;
  const minStr = String(m).padStart(2, '0');

  if (meridiem) {
    const am = meridiem.toLowerCase() === 'am';
    const pm = meridiem.toLowerCase() === 'pm';
    if (pm && h < 12) return `${h + 12}:${minStr}` === '12:00' ? `12:00 PM` : `${h}:${minStr} PM`;
    if (am && h === 12) return `12:${minStr} AM`;
    return `${h}:${minStr} ${pm ? 'PM' : 'AM'}`;
  }

  // No meridiem — infer: assume PM for hours 1-6, AM for 7-11
  if (h >= 7 && h <= 11) return `${h}:${minStr} AM`;
  if (h === 12) return `12:${minStr} PM`;
  return `${h}:${minStr} PM`; // 1–6 → PM
}

/**
 * Main export
 * @param {string} text - Natural language event description
 * @returns {{ title: string, date?: string, time?: string, location?: string }}
 */
export default function parseEventText(text) {
  if (!text || !text.trim()) return { title: '' };

  let remaining = text.trim();
  let title = '';
  let date = undefined;
  let time = undefined;
  let location = undefined;

  // ── 1. Extract time ────────────────────────────────────────────────────────

  // "11 in the morning" / "2 in the afternoon"
  const timeInPhraseMatch = remaining.match(
    /\b(\d{1,2})(?::(\d{2}))?\s+in\s+the\s+(morning|afternoon|evening)\b/i
  );
  if (timeInPhraseMatch) {
    const [full, h, m, period] = timeInPhraseMatch;
    const meridiem = period.toLowerCase() === 'morning' ? 'am' : 'pm';
    time = formatTime(h, m || '0', meridiem);
    remaining = remaining.replace(full, '').trim();
  }

  // "9am" / "2:30pm" / "11:00 AM" / "2:30"
  if (!time) {
    const timeMatch = remaining.match(
      /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)\b/i
    );
    if (timeMatch) {
      const [full, h, m, meridiem] = timeMatch;
      time = formatTime(h, m || '0', meridiem);
      remaining = remaining.replace(full, '').trim();
    }
  }

  // Bare time like "at 2:30" (no am/pm) — check if preceded by "at"
  if (!time) {
    const bareTimeAtMatch = remaining.match(/\bat\s+(\d{1,2}):(\d{2})\b/i);
    if (bareTimeAtMatch) {
      const [full, h, m] = bareTimeAtMatch;
      time = formatTime(h, m, null);
      remaining = remaining.replace(full, '').trim();
    }
  }

  // Bare time "11:00" anywhere
  if (!time) {
    const bareTimeMatch = remaining.match(/\b(\d{1,2}):(\d{2})\b/);
    if (bareTimeMatch) {
      const [full, h, m] = bareTimeMatch;
      time = formatTime(h, m, null);
      remaining = remaining.replace(full, '').trim();
    }
  }

  // ── 2. Extract location ────────────────────────────────────────────────────
  // Location is "at <something>" or "in <something>" near the end
  // Only capture if it looks like a venue (not a date/time phrase)
  const locationMatch = remaining.match(
    /\bat\s+((?!(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\d+(?:st|nd|rd|th)?)\b)[^,]+?)(?:,|$)/i
  );
  if (locationMatch) {
    const candidateLoc = locationMatch[1].trim();
    // Make sure it's not a pure time expression
    if (!/^\d{1,2}(?::\d{2})?(?:am|pm)?$/i.test(candidateLoc)) {
      location = candidateLoc;
      remaining = remaining.replace(locationMatch[0], '').trim();
    }
  }

  // ── 3. Extract date ────────────────────────────────────────────────────────

  // Pattern: "Saturday April 11th" or "April 11th" or "April 23"
  const monthDayFullMatch = remaining.match(
    new RegExp(
      `(?:(?:${WEEKDAYS.join('|')})\\s+)?` +
      `(${[...MONTHS,...MONTH_ABBR].join('|')})` +
      `\\.?\\s+(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?`,
      'i'
    )
  );
  if (monthDayFullMatch) {
    const [full, monthStr, dayStr] = monthDayFullMatch;
    const monthIndex = [...MONTHS,...MONTH_ABBR].indexOf(monthStr.toLowerCase()) % 12;
    const day = parseInt(dayStr);
    const d = resolveDateFromMonthDay(monthIndex, day);
    date = formatDate(d);
    remaining = remaining.replace(full, '').trim();
  }

  // Pattern: "Tuesday the 15th" (weekday + ordinal, no month)
  if (!date) {
    const weekdayOrdinalMatch = remaining.match(
      new RegExp(`(${WEEKDAYS.join('|')})\\s+the\\s+(\\d{1,2})(?:st|nd|rd|th)?`, 'i')
    );
    if (weekdayOrdinalMatch) {
      const [full, weekdayStr, dayStr] = weekdayOrdinalMatch;
      // Use current/next month with that day
      const today = new Date();
      const day = parseInt(dayStr);
      let d = new Date(today.getFullYear(), today.getMonth(), day);
      if (d < today) d = new Date(today.getFullYear(), today.getMonth() + 1, day);
      date = formatDate(d);
      remaining = remaining.replace(full, '').trim();
    }
  }

  // Pattern: "Saturday" alone
  if (!date) {
    const weekdayMatch = remaining.match(
      new RegExp(`\\b(${WEEKDAYS.join('|')})\\b`, 'i')
    );
    if (weekdayMatch) {
      const dayIndex = WEEKDAYS.indexOf(weekdayMatch[1].toLowerCase());
      const d = nextWeekday(dayIndex);
      date = formatDate(d);
      remaining = remaining.replace(weekdayMatch[0], '').trim();
    }
  }

  // ── 4. Extract title ───────────────────────────────────────────────────────
  // Clean up remaining: strip leading/trailing commas, whitespace, "at"
  title = remaining
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .replace(/\s*,\s*$/, '')
    .trim();

  // Strip trailing " at" or " in" left over
  title = title.replace(/\s+(at|in)$/i, '').trim();
  title = title.replace(/,\s*$/, '').trim();

  return {
    title,
    ...(date ? { date } : {}),
    ...(time ? { time } : {}),
    ...(location ? { location } : {}),
  };
}
