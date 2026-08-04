import { AttendanceLog } from '../types';

/**
 * Returns a YYYY-MM-DD date string in local client timezone.
 * NEVER uses .toISOString().split('T')[0] because toISOString() converts to UTC,
 * which shifts dates by -1 day during early morning hours in Indonesia (UTC+7/WIB).
 */
export function getLocalDateString(dateInput: Date | string | number = new Date()): string {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    // If invalid Date, fallback if it's already a valid YYYY-MM-DD string
    if (typeof dateInput === 'string' && dateInput.length >= 10) {
      return dateInput.substring(0, 10);
    }
    return '';
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date in YYYY-MM-DD in client local timezone.
 */
export function getTodayString(): string {
  return getLocalDateString(new Date());
}

/**
 * Formats time as HH:mm:ss WIB or HH:mm WIB in local client timezone.
 */
export function getLocalTimeString(dateInput: Date | string | number = new Date(), includeSeconds: boolean = true): string {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput : '';
  
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  if (includeSeconds) {
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s} WIB`;
  }
  return `${h}:${m} WIB`;
}

/**
 * Returns current month ('01'..'12') and year ('2026') in local timezone.
 */
export function getCurrentYearAndMonth(d: Date = new Date()): { year: string; month: string } {
  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return { year, month };
}

/**
 * Normalizes an AttendanceLog to ensure its `date` field accurately reflects the local client timezone.
 * If `created_at` timestamp exists (from Supabase), it converts the absolute timestamp to client local YYYY-MM-DD.
 */
export function normalizeLogTimezone(log: AttendanceLog): AttendanceLog {
  if (!log) return log;
  let cleanDate = log.date;

  if (log.created_at) {
    const d = new Date(log.created_at);
    if (!isNaN(d.getTime())) {
      cleanDate = getLocalDateString(d);
    }
  } else if (cleanDate && cleanDate.includes('T')) {
    cleanDate = cleanDate.split('T')[0];
  }

  return {
    ...log,
    date: cleanDate
  };
}

/**
 * Normalizes an array of AttendanceLogs
 */
export function normalizeLogsTimezone(logs: AttendanceLog[]): AttendanceLog[] {
  if (!Array.isArray(logs)) return [];
  return logs.map(normalizeLogTimezone);
}

/**
 * Formats YYYY-MM-DD string into Indonesian date string like "4 Agustus 2026"
 */
export function formatDateIndonesian(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  const months: Record<string, string> = {
    '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
    '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
  };
  const dayNum = parseInt(d, 10);
  const monthName = months[m] || m;
  return `${dayNum} ${monthName} ${y}`;
}
