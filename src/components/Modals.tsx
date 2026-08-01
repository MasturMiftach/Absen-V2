import React, { useState } from 'react';
import { Teacher } from '../types';
import { X, FileSpreadsheet, UserPlus, Settings, Hand, Stethoscope, Database, Copy, Check, Key, Pencil } from 'lucide-react';
import { getSupabaseCredentials, saveSupabaseCredentials, isSupabaseConnected, SUPABASE_SQL_SETUP } from '../lib/supabase';

interface IzinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (izinType: 'IZIN' | 'SAKIT', notes: string) => void;
}

export const IzinModal: React.FC<IzinModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [izinType, setIzinType] = useState<'IZIN' | 'SAKIT'>('IZIN');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(izinType, notes);
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-500" /> Form Permohonan Izin / Sakit
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Keterangan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIzinType('IZIN')}
                className={`border-2 rounded-xl p-3 flex items-center justify-center gap-2 transition ${
                  izinType === 'IZIN'
                    ? 'border-amber-500 bg-amber-500 text-white font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-amber-50'
                }`}
              >
                <Hand className="w-4 h-4" />
                <span className="text-xs font-bold">Izin</span>
              </button>

              <button
                type="button"
                onClick={() => setIzinType('SAKIT')}
                className={`border-2 rounded-xl p-3 flex items-center justify-center gap-2 transition ${
                  izinType === 'SAKIT'
                    ? 'border-blue-600 bg-blue-600 text-white font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span className="text-xs font-bold">Sakit</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Alasan / Catatan Keterangan <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
              rows={3}
              placeholder="Contoh: Sakit flu / Ada keperluan dinas luar madrasah..."
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition"
            >
              Kirim Keterangan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
  onSaveSupabaseCredentials?: (url: string, key: string) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  gasUrl,
  onSaveGasUrl,
  onSaveSupabaseCredentials
}) => {
  const [inputUrl, setInputUrl] = useState<string>(gasUrl);
  const initialSb = getSupabaseCredentials();
  const [sbUrl, setSbUrl] = useState<string>(initialSb.url);
  const [sbKey, setSbKey] = useState<string>(initialSb.key);
  const [showSql, setShowSql] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  React.useEffect(() => {
    setInputUrl(gasUrl);
    const creds = getSupabaseCredentials();
    setSbUrl(creds.url);
    setSbKey(creds.key);
  }, [gasUrl, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveGasUrl(inputUrl.trim());
    if (sbUrl.trim() && sbKey.trim()) {
      saveSupabaseCredentials(sbUrl, sbKey);
      if (onSaveSupabaseCredentials) {
        onSaveSupabaseCredentials(sbUrl.trim(), sbKey.trim());
      }
    }
    onClose();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const connected = isSupabaseConnected();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" /> Pengaturan Database Supabase & Sync
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supabase Status Banner */}
        <div className={`p-3.5 rounded-xl border space-y-1 ${connected ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold flex items-center gap-1.5 ${connected ? 'text-emerald-900' : 'text-amber-900'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {connected ? 'Database Supabase Terhubung' : 'Supabase Belum Dikonfigurasi'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${connected ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
              {connected ? 'Real-time PostgreSQL' : 'Local Storage Fallback'}
            </span>
          </div>
          <p className={`text-[11px] leading-snug ${connected ? 'text-emerald-800' : 'text-amber-800'}`}>
            {connected
              ? 'Data absensi, guru, dan jadwal kerja tersimpan secara terpusat di PostgreSQL Supabase dengan sinkronisasi otomatis.'
              : 'Masukkan URL dan Anon Key dari Supabase Project Anda untuk mengaktifkan database cloud terpusat.'}
          </p>
        </div>

        {/* SUPABASE CREDENTIALS FORM */}
        <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-600" /> Kredensial Supabase
            </span>
            <button
              type="button"
              onClick={() => setShowSql(!showSql)}
              className="text-[11px] text-emerald-700 hover:underline font-semibold"
            >
              {showSql ? 'Sembunyikan Script SQL' : 'Lihat Script Setup SQL'}
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Supabase Project URL</label>
            <input
              type="url"
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
              placeholder="https://xyzxyz.supabase.co"
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Supabase Anon Key (Public API Key)</label>
            <input
              type="password"
              value={sbKey}
              onChange={(e) => setSbKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          {showSql && (
            <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Script SQL Setup Tabel (Jalankan di Supabase SQL Editor):</span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold flex items-center gap-1 transition"
                >
                  {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedSql ? 'Tercopy!' : 'Copy Script SQL'}
                </button>
              </div>
              <pre className="p-2.5 bg-slate-900 text-slate-200 text-[10px] font-mono rounded-lg overflow-x-auto max-h-40 leading-relaxed custom-scrollbar">
                {SUPABASE_SQL_SETUP}
              </pre>
            </div>
          )}
        </div>

        {/* GAS SPREADSHEET CONFIG */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">URL Web App Google Apps Script (Opsional Sync Spreadsheet)</label>
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
          />
        </div>

        <div className="pt-2 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition"
          >
            Simpan & Hubungkan Database
          </button>
        </div>
      </div>
    </div>
  );
};

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
}

export const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ isOpen, onClose, onAddTeacher }) => {
  const [name, setName] = useState<string>('');
  const [nip, setNip] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [pin, setPin] = useState<string>('123456');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nip.trim() || !role.trim()) return;

    onAddTeacher({
      name: name.trim(),
      nip: nip.trim(),
      role: role.trim(),
      pin: pin.trim() || '123456'
    });

    setName('');
    setNip('');
    setRole('');
    setPin('123456');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" /> Tambah Guru / Staf Baru
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap & Gelar <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Contoh: Ahmad Fauzi, S.Pd.I"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ID Pegawai <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              required
              placeholder="Contoh: 19850101..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jabatan / Guru Kelas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              placeholder="Contoh: Wali Kelas 4B / Guru Fiqih"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              PIN Login Absensi (Default: 123456)
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  onUpdateTeacher: (teacher: Teacher) => void;
}

export const EditTeacherModal: React.FC<EditTeacherModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onUpdateTeacher
}) => {
  const [name, setName] = useState<string>('');
  const [nip, setNip] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [pin, setPin] = useState<string>('');

  React.useEffect(() => {
    if (teacher) {
      setName(teacher.name);
      setNip(teacher.nip);
      setRole(teacher.role);
      setPin(teacher.pin || '123456');
    }
  }, [teacher, isOpen]);

  if (!isOpen || !teacher) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nip.trim() || !role.trim()) return;

    onUpdateTeacher({
      ...teacher,
      name: name.trim(),
      nip: nip.trim(),
      role: role.trim(),
      pin: pin.trim() || '123456'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Pencil className="w-4 h-4 text-emerald-600" /> Edit Akun Guru / Staf
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap & Gelar <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Contoh: Ahmad Fauzi, S.Pd.I"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ID Pegawai <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              required
              placeholder="Contoh: 19850101..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jabatan / Guru Kelas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              placeholder="Contoh: Wali Kelas 4B / Guru Fiqih"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              PIN Login Absensi
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              placeholder="123456"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">PIN digunakan oleh guru untuk login presensi mandiri.</p>
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

