import React, { useState, useMemo } from 'react';
import { Teacher, WorkScheduleDay, AttendanceLog, Holiday } from '../types';
import { getTodayString, getLocalDateString, getHolidayForDate, formatDateIndonesian } from '../utils/dateUtils';
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
  Loader2
} from 'lucide-react';

interface AutoFillAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  schedule: WorkScheduleDay[];
  holidays: Holiday[];
  attendanceLogs: AttendanceLog[];
  onBulkAddLogs: (newLogs: AttendanceLog[]) => Promise<void>;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

type PeriodPreset = 'bulan_ini' | '7_hari' | '30_hari' | 'bulan_lalu' | 'kustom';
type PresensiFillType = 'BOTH' | 'MASUK' | 'PULANG';

interface MissingAttendanceItem {
  teacher: Teacher;
  date: string;
  dayName: string;
  scheduleDay: WorkScheduleDay;
  missingTypes: ('MASUK' | 'PULANG')[];
}

export const AutoFillAttendanceModal: React.FC<AutoFillAttendanceModalProps> = ({
  isOpen,
  onClose,
  teachers,
  schedule,
  holidays,
  attendanceLogs,
  onBulkAddLogs,
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

  // Execution state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

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

  // Analyze missing attendance items
  const analysisResult = useMemo(() => {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const missingItems: MissingAttendanceItem[] = [];
    const holidayDates: { date: string; reason: string }[] = [];
    let totalWorkDays = 0;

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
        const teacherLogs = attendanceLogs.filter(
          (l) => l.teacherName === teacher.name && l.date === dateStr
        );

        // If already has IZIN or SAKIT, do not touch
        const hasIzinSakit = teacherLogs.some(
          (l) => l.presensiType === 'IZIN' || l.presensiType === 'SAKIT'
        );
        if (hasIzinSakit) continue;

        const hasMasuk = teacherLogs.some((l) => l.presensiType === 'MASUK');
        const hasPulang = teacherLogs.some((l) => l.presensiType === 'PULANG');

        const neededTypes: ('MASUK' | 'PULANG')[] = [];
        if ((fillType === 'BOTH' || fillType === 'MASUK') && !hasMasuk) {
          neededTypes.push('MASUK');
        }
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
      totalLogsToGenerate,
    };
  }, [dateRangeList, targetTeachers, schedule, holidays, attendanceLogs, fillType]);

  if (!isOpen) return null;

  // Execute fill
  const handleExecuteFill = async () => {
    if (analysisResult.totalLogsToGenerate === 0) {
      showToast(
        'Sudah Lengkap',
        'Tidak ditemukan presensi kosong pada hari kerja di rentang tanggal ini.'
      );
      return;
    }

    setIsProcessing(true);
    try {
      const generatedLogs: AttendanceLog[] = [];
      const timestampBase = Date.now();
      let indexCounter = 0;

      for (const item of analysisResult.missingItems) {
        for (const type of item.missingTypes) {
          indexCounter++;
          const id = `log-adminfill-${timestampBase}-${indexCounter}`;

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
        `Sebanyak ${generatedLogs.length} data kehadiran kosong berhasil diisi dan disinkronkan ke Database.`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 sm:p-6 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
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
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-grow">
          {/* NOTICE SAFEGUARD */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-900 leading-relaxed">
              <span className="font-bold">Perlindungan Data Otomatis:</span> Hari libur resmi/madrasah
              dan hari libur mingguan (Minggu) <strong>dilewati secara otomatis</strong>. Catatan Izin/Sakit
              dan presensi yang sudah tercatat <strong>tidak akan ditimpa atau diganti</strong>.
            </div>
          </div>

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
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-500">Rentang Tanggal</div>
                <div className="text-sm font-black text-slate-800">
                  {analysisResult.totalDates} Hari
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-500">Libur Dilewati</div>
                <div className="text-sm font-black text-amber-600">
                  {analysisResult.holidayDates.length} Hari
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-500">Guru Sasaran</div>
                <div className="text-sm font-black text-slate-800">
                  {targetTeachers.length} Orang
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

            {/* PREVIEW OF MISSING ITEMS */}
            {analysisResult.totalLogsToGenerate === 0 ? (
              <div className="p-4 bg-emerald-100/60 border border-emerald-300 rounded-xl text-center text-emerald-900 font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>
                  Luar Biasa! Semua guru sudah memiliki catatan presensi lengkap pada hari kerja di
                  rentang waktu ini.
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>Pratinjau Guru yang Akan Dilengkapi:</span>
                  <span className="text-slate-500 font-normal">
                    Menampilkan {analysisResult.missingItems.length} hari kerja belum lengkap
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
                  {analysisResult.missingItems.slice(0, 30).map((item, idx) => (
                    <div
                      key={`${item.teacher.id}-${item.date}`}
                      className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-50 transition text-[11px]"
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
                        {item.missingTypes.map((type) => (
                          <span
                            key={type}
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              type === 'MASUK'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            + {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {analysisResult.missingItems.length > 30 && (
                    <div className="px-3 py-2 text-center text-[10px] text-slate-500 italic bg-slate-50">
                      ... dan {analysisResult.missingItems.length - 30} data hari lainnya siap dilengkapi.
                    </div>
                  )}
                </div>
              </div>
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
              presensi akan ditambahkan ke Database
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
