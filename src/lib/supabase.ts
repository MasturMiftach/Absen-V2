import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Teacher, WorkScheduleDay, AttendanceLog, LocationConfig, Holiday } from '../types';
import { INITIAL_TEACHERS, DEFAULT_SCHEDULE, INITIAL_LOGS, DEFAULT_LOCATION_CONFIG, INITIAL_HOLIDAYS } from '../data/initialData';
import { normalizeLogsTimezone } from '../utils/dateUtils';

// Access environment variables securely
const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const envUrl = env.VITE_SUPABASE_URL || '';
const envKey = env.VITE_SUPABASE_ANON_KEY || '';

// Helper to retrieve current Supabase credentials
export function getSupabaseCredentials() {
  const url = envUrl || localStorage.getItem('mi_soborejo_supabase_url') || '';
  const key = envKey || localStorage.getItem('mi_soborejo_supabase_key') || '';
  return { url, key };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (url) localStorage.setItem('mi_soborejo_supabase_url', url.trim());
  if (key) localStorage.setItem('mi_soborejo_supabase_key', key.trim());
  const newUrl = url.trim() || 'https://placeholder.supabase.co';
  const newKey = key.trim() || 'placeholder-anon-key';
  supabase = createClient(newUrl, newKey);
}

// Inisialisasi Supabase Client dengan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
const initialCreds = getSupabaseCredentials();
export let supabase: SupabaseClient = createClient(
  initialCreds.url && initialCreds.url.startsWith('http') ? initialCreds.url : 'https://placeholder.supabase.co',
  initialCreds.key || 'placeholder-anon-key'
);

export function getSupabaseInstance(): SupabaseClient {
  return supabase;
}

export function isSupabaseConnected(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url !== 'https://placeholder.supabase.co');
}

// Helper to store & retrieve teachers locally as fallback
function getLocalTeachers(): Teacher[] {
  try {
    const saved = localStorage.getItem('mi_soborejo_teachers');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading local teachers:', err);
  }
  return INITIAL_TEACHERS;
}

function saveLocalTeachers(teachers: Teacher[]): void {
  try {
    localStorage.setItem('mi_soborejo_teachers', JSON.stringify(teachers));
  } catch (err) {
    console.error('Error saving local teachers:', err);
  }
}

// ========================================================
// 1. DATA GURU (teachers)
// ========================================================
export async function fetchTeachers(): Promise<Teacher[]> {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase Error: Gagal mengambil data guru dari tabel "teachers":', error);
      return getLocalTeachers();
    }

    if (!data || data.length === 0) {
      await syncTeachersToSupabase(INITIAL_TEACHERS);
      return INITIAL_TEACHERS;
    }

    // Robust parsing supporting "photoUrl", "photo_url", or "photourl"
    const parsedTeachers: Teacher[] = (data as any[]).map((item) => ({
      id: Number(item.id),
      name: String(item.name || ''),
      nip: String(item.nip || ''),
      role: String(item.role || 'Guru'),
      pin: String(item.pin || '123456'),
      photoUrl: String(item.photoUrl || item.photo_url || item.photourl || '')
    }));

    saveLocalTeachers(parsedTeachers);
    return parsedTeachers;
  } catch (err) {
    console.error('Supabase Connection Exception (fetchTeachers):', err);
    return getLocalTeachers();
  }
}

export function subscribeTeachers(onUpdate: (teachers: Teacher[]) => void) {
  fetchTeachers().then(onUpdate);

  const channel = supabase
    .channel('realtime:teachers')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => {
      fetchTeachers().then(onUpdate);
    })
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || err) {
        console.error('Supabase Realtime Channel Error (teachers):', err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function syncTeacherToSupabase(teacher: Teacher): Promise<{ success: boolean; error?: string }> {
  try {
    // Attempt 1: Standard double-quoted camelCase "photoUrl"
    const payload1 = {
      id: Number(teacher.id),
      name: teacher.name,
      nip: teacher.nip || '',
      role: teacher.role || 'Guru',
      pin: teacher.pin || '123456',
      photoUrl: teacher.photoUrl || ''
    };

    let { error } = await supabase.from('teachers').upsert(payload1);

    // If failed due to column name mismatch (e.g. column "photoUrl" does not exist)
    if (error && (error.message?.toLowerCase().includes('column') || error.message?.toLowerCase().includes('photourl') || (error as any).code === '42703')) {
      console.warn('Kolom "photoUrl" tidak cocok, mencoba fallback "photo_url"...');
      // Attempt 2: snake_case "photo_url"
      const payload2 = {
        id: Number(teacher.id),
        name: teacher.name,
        nip: teacher.nip || '',
        role: teacher.role || 'Guru',
        pin: teacher.pin || '123456',
        photo_url: teacher.photoUrl || ''
      };
      const res2 = await supabase.from('teachers').upsert(payload2);
      if (!res2.error) {
        error = null;
      } else {
        // Attempt 3: lowercase "photourl"
        const payload3 = {
          id: Number(teacher.id),
          name: teacher.name,
          nip: teacher.nip || '',
          role: teacher.role || 'Guru',
          pin: teacher.pin || '123456',
          photourl: teacher.photoUrl || ''
        };
        const res3 = await supabase.from('teachers').upsert(payload3);
        if (!res3.error) {
          error = null;
        } else {
          // Attempt 4: If table doesn't have any photo column yet, save basic teacher info and warn
          const payloadNoPhoto = {
            id: Number(teacher.id),
            name: teacher.name,
            nip: teacher.nip || '',
            role: teacher.role || 'Guru',
            pin: teacher.pin || '123456'
          };
          const res4 = await supabase.from('teachers').upsert(payloadNoPhoto);
          if (!res4.error) {
            console.warn('Tabel teachers di Supabase belum memiliki kolom photoUrl. Jalankan script SQL: ALTER TABLE teachers ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;');
            error = { message: 'Kolom "photoUrl" belum ada di tabel Supabase. Jalankan query SQL: ALTER TABLE teachers ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;' } as any;
          }
        }
      }
    }

    if (error) {
      console.error('Supabase Error: Gagal menyimpan data guru ke tabel "teachers":', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Supabase Connection Exception (syncTeacherToSupabase):', err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteTeacherFromSupabase(teacherId: number): Promise<void> {
  try {
    const { error } = await supabase.from('teachers').delete().eq('id', Number(teacherId));
    if (error) {
      console.error('Supabase Error: Gagal menghapus guru dari tabel "teachers":', error);
    }
  } catch (err) {
    console.error('Supabase Connection Exception (deleteTeacherFromSupabase):', err);
  }
}

export async function syncTeachersToSupabase(teachers: Teacher[]): Promise<void> {
  try {
    const records = teachers.map((t) => ({
      id: Number(t.id),
      name: t.name,
      nip: t.nip || '',
      role: t.role || 'Guru',
      pin: t.pin || '123456',
      photoUrl: t.photoUrl || ''
    }));
    let { error } = await supabase.from('teachers').upsert(records);
    if (error && (error.message?.toLowerCase().includes('column') || (error as any).code === '42703')) {
      // Fallback with photo_url
      const fallbackRecords = teachers.map((t) => ({
        id: Number(t.id),
        name: t.name,
        nip: t.nip || '',
        role: t.role || 'Guru',
        pin: t.pin || '123456',
        photo_url: t.photoUrl || ''
      }));
      const res2 = await supabase.from('teachers').upsert(fallbackRecords);
      if (!res2.error) {
        error = null;
      }
    }
    if (error) {
      console.error('Supabase Error: Gagal sync banyak guru ke tabel "teachers":', error);
    }
  } catch (err) {
    console.error('Supabase Connection Exception (syncTeachersToSupabase):', err);
  }
}

// ========================================================
// 2. LOG PRESENSI (attendance_logs)
// ========================================================
export async function fetchAttendanceLogs(): Promise<AttendanceLog[]> {
  try {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error: Gagal mengambil log presensi dari tabel "attendance_logs":', error);
      return INITIAL_LOGS;
    }

    if (!data || data.length === 0) {
      for (const log of INITIAL_LOGS) {
        await syncLogToSupabase(log);
      }
      return normalizeLogsTimezone(INITIAL_LOGS);
    }

    return normalizeLogsTimezone(data as AttendanceLog[]);
  } catch (err) {
    console.error('Supabase Connection Exception (fetchAttendanceLogs):', err);
    return INITIAL_LOGS;
  }
}

export function subscribeAttendanceLogs(onUpdate: (logs: AttendanceLog[]) => void) {
  fetchAttendanceLogs().then(onUpdate);

  const channel = supabase
    .channel('realtime:attendance_logs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, () => {
      fetchAttendanceLogs().then(onUpdate);
    })
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || err) {
        console.error('Supabase Realtime Channel Error (attendance_logs):', err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function syncLogToSupabase(log: AttendanceLog): Promise<void> {
  try {
    const cleanDate = log.date ? log.date.substring(0, 10) : '';
    let createdAt = log.created_at;
    if (!createdAt && cleanDate) {
      const rawTime = log.time ? log.time.replace(/[^0-9:]/g, '').trim() : '07:00:00';
      const cleanTime = rawTime.length >= 5 ? (rawTime.length === 5 ? `${rawTime}:00` : rawTime.substring(0, 8)) : '07:00:00';
      createdAt = `${cleanDate}T${cleanTime}+07:00`;
    }

    const { error } = await supabase.from('attendance_logs').upsert({
      id: String(log.id),
      teacherName: log.teacherName,
      nip: log.nip || '',
      role: log.role || 'Guru',
      presensiType: log.presensiType,
      status: log.status,
      time: log.time,
      date: cleanDate,
      notes: log.notes || '',
      ...(createdAt ? { created_at: createdAt } : {})
    });
    if (error) {
      console.error('Supabase Error: Gagal menginput log presensi ke tabel "attendance_logs":', error);
    }
  } catch (err) {
    console.error('Supabase Connection Exception (syncLogToSupabase):', err);
  }
}

export async function syncLogsToSupabase(logs: AttendanceLog[]): Promise<{ success: boolean; count: number; error?: string }> {
  if (!logs || logs.length === 0) return { success: true, count: 0 };
  try {
    const records = logs.map((log) => {
      const cleanDate = log.date ? log.date.substring(0, 10) : '';
      let createdAt = log.created_at;
      if (!createdAt && cleanDate) {
        const rawTime = log.time ? log.time.replace(/[^0-9:]/g, '').trim() : '07:00:00';
        const cleanTime = rawTime.length >= 5 ? (rawTime.length === 5 ? `${rawTime}:00` : rawTime.substring(0, 8)) : '07:00:00';
        createdAt = `${cleanDate}T${cleanTime}+07:00`;
      }

      return {
        id: String(log.id),
        teacherName: log.teacherName,
        nip: log.nip || '',
        role: log.role || 'Guru',
        presensiType: log.presensiType,
        status: log.status,
        time: log.time,
        date: cleanDate,
        notes: log.notes || '',
        ...(createdAt ? { created_at: createdAt } : {})
      };
    });

    // Chunk records to prevent Supabase / PostgREST payload limits
    const chunkSize = 50;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const { error } = await supabase.from('attendance_logs').upsert(chunk);
      if (error) {
        console.error('Supabase Error syncLogsToSupabase chunk:', error);
        return { success: false, count: i, error: error.message };
      }
    }
    return { success: true, count: records.length };
  } catch (err: any) {
    console.error('Supabase Connection Exception (syncLogsToSupabase):', err);
    return { success: false, count: 0, error: err?.message || String(err) };
  }
}

export async function deleteLogFromSupabase(logId: string): Promise<void> {
  try {
    const { error } = await supabase.from('attendance_logs').delete().eq('id', String(logId));
    if (error) {
      console.error('Supabase Error: Gagal menghapus log dari tabel "attendance_logs":', error);
    }
  } catch (err) {
    console.error('Supabase Connection Exception (deleteLogFromSupabase):', err);
  }
}

// ========================================================
// 3. JADWAL KERJA (work_schedule)
// ========================================================
export async function fetchSchedule(): Promise<WorkScheduleDay[]> {
  try {
    const { data, error } = await supabase
      .from('work_schedule')
      .select('*');

    if (error) {
      console.error('Supabase Error: Gagal mengambil jadwal kerja dari tabel "work_schedule":', error);
      return DEFAULT_SCHEDULE;
    }

    if (!data || data.length === 0) {
      await syncScheduleToSupabase(DEFAULT_SCHEDULE);
      return DEFAULT_SCHEDULE;
    }

    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const sorted = (data as WorkScheduleDay[]).sort(
      (a, b) => dayOrder.indexOf(a.hari) - dayOrder.indexOf(b.hari)
    );

    return sorted;
  } catch (err) {
    console.error('Supabase Connection Exception (fetchSchedule):', err);
    return DEFAULT_SCHEDULE;
  }
}

export function subscribeSchedule(onUpdate: (schedule: WorkScheduleDay[]) => void) {
  fetchSchedule().then(onUpdate);

  const channel = supabase
    .channel('realtime:work_schedule')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'work_schedule' }, () => {
      fetchSchedule().then(onUpdate);
    })
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || err) {
        console.error('Supabase Realtime Channel Error (work_schedule):', err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function syncScheduleToSupabase(schedule: WorkScheduleDay[]): Promise<void> {
  try {
    const records = schedule.map((s) => ({
      hari: s.hari,
      statusHari: s.statusHari,
      jamMasuk: s.jamMasuk,
      jamPulang: s.jamPulang,
      bukaAbsenMasukMnt: s.bukaAbsenMasukMnt,
      toleransiTerlambatMnt: s.toleransiTerlambatMnt,
      toleransiPulangMnt: s.toleransiPulangMnt,
      batasAbsenPulangMnt: s.batasAbsenPulangMnt
    }));
    const { error } = await supabase.from('work_schedule').upsert(records);
    if (error) {
      console.error('Supabase Error: Gagal menyimpan jadwal kerja ke tabel "work_schedule":', error);
    }
  } catch (err) {
    console.error('Supabase Connection Exception (syncScheduleToSupabase):', err);
  }
}

// ========================================================
// 4. KONFIGURASI LOKASI GPS (location_config)
// ========================================================
export async function fetchLocationConfig(): Promise<LocationConfig> {
  try {
    const { data, error } = await supabase
      .from('location_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      if (error) console.error('Supabase Error: Gagal mengambil konfigurasi lokasi dari tabel "location_config":', error);
      await syncLocationConfigToSupabase(DEFAULT_LOCATION_CONFIG);
      return DEFAULT_LOCATION_CONFIG;
    }

    return {
      enabled: Boolean(data.enabled),
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      radiusMeters: Number(data.radiusMeters),
      locationName: data.locationName || "MI Ma'arif Al Ihsan Soborejo"
    };
  } catch (err) {
    console.error('Supabase Connection Exception (fetchLocationConfig):', err);
    return DEFAULT_LOCATION_CONFIG;
  }
}

export function subscribeLocationConfig(onUpdate: (config: LocationConfig) => void) {
  fetchLocationConfig().then(onUpdate);

  const channel = supabase
    .channel('realtime:location_config')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'location_config' }, () => {
      fetchLocationConfig().then(onUpdate);
    })
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || err) {
        console.error('Supabase Realtime Channel Error (location_config):', err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function syncLocationConfigToSupabase(config: LocationConfig): Promise<void> {
  try {
    const { error } = await supabase.from('location_config').upsert({
      id: 1,
      enabled: config.enabled,
      latitude: config.latitude,
      longitude: config.longitude,
      radiusMeters: config.radiusMeters,
      locationName: config.locationName
    });
    if (error) {
      console.error('Supabase Error: Gagal menyimpan konfigurasi lokasi ke tabel "location_config":', error);
    }
  } catch (err) {
    console.error('Supabase Connection Exception (syncLocationConfigToSupabase):', err);
  }
}

// ========================================================
// 5. MANAJEMEN HARI LIBUR (holidays)
// ========================================================
export function getLocalHolidays(): Holiday[] {
  try {
    const raw = localStorage.getItem('mi_soborejo_holidays');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Gagal membaca local holidays:', e);
  }
  return INITIAL_HOLIDAYS;
}

export function saveLocalHolidays(holidays: Holiday[]) {
  try {
    localStorage.setItem('mi_soborejo_holidays', JSON.stringify(holidays));
  } catch (e) {
    console.warn('Gagal menyimpan local holidays:', e);
  }
}

export async function fetchHolidays(): Promise<Holiday[]> {
  try {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.warn('Supabase Warning: Gagal mengambil "holidays", menggunakan data lokal:', error.message);
      return getLocalHolidays();
    }

    if (!data || data.length === 0) {
      // Pre-seed initial holidays
      for (const h of INITIAL_HOLIDAYS) {
        await syncHolidayToSupabase(h);
      }
      saveLocalHolidays(INITIAL_HOLIDAYS);
      return INITIAL_HOLIDAYS;
    }

    const holidays = data.map(item => ({
      id: String(item.id),
      date: String(item.date),
      description: String(item.description),
      type: (item.type as 'NASIONAL' | 'KEAGAMAAN' | 'KHUSUS') || 'NASIONAL',
      isRecurring: Boolean(item.isRecurring)
    })) as Holiday[];

    saveLocalHolidays(holidays);
    return holidays;
  } catch (err) {
    console.warn('Supabase Exception (fetchHolidays), fallback ke lokal:', err);
    return getLocalHolidays();
  }
}

export function subscribeHolidays(onUpdate: (holidays: Holiday[]) => void) {
  fetchHolidays().then(onUpdate);

  const channel = supabase
    .channel('realtime:holidays')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'holidays' }, () => {
      fetchHolidays().then(onUpdate);
    })
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || err) {
        console.warn('Supabase Realtime Channel (holidays) warning:', err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function syncHolidayToSupabase(holiday: Holiday): Promise<void> {
  try {
    const { error } = await supabase.from('holidays').upsert({
      id: holiday.id,
      date: holiday.date,
      description: holiday.description,
      type: holiday.type,
      isRecurring: holiday.isRecurring || false
    });
    if (error) {
      console.warn('Supabase Warning: Gagal simpan holiday ke Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Supabase Exception (syncHolidayToSupabase):', err);
  }
}

export async function deleteHolidayFromSupabase(holidayId: string): Promise<void> {
  try {
    const { error } = await supabase.from('holidays').delete().eq('id', holidayId);
    if (error) {
      console.warn('Supabase Warning: Gagal hapus holiday dari Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Supabase Exception (deleteHolidayFromSupabase):', err);
  }
}

export const SUPABASE_SQL_SETUP = `-- Script Setup SQL Supabase
-- Buka Supabase Dashboard > SQL Editor > Run Query berikut:

CREATE TABLE IF NOT EXISTS teachers (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT,
  role TEXT,
  pin TEXT,
  "photoUrl" TEXT
);

-- Pastikan kolom photoUrl tersedia jika tabel teachers sudah ada sebelumnya
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;

CREATE TABLE IF NOT EXISTS work_schedule (
  hari TEXT PRIMARY KEY,
  "statusHari" TEXT,
  "jamMasuk" TEXT,
  "jamPulang" TEXT,
  "bukaAbsenMasukMnt" INTEGER,
  "toleransiTerlambatMnt" INTEGER,
  "toleransiPulangMnt" INTEGER,
  "batasAbsenPulangMnt" INTEGER
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id TEXT PRIMARY KEY,
  "teacherName" TEXT,
  nip TEXT,
  role TEXT,
  "presensiType" TEXT,
  status TEXT,
  time TEXT,
  date TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS location_config (
  id INT PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  latitude DOUBLE PRECISION DEFAULT -7.5000,
  longitude DOUBLE PRECISION DEFAULT 110.2000,
  "radiusMeters" INTEGER DEFAULT 100,
  "locationName" TEXT DEFAULT 'MI Ma''arif Al Ihsan Soborejo'
);

CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'NASIONAL',
  "isRecurring" BOOLEAN DEFAULT false
);

-- Enable RLS & Policies
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access teachers" ON teachers;
CREATE POLICY "Public access teachers" ON teachers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access work_schedule" ON work_schedule;
CREATE POLICY "Public access work_schedule" ON work_schedule FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access attendance_logs" ON attendance_logs;
CREATE POLICY "Public access attendance_logs" ON attendance_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access location_config" ON location_config;
CREATE POLICY "Public access location_config" ON location_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access holidays" ON holidays;
CREATE POLICY "Public access holidays" ON holidays FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE teachers;
ALTER PUBLICATION supabase_realtime ADD TABLE work_schedule;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE location_config;
ALTER PUBLICATION supabase_realtime ADD TABLE holidays;
`;
