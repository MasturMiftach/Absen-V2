export interface Teacher {
  id: number;
  name: string;
  nip: string;
  role: string;
  pin: string;
  photoUrl?: string;
}

export interface WorkScheduleDay {
  hari: string;
  statusHari: 'Kerja' | 'Libur';
  jamMasuk: string;
  jamPulang: string;
  bukaAbsenMasukMnt: number;
  toleransiTerlambatMnt: number;
  toleransiPulangMnt: number;
  batasAbsenPulangMnt: number;
}

export interface AttendanceLog {
  id: string;
  teacherName: string;
  nip: string;
  role: string;
  presensiType: 'MASUK' | 'PULANG' | 'IZIN' | 'SAKIT';
  status: 'Datang Tepat Waktu' | 'Terlambat' | 'Pulang Tepat Waktu' | 'Pulang Sebelum Waktu' | 'Tepat Waktu' | 'IZIN' | 'SAKIT';
  time: string;
  date: string; // YYYY-MM-DD
  notes: string;
  created_at?: string;
}

export interface ActiveUser {
  id: number;
  name: string;
  nip: string;
  role: string;
  isStaff: boolean;
  isAdmin: boolean;
  photoUrl?: string;
}

export interface LocationConfig {
  enabled: boolean;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  locationName: string;
}

export type TabType = 'absensi' | 'dashboard' | 'jadwal' | 'guru' | 'rekap' | 'panduan';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  isError?: boolean;
}
