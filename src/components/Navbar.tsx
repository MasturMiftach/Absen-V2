import React, { useState, useEffect } from 'react';
import { ActiveUser, TabType } from '../types';
import { Landmark, Settings, LogOut, ClipboardList, PieChart, CalendarDays, Users, FileSpreadsheet, BookOpen } from 'lucide-react';

interface NavbarProps {
  currentUser: ActiveUser;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  gasConnected: boolean;
  onOpenConfig: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  gasConnected,
  onOpenConfig,
  onLogout
}) => {
  const [clockStr, setClockStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tStr = now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB';
      const dStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setClockStr(tStr);
      setDateStr(dStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-lg border-b-4 border-amber-400 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Madrasah Title */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white p-1.5 rounded-2xl border-2 border-amber-400 shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src="/logo.jpg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/app-icon.jpg';
                }}
                alt="Logo MI Ma'arif Al Ihsan Soborejo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/30 tracking-wider">
                  LP MA'ARIF NU
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Cloud Database Active</span>
                </span>
                {gasConnected && (
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-400/30">
                    GAS Active
                  </span>
                )}
              </div>
              <h1 className="font-extrabold text-base sm:text-lg md:text-xl leading-tight tracking-wide bg-gradient-to-r from-amber-300 via-amber-200 to-white bg-clip-text text-transparent truncate drop-shadow-sm">
                MI MA'ARIF AL IHSAN SOBOREJO
              </h1>
              <p className="text-[11px] text-emerald-100/90 truncate">Sistem Absensi Kehadiran & Jurnal Digital Guru</p>
            </div>
          </div>

          {/* Clock & User Controls */}
          <div className="flex items-center justify-between md:justify-end space-x-3 border-t md:border-t-0 border-white/10 pt-2 md:pt-0">
            <div className="text-left md:text-right">
              <div className="text-base sm:text-lg font-black tracking-wider text-amber-300 font-mono">
                {clockStr || '00:00:00 WIB'}
              </div>
              <div className="text-[11px] text-emerald-100 font-medium">
                {dateStr || 'Hari ini'}
              </div>
            </div>

            {/* User Active Session Badge & Actions */}
            <div className="flex items-center gap-2">
              <div className="bg-emerald-950/80 px-2.5 py-1.5 rounded-xl border border-emerald-600/50 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-amber-400/60 shadow-sm">
                  {currentUser.photoUrl ? (
                    <img src={currentUser.photoUrl} alt={`Foto ${currentUser.name}`} className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentUser.name ? currentUser.name.charAt(0) : 'U'}</span>
                  )}
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">{currentUser.name}</div>
                  <div className="text-[10px] text-amber-400 font-semibold uppercase truncate max-w-[140px]">{currentUser.role}</div>
                </div>
              </div>

              <button
                onClick={onOpenConfig}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition shadow-sm"
                title="Pengaturan Spreadsheet GAS"
              >
                <Settings className="w-4 h-4 text-amber-300" />
              </button>

              <button
                onClick={onLogout}
                className="px-3 py-2 bg-rose-600/80 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold border border-rose-500 transition flex items-center gap-1.5 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* MAIN NAVIGATION BUTTONS */}
      <nav className="bg-emerald-950/90 border-t border-emerald-800/50 backdrop-blur-md px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-2 custom-scrollbar">
          <button
            onClick={() => onSelectTab('absensi')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'absensi'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-100 hover:bg-emerald-800/50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>{currentUser.isAdmin ? 'Form Presensi' : 'Presensi Guru'}</span>
          </button>

          {currentUser.isAdmin && (
            <>
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-emerald-100 hover:bg-emerald-800/50'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Dashboard & Log</span>
              </button>

              <button
                onClick={() => onSelectTab('jadwal')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === 'jadwal'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-emerald-100 hover:bg-emerald-800/50'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Pengaturan Jadwal</span>
              </button>

              <button
                onClick={() => onSelectTab('guru')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === 'guru'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-emerald-100 hover:bg-emerald-800/50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Data Guru & Staf</span>
              </button>

              <button
                onClick={() => onSelectTab('rekap')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === 'rekap'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-emerald-100 hover:bg-emerald-800/50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Rekap Bulanan</span>
              </button>

              <button
                onClick={() => onSelectTab('panduan')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === 'panduan'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-emerald-100 hover:bg-emerald-800/50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Panduan Google Sheets</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
