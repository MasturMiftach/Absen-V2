-- ========================================================
-- SKEMA DATABASE SQL SUPABASE / POSTGRESQL
-- Aplikasi Presensi MI Ma'arif Al Ihsan Soborejo
-- ========================================================

-- 1. TABEL DATA GURU (teachers)
CREATE TABLE IF NOT EXISTS teachers (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT,
  role TEXT,
  pin TEXT
);

-- 2. TABEL JADWAL KERJA (work_schedule)
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

-- 3. TABEL LOG ATTENDANCE / PRESENSI (attendance_logs)
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

-- 4. TABEL KONFIGURASI LOKASI GPS (location_config)
CREATE TABLE IF NOT EXISTS location_config (
  id INT PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN DEFAULT true,
  latitude DOUBLE PRECISION DEFAULT -7.5000,
  longitude DOUBLE PRECISION DEFAULT 110.2000,
  "radiusMeters" INTEGER DEFAULT 100,
  "locationName" TEXT DEFAULT 'MI Ma''arif Al Ihsan Soborejo'
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) & HAK AKSES
-- ========================================================
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_config ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik (Read/Write)
DROP POLICY IF EXISTS "Public access teachers" ON teachers;
CREATE POLICY "Public access teachers" ON teachers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access work_schedule" ON work_schedule;
CREATE POLICY "Public access work_schedule" ON work_schedule FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access attendance_logs" ON attendance_logs;
CREATE POLICY "Public access attendance_logs" ON attendance_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access location_config" ON location_config;
CREATE POLICY "Public access location_config" ON location_config FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- REALTIME SUBSCRIPTION
-- ========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE teachers;
ALTER PUBLICATION supabase_realtime ADD TABLE work_schedule;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE location_config;
