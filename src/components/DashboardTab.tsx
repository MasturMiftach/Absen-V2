import React, { useState } from 'react';
import { Teacher, AttendanceLog } from '../types';
import { exportLogsToCSV, exportDetailedReportXLSX } from '../utils/excel';
import { Users, UserCheck, Clock, FileText, UserX, PieChart, MessageSquare, Copy, ExternalLink, Search, Download, Trash2, FileSpreadsheet } from 'lucide-react';

interface DashboardTabProps {
  teachers: Teacher[];
  attendanceLogs: AttendanceLog[];
  onDeleteLog: (id: string) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  teachers,
  attendanceLogs,
  onDeleteLog,
  showToast
}) => {
  const [searchFilter, setSearchFilter] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = attendanceLogs.filter(l => l.date === today);

  const tepatWaktu = todayLogs.filter(l => l.status === 'Datang Tepat Waktu' || l.status === 'Pulang Tepat Waktu' || l.status === 'Tepat Waktu').length;
  const terlambat = todayLogs.filter(l => l.status === 'Terlambat' || l.status === 'Pulang Sebelum Waktu').length;
  const izinSakit = todayLogs.filter(l => l.status === 'IZIN' || l.status === 'SAKIT').length;
  const totalGuru = teachers.length;
  const belumAbsen = Math.max(0, totalGuru - todayLogs.length);

  const filteredLogs = attendanceLogs.filter(l => {
    const text = (l.teacherName + ' ' + l.role + ' ' + l.status + ' ' + l.notes).toLowerCase();
    return text.includes(searchFilter.toLowerCase());
  });

  const waReminderMessage = `Assalamu'alaikum Wr. Wb. Bapak/Ibu Guru MI Ma'arif Al Ihsan Soborejo, mengingatkan untuk mengisi presensi kehadiran hari ini melalui portal absensi web madrasah. Terima kasih.`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Teks Disalin', 'Format pengingat WhatsApp berhasil disalin.');
    });
  };

  const handleExportCSV = () => {
    exportLogsToCSV(attendanceLogs);
    showToast('Ekspor Berhasil', 'File rekap log presensi (.csv) telah diunduh.');
  };

  const handleExportXLSX = () => {
    exportDetailedReportXLSX(filteredLogs, 'SEMUA', `Log Presensi - ${today}`, "MI MA'ARIF AL IHSAN SOBOREJO");
    showToast('Download Excel Berhasil!', 'Laporan presensi format standar (.xlsx) telah diunduh.');
  };

  // Pie chart calculated percentages
  const totalTracked = tepatWaktu + terlambat + izinSakit + belumAbsen || 1;
  const pctTepat = Math.round((tepatWaktu / totalTracked) * 100);
  const pctLambat = Math.round((terlambat / totalTracked) * 100);
  const pctIzin = Math.round((izinSakit / totalTracked) * 100);
  const pctBelum = Math.max(0, 100 - pctTepat - pctLambat - pctIzin);

  return (
    <div className="space-y-6">
      
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Total Guru</div>
            <div className="text-xl font-black text-slate-800">{totalGuru}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Tepat Waktu</div>
            <div className="text-xl font-black text-emerald-700">{tepatWaktu}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Terlambat</div>
            <div className="text-xl font-black text-amber-600">{terlambat}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Izin / Sakit</div>
            <div className="text-xl font-black text-indigo-600">{izinSakit}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3 col-span-2 lg:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Belum Absen</div>
            <div className="text-xl font-black text-rose-600">{belumAbsen}</div>
          </div>
        </div>
      </div>

      {/* Visual Chart & WhatsApp Reminder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Statistics Bar Chart View */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" /> Persentase Kehadiran Hari Ini
            </h3>
            
            <div className="space-y-3 py-2">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-700">Tepat Waktu</span>
                  <span>{tepatWaktu} Guru ({pctTepat}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 transition-all duration-500" style={{ width: `${pctTepat}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-amber-600">Terlambat</span>
                  <span>{terlambat} Guru ({pctLambat}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${pctLambat}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-indigo-600">Izin / Sakit</span>
                  <span>{izinSakit} Guru ({pctIzin}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${pctIzin}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-600">Belum Absen</span>
                  <span>{belumAbsen} Guru ({pctBelum}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${pctBelum}%` }} />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 text-center border-t border-slate-100 pt-2">
            Persentase kehadiran diperbarui secara realtime.
          </p>
        </div>

        {/* WhatsApp Broadcast Tool */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" /> Broadcast WhatsApp Pengingat Presensi
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">
                Fitur Operator
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Kirim pengingat presensi otomatis ke Grup WhatsApp Guru MI Ma'arif Al Ihsan Soborejo.
            </p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 font-mono text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-emerald-800 mb-1">📋 Teks Pengingat Absensi:</p>
              <p>{waReminderMessage}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => copyToClipboard(waReminderMessage)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" /> Salin Teks Pesan
            </button>
            <a
              href="https://web.whatsapp.com"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka WhatsApp Web
            </a>
          </div>
        </div>

      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">Log Data Presensi Guru Hari Ini</h3>
            <p className="text-[11px] text-slate-500">Daftar presensi ter-update secara otomatis</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cari nama guru..."
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl pl-8 pr-3 py-2 w-44 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              onClick={handleExportXLSX}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
              title="Download Excel format standar (seperti screenshot)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" /> Export Excel (.xlsx)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Nama Guru</th>
                <th className="py-3.5 px-4">Jabatan / Kelas</th>
                <th className="py-3.5 px-4">Jenis</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Catatan / Jurnal</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400 text-xs">
                    Tidak ada log data presensi ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isGreen = log.status === 'Datang Tepat Waktu' || log.status === 'Pulang Tepat Waktu' || log.status === 'Tepat Waktu';
                  const isAmber = log.status === 'Terlambat' || log.status === 'Pulang Sebelum Waktu';

                  const badgeColor = isGreen
                    ? 'bg-emerald-100 text-emerald-800'
                    : isAmber
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-blue-100 text-blue-800';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">{log.time}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{log.teacherName}</td>
                      <td className="py-3 px-4 text-slate-600">{log.role}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{log.presensiType}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeColor}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 italic text-[11px]">{log.notes}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 transition"
                          title="Hapus log ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
