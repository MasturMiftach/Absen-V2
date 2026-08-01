import React from 'react';
import { GAS_SCRIPT_CODE } from '../data/initialData';
import { SUPABASE_SQL_SETUP } from '../lib/supabase';
import { BookOpen, Copy, Check, Database } from 'lucide-react';

interface PanduanTabProps {
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const PanduanTab: React.FC<PanduanTabProps> = ({ showToast }) => {
  const [copied, setCopied] = React.useState(false);
  const [copiedSql, setCopiedSql] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_CODE).then(() => {
      setCopied(true);
      showToast('Script Disalin', 'Kode Google Apps Script disalin ke clipboard.');
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP).then(() => {
      setCopiedSql(true);
      showToast('SQL Disalin', 'Script Setup SQL Supabase disalin ke clipboard.');
      setTimeout(() => setCopiedSql(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: SUPABASE SETUP GUIDE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" /> Panduan Menghubungkan Database Supabase (Cloud Terpusat)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Supabase menyediakan database PostgreSQL cloud terpusat dan gratis dengan fitur real-time sync antar komputer.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">1</div>
            <div className="text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">Buat Akun & Project Supabase</div>
              <p>Buka <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">supabase.com</a> dan buat project baru gratis.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">2</div>
            <div className="text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">Jalankan Query SQL Setup</div>
              <p>Buka menu <strong>SQL Editor</strong> di Supabase Dashboard, lalu jalankan script SQL di bawah ini untuk membuat tabel <strong className="font-mono">teachers</strong>, <strong className="font-mono">work_schedule</strong>, dan <strong className="font-mono">attendance_logs</strong>:</p>
            </div>
          </div>

          <div className="relative bg-slate-900 rounded-2xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
            <button
              onClick={handleCopySql}
              className="absolute top-3 right-3 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition flex items-center gap-1 shadow"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Tersalin!' : 'Salin Script SQL'}</span>
            </button>
            <pre className="pt-8 text-emerald-300 leading-relaxed font-mono">
              {SUPABASE_SQL_SETUP}
            </pre>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">3</div>
            <div className="text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">Salin URL & Anon Key ke Pengaturan Aplikasi</div>
              <p>Di Supabase, buka <strong>Project Settings</strong> &gt; <strong>API</strong>. Salin <strong>Project URL</strong> dan <strong>anon / public key</strong>, lalu masukkan di menu Pengaturan (ikon ⚙️ roda gigi) di kanan atas aplikasi ini.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: GOOGLE APPS SCRIPT SPREADSHEET GUIDE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" /> Panduan Hubungkan dengan Google Sheets (Opsional Sync Spreadsheet)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Simpan otomatis data presensi guru langsung ke Google Sheets madrasah.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">1</div>
            <div className="text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">Buat Google Spreadsheet Baru</div>
              <p>
                Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">sheets.new</a> di Google Drive Anda. Beri nama spreadsheet: <strong className="font-mono">Absensi_Guru_MI_Soborejo</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">2</div>
            <div className="text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">Buka Script Editor</div>
              <p>Di menu Google Sheet, klik <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">3</div>
            <div className="text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">Salin Script Backend di Bawah Ini</div>
              <p>Hapus semua kode bawaan di Apps Script, lalu tempelkan kode berikut:</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">4</div>
            <div className="text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">Deploy sebagai Web App</div>
              <p>
                Klik tombol <strong>Deploy</strong> &gt; <strong>New Deployment</strong> &gt; Pilih jenis <strong>Web App</strong>.<br />
                - Execute as: <strong>Me</strong> (Akun Anda)<br />
                - Who has access: <strong>Anyone</strong> (Siapa Saja).<br />
                Klik <strong>Deploy</strong>, izinkan akses, lalu salin <strong>Web App URL</strong> yang dihasilkan.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">5</div>
            <div className="text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">Masukkan URL di Aplikasi</div>
              <p>Klik tombol ikon roda gigi ⚙️ di bagian kanan atas navbar aplikasi ini, lalu tempelkan URL Web App Google Apps Script tersebut.</p>
            </div>
          </div>
        </div>

        {/* Apps Script Code Box */}
        <div className="relative bg-slate-900 rounded-2xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
          <button
            onClick={handleCopyCode}
            className="absolute top-3 right-3 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition flex items-center gap-1 shadow"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Script'}</span>
          </button>
          <pre className="pt-8 text-emerald-300 leading-relaxed font-mono">
            {GAS_SCRIPT_CODE}
          </pre>
        </div>
      </div>
    </div>
  );
};
