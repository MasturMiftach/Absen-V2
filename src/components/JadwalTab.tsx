import React from 'react';
import { WorkScheduleDay, LocationConfig, Holiday } from '../types';
import { Clock, RotateCcw, Save, Info } from 'lucide-react';
import { LocationConfigCard } from './LocationConfigCard';
import { HolidayConfigCard } from './HolidayConfigCard';

interface JadwalTabProps {
  schedule: WorkScheduleDay[];
  onUpdateScheduleItem: (index: number, field: keyof WorkScheduleDay, value: string | number) => void;
  onSaveSchedule: () => void;
  onResetSchedule: () => void;
  locationConfig: LocationConfig;
  onSaveLocationConfig: (config: LocationConfig) => void;
  holidays: Holiday[];
  onAddHoliday: (holiday: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
  onResetHolidays?: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const JadwalTab: React.FC<JadwalTabProps> = ({
  schedule,
  onUpdateScheduleItem,
  onSaveSchedule,
  onResetSchedule,
  locationConfig,
  onSaveLocationConfig,
  holidays,
  onAddHoliday,
  onDeleteHoliday,
  onResetHolidays,
  showToast
}) => {
  return (
    <div className="space-y-6">
      {/* MANAJEMEN HARI LIBUR NASIONAL & KEAGAMAAN */}
      <HolidayConfigCard
        holidays={holidays}
        onAddHoliday={onAddHoliday}
        onDeleteHoliday={onDeleteHoliday}
        onResetHolidays={onResetHolidays}
        showToast={showToast}
      />

      {/* GEOLOCATION CONFIG CARD */}
      <LocationConfigCard
        locationConfig={locationConfig}
        onSaveLocationConfig={onSaveLocationConfig}
        showToast={showToast}
      />

      {/* SCHEDULE TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" /> Pengaturan Jadwal Kerja & Toleransi Waktu Absensi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur jadwal jam masuk, jam pulang, serta toleransi menit absensi untuk setiap hari kerja.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onResetSchedule}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Reset Default
            </button>
            <button
              onClick={onSaveSchedule}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" /> Simpan Jadwal
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Hari</th>
                <th className="py-3 px-3">Status_Hari</th>
                <th className="py-3 px-3">Jam_Masuk</th>
                <th className="py-3 px-3">Jam_Pulang</th>
                <th className="py-3 px-3 text-center">Buka_Absen_Masuk_Mnt</th>
                <th className="py-3 px-3 text-center">Toleransi_Terlambat_Mnt</th>
                <th className="py-3 px-3 text-center">Toleransi_Pulang_Mnt</th>
                <th className="py-3 px-3 text-center">Batas_Absen_Pulang_Mnt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {schedule.map((sch, index) => (
                <tr key={sch.hari} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-800">{sch.hari}</td>
                  <td className="py-2.5 px-3">
                    <select
                      value={sch.statusHari}
                      onChange={(e) => onUpdateScheduleItem(index, 'statusHari', e.target.value as 'Kerja' | 'Libur')}
                      className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="Kerja">Kerja</option>
                      <option value="Libur">Libur</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="time"
                      value={sch.jamMasuk}
                      onChange={(e) => onUpdateScheduleItem(index, 'jamMasuk', e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="time"
                      value={sch.jamPulang}
                      onChange={(e) => onUpdateScheduleItem(index, 'jamPulang', e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={sch.bukaAbsenMasukMnt}
                      onChange={(e) => onUpdateScheduleItem(index, 'bukaAbsenMasukMnt', parseInt(e.target.value) || 0)}
                      className="w-16 text-center bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={sch.toleransiTerlambatMnt}
                      onChange={(e) => onUpdateScheduleItem(index, 'toleransiTerlambatMnt', parseInt(e.target.value) || 0)}
                      className="w-16 text-center bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={sch.toleransiPulangMnt}
                      onChange={(e) => onUpdateScheduleItem(index, 'toleransiPulangMnt', parseInt(e.target.value) || 0)}
                      className="w-16 text-center bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={sch.batasAbsenPulangMnt}
                      onChange={(e) => onUpdateScheduleItem(index, 'batasAbsenPulangMnt', parseInt(e.target.value) || 0)}
                      className="w-20 text-center bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-xs text-emerald-900 space-y-1.5 font-sans">
          <div className="font-bold flex items-center gap-1.5 text-emerald-800">
            <Info className="w-4 h-4" /> Penjelasan Kolom Parameter Jadwal:
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 leading-relaxed">
            <li><strong>Buka Absen Masuk (Mnt)</strong>: Berapa menit sebelum Jam Masuk tombol presensi masuk mulai aktif (Contoh: 60 menit sebelum 07:00 = Buka jam 06:00).</li>
            <li><strong>Toleransi Terlambat (Mnt)</strong>: Batas waktu maksimal (menit tambahan setelah Jam Masuk) diperbolehkan melakukan presensi masuk dengan status Terlambat (Contoh: Jam Masuk 07:00 + Toleransi 15 mnt = Presensi s/d 07:15 diterima dan dicatat sebagai "Terlambat").</li>
            <li><strong>Toleransi Pulang (Mnt)</strong>: Berapa menit sebelum Jam Pulang tombol presensi pulang mulai dapat diakses.</li>
            <li><strong>Batas Absen Pulang (Mnt)</strong>: Batas maksimum durasi jam pulang diperbolehkan melakukan absen pulang setelah jam kerja berakhir.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
