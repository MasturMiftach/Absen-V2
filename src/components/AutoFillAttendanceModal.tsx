import React, { useState, useMemo } from 'react';
import { Teacher, WorkScheduleDay, AttendanceLog, Holiday } from '../types';
import { getTodayString, getLocalDateString, getHolidayForDate, formatDateIndonesian } from '../utils/dateUtils';
import {
  normalizeDateToYYYYMMDD,
  isRealAttendance,
  isLogForTeacherAndDate,
  getLogAttendanceType,
  getAdminFillLogId,
  findAndDeduplicateLogs
} from '../utils/attendanceUtils';
import {
  CalendarCheck,
  Sparkles,
  X,
  Calendar,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Filter,
  Check,
  FileCheck2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Trash2
} from 'lucide-react';

interface AutoFillAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  schedule: WorkScheduleDay[];
  holidays: Holiday[];
  attendanceLogs: AttendanceLog[];
  onBulkAddLogs: (newLogs: AttendanceLog[]) => Promise<void>;
  onRefreshLogs?: () => Promise<void>;
  onCleanDuplicates?: () => Promise<number>;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

type PeriodPreset = 'bulan_ini' | '7_hari' | '30_hari' | 'bulan_lalu' | 'kustom';
type PresensiFillType = 'BOTH' | 'MASUK' | 'PULANG';

export interface MissingAttendanceItem {
  teacher: Teacher;
  date: string;
  dayName: string;
  scheduleDay: WorkScheduleDay;
  missingTypes: ('MASUK' | 'PULANG')[];
  existingRealLogs: AttendanceLog[];
  hasRealMasuk: boolean;
  hasRealPulang: boolean;
  realMasukLog?: AttendanceLog;
  realPulangLog?: AttendanceLog;
}

export interface ProtectedRealAttendanceItem {
  teacher: Teacher;
  date: string;
  dayName: string;
  logs: AttendanceLog[];
  types: ('MASUK' | 'PULANG' | 'IZIN' | 'SAKIT')[];
}

export const AutoFillAttendanceModal: React.FC<AutoFillAttendanceModalProps> = ({
  isOpen,
  onClose,
  teachers,
  schedule,
  holidays,
  attendanceLogs,
  onBulkAddLogs,
  onRefreshLogs,
  onCleanDuplicates,
  showToast,
}) => {
  const todayStr = getTodayString();

  // Presets & Dates state
  const [preset, setPreset] = useState<PeriodPreset>('bulan_ini');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Filter Target Teachers
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('SEMUA');

  // Fill Options
  const [fillType, setFillType] = useState<PresensiFillType>('BOTH');
  const [customMasukTime, setCustomMasukTime] = useState<string>('06:50');
  const [customPulangTime, setCustomPulangTime] = useState<string>('14:30');
  const [useScheduleTime, setUseScheduleTime] = useState<boolean>(true);
  const [notesText, setNotesText] = useState<string>('Dilengkapi oleh Admin (Disahkan Madrasah)');

  // UI tabs & states
  const [previewTab, setPreviewTab] = useState<'missing' | 'protected'>('missing');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  // Check duplicate logs currently in system
  const duplicateStats = useMemo(() => {
    return findAndDeduplicateLogs(attendanceLogs);
  }, [attendanceLogs]);

  // Clean duplicates action
  const handleCleanDuplicates = async () => {
    if (!onCleanDuplicates || isCleaningDuplicates) return;
    setIsCleaningDuplicates(true);
    try {
      const removedCount = await onCleanDuplicates();
      if (removedCount > 0) {
        showToast('Pembersihan Selesai', `${removedCount} data ganda berhasil dihapus.`);
      }
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  // Trigger data refresh if available
  const handleTriggerRefresh = async () => {
    if (!onRefreshLogs || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshLogs();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle preset change
  const handlePresetChange = (newPreset: PeriodPreset) => {
    setPreset(newPreset);
    const now = new Date();

    if (newPreset === 'bulan_ini') {
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      setStartDate(start);
      setEndDate(todayStr);
    } else if (newPreset === '7_hari') {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      setStartDate(getLocalDateString(past));
      setEndDate(todayStr);
    } else if (newPreset === '30_hari') {
      const past = new Date(now);
      past.setDate(past.getDate() - 29);
      setStartDate(getLocalDateString(past));
      setEndDate(todayStr);
    } else if (newPreset === 'bulan_lalu') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(getLocalDateString(prevMonth));
      setEndDate(getLocalDateString(lastDayPrevMonth));
    }
  };

  // Helper to compute dates between startDate and endDate
  const dateRangeList = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return [];
    const dates: string[] = [];
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const current = new Date(sy, sm - 1, sd, 12, 0, 0);
    const end = new Date(ey, em - 1, ed, 12, 0, 0);

    while (current <= end) {
      dates.push(getLocalDateString(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [startDate, endDate]);

  // Target teachers list
  const targetTeachers = useMemo(() => {
    if (selectedTeacherId === 'SEMUA') return teachers;
    return teachers.filter((t) => String(t.id) === selectedTeacherId);
  }, [selectedTeacherId, teachers]);

  // Analyze missing attendance items with strict protection for existing real attendance
  const analysisResult = useMemo(() => {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const missingItems: MissingAttendanceItem[] = [];
    const protectedRealItems: ProtectedRealAttendanceItem[] = [];
    const holidayDates: { date: string; reason: string }[] = [];
    let totalWorkDays = 0;
    let totalRealAttendanceProtected = 0;

    for (const dateStr of dateRangeList) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d, 12, 0, 0);
      const dayName = dayNames[dateObj.getDay()];

      // Schedule config for that day
      const schedDay = schedule.find((s) => s.hari === dayName) || {
        hari: dayName,
        statusHari: dateObj.getDay() === 0 ? 'Libur' : 'Kerja',
        jamMasuk: '07:00',
        jamPulang: dateObj.getDay() === 5 ? '11:30' : '14:30',
        bukaAbsenMasukMnt: 60,
        toleransiTerlambatMnt: 15,
        toleransiPulangMnt: 15,
        batasAbsenPulangMnt: 120,
      };

      // Check Holiday
      const holiday = getHolidayForDate(dateStr, holidays);
      const isWorkScheduleHoliday = schedDay.statusHari === 'Libur';

      if (holiday || isWorkScheduleHoliday) {
        holidayDates.push({
          date: dateStr,
          reason: holiday ? holiday.description : `Libur Mingguan (${dayName})`,
        });
        continue; // Skip holiday!
      }

      totalWorkDays++;

      // Check each target teacher
      for (const teacher of targetTeachers) {
        // Find ALL logs for this teacher on this date with resilient matching
        const teacherLogs = attendanceLogs.filter((l) => isLogForTeacherAndDate(l, teacher, dateStr));

        // Detect existing types and real attendance
        const izinSakitLog = teacherLogs.find((l) => {
          const t = getLogAttendanceType(l);
          return t === 'IZIN' || t === 'SAKIT';
        });

        const masukLogs = teacherLogs.filter((l) => getLogAttendanceType(l) === 'MASUK');
        const pulangLogs = teacherLogs.filter((l) => getLogAttendanceType(l) === 'PULANG');

        const realMasukLog = masukLogs.find(isRealAttendance);
        const realPulangLog = pulangLogs.find(isRealAttendance);

        const hasMasuk = masukLogs.length > 0;
        const hasPulang = pulangLogs.length > 0;
        const hasRealMasuk = Boolean(realMasukLog);
        const hasRealPulang = Boolean(realPulangLog);

        const realLogsOnThisDay = teacherLogs.filter(isRealAttendance);
        totalRealAttendanceProtected += realLogsOnThisDay.length;

        // If already has IZIN or SAKIT, strictly do NOT touch and skip completely
        if (izinSakitLog) {
          protectedRealItems.push({
            teacher,
            date: dateStr,
            dayName,
            logs: [izinSakitLog],
            types: [getLogAttendanceType(izinSakitLog) as any],
          });
          continue;
        }

        const neededTypes: ('MASUK' | 'PULANG')[] = [];

        // ONLY generate MASUK if MASUK is completely absent in database
        if ((fillType === 'BOTH' || fillType === 'MASUK') && !hasMasuk) {
          neededTypes.push('MASUK');
        }

        // ONLY generate PULANG if PULANG is completely absent in database
        if ((fillType === 'BOTH' || fillType === 'PULANG') && !hasPulang) {
          neededTypes.push('PULANG');
        }

        if (neededTypes.length > 0) {
          missingItems.push({
            teacher,
            date: dateStr,
            dayName,
            scheduleDay: schedDay,
            missingTypes: neededTypes,
            existingRealLogs: realLogsOnThisDay,
            hasRealMasuk,
            hasRealPulang,
            realMasukLog,
            realPulangLog,
          });
        } else if (realLogsOnThisDay.length > 0) {
          // Both MASUK and PULANG are already covered by real attendance
          protectedRealItems.push({
            teacher,
            date: dateStr,
            dayName,
            logs: realLogsOnThisDay,
            types: realLogsOnThisDay.map((l) => getLogAttendanceType(l) as any),
          });
        }
      }
    }

    const totalLogsToGenerate = missingItems.reduce(
      (acc, item) => acc + item.missingTypes.length,
      0
    );

    return {
      totalDates: dateRangeList.length,
      totalWorkDays,
      holidayDates,
      missingItems,
      protectedRealItems,
      totalRealAttendanceProtected,
      totalLogsToGenerate,
    };
  }, [dateRangeList, targetTeachers, schedule, holidays, attendanceLogs, fillType]);

  if (!isOpen) return null;

  // Execute fill
  const handleExecuteFill = async () => {
    if (analysisResult.totalLogsToGenerate === 0) {
      showToast(
        'Sudah Lengkap',
        'Tidak ditemukan presensi kosong pada hari kerja di rentang tanggal ini. Semua bagian terisi telah terlindungi.'
      );
      return;
    }

    setIsProcessing(true);
    try {
      const generatedLogs: AttendanceLog[] = [];

      for (const item of analysisResult.missingItems) {
        for (const type of item.missingTypes) {
          // Deterministic unique ID guarantees zero duplicate rows even if executed repeatedly
          const id = getAdminFillLogId(item.teacher, item.date, type);

          let timeStr = '';
          let statusText: AttendanceLog['status'] = 'Tepat Waktu';

          if (type === 'MASUK') {
            statusText = 'Datang Tepat Waktu';
            if (useScheduleTime) {
              timeStr = `${item.scheduleDay.jamMasuk || '07:00'}:00 WIB`;
            } else {
              timeStr = `${customMasukTime || '06:50'}:00 WIB`;
            }
          } else {
            statusText = 'Pulang Tepat Waktu';
            if (useScheduleTime) {
              timeStr = `${item.scheduleDay.jamPulang || '14:30'}:00 WIB`;
            } else {
              timeStr = `${customPulangTime || '14:30'}:00 WIB`;
            }
          }

          const rawTimeOnly = timeStr.replace(/[^0-9:]/g, '').trim();
          const cleanTime = rawTimeOnly.length >= 5 ? (rawTimeOnly.length === 5 ? `${rawTimeOnly}:00` : rawTimeOnly.substring(0, 8)) : '07:00:00';
          const createdAtDate = `${item.date}T${cleanTime}+07:00`;

          const newLog: AttendanceLog = {
            id,
            teacherName: item.teacher.name,
            nip: item.teacher.nip || '',
            role: item.teacher.role || 'Guru',
            presensiType: type,
            status: statusText,
            time: timeStr,
            date: item.date,
            notes: notesText.trim() || 'Dilengkapi oleh Admin',
            created_at: createdAtDate,
          };

          generatedLogs.push(newLog);
        }
      }

      await onBulkAddLogs(generatedLogs);
      showToast(
        'Presensi Berhasil Dilengkapi!',
        `Sebanyak ${generatedLogs.length} data kehadiran berhasil diisi dan disinkronkan tanpa duplikasi. Bagian absen real (${analysisResult.totalRealAttendanceProtected} data) tetap aman terlindungi.`
      );
      setShowConfirm(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to auto-fill attendances:', err);
      showToast('Gagal Melengkapi Presensi', err?.message || 'Terjadi kesalahan sistem.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Lengkapi Presensi Kosong
                </h3>
                <span className="px-2 py-0.5 bg-amber-400 text-emerald-950 text-[10px] font-black uppercase rounded-md tracking-wider">
                  Admin Tool
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5 leading-relaxed">
                Isi otomatis presensi guru yang terlewat pada hari kerja non-libur dengan aman & cepat.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onRefreshLogs && (
              <button
                type="button"
                onClick={handleTriggerRefresh}
                disabled={isRefreshing || isProcessing}
                title="Sinkronkan data database terbaru"
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition flex items-center gap-1 text-[11px] font-semibold"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-300' : ''}`} />
                <span className="hidden sm:inline">Sinkronkan</span>
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-grow">
          {/* NOTICE SAFEGUARD */}
          <div className="bg-emerald-50/80 border border-emerald-300/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-950 leading-relaxed">
              <span className="font-bold text-emerald-900 block sm:inline">
                Proteksi Absen Real Otomatis Aktif:
              </span>{' '}
              Data database yang sudah berisi presensi real guru (baik <strong>Masuk</strong>, <strong>Pulang</strong>, ataupun <strong>Izin/Sakit</strong>) <strong>secara otomatis dilewati</strong> dan <strong>tidak akan pernah ditimpa atau digandakan</strong>. Sistem menggunakan ID deterministik unik sehingga pengulangan pengisian tidak akan menimbulkan duplikasi data.
            </div>
          </div>

          {/* DUPLICATE DETECTION BANNER IF ANY DUPLICATES EXIST IN CURRENT LOGS */}
          {duplicateStats.duplicateCount > 0 && (
            <div className="bg-amber-50 border border-amber-300/90 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-950">
                  <span className="font-bold text-amber-900 block sm:inline">
                    Terdeteksi {duplicateStats.duplicateCount} data presensi ganda di sistem:
                  </span>{' '}
                  Kemungkinan akibat pengisian berulang dari versi sebelumnya. Klik tombol di samping untuk langsung membersihkan data ganda.
                </div>
              </div>
              {onCleanDuplicates && (
                <button
                  type="button"
                  onClick={handleCleanDuplicates}
                  disabled={isCleaningDuplicates}
                  className="w-full sm:w-auto shrink-0 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isCleaningDuplicates ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Bersihkan Data Ganda ({duplicateStats.duplicateCount})
                </button>
              )}
            </div>
          )}

          {/* STEP 1: PILIH PERIODE */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              1. Pilih Rentang Tanggal
            </label>

            {/* PRESET CHIPS */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { id: 'bulan_ini', label: 'Bulan Ini (Hingga Hari Ini)' },
                { id: '7_hari', label: '7 Hari Terakhir' },
                { id: '30_hari', label: '30 Hari Terakhir' },
                { id: 'bulan_lalu', label: 'Bulan Lalu Penuh' },
                { id: 'kustom', label: 'Pilih Manual' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetChange(p.id as PeriodPreset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    preset === p.id
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* DATE INPUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1">
                  Mulai Dari Tanggal:
                </span>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || todayStr}
                  onChange={(e) => {
                    setPreset('kustom');
                    setStartDate(e.target.value);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1">
                  Sampai Dengan Tanggal:
                </span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={todayStr}
                  onChange={(e) => {
                    setPreset('kustom');
                    setEndDate(e.target.value);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: PILIH SASARAN GURU & JENIS PRESENSI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-700" />
                2. Sasaran Guru
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="SEMUA">Semua Guru & Pegawai ({teachers.length} Orang)</option>
                {teachers.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name} ({t.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                3. Jenis Kehadiran
              </label>
              <select
                value={fillType}
                onChange={(e) => setFillType(e.target.value as PresensiFillType)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="BOTH">Masuk & Pulang (Lengkap)</option>
                <option value="MASUK">Hanya Presensi Masuk</option>
                <option value="PULANG">Hanya Presensi Pulang</option>
              </select>
            </div>
          </div>

          {/* STEP 3: PENGATURAN WAKTU & CATATAN */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Pengaturan Jam & Keterangan
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useScheduleTime}
                  onChange={(e) => setUseScheduleTime(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-700">
                  Gunakan Jam Sesuai Jadwal Hari Itu
                </span>
              </label>
            </div>

            {!useScheduleTime && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Jam Masuk Ditulis:
                  </span>
                  <input
                    type="time"
                    value={customMasukTime}
                    onChange={(e) => setCustomMasukTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Jam Pulang Ditulis:
                  </span>
                  <input
                    type="time"
                    value={customPulangTime}
                    onChange={(e) => setCustomPulangTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            )}

            <div>
              <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                Catatan / Jurnal Presensi:
              </span>
              <input
                type="text"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Misal: Disahkan oleh Admin (Lupa Presensi)"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* STEP 4: REALTIME SCAN & PREVIEW STATS */}
          <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-50/50 to-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                Hasil Pemindaian Kehadiran
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                {analysisResult.totalWorkDays} Hari Kerja Aktif
              </span>
            </div>

            {/* METRICS ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                <div className="text-[10px] font-bold text-slate-500">Rentang Waktu</div>
                <div className="text-sm font-black text-slate-800">
                  {analysisResult.totalDates} Hari
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                <div className="text-[10px] font-bold text-slate-500">Libur Dilewati</div>
                <div className="text-sm font-black text-amber-600">
                  {analysisResult.holidayDates.length} Hari
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-center shadow-2xs bg-emerald-50/40">
                <div className="text-[10px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Absen Real Aman
                </div>
                <div className="text-sm font-black text-emerald-700">
                  {analysisResult.totalRealAttendanceProtected} Data
                </div>
              </div>

              <div className="bg-emerald-700 text-white p-2.5 rounded-xl border border-emerald-600 text-center shadow-sm">
                <div className="text-[10px] font-bold text-emerald-200">Presensi Kosong</div>
                <div className="text-sm font-black text-amber-300">
                  {analysisResult.totalLogsToGenerate} Slot
                </div>
              </div>
            </div>

            {/* HOLIDAY LIST (COLLAPSIBLE / COMPACT) */}
            {analysisResult.holidayDates.length > 0 && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900">
                <span className="font-bold">Hari Libur Terdeteksi & Dikecualikan ({analysisResult.holidayDates.length}):</span>{' '}
                {analysisResult.holidayDates
                  .map((h) => `${formatDateIndonesian(h.date)} (${h.reason})`)
                  .join(' • ')}
              </div>
            )}

            {/* TAB SWITCHER: SLOT KOSONG VS ABSEN REAL DILEWATI */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setPreviewTab('missing')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  previewTab === 'missing'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>Slot Kosong Perlu Diisi</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  previewTab === 'missing' ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {analysisResult.missingItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('protected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  previewTab === 'protected'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Absen Real Terlewati Aman</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  previewTab === 'protected' ? 'bg-emerald-300 text-emerald-950' : 'bg-slate-200 text-slate-700'
                }`}>
                  {analysisResult.protectedRealItems.length}
                </span>
              </button>
            </div>

            {/* TAB CONTENT 1: PREVIEW OF MISSING ITEMS */}
            {previewTab === 'missing' && (
              analysisResult.totalLogsToGenerate === 0 ? (
                <div className="p-4 bg-emerald-100/60 border border-emerald-300 rounded-xl text-center text-emerald-900 font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>
                    Semua presensi sudah lengkap! Tidak ada slot kosong pada hari kerja di rentang ini.
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>Daftar Guru & Hari Kerja yang Memiliki Slot Kosong:</span>
                    <span className="text-slate-500 font-normal">
                      Menampilkan {analysisResult.missingItems.length} data
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
                    {analysisResult.missingItems.slice(0, 40).map((item, idx) => (
                      <div
                        key={`${item.teacher.id}-${item.date}`}
                        className="px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition text-[11px]"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 truncate block">
                            {idx + 1}. {item.teacher.name}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {item.dayName}, {formatDateIndonesian(item.date)}
                          </span>

                          {/* BADGE SHOWING PROTECTED REAL ATTENDANCE ON THIS DAY */}
                          {(item.hasRealMasuk || item.hasRealPulang) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.hasRealMasuk && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                  Masuk Real ({item.realMasukLog?.time}) Dilewati
                                </span>
                              )}
                              {item.hasRealPulang && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[9px] font-bold">
                                  <ShieldCheck className="w-2.5 h-2.5 text-blue-600" />
                                  Pulang Real ({item.realPulangLog?.time}) Dilewati
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ACTION TAGS TO BE FILLED */}
                        <div className="flex items-center gap-1 shrink-0 self-start sm:self-auto">
                          {item.missingTypes.map((type) => (
                            <span
                              key={type}
                              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                type === 'MASUK'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-teal-100 text-teal-900 border border-teal-300'
                              }`}
                            >
                              + Isi {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {analysisResult.missingItems.length > 40 && (
                      <div className="px-3 py-2 text-center text-[10px] text-slate-500 italic bg-slate-50">
                        ... dan {analysisResult.missingItems.length - 40} data hari kerja lainnya siap dilengkapi.
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* TAB CONTENT 2: PREVIEW OF PROTECTED REAL ATTENDANCE */}
            {previewTab === 'protected' && (
              analysisResult.protectedRealItems.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-600 text-[11px]">
                  Belum ada presensi real yang terdeteksi lengkap pada rentang tanggal ini.
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="text-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Data Absen Real yang Ditemukan di Database (Dilewati Otomatis):
                    </span>
                    <span className="text-slate-500 font-normal">
                      Total {analysisResult.protectedRealItems.length} guru/hari
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-emerald-200 rounded-xl bg-emerald-50/20 divide-y divide-emerald-100">
                    {analysisResult.protectedRealItems.slice(0, 30).map((item, idx) => (
                      <div
                        key={`${item.teacher.id}-${item.date}-prot`}
                        className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-emerald-50/50 transition text-[11px]"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 truncate block">
                            {idx + 1}. {item.teacher.name}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {item.dayName}, {formatDateIndonesian(item.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.logs.map((log) => (
                            <span
                              key={log.id}
                              className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300"
                            >
                              ✓ {log.presensiType} ({log.time})
                            </span>
                          ))}
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-700">
                            Aman
                          </span>
                        </div>
                      </div>
                    ))}
                    {analysisResult.protectedRealItems.length > 30 && (
                      <div className="px-3 py-2 text-center text-[10px] text-slate-500 italic bg-emerald-50/30">
                        ... dan {analysisResult.protectedRealItems.length - 30} data absen real lainnya aman terlindungi.
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-emerald-700" />
            <span>
              Total{' '}
              <strong className="text-emerald-800">{analysisResult.totalLogsToGenerate}</strong>{' '}
              presensi kosong akan ditambahkan ke Database
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={analysisResult.totalLogsToGenerate === 0 || isProcessing}
              onClick={() => {
                if (showConfirm) {
                  handleExecuteFill();
                } else {
                  setShowConfirm(true);
                }
              }}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs transition shadow-md flex items-center justify-center gap-2 active:scale-95 ${
                analysisResult.totalLogsToGenerate === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : showConfirm
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-400 animate-pulse'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : showConfirm ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Konfirmasi: Isi {analysisResult.totalLogsToGenerate} Presensi Sekarang</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    Isi & Lengkapi ({analysisResult.totalLogsToGenerate} Presensi)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
