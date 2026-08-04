import * as XLSX from 'xlsx';
import { AttendanceLog } from '../types';
import { getTodayString } from './dateUtils';

export function exportDetailedReportXLSX(
  logs: AttendanceLog[],
  selectedTeacher: string = 'SEMUA',
  periodText: string = '',
  instansiName: string = "MI MA'ARIF AL IHSAN SOBOREJO"
) {
  const sorted = [...logs].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.time.localeCompare(a.time);
  });

  const sheetData: any[][] = [];

  // Metadata Headers (Instansi & Tanggal values shifted to Column C / index 2)
  sheetData.push(['Instansi', '', instansiName]);
  sheetData.push(['Tanggal', '', periodText]);
  sheetData.push([]); // Empty spacing row

  // Table Column Headers
  sheetData.push(['No', 'Tanggal', 'Jam', 'Nama', 'Tipe Presensi', 'Keterangan', 'Aktivitas']);

  // Populate data rows
  sorted.forEach((log, index) => {
    let tipePresensi = 'Datang';
    if (log.presensiType === 'PULANG') tipePresensi = 'Pulang';
    else if (log.presensiType === 'IZIN') tipePresensi = 'Izin';
    else if (log.presensiType === 'SAKIT') tipePresensi = 'Sakit';

    const cleanJam = log.time ? log.time.split(' ')[0].substring(0, 5) : '-';

    let ket = 'Tepat Waktu';
    if (log.status === 'Terlambat') {
      ket = 'Terlambat';
    } else if (log.status === 'Pulang Sebelum Waktu') {
      ket = 'Pulang Sebelum Waktu';
    } else if (log.status === 'IZIN') {
      ket = 'Izin';
    } else if (log.status === 'SAKIT') {
      ket = 'Sakit';
    } else {
      ket = 'Tepat Waktu';
    }

    sheetData.push([
      index + 1,
      log.date,
      cleanJam,
      log.teacherName,
      tipePresensi,
      ket,
      log.notes && log.notes !== '-' ? log.notes : ''
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  worksheet['!cols'] = [
    { wch: 5 },  // No (narrower)
    { wch: 14 }, // Tanggal
    { wch: 10 }, // Jam
    { wch: 25 }, // Nama
    { wch: 16 }, // Tipe Presensi
    { wch: 20 }, // Keterangan
    { wch: 35 }  // Aktivitas
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Presensi');

  const sanitizedTeacher = selectedTeacher === 'SEMUA' ? 'Semua_Guru' : selectedTeacher.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Laporan_Presensi_${sanitizedTeacher}_${getTodayString()}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

export function exportLogsToCSV(logs: AttendanceLog[], filenameStr?: string) {
  const headers = ["Waktu Presensi", "Tanggal", "Nama Guru", "ID Pegawai", "Jabatan", "Jenis Presensi", "Status Kehadiran", "Catatan / Jurnal"];
  
  const rows = logs.map(l => [
    `"${l.time.replace(/"/g, '""')}"`,
    `"${l.date.replace(/"/g, '""')}"`,
    `"${l.teacherName.replace(/"/g, '""')}"`,
    `"${l.nip.replace(/"/g, '""')}"`,
    `"${l.role.replace(/"/g, '""')}"`,
    `"${l.presensiType.replace(/"/g, '""')}"`,
    `"${l.status.replace(/"/g, '""')}"`,
    `"${l.notes.replace(/"/g, '""')}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = filenameStr || `Rekap_Presensi_MI_Soborejo_${getTodayString()}.csv`;
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportRekapToCSV(data: Array<{
  no: number;
  name: string;
  nip: string;
  tepatWaktu: number;
  terlambat: number;
  izinSakit: number;
  percent: number;
}>, bulan: string, tahun: string) {
  const headers = ["No", "Nama Guru", "ID Pegawai", "Hadir Tepat Waktu (Hari)", "Terlambat (Hari)", "Izin / Sakit (Hari)", "Persentase Kehadiran (%)"];
  const rows = data.map(d => [
    d.no,
    `"${d.name.replace(/"/g, '""')}"`,
    `"${d.nip.replace(/"/g, '""')}"`,
    d.tepatWaktu,
    d.terlambat,
    d.izinSakit,
    `${d.percent}%`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Rekap_Bulanan_${bulan}_${tahun}_MI_Soborejo.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

