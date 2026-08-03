import React, { useState } from 'react';
import { Teacher, ActiveUser } from '../types';
import { UserCheck, Shield, Eye, EyeOff, ArrowRight, Lock, Landmark } from 'lucide-react';

interface LoginViewProps {
  teachers: Teacher[];
  onLoginSuccess: (user: ActiveUser) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ teachers, onLoginSuccess, showToast }) => {
  const [roleTab, setRoleTab] = useState<'GURU' | 'ADMIN'>('GURU');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teacherPin, setTeacherPin] = useState<string>('');
  const [showTeacherPin, setShowTeacherPin] = useState<boolean>(false);

  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showAdminPass, setShowAdminPass] = useState<boolean>(false);

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      showToast('Pilih Nama', 'Silakan pilih nama guru dari daftar.', true);
      return;
    }

    const teacher = teachers.find(t => t.id === Number(selectedTeacherId));
    if (!teacher) {
      showToast('Pilih Nama', 'Data guru tidak ditemukan.', true);
      return;
    }

    if (teacherPin.trim() === (teacher.pin || '123456')) {
      const user: ActiveUser = {
        id: teacher.id,
        name: teacher.name,
        nip: teacher.nip,
        role: teacher.role,
        isStaff: true,
        isAdmin: false,
        photoUrl: teacher.photoUrl
      };
      onLoginSuccess(user);
    } else {
      showToast('PIN Salah', 'PIN yang Anda masukkan tidak sesuai.', true);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername.trim() === 'admin' && adminPassword.trim() === '123456') {
      const adminUser: ActiveUser = {
        id: 999,
        name: 'Admin Operator',
        nip: 'ADMIN-SOBOREJO',
        role: 'Administrator',
        isStaff: false,
        isAdmin: true
      };
      onLoginSuccess(adminUser);
    } else {
      showToast('Login Gagal', 'Username atau password admin salah (Gunakan: admin / 123456).', true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Background Blur Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Header Section */}
        <div className="text-center mb-6 space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-28 h-28 sm:w-36 sm:h-36 bg-white p-2.5 rounded-3xl border-2 border-amber-400 shadow-2xl flex items-center justify-center overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.jpg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/app-icon.jpg';
                }}
                alt="Logo MI Ma'arif Al Ihsan Soborejo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="block">
            <span className="inline-block bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30 uppercase tracking-widest">
              LP MA'ARIF NU
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            MI MA'ARIF AL IHSAN
          </h1>
          <p className="text-emerald-200 text-xs sm:text-sm font-medium">Sistem Absensi Kehadiran & Jurnal Guru</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
          {/* Login Role Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setRoleTab('GURU')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                roleTab === 'GURU' ? 'shadow bg-white text-emerald-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" /> Login Guru / Staf
            </button>
            <button
              type="button"
              onClick={() => setRoleTab('ADMIN')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                roleTab === 'ADMIN' ? 'shadow bg-white text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" /> Login Admin
            </button>
          </div>

          {/* Teacher Login Form */}
          {roleTab === 'GURU' && (
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Nama Guru / Staf
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl p-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
                >
                  <option value="" disabled>-- Pilih Nama Anda --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECTED TEACHER PROFILE PHOTO PREVIEW */}
              {selectedTeacherId && (() => {
                const t = teachers.find(item => item.id === Number(selectedTeacherId));
                if (!t) return null;
                return (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl animate-scale-up">
                    <div className="w-12 h-12 rounded-xl bg-emerald-800 text-amber-300 font-bold flex items-center justify-center text-lg shadow-sm shrink-0 overflow-hidden border-2 border-amber-400">
                      {t.photoUrl ? (
                        <img src={t.photoUrl} alt={`Foto ${t.name}`} className="w-full h-full object-cover" />
                      ) : (
                        <span>{t.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-800 truncate">{t.name}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold truncate">{t.role}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {t.nip}</div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  PIN / Password
                </label>
                <div className="relative">
                  <input
                    type={showTeacherPin ? 'text' : 'password'}
                    value={teacherPin}
                    onChange={(e) => setTeacherPin(e.target.value)}
                    required
                    placeholder="Masukkan PIN"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl p-3 pr-10 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPin(!showTeacherPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showTeacherPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 hover:from-emerald-900 hover:to-emerald-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-800/30 transition flex items-center justify-center gap-2 transform active:scale-[0.99]"
              >
                <span>MASUK PORTAL ABSENSI</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </form>
          )}

          {/* Admin Login Form */}
          {roleTab === 'ADMIN' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Username Operator / Admin
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                  placeholder="admin"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl p-3 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Password Admin
                </label>
                <div className="relative">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="******"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl p-3 pr-10 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 hover:from-slate-900 hover:to-slate-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-slate-900/30 transition flex items-center justify-center gap-2 transform active:scale-[0.99]"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>MASUK SEBAGAI ADMIN</span>
              </button>
            </form>
          )}

          {/* Quick Help Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-1.5">
            <p className="text-xs font-semibold text-slate-700">
              Dikembangkan oleh MI MA'ARIF AL IHSAN SOBOREJO
            </p>
            <p className="text-xs text-slate-600 flex items-center justify-center gap-1 font-medium">
              <span>Kontak:</span>
              <a href="https://wa.me/6281225249711" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-700 hover:underline">
                +62 812-2524-9711
              </a>
            </p>
          </div>
        </div>

        {/* Footer Address */}
        <p className="text-center text-[11px] text-emerald-200/70 mt-6">
          MI Ma'arif Al Ihsan Soborejo &copy; 2026 • Kec. Pringsurat, Kab. Temanggung
        </p>
      </div>
    </div>
  );
};
