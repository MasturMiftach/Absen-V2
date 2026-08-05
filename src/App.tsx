import { useState, useEffect } from 'react';
import { Teacher, WorkScheduleDay, AttendanceLog, ActiveUser, TabType, ToastMessage, LocationConfig, Holiday } from './types';
import { INITIAL_TEACHERS, DEFAULT_SCHEDULE, INITIAL_LOGS, DEFAULT_LOCATION_CONFIG, INITIAL_HOLIDAYS } from './data/initialData';
import { calculateDistanceMeters, getCurrentPosition } from './utils/geo';
import { getTodayString, getLocalTimeString, getLocalDateString, getHolidayForDate } from './utils/dateUtils';
import {
  subscribeAttendanceLogs,
  subscribeTeachers,
  subscribeSchedule,
  subscribeLocationConfig,
  subscribeHolidays,
  syncLogToSupabase,
  deleteLogFromSupabase,
  syncTeacherToSupabase,
  deleteTeacherFromSupabase,
  syncScheduleToSupabase,
  syncTeachersToSupabase,
  syncLocationConfigToSupabase,
  syncHolidayToSupabase,
  deleteHolidayFromSupabase
} from './lib/supabase';

import { ToastContainer } from './components/Toast';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { PresensiTab } from './components/PresensiTab';
import { DashboardTab } from './components/DashboardTab';
import { JadwalTab } from './components/JadwalTab';
import { GuruTab } from './components/GuruTab';
import { RekapTab } from './components/RekapTab';
import { PanduanTab } from './components/PanduanTab';
import { IzinModal, ConfigModal, AddTeacherModal } from './components/Modals';

export default function App() {
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [schedule, setSchedule] = useState<WorkScheduleDay[]>(DEFAULT_SCHEDULE);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(INITIAL_LOGS);
  const [locationConfig, setLocationConfig] = useState<LocationConfig>(DEFAULT_LOCATION_CONFIG);
  const [holidays, setHolidays] = useState<Holiday[]>(INITIAL_HOLIDAYS);

  const [userDistanceMeters, setUserDistanceMeters] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const [gasUrl, setGasUrl] = useState<string>(() => {
    return localStorage.getItem('mi_soborejo_gas_url') || '';
  });

  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(() => {
    const saved = localStorage.getItem('mi_soborejo_logged_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<TabType>('absensi');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals visibility state
  const [isIzinOpen, setIsIzinOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);

  // REALTIME SUPABASE DATABASE LISTENERS
  useEffect(() => {
    const unsubLogs = subscribeAttendanceLogs((remoteLogs) => {
      if (remoteLogs && remoteLogs.length > 0) {
        setAttendanceLogs(remoteLogs);
      }
    });

    const unsubTeachers = subscribeTeachers((remoteTeachers) => {
      if (remoteTeachers && remoteTeachers.length > 0) {
        setTeachers(remoteTeachers);
      }
    });

    const unsubSchedule = subscribeSchedule((remoteSchedule) => {
      if (remoteSchedule && remoteSchedule.length > 0) {
        setSchedule(remoteSchedule);
      }
    });

    const unsubLocation = subscribeLocationConfig((remoteLocation) => {
      if (remoteLocation) {
        setLocationConfig(remoteLocation);
      }
    });

    const unsubHolidays = subscribeHolidays((remoteHolidays) => {
      if (remoteHolidays && remoteHolidays.length > 0) {
        setHolidays(remoteHolidays);
      }
    });

    return () => {
      unsubLogs();
      unsubTeachers();
      unsubSchedule();
      unsubLocation();
      unsubHolidays();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('mi_soborejo_gas_url', gasUrl);
  }, [gasUrl]);

  // Function to refresh user GPS position
  const handleRefreshLocation = async () => {
    if (!locationConfig.enabled) return;
    setIsLocating(true);
    try {
      const pos = await getCurrentPosition();
      const dist = calculateDistanceMeters(
        pos.coords.latitude,
        pos.coords.longitude,
        locationConfig.latitude,
        locationConfig.longitude
      );
      setUserDistanceMeters(dist);
    } catch (err) {
      console.warn('GPS location fetch error:', err);
      setUserDistanceMeters(null);
    } finally {
      setIsLocating(false);
    }
  };

  // Auto-detect user GPS location on startup & when locationConfig changes
  useEffect(() => {
    if (currentUser && locationConfig.enabled) {
      handleRefreshLocation();
    }
  }, [currentUser, locationConfig.enabled, locationConfig.latitude, locationConfig.longitude]);

  const showToast = (title: string, message: string, isError: boolean = false) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, title, message, isError }]);

    // Play subtle audio chime
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isError ? 300 : 587.33, ctx.currentTime);
        if (!isError) {
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        }
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio not permitted or unattached
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLoginSuccess = (user: ActiveUser) => {
    setCurrentUser(user);
    localStorage.setItem('mi_soborejo_logged_user', JSON.stringify(user));
    showToast('Login Berhasil!', `Selamat datang, ${user.name}`);
    setActiveTab('absensi');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mi_soborejo_logged_user');
    showToast('Logout Success', 'Anda telah keluar dari aplikasi.');
  };

  // Helper to get today's day schedule config
  const getTodaySchedule = (now: Date): WorkScheduleDay => {
    const daysName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = daysName[now.getDay()];
    return schedule.find((s) => s.hari === dayName) || schedule[0];
  };

  const handleSaveLocationConfig = (newConfig: LocationConfig) => {
    setLocationConfig(newConfig);
    syncLocationConfigToSupabase(newConfig);
    showToast(
      'Pengaturan Lokasi Disimpan',
      `Validasi lokasi ${newConfig.enabled ? 'diaktifkan' : 'didisaksikan'} dengan radius ${newConfig.radiusMeters} meter.`
    );
  };

  const handleQuickPresensi = async (presensiType: 'MASUK' | 'PULANG', notes: string) => {
    if (!currentUser) return;

    // GEOLOCATION GPS CHECK IF ENABLED
    if (locationConfig.enabled) {
      try {
        setIsLocating(true);
        const pos = await getCurrentPosition();
        const dist = calculateDistanceMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          locationConfig.latitude,
          locationConfig.longitude
        );
        setUserDistanceMeters(dist);
        setIsLocating(false);

        if (dist > locationConfig.radiusMeters) {
          showToast(
            'Lokasi Di Luar Jangkauan Absensi',
            `Posisi Anda berjarak ${dist} meter dari ${locationConfig.locationName} (Radius maksimal: ${locationConfig.radiusMeters} meter). Silakan mendekat ke lokasi sekolah.`,
            true
          );
          return; // BLOCK ATTENDANCE
        }
      } catch (err) {
        setIsLocating(false);
        const errorMsg = err instanceof Error ? err.message : 'Gagal memverifikasi lokasi GPS Anda.';
        showToast('Validasi GPS Gagal', errorMsg, true);
        return; // BLOCK ATTENDANCE IF GPS ERROR
      }
    }

    const today = getTodayString();

    // 1. Check if user already logged IZIN or SAKIT today
    const izinLog = attendanceLogs.find(
      (l) => l.date === today && l.teacherName === currentUser.name && (l.presensiType === 'IZIN' || l.presensiType === 'SAKIT')
    );
    if (izinLog) {
      showToast(
        'Sudah Ada Catatan Presensi',
        `Anda telah tercatat ${izinLog.presensiType} untuk hari ini. Presensi masuk/pulang tidak dapat dilakukan lagi.`,
        true
      );
      return;
    }

    // 2. Check if user already logged this presensiType today
    const alreadyLogged = attendanceLogs.find(
      (l) => l.date === today && l.teacherName === currentUser.name && l.presensiType === presensiType
    );

    if (alreadyLogged) {
      showToast(
        'Sudah Presensi',
        `Anda sudah melakukan Presensi ${presensiType} hari ini pada pukul ${alreadyLogged.time}. Data presensi telah dikunci.`,
        true
      );
      return;
    }

    const now = new Date();
    const todaySch = getTodaySchedule(now);
    const todayHoliday = getHolidayForDate(today, holidays);

    // 1. Check if today is a Holiday
    if (todaySch.statusHari === 'Libur' || todayHoliday) {
      const msg = todayHoliday
        ? `Hari ini adalah Hari Libur (${todayHoliday.description}). Presensi harian ditutup.`
        : `Hari ini (${todaySch.hari}) adalah hari Libur. Presensi tidak dibuka dan tidak dicatat.`;
      showToast('Di Luar Jadwal Presensi', msg, true);
      return; // DO NOT RECORD IN DATABASE
    }

    // Helper to build date object for time comparisons on today's date
    const createScheduleTime = (timeStr: string, addMinutes: number = 0): Date => {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(now);
      d.setHours(h, m + addMinutes, 0, 0);
      return d;
    };

    const formatHHMM = (d: Date): string => {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    };

    let calculatedStatus: 'Datang Tepat Waktu' | 'Terlambat' | 'Pulang Tepat Waktu' | 'Pulang Sebelum Waktu';

    if (presensiType === 'MASUK') {
      // Waktu Buka Absen Masuk: jamMasuk - bukaAbsenMasukMnt
      const openMasuk = createScheduleTime(todaySch.jamMasuk, -todaySch.bukaAbsenMasukMnt);
      // Jam Masuk resmi (misal: 07:00)
      const exactJamMasuk = createScheduleTime(todaySch.jamMasuk, 0);
      // Batas Akhir Absen Masuk (Batas Toleransi Terlambat): jamMasuk + toleransiTerlambatMnt
      const limitMasukTepat = createScheduleTime(todaySch.jamMasuk, todaySch.toleransiTerlambatMnt);

      // Check bounds
      if (now < openMasuk) {
        showToast(
          'Di Luar Jadwal Presensi',
          `Presensi Masuk belum dibuka. Presensi baru dibuka jam ${formatHHMM(openMasuk)} WIB. Presensi tidak dicatat dalam database.`,
          true
        );
        return; // DO NOT RECORD IN DATABASE
      }

      if (now > limitMasukTepat) {
        showToast(
          'Di Luar Jadwal Presensi',
          `Presensi Masuk sudah ditutup! Batas akhir presensi masuk (toleransi) adalah jam ${formatHHMM(limitMasukTepat)} WIB. Presensi tidak dicatat dalam database.`,
          true
        );
        return; // DO NOT RECORD IN DATABASE
      }

      // Inside valid time window!
      if (now > exactJamMasuk) {
        calculatedStatus = 'Terlambat';
      } else {
        calculatedStatus = 'Datang Tepat Waktu';
      }

    } else { // PULANG
      // Batas Awal Buka Absen Pulang (Toleransi Pulang Lebih Awal): jamPulang - toleransiPulangMnt
      const limitPulangTepat = createScheduleTime(todaySch.jamPulang, -todaySch.toleransiPulangMnt);
      // Batas Akhir Absen Pulang: jamPulang + batasAbsenPulangMnt
      const closePulang = createScheduleTime(todaySch.jamPulang, todaySch.batasAbsenPulangMnt);

      // Check bounds
      if (now < limitPulangTepat) {
        showToast(
          'Di Luar Jadwal Presensi',
          `Presensi Pulang belum dibuka! Presensi pulang lebih awal hanya diperbolehkan jika sudah memasuki batas toleransi (${formatHHMM(limitPulangTepat)} WIB). Presensi tidak dicatat dalam database.`,
          true
        );
        return; // DO NOT RECORD IN DATABASE
      }

      if (now > closePulang) {
        showToast(
          'Di Luar Jadwal Presensi',
          `Presensi Pulang sudah melewati batas waktu maksimal (${formatHHMM(closePulang)} WIB). Presensi tidak dicatat dalam database.`,
          true
        );
        return; // DO NOT RECORD IN DATABASE
      }

      // Inside valid time window!
      const exactJamPulang = createScheduleTime(todaySch.jamPulang, 0);
      if (now < exactJamPulang) {
        calculatedStatus = 'Pulang Sebelum Waktu';
      } else {
        calculatedStatus = 'Pulang Tepat Waktu';
      }
    }

    const timeString = getLocalTimeString(now);

    const newLog: AttendanceLog = {
      id: 'log-' + Date.now(),
      teacherName: currentUser.name,
      nip: currentUser.nip,
      role: currentUser.role,
      presensiType,
      status: calculatedStatus,
      time: timeString,
      date: today,
      notes: notes.trim() || '-'
    };

    setAttendanceLogs((prev) => [newLog, ...prev]);
    syncLogToSupabase(newLog);

    // Send to Google Apps Script backend asynchronously if set
    if (gasUrl) {
      fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      })
        .then(() => {
          showToast(
            'Presensi Berhasil & Terkirim ke Spreadsheet!',
            `Status: ${calculatedStatus} (${timeString}). Data telah dicatat dan terkirim.`
          );
        })
        .catch(() => {
          showToast(
            'Presensi Berhasil!',
            `Status: ${calculatedStatus} (${timeString}). Data telah dicatat.`
          );
        });
    } else {
      showToast(
        'Presensi Berhasil!',
        `Status: ${calculatedStatus} (${timeString}). Data telah dicatat.`
      );
    }
  };

  const handleIzinSubmit = (izinType: 'IZIN' | 'SAKIT', notes: string) => {
    if (!currentUser) return;

    const today = getTodayString();
    const existingLog = attendanceLogs.find(
      (l) => l.date === today && l.teacherName === currentUser.name
    );

    if (existingLog) {
      showToast(
        'Pengajuan Dikunci',
        `Anda sudah memiliki catatan presensi (${existingLog.presensiType}) untuk hari ini. Tidak dapat mengajukan Izin/Sakit lagi.`,
        true
      );
      return;
    }

    const now = new Date();
    const timeString = getLocalTimeString(now);
    const dateString = getLocalDateString(now);

    const newLog: AttendanceLog = {
      id: 'log-' + Date.now(),
      teacherName: currentUser.name,
      nip: currentUser.nip,
      role: currentUser.role,
      presensiType: izinType,
      status: izinType,
      time: timeString,
      date: dateString,
      notes: notes.trim()
    };

    setAttendanceLogs((prev) => [newLog, ...prev]);
    syncLogToSupabase(newLog);

    if (gasUrl) {
      fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      }).catch(() => {});
    }

    showToast('Keterangan Terkirim', `Status ${izinType} Anda telah tercatat.`);
  };

  const handleDeleteLog = (id: string) => {
    setAttendanceLogs((prev) => prev.filter((l) => l.id !== id));
    deleteLogFromSupabase(id);
    showToast('Log Dihapus', 'Data presensi berhasil dihapus dari Cloud Database.');
  };

  const handleUpdateScheduleItem = (index: number, field: keyof WorkScheduleDay, value: string | number) => {
    setSchedule((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveSchedule = () => {
    syncScheduleToSupabase(schedule);
    showToast('Jadwal Disimpan', 'Pengaturan jadwal kerja & toleransi berhasil diperbarui ke Supabase Database.');
  };

  const handleResetSchedule = () => {
    setSchedule(DEFAULT_SCHEDULE);
    syncScheduleToSupabase(DEFAULT_SCHEDULE);
    showToast('Jadwal Direset', 'Jadwal kerja dikembalikan ke pengaturan default.');
  };

  const handleAddTeacher = (newTeacherData: Omit<Teacher, 'id'>) => {
    const newTeacher: Teacher = {
      id: Date.now(),
      ...newTeacherData
    };
    setTeachers((prev) => [...prev, newTeacher]);
    syncTeacherToSupabase(newTeacher);
    showToast('Guru Ditambahkan', `${newTeacher.name} berhasil didaftarkan dan tersinkron ke Database Supabase.`);
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    setTeachers((prev) => prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t)));
    if (currentUser && currentUser.id === updatedTeacher.id) {
      const updatedUser: ActiveUser = {
        ...currentUser,
        name: updatedTeacher.name,
        nip: updatedTeacher.nip,
        role: updatedTeacher.role,
        photoUrl: updatedTeacher.photoUrl
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('mi_soborejo_logged_user', JSON.stringify(updatedUser));
    }
    syncTeacherToSupabase(updatedTeacher);
    showToast('Data Diperbarui', `Data ${updatedTeacher.name} berhasil diperbarui dan tersinkron ke Database Supabase.`);
  };

  const handleDeleteTeacher = (id: number) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    deleteTeacherFromSupabase(id);
    showToast('Dihapus', 'Data guru berhasil dihapus.');
  };

  const handleImportTeachers = (importedList: Teacher[]) => {
    setTeachers((prev) => [...prev, ...importedList]);
    syncTeachersToSupabase(importedList);
  };

  const handleAddHoliday = (newHoliday: Holiday) => {
    setHolidays((prev) => [...prev, newHoliday]);
    syncHolidayToSupabase(newHoliday);
  };

  const handleDeleteHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
    deleteHolidayFromSupabase(id);
  };

  const handleResetHolidays = () => {
    setHolidays(INITIAL_HOLIDAYS);
    for (const h of INITIAL_HOLIDAYS) {
      syncHolidayToSupabase(h);
    }
    showToast('Reset Hari Libur', 'Daftar hari libur dikembalikan ke standar awal.');
  };

  if (!currentUser) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
        <LoginView teachers={teachers} onLoginSuccess={handleLoginSuccess} showToast={showToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100 text-slate-800 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-800">
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* TOP HEADER NAVBAR */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        gasConnected={Boolean(gasUrl)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onLogout={handleLogout}
      />

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        {activeTab === 'absensi' && (
          <PresensiTab
            currentUser={currentUser}
            attendanceLogs={attendanceLogs}
            schedule={schedule}
            holidays={holidays}
            locationConfig={locationConfig}
            userDistanceMeters={userDistanceMeters}
            isLocating={isLocating}
            onQuickPresensi={handleQuickPresensi}
            onOpenIzinModal={() => setIsIzinOpen(true)}
            onRefreshLocation={handleRefreshLocation}
          />
        )}

        {activeTab === 'dashboard' && currentUser.isAdmin && (
          <DashboardTab
            teachers={teachers}
            attendanceLogs={attendanceLogs}
            holidays={holidays}
            onDeleteLog={handleDeleteLog}
            showToast={showToast}
          />
        )}

        {activeTab === 'jadwal' && currentUser.isAdmin && (
          <JadwalTab
            schedule={schedule}
            onUpdateScheduleItem={handleUpdateScheduleItem}
            onSaveSchedule={handleSaveSchedule}
            onResetSchedule={handleResetSchedule}
            locationConfig={locationConfig}
            onSaveLocationConfig={handleSaveLocationConfig}
            holidays={holidays}
            onAddHoliday={handleAddHoliday}
            onDeleteHoliday={handleDeleteHoliday}
            onResetHolidays={handleResetHolidays}
            showToast={showToast}
          />
        )}

        {activeTab === 'guru' && currentUser.isAdmin && (
          <GuruTab
            teachers={teachers}
            onOpenAddTeacher={() => setIsAddTeacherOpen(true)}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onImportTeachers={handleImportTeachers}
            showToast={showToast}
          />
        )}

        {activeTab === 'rekap' && currentUser.isAdmin && (
          <RekapTab teachers={teachers} attendanceLogs={attendanceLogs} showToast={showToast} />
        )}

        {activeTab === 'panduan' && currentUser.isAdmin && <PanduanTab showToast={showToast} />}
      </main>

      {/* MODALS */}
      <IzinModal isOpen={isIzinOpen} onClose={() => setIsIzinOpen(false)} onSubmit={handleIzinSubmit} />
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        gasUrl={gasUrl}
        onSaveGasUrl={(url) => {
          setGasUrl(url);
          showToast(
            'Integrasi GAS',
            url ? 'Aplikasi terhubung ke Google Apps Script!' : 'Aplikasi menggunakan Mode Penyimpanan Lokal.'
          );
        }}
      />
      <AddTeacherModal
        isOpen={isAddTeacherOpen}
        onClose={() => setIsAddTeacherOpen(false)}
        onAddTeacher={handleAddTeacher}
      />

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
        <img
          src="/logo.jpg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/app-icon.jpg';
          }}
          alt="Logo MI"
          className="w-8 h-8 sm:w-10 sm:h-10 object-contain inline-block drop-shadow-sm"
        />
        <span>MI Ma'arif Al Ihsan Soborejo &copy; 2026 • Kec. Pringsurat, Kab. Temanggung • Sistem Presensi Digital Guru</span>
      </footer>
    </div>
  );
}
