import React, { useState } from 'react';
import { Teacher, AttendanceLog } from '../types';
import { exportRekapToCSV, exportDetailedReportXLSX } from '../utils/excel';
import { FileText, Filter, Download, Printer, User, Calendar, Table } from 'lucide-react';

interface RekapTabProps {
  teachers: Teacher[];
  attendanceLogs: AttendanceLog[];
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const RekapTab: React.FC<RekapTabProps> = ({ teachers, attendanceLogs, showToast }) => {
  const [selectedBulan, setSelectedBulan] = useState<string>('07');
  const [selectedTahun, setSelectedTahun] = useState<string>('2026');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('SEMUA');
  const [activeTabMode, setActiveTabMode] = useState<'rekap' | 'detail'>('detail');

  const bulanNames: Record<string, string> = {
    '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
    '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
  };

  const periodText = `01 ${bulanNames[selectedBulan]} ${selectedTahun} s/d 31 ${bulanNames[selectedBulan]} ${selectedTahun}`;

  // Filtered detailed logs for selected teacher & period
  const detailedLogs = attendanceLogs.filter(log => {
    const matchTeacher = selectedTeacher === 'SEMUA' || log.teacherName.toLowerCase().includes(selectedTeacher.toLowerCase()) || log.teacherName === selectedTeacher;
    const [y, m] = log.date.split('-');
    const matchPeriod = y === selectedTahun && m === selectedBulan;
    return matchTeacher && matchPeriod;
  }).sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.time.localeCompare(a.time);
  });

  const rekapData = teachers.map((t, idx) => {
    const logs = attendanceLogs.filter(l => {
      if (l.teacherName !== t.name) return false;
      const [y, m] = l.date.split('-');
      return y === selectedTahun && m === selectedBulan;
    });

    const tepatWaktu = logs.filter(l => l.status === 'Datang Tepat Waktu' || l.status === 'Pulang Tepat Waktu' || l.status === 'Tepat Waktu').length;
    const terlambat = logs.filter(l => l.status === 'Terlambat' || l.status === 'Pulang Sebelum Waktu').length;
    const izinSakit = logs.filter(l => l.status === 'IZIN' || l.status === 'SAKIT').length;
    
    const totalWorkingDays = 22;
    const percent = Math.min(100, Math.round(((tepatWaktu + terlambat) / totalWorkingDays) * 100));

    return {
      no: idx + 1,
      name: t.name,
      nip: t.nip,
      tepatWaktu,
      terlambat,
      izinSakit,
      percent
    };
  });

  const handleExportDetailed = () => {
    exportDetailedReportXLSX(
      detailedLogs,
      selectedTeacher,
      periodText,
      "MI MA'ARIF AL IHSAN SOBOREJO"
    );
    showToast('Download Excel Berhasil!', `Laporan presensi (${selectedTeacher === 'SEMUA' ? 'Semua Guru' : selectedTeacher}) format standar telah diunduh.`);
  };

  const handleExportRekapSummary = () => {
    exportRekapToCSV(rekapData, bulanNames[selectedBulan] || selectedBulan, selectedTahun);
    showToast('Ekspor Berhasil', `Laporan rekap bulanan ${bulanNames[selectedBulan]} ${selectedTahun} telah diunduh.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" /> Laporan & Rekapitulasi Presensi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Unduh laporan per guru atau seluruh guru sesuai format standar instansi MI MA'ARIF AL IHSAN SOBOREJO.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTabMode('detail')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeTabMode === 'detail'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> Laporan Detail Guru
          </button>
          <button
            onClick={() => setActiveTabMode('rekap')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeTabMode === 'rekap'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Rekapitulasi Bulanan
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-emerald-700" /> Pilih Guru
          </label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-emerald-600 outline-none font-medium"
          >
            <option value="SEMUA">-- Semua Guru --</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.name}>{t.name} (ID Pegawai: {t.nip})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Pilih Bulan
          </label>
          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-emerald-600 outline-none font-medium"
          >
            {Object.entries(bulanNames).map(([val, name]) => (
              <option key={val} value={val}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Pilih Tahun
          </label>
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-emerald-600 outline-none font-medium"
          >
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>

        <div className="flex items-end">
          {activeTabMode === 'detail' ? (
            <button
              onClick={handleExportDetailed}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" /> Download Excel (.xlsx)
            </button>
          ) : (
            <button
              onClick={handleExportRekapSummary}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" /> Download Rekap (.csv)
            </button>
          )}
        </div>
      </div>

      {/* MODE 1: DETAILED REPORT VIEW (EXACT FORMAT MATCHING SCREENSHOT) */}
      {activeTabMode === 'detail' && (
        <div className="space-y-4">
          {/* Header Preview Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs space-y-1">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="font-bold text-slate-600">Instansi</span>
              <span className="font-bold text-emerald-900">: MI MA'ARIF AL IHSAN SOBOREJO</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="font-bold text-slate-600">Tanggal</span>
              <span className="text-slate-800">: {periodText}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="font-bold text-slate-600">Filter Guru</span>
              <span className="text-slate-800">: {selectedTeacher === 'SEMUA' ? 'Semua Guru' : selectedTeacher}</span>
            </div>
          </div>

          {/* Table Exact Screenshot Replica */}
          <div className="overflow-x-auto border border-slate-300 rounded-xl">
            <table className="w-full text-left text-xs text-slate-800 border-collapse">
              <thead className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-12">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-28">Tanggal</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-20">Jam</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Nama</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-32">Tipe Presensi</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-36">Keterangan</th>
                  <th className="py-2.5 px-3">Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {detailedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans italic">
                      Tidak ada data presensi ditemukan untuk filter {selectedTeacher === 'SEMUA' ? 'Semua Guru' : selectedTeacher} pada {bulanNames[selectedBulan]} {selectedTahun}.
                    </td>
                  </tr>
                ) : (
                  detailedLogs.map((log, idx) => {
                    let tipePresensi = 'Datang';
                    if (log.presensiType === 'PULANG') tipePresensi = 'Pulang';
                    else if (log.presensiType === 'IZIN') tipePresensi = 'Izin';
                    else if (log.presensiType === 'SAKIT') tipePresensi = 'Sakit';

                    const cleanJam = log.time ? log.time.split(' ')[0].substring(0, 5) : '-';

                    let ket = 'Tepat Waktu';
                    if (log.status === 'Terlambat') ket = 'Terlambat';
                    else if (log.status === 'Pulang Sebelum Waktu') ket = 'Pulang Sebelum Waktu';
                    else if (log.status === 'IZIN') ket = 'Izin';
                    else if (log.status === 'SAKIT') ket = 'Sakit';

                    // Extract first name/short name if preferred, or keep full
                    const displayName = log.teacherName.split(' ')[0].toUpperCase();

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 border-r border-slate-200">{log.date}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-bold">{cleanJam}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-bold font-sans">{displayName} ({log.teacherName})</td>
                        <td className="py-2 px-3 border-r border-slate-200">{tipePresensi}</td>
                        <td className="py-2 px-3 border-r border-slate-200">{ket}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">{log.notes && log.notes !== '-' ? log.notes : ''}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500 font-medium">
              Menampilkan <strong>{detailedLogs.length}</strong> entri presensi.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDetailed}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" /> Download Format Excel (.xlsx)
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak / PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: REKAPITULASI SUMMARY TABLE */}
      {activeTabMode === 'rekap' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-emerald-950 text-white font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Guru</th>
                  <th className="py-3 px-4">ID Pegawai</th>
                  <th className="py-3 px-4 text-center">Hadir Tepat Waktu</th>
                  <th className="py-3 px-4 text-center">Terlambat</th>
                  <th className="py-3 px-4 text-center">Izin / Sakit</th>
                  <th className="py-3 px-4 text-center">Persentase Kehadiran (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rekapData.map(row => (
                  <tr key={row.no} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-500">{row.no}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{row.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{row.nip}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{row.tepatWaktu} Hari</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">{row.terlambat} Hari</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-600">{row.izinSakit} Hari</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg ${
                        row.percent >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.percent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleExportRekapSummary}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" /> Unduh Ringkasan CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak / Simpan PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

