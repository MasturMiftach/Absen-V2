import React, { useState } from 'react';
import { ActiveUser, AttendanceLog, WorkScheduleDay, LocationConfig, Holiday } from '../types';
import { getTodayString, getHolidayForDate } from '../utils/dateUtils';
import { LogIn, LogOut, FileEdit, FilePlus, ClipboardCheck, CheckCircle2, MapPin, AlertCircle, ShieldCheck, Calendar, Sparkles } from 'lucide-react';

interface PresensiTabProps {
  currentUser: ActiveUser;
  attendanceLogs: AttendanceLog[];
  schedule: WorkScheduleDay[];
  holidays?: Holiday[];
  locationConfig?: LocationConfig;
  userDistanceMeters?: number | null;
  isLocating?: boolean;
  onQuickPresensi: (presensiType: 'MASUK' | 'PULANG', notes: string) => void;
  onOpenIzinModal: () => void;
  onRefreshLocation?: () => void;
}

export const PresensiTab: React.FC<PresensiTabProps> = ({
  currentUser,
  attendanceLogs,
  schedule,
  holidays = [],
  locationConfig,
  userDistanceMeters,
  isLocating,
  onQuickPresensi,
  onOpenIzinModal,
  onRefreshLocation
}) => {
  const [journalNotes, setJournalNotes] = useState<string>('');
  const [now, setNow] = useState<Date>(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const today = getTodayString();
  const myTodayLogs = attendanceLogs.filter(l => l.date === today && l.teacherName === currentUser.name);

  const masukLog = myTodayLogs.find(l => l.presensiType === 'MASUK');
  const pulangLog = myTodayLogs.find(l => l.presensiType === 'PULANG');
  const izinLog = myTodayLogs.find(l => l.presensiType === 'IZIN' || l.presensiType === 'SAKIT');

  const todayLogsAll = attendanceLogs.filter(l => l.date === today);

  const daysName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = daysName[now.getDay()];
  const todaySch = schedule.find((s) => s.hari === dayName) || schedule[0];

  const formatAddMinutes = (timeStr: string, addMins: number) => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(now);
    d.setHours(h, m + addMins, 0, 0);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const todayHoliday = getHolidayForDate(today, holidays);
  const isHoliday = todaySch.statusHari === 'Libur' || Boolean(todayHoliday);
  const openMasukStr = todaySch ? formatAddMinutes(todaySch.jamMasuk, -todaySch.bukaAbsenMasukMnt) : '06:00';
  const limitMasukTepatStr = todaySch ? formatAddMinutes(todaySch.jamMasuk, todaySch.toleransiTerlambatMnt) : '07:15';
  const limitPulangTepatStr = todaySch ? formatAddMinutes(todaySch.jamPulang, -todaySch.toleransiPulangMnt) : '14:15';
  const closePulangStr = todaySch ? formatAddMinutes(todaySch.jamPulang, todaySch.batasAbsenPulangMnt) : '16:30';

  // Helper to create Date for schedule comparison on current date 'now'
  const createScheduleTime = (timeStr: string, addMinutes: number = 0): Date => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(now);
    d.setHours(h, m + addMinutes, 0, 0);
    return d;
  };

  const isMasukTimeWindow = !isHoliday && todaySch && (() => {
    const openMasuk = createScheduleTime(todaySch.jamMasuk, -todaySch.bukaAbsenMasukMnt);
    const limitMasukTepat = createScheduleTime(todaySch.jamMasuk, todaySch.toleransiTerlambatMnt);
    return now >= openMasuk && now <= limitMasukTepat;
  })();

  const isPulangTimeWindow = !isHoliday && todaySch && (() => {
    const limitPulangTepat = createScheduleTime(todaySch.jamPulang, -todaySch.toleransiPulangMnt);
    const closePulang = createScheduleTime(todaySch.jamPulang, todaySch.batasAbsenPulangMnt);
    return now >= limitPulangTepat && now <= closePulang;
  })();

  const isGeoEnabled = locationConfig?.enabled ?? false;
  const radius = locationConfig?.radiusMeters ?? 100;
  const isWithinRadius = userDistanceMeters !== null && userDistanceMeters !== undefined && userDistanceMeters <= radius;

  // Disabling states for buttons
  const isMasukDisabled = Boolean(masukLog) || Boolean(izinLog) || isHoliday;
  const isPulangDisabled = Boolean(pulangLog) || Boolean(izinLog) || isHoliday;
  const isIzinDisabled = Boolean(masukLog) || Boolean(pulangLog) || Boolean(izinLog);

  const handleMasukClick = () => {
    if (isMasukDisabled) return;
    onQuickPresensi('MASUK', journalNotes);
    setJournalNotes('');
  };

  const handlePulangClick = () => {
    if (isPulangDisabled) return;
    onQuickPresensi('PULANG', journalNotes);
    setJournalNotes('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* GEOLOCATION GPS STATUS BANNER */}
      {isGeoEnabled && (
        <div className={`p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLocating
            ? 'bg-blue-50 border-blue-200 text-blue-900'
            : isWithinRadius
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : userDistanceMeters === null || userDistanceMeters === undefined
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              isWithinRadius
                ? 'bg-emerald-200 text-emerald-800'
                : 'bg-rose-200 text-rose-800'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <span>Validasi Lokasi Presensi (GPS)</span>
                {isWithinRadius ? (
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded-full font-bold">
                    DALAM RADIUS
                  </span>
                ) : userDistanceMeters !== null && userDistanceMeters !== undefined ? (
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] rounded-full font-bold">
                    DI LUAR RADIUS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold">
                    MENDETEKSI GPS
                  </span>
                )}
              </div>
              <p className="text-xs font-medium">
                {isLocating ? (
                  'Mencari koordinat presisi perangkat Anda...'
                ) : isWithinRadius ? (
                  `Posisi Anda berjarak sekitar ${userDistanceMeters}m dari ${locationConfig?.locationName} (Sesuai Radius Max ${radius}m).`
                ) : userDistanceMeters !== null && userDistanceMeters !== undefined ? (
                  `Posisi Anda berjarak ${userDistanceMeters}m (Melampaui radius maksimal ${radius}m dari sekolah).`
                ) : (
                  `Validasi GPS aktif (${radius}m). Tekan Cek Ulang GPS jika lokasi belum terdeteksi.`
                )}
              </p>
            </div>
          </div>

          {onRefreshLocation && (
            <button
              type="button"
              onClick={onRefreshLocation}
              disabled={isLocating}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-amber-400 font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 self-start sm:self-center shrink-0"
            >
              <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'animate-bounce' : ''}`} />
              <span>Cek Ulang GPS</span>
            </button>
          )}
        </div>
      )}
      
      {/* Welcome Teacher Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 rounded-3xl p-6 text-white shadow-xl border border-amber-400/30 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* TEACHER PROFILE PHOTO / AVATAR */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-emerald-800 text-amber-300 font-extrabold text-2xl rounded-2xl border-2 border-amber-400 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
            {currentUser.photoUrl ? (
              <img
                src={currentUser.photoUrl}
                alt={`Foto Profil ${currentUser.name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{currentUser.name ? currentUser.name.charAt(0) : 'G'}</span>
            )}
          </div>
          <div>
            <div className="text-xs text-emerald-200 font-medium">Assalamu'alaikum Wr. Wb.</div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{currentUser.name}</h2>
            <p className="text-xs text-emerald-100 font-mono mt-0.5">ID Pegawai: {currentUser.nip}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-amber-400 text-slate-900 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Today Clock Status Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 w-full sm:w-auto text-center sm:text-right space-y-1">
          <div className="text-[11px] text-emerald-200 font-semibold">Status Presensi Anda Hari Ini ({dayName}):</div>
          {izinLog ? (
            <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/40 text-xs font-bold rounded-full">
              Status: {izinLog.presensiType}
            </div>
          ) : masukLog && pulangLog ? (
            <div className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-bold rounded-full">
              Sudah Absen Masuk & Pulang
            </div>
          ) : masukLog ? (
            <div className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-bold rounded-full">
              Sudah Absen Masuk ({masukLog.time})
            </div>
          ) : (
            <div className="inline-block px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold rounded-full">
              Belum Presensi Masuk
            </div>
          )}
        </div>
      </div>

      {/* HOLIDAY SPECIAL BANNER */}
      {isHoliday && (
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start gap-3.5 text-slate-800">
          <div className="p-3 bg-amber-400 text-slate-900 rounded-2xl shrink-0 shadow-md">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                {todayHoliday ? `HARI LIBUR ${todayHoliday.type}` : 'HARI LIBUR RUTIN'}
              </span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              {todayHoliday ? todayHoliday.description : `Hari Ini (${dayName}) Adalah Hari Libur`}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Selamat menikmati hari libur! Layanan presensi rutin ditutup dan tombol absen otomatis dikunci.
            </p>
          </div>
        </div>
      )}

      {/* TODAY SCHEDULE INFO WIDGET */}
      <div className="bg-emerald-900/10 border border-emerald-800/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2 font-bold text-emerald-950">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          Jadwal Hari Ini ({dayName}): <span className={isHoliday ? "text-red-600 uppercase" : "text-emerald-800 font-mono"}>{isHoliday ? "HARI LIBUR" : `${todaySch.jamMasuk} - ${todaySch.jamPulang} WIB`}</span>
        </div>
        {!isHoliday && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
            <span><strong className="text-emerald-800">Waktu Absen Masuk:</strong> {openMasukStr} - {limitMasukTepatStr} WIB (Maks Toleransi)</span>
            <span><strong className="text-emerald-800">Waktu Absen Pulang:</strong> {limitPulangTepatStr} - {closePulangStr} WIB (Batas Toleransi Awal)</span>
          </div>
        )}
      </div>

      {/* 2 BIG BUTTONS FOR TEACHERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        
        {/* BUTTON 1: PRESENSI MASUK */}
        <button
          onClick={handleMasukClick}
          disabled={isMasukDisabled}
          className={`group relative rounded-3xl p-6 sm:p-8 shadow-xl transition-all duration-300 flex flex-col items-center text-center border-2 ${
            masukLog
              ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 cursor-not-allowed opacity-95 shadow-none'
              : izinLog
              ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed opacity-80 shadow-none'
              : isHoliday
              ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed opacity-75 shadow-none'
              : 'bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white border-emerald-400/30 transform active:scale-95 hover:shadow-2xl'
          }`}
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 transition-transform ${
            masukLog
              ? 'bg-emerald-200/80 text-emerald-700'
              : isMasukDisabled
              ? 'bg-slate-200 text-slate-400'
              : 'bg-white/15 group-hover:bg-white/25 text-amber-300 shadow-inner group-hover:scale-110'
          }`}>
            {masukLog ? <CheckCircle2 className="w-10 h-10 text-emerald-700" /> : <LogIn className={`w-10 h-10 ${isMasukDisabled ? 'text-slate-400' : 'text-amber-300'}`} />}
          </div>

          <span className={`text-xl sm:text-2xl font-black tracking-wide ${masukLog ? 'text-emerald-900' : isMasukDisabled ? 'text-slate-600' : 'text-white'}`}>
            {masukLog ? 'PRESENSI MASUK TERCATAT' : 'PRESENSI MASUK'}
          </span>

          <span className={`text-xs mt-1 font-medium ${masukLog ? 'text-emerald-700 font-semibold' : isMasukDisabled ? 'text-slate-500' : 'text-emerald-200'}`}>
            {masukLog
              ? 'Data presensi telah disimpan & dikunci.'
              : izinLog
              ? 'Telah tercatat Izin / Sakit hari ini.'
              : isHoliday
              ? 'Hari Libur - Presensi Ditutup'
              : `Buka: ${openMasukStr} - ${limitMasukTepatStr} WIB (Batas Toleransi: ${limitMasukTepatStr})`}
          </span>

          {!masukLog && !isMasukDisabled && isMasukTimeWindow && (
            <div className="mt-3 px-3.5 py-1.5 bg-amber-400 text-slate-900 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <AlertCircle className="w-4 h-4 text-slate-900" />
              <span>Anda belum presensi</span>
            </div>
          )}
          
          {masukLog && (
            <div className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>Masuk: {masukLog.time} ({masukLog.status})</span>
            </div>
          )}
        </button>

        {/* BUTTON 2: PRESENSI PULANG */}
        <button
          onClick={handlePulangClick}
          disabled={isPulangDisabled}
          className={`group relative rounded-3xl p-6 sm:p-8 shadow-xl transition-all duration-300 flex flex-col items-center text-center border-2 ${
            pulangLog
              ? 'bg-amber-50/80 border-amber-500 text-amber-950 cursor-not-allowed opacity-95 shadow-none'
              : izinLog || isHoliday
              ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed opacity-80 shadow-none'
              : 'bg-gradient-to-br from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white border-amber-300/30 transform active:scale-95 hover:shadow-2xl'
          }`}
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 transition-transform ${
            pulangLog
              ? 'bg-amber-200/80 text-amber-800'
              : isPulangDisabled
              ? 'bg-slate-200 text-slate-400'
              : 'bg-white/15 group-hover:bg-white/25 text-amber-300 shadow-inner group-hover:scale-110'
          }`}>
            {pulangLog ? <CheckCircle2 className="w-10 h-10 text-amber-700" /> : <LogOut className={`w-10 h-10 ${isPulangDisabled ? 'text-slate-400' : 'text-amber-300'}`} />}
          </div>

          <span className={`text-xl sm:text-2xl font-black tracking-wide ${pulangLog ? 'text-amber-950' : isPulangDisabled ? 'text-slate-600' : 'text-white'}`}>
            {pulangLog ? 'PRESENSI PULANG TERCATAT' : 'PRESENSI PULANG'}
          </span>

          <span className={`text-xs mt-1 font-medium ${pulangLog ? 'text-amber-800 font-semibold' : isPulangDisabled ? 'text-slate-500' : 'text-amber-100'}`}>
            {pulangLog
              ? 'Data presensi pulang telah disimpan & dikunci.'
              : izinLog
              ? 'Telah tercatat Izin / Sakit hari ini.'
              : isHoliday
              ? 'Hari Libur - Presensi Ditutup'
              : !masukLog
              ? 'Lupa presensi masuk? Tetap dapat presensi pulang.'
              : `Buka: ${limitPulangTepatStr} - ${closePulangStr} WIB (Toleransi Pulang Awal: ${limitPulangTepatStr} WIB)`}
          </span>

          {!pulangLog && !isPulangDisabled && isPulangTimeWindow && (
            <div className="mt-3 px-3.5 py-1.5 bg-amber-400 text-slate-900 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <AlertCircle className="w-4 h-4 text-slate-900" />
              <span>Anda belum presensi</span>
            </div>
          )}
          
          {pulangLog && (
            <div className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-amber-200" />
              <span>Pulang: {pulangLog.time} ({pulangLog.status})</span>
            </div>
          )}
        </button>

      </div>

      {/* OPTIONAL JOURNAL NOTES & PERMIT SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileEdit className="w-4 h-4 text-emerald-600" /> Catatan Ringkasan Jurnal / Keterangan (Opsional)
          </h3>
          <button
            type="button"
            onClick={onOpenIzinModal}
            disabled={isIzinDisabled}
            className={`text-xs font-bold flex items-center gap-1 px-3 py-1 rounded-lg border transition ${
              isIzinDisabled
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>{isIzinDisabled ? 'Pengajuan Dikunci (Sudah Absen)' : 'Ajukan Izin / Sakit'}</span>
          </button>
        </div>
        
        <div>
          <input
            type="text"
            value={journalNotes}
            onChange={(e) => setJournalNotes(e.target.value)}
            placeholder="Contoh: Mengajar Kelas 4 Mapel Akidah Akhlak (Opsional)..."
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl p-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Catatan ini akan otomatis terikut saat Anda menekan tombol Presensi Masuk / Pulang.
          </p>
        </div>
      </div>

      {/* Today Attendance Feed */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-600" /> Daftar Kehadiran Hari Ini
          </h3>
          <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
            {todayLogsAll.length} Presensi
          </span>
        </div>

        {todayLogsAll.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Belum ada presensi hari ini.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
            {todayLogsAll.map((log) => {
              const isGreen = log.status === 'Datang Tepat Waktu' || log.status === 'Pulang Tepat Waktu' || log.status === 'Tepat Waktu';
              const isAmber = log.status === 'Terlambat' || log.status === 'Pulang Sebelum Waktu';
              
              const badgeColor = isGreen
                ? 'bg-emerald-100 text-emerald-800'
                : isAmber
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-blue-100 text-blue-800';

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-emerald-50/30 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-400 font-bold flex items-center justify-center text-xs shadow-sm">
                      {log.teacherName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">{log.teacherName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {log.time} • {log.presensiType} {log.notes && log.notes !== '-' ? `(${log.notes})` : ''}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                    {log.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
