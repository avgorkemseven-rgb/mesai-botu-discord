import { config } from './config.js';

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours} sa ${minutes} dk ${remainingSeconds} sn`;
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: config.timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function zonedParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
}

function timezoneOffsetMs(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]),
  );
  const asUtc = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second);
  return asUtc - date.getTime();
}

function zonedMidnightIso(year, month, day) {
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  return new Date(guess.getTime() - timezoneOffsetMs(guess)).toISOString();
}

export function getPeriodStart(period, now = new Date()) {
  const parts = zonedParts(now);
  if (period === 'gün' || period === 'gun') {
    return zonedMidnightIso(parts.year, parts.month, parts.day);
  }
  if (period === 'hafta') {
    const calendarDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
    const day = (calendarDate.getUTCDay() + 6) % 7;
    calendarDate.setUTCDate(calendarDate.getUTCDate() - day);
    return zonedMidnightIso(calendarDate.getUTCFullYear(), calendarDate.getUTCMonth() + 1, calendarDate.getUTCDate());
  }
  if (period === 'ay') {
    return zonedMidnightIso(parts.year, parts.month, 1);
  }
  return null;
}

export function periodLabel(period) {
  return {
    gün: 'Bugün',
    gun: 'Bugün',
    hafta: 'Bu hafta',
    ay: 'Bu ay',
    tüm: 'Tüm zamanlar',
    tum: 'Tüm zamanlar',
  }[period] || 'Bu hafta';
}
