import { Teacher, WorkScheduleDay, AttendanceLog, LocationConfig, Holiday } from '../types';
import { getTodayString } from '../utils/dateUtils';

export const DEFAULT_LOCATION_CONFIG: LocationConfig = {
  enabled: true,
  latitude: -7.5000,
  longitude: 110.2000,
  radiusMeters: 100,
  locationName: "MI Ma'arif Al Ihsan Soborejo"
};

export const INITIAL_HOLIDAYS: Holiday[] = [
  // 2026 Holidays
  { id: 'hol-2026-001', date: '2026-01-01', description: 'Tahun Baru 2026 Masehi', type: 'NASIONAL', isRecurring: true },
  { id: 'hol-2026-002', date: '2026-01-16', description: 'Isra Mi\'raj Nabi Muhammad SAW 1447 H', type: 'KEAGAMAAN' },
  { id: 'hol-2026-003', date: '2026-02-17', description: 'Tahun Baru Imlek 2577 Kongzili', type: 'KEAGAMAAN' },
  { id: 'hol-2026-004', date: '2026-03-19', description: 'Hari Raya Nyepi Tahun Baru Saka 1948', type: 'KEAGAMAAN' },
  { id: 'hol-2026-005', date: '2026-03-20', description: 'Hari Raya Idul Fitri 1447 H (Hari 1)', type: 'KEAGAMAAN' },
  { id: 'hol-2026-006', date: '2026-03-21', description: 'Hari Raya Idul Fitri 1447 H (Hari 2)', type: 'KEAGAMAAN' },
  { id: 'hol-2026-007', date: '2026-04-03', description: 'Wafat Yesus Kristus', type: 'KEAGAMAAN' },
  { id: 'hol-2026-008', date: '2026-05-01', description: 'Hari Buruh Internasional', type: 'NASIONAL', isRecurring: true },
  { id: 'hol-2026-009', date: '2026-05-14', description: 'Kenaikan Yesus Kristus', type: 'KEAGAMAAN' },
  { id: 'hol-2026-010', date: '2026-05-27', description: 'Hari Raya Idul Adha 1447 H', type: 'KEAGAMAAN' },
  { id: 'hol-2026-011', date: '2026-05-31', description: 'Hari Raya Waisak 2570 BE', type: 'KEAGAMAAN' },
  { id: 'hol-2026-012', date: '2026-06-01', description: 'Hari Lahir Pancasila', type: 'NASIONAL', isRecurring: true },
  { id: 'hol-2026-013', date: '2026-06-16', description: 'Tahun Baru Islam 1448 Hijriah', type: 'KEAGAMAAN' },
  { id: 'hol-2026-014', date: '2026-08-17', description: 'Hari Proklamasi Kemerdekaan RI', type: 'NASIONAL', isRecurring: true },
  { id: 'hol-2026-015', date: '2026-08-25', description: 'Maulid Nabi Muhammad SAW 1448 H', type: 'KEAGAMAAN' },
  { id: 'hol-2026-016', date: '2026-10-22', description: 'Hari Santri Nasional', type: 'NASIONAL', isRecurring: true },
  { id: 'hol-2026-017', date: '2026-11-25', description: 'Hari Guru Nasional', type: 'NASIONAL', isRecurring: true },
  { id: 'hol-2026-018', date: '2026-12-25', description: 'Hari Raya Natal', type: 'KEAGAMAAN', isRecurring: true },

  // Sample Custom Holidays
  { id: 'hol-2026-019', date: '2026-03-22', description: 'Cuti Bersama Idul Fitri MI Soborejo', type: 'KHUSUS' },
  { id: 'hol-2026-020', date: '2026-03-23', description: 'Cuti Bersama Idul Fitri MI Soborejo', type: 'KHUSUS' }
];

export const INITIAL_TEACHERS: Teacher[] = [
  { id: 1, name: "Siti Rahmawati, S.Pd.I", nip: "198802142019032012", role: "Wali Kelas 1", pin: "123456", photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
  { id: 2, name: "Muhammad Anshori, S.Pd", nip: "198506112015041003", role: "Wali Kelas 2 & PJOK", pin: "123456", photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80" },
  { id: 3, name: "Nur Hidayah, M.Pd", nip: "199009252020122018", role: "Wali Kelas 3", pin: "123456", photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80" },
  { id: 4, name: "Ahmad Zaini, S.Ag", nip: "197903152008011015", role: "Wali Kelas 4 & Guru Akidah", pin: "123456", photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
  { id: 5, name: "Budi Santoso, S.Pd", nip: "198311022014021004", role: "Wali Kelas 5", pin: "123456", photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
  { id: 6, name: "Khotimah, S.Pd.I", nip: "199201102022032021", role: "Wali Kelas 6 & Guru B. Arab", pin: "123456", photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" }
];

export const DEFAULT_SCHEDULE: WorkScheduleDay[] = [
  { hari: 'Senin', statusHari: 'Kerja', jamMasuk: '07:00', jamPulang: '14:30', bukaAbsenMasukMnt: 60, toleransiTerlambatMnt: 15, toleransiPulangMnt: 15, batasAbsenPulangMnt: 120 },
  { hari: 'Selasa', statusHari: 'Kerja', jamMasuk: '07:00', jamPulang: '14:30', bukaAbsenMasukMnt: 60, toleransiTerlambatMnt: 15, toleransiPulangMnt: 15, batasAbsenPulangMnt: 120 },
  { hari: 'Rabu', statusHari: 'Kerja', jamMasuk: '07:00', jamPulang: '14:30', bukaAbsenMasukMnt: 60, toleransiTerlambatMnt: 15, toleransiPulangMnt: 15, batasAbsenPulangMnt: 120 },
  { hari: 'Kamis', statusHari: 'Kerja', jamMasuk: '07:00', jamPulang: '14:30', bukaAbsenMasukMnt: 60, toleransiTerlambatMnt: 15, toleransiPulangMnt: 15, batasAbsenPulangMnt: 120 },
  { hari: 'Jumat', statusHari: 'Kerja', jamMasuk: '07:00', jamPulang: '11:30', bukaAbsenMasukMnt: 60, toleransiTerlambatMnt: 15, toleransiPulangMnt: 15, batasAbsenPulangMnt: 120 },
  { hari: 'Sabtu', statusHari: 'Kerja', jamMasuk: '07:00', jamPulang: '13:00', bukaAbsenMasukMnt: 60, toleransiTerlambatMnt: 15, toleransiPulangMnt: 15, batasAbsenPulangMnt: 120 },
  { hari: 'Minggu', statusHari: 'Libur', jamMasuk: '07:00', jamPulang: '12:00', bukaAbsenMasukMnt: 60, toleransiTerlambatMnt: 15, toleransiPulangMnt: 15, batasAbsenPulangMnt: 120 }
];

const todayStr = getTodayString();

export const INITIAL_LOGS: AttendanceLog[] = [
  {
    id: 'log-1',
    teacherName: 'Siti Rahmawati, S.Pd.I',
    nip: '198802142019032012',
    role: 'Wali Kelas 1',
    presensiType: 'MASUK',
    status: 'Tepat Waktu',
    time: '06:45:12 WIB',
    date: todayStr,
    notes: 'Siap KBM Pagi Kelas 1'
  }
];

export const GAS_SCRIPT_CODE = `// ====================================================
// BACKEND GOOGLE APPS SCRIPT - MI MA'ARIF AL IHSAN SOBOREJO
// ====================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Header jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Tanggal", 
        "Waktu", 
        "Nama Guru", 
        "ID Pegawai", 
        "Jabatan", 
        "Jenis Presensi", 
        "Status", 
        "Catatan / Jurnal"
      ]);
    }
    
    // Append Data Presensi Sederhana
    sheet.appendRow([
      data.date,
      data.time,
      data.teacherName,
      data.nip,
      data.role,
      data.presensiType,
      data.status,
      data.notes
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "success", "message": "Presensi tersimpan!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
