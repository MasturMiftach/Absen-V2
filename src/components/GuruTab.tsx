import React, { useState } from 'react';
import { Teacher } from '../types';
import { Users, Upload, UserPlus, Trash2, Pencil, Search, Key } from 'lucide-react';
import { EditTeacherModal } from './Modals';

interface GuruTabProps {
  teachers: Teacher[];
  onOpenAddTeacher: () => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: number) => void;
  onImportTeachers: (imported: Teacher[]) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const GuruTab: React.FC<GuruTabProps> = ({
  teachers,
  onOpenAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onImportTeachers,
  showToast
}) => {
  const [search, setSearch] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.nip.toLowerCase().includes(search.toLowerCase()) ||
      t.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r\n|\n/);
        const imported: Teacher[] = [];

        lines.forEach((line, idx) => {
          if (!line.trim()) return;
          const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^"|"$/g, ''));
          if (idx === 0 && (parts[0].toLowerCase().includes('nama') || parts[0].toLowerCase().includes('name'))) {
            return; // Skip header line
          }
          if (parts.length >= 2) {
            const name = parts[0];
            const nip = parts[1] || '1980000000';
            const role = parts[2] || 'Guru';
            imported.push({
              id: Date.now() + idx,
              name,
              nip,
              role,
              pin: '123456'
            });
          }
        });

        if (imported.length > 0) {
          onImportTeachers(imported);
          showToast('Impor Berhasil!', `${imported.length} data guru berhasil diimpor.`);
        } else {
          showToast('File Kosong', 'Format file tidak terbaca atau kosong.', true);
        }
      } catch (err) {
        showToast('Gagal Impor', 'Gagal membaca file CSV/Text.', true);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Master Data Guru & Staf MI Ma'arif Al Ihsan Soborejo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Kelola daftar pendidik, akun, & PIN login guru</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 border border-slate-300">
            <Upload className="w-3.5 h-3.5 text-emerald-700" /> Impor (CSV/Excel)
            <input
              type="file"
              accept=".csv, .txt, .xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={onOpenAddTeacher}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" /> Tambah Guru
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari berdasarkan Nama, ID Pegawai, atau Jabatan..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map(t => (
          <div
            key={t.id}
            className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex items-start justify-between shadow-sm hover:shadow transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-800 text-amber-400 font-bold flex items-center justify-center text-base shadow-sm shrink-0">
                {t.name.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs text-slate-800 leading-snug">{t.name}</h4>
                <p className="text-[11px] text-emerald-700 font-semibold">{t.role}</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[10px] text-slate-500 font-mono">ID Pegawai: {t.nip}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-mono font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5" title="PIN Login">
                    <Key className="w-2.5 h-2.5 text-emerald-700" /> {t.pin || '123456'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setEditingTeacher(t)}
                className="text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg transition"
                title="Edit data & akun guru"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteTeacher(t.id)}
                className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition"
                title="Hapus data guru"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredTeachers.length === 0 && (
          <div className="col-span-full text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Tidak ada data guru/staf ditemukan.
          </div>
        )}
      </div>

      {/* EDIT TEACHER MODAL */}
      <EditTeacherModal
        isOpen={Boolean(editingTeacher)}
        onClose={() => setEditingTeacher(null)}
        teacher={editingTeacher}
        onUpdateTeacher={(updated) => {
          onUpdateTeacher(updated);
          setEditingTeacher(null);
        }}
      />
    </div>
  );
};

