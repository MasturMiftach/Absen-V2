import React, { useState } from 'react';
import { Holiday } from '../types';
import { formatDateIndonesian, getTodayString } from '../utils/dateUtils';
import { Calendar, Plus, Trash2, Tag, Search, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

interface HolidayConfigCardProps {
  holidays: Holiday[];
  onAddHoliday: (holiday: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
  onResetHolidays?: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const HolidayConfigCard: React.FC<HolidayConfigCardProps> = ({
  holidays,
  onAddHoliday,
  onDeleteHoliday,
  onResetHolidays,
  showToast
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const [newDate, setNewDate] = useState<string>(getTodayString());
  const [newDesc, setNewDesc] = useState<string>('');
  const [newType, setNewType] = useState<'NASIONAL' | 'KEAGAMAAN' | 'KHUSUS'>('KHUSUS');
  const [newIsRecurring, setNewIsRecurring] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      showToast('Form Tidak Lengkap', 'Silakan pilih tanggal hari libur.', true);
      return;
    }
    if (!newDesc.trim()) {
      showToast('Form Tidak Lengkap', 'Silakan isi keterangan / nama hari libur.', true);
      return;
    }

    const newHoliday: Holiday = {
      id: 'hol-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      date: newDate,
      description: newDesc.trim(),
      type: newType,
      isRecurring: newIsRecurring
    };

    onAddHoliday(newHoliday);
    showToast('Hari Libur Ditambahkan', `Hari libur "${newDesc}" (${newDate}) berhasil disimpan.`);
    
    // Reset Form
    setNewDesc('');
    setShowAddForm(false);
  };

  const filteredHolidays = holidays.filter((h) => {
    const matchType = filterType === 'SEMUA' || h.type === filterType;
    const matchSearch =
      !searchQuery ||
      h.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.date.includes(searchQuery);
    return matchType && matchSearch;
  }).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" /> Manajemen Hari Libur Nasional & Keagamaan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola daftar hari libur nasional, hari besar keagamaan, serta hari libur khusus/cuti bersama madrasah.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onResetHolidays && (
            <button
              onClick={onResetHolidays}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition flex items-center gap-1.5"
              title="Kembalikan daftar hari libur awal"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> Reset Default
            </button>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            {showAddForm ? 'Tutup Form' : 'Tambah Libur Manual'}
          </button>
        </div>
      </div>

      {/* ADD HOLIDAY FORM */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-900 border-b border-emerald-200/80 pb-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Form Tambah Hari Libur Baru
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tanggal Libur</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Keterangan / Nama Hari Libur</label>
              <input
                type="text"
                placeholder="Contoh: Cuti Bersama MI Soborejo, Libur Semester 1"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Jenis Libur</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'NASIONAL' | 'KEAGAMAAN' | 'KHUSUS')}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="KHUSUS">Khusus / Cuti Bersama</option>
                <option value="NASIONAL">Libur Nasional</option>
                <option value="KEAGAMAAN">Keagamaan</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={newIsRecurring}
                onChange={(e) => setNewIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>Berulang setiap tahun pada tanggal yang sama (contoh: 17 Agustus, 1 Januari)</span>
            </label>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow transition"
              >
                Simpan Hari Libur
              </button>
            </div>
          </div>
        </form>
      )}

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('SEMUA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'SEMUA'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({holidays.length})
          </button>
          <button
            onClick={() => setFilterType('NASIONAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'NASIONAL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Nasional ({holidays.filter(h => h.type === 'NASIONAL').length})
          </button>
          <button
            onClick={() => setFilterType('KEAGAMAAN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'KEAGAMAAN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Keagamaan ({holidays.filter(h => h.type === 'KEAGAMAAN').length})
          </button>
          <button
            onClick={() => setFilterType('KHUSUS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'KHUSUS'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Khusus / Manual ({holidays.filter(h => h.type === 'KHUSUS').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari hari libur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* HOLIDAYS TABLE */}
      <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3">Tanggal</th>
              <th className="py-3 px-3">Nama Hari Libur</th>
              <th className="py-3 px-3 text-center">Jenis Libur</th>
              <th className="py-3 px-3 text-center">Berulang Annual</th>
              <th className="py-3 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredHolidays.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                  Tidak ada data hari libur ditemukan.
                </td>
              </tr>
            ) : (
              filteredHolidays.map((h) => {
                let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                if (h.type === 'NASIONAL') badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                if (h.type === 'KEAGAMAAN') badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                if (h.type === 'KHUSUS') badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';

                return (
                  <tr key={h.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {h.date}
                      <span className="block text-[10px] font-normal text-slate-500 font-sans">
                        {formatDateIndonesian(h.date)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {h.description}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeClass}`}>
                        <Tag className="w-2.5 h-2.5" />
                        {h.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium">
                      {h.isRecurring ? (
                        <span className="text-emerald-600 font-semibold text-[11px]">Ya (Setiap Tahun)</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Hapus hari libur "${h.description}" (${h.date})?`)) {
                            onDeleteHoliday(h.id);
                            showToast('Hari Libur Dihapus', `Hari libur ${h.description} berhasil dihapus.`);
                          }
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Hari Libur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span>
          <strong>Catatan:</strong> Pada tanggal hari libur yang terdaftar, sistem akan otomatis menampilkan spanduk pengumuman libur di halaman utama Presensi dan tidak akan mencatat absensi biasa.
        </span>
      </div>
    </div>
  );
};
