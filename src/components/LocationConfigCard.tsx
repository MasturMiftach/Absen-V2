import React, { useState } from 'react';
import { LocationConfig } from '../types';
import { MapPin, Navigation, Save, Power, Compass, ExternalLink } from 'lucide-react';
import { getCurrentPosition } from '../utils/geo';

interface LocationConfigCardProps {
  locationConfig: LocationConfig;
  onSaveLocationConfig: (config: LocationConfig) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const LocationConfigCard: React.FC<LocationConfigCardProps> = ({
  locationConfig,
  onSaveLocationConfig,
  showToast
}) => {
  const [enabled, setEnabled] = useState(locationConfig.enabled);
  const [locationName, setLocationName] = useState(locationConfig.locationName);
  const [latitude, setLatitude] = useState(locationConfig.latitude);
  const [longitude, setLongitude] = useState(locationConfig.longitude);
  const [radiusMeters, setRadiusMeters] = useState(locationConfig.radiusMeters);
  const [isDetecting, setIsDetecting] = useState(false);

  React.useEffect(() => {
    setEnabled(locationConfig.enabled);
    setLocationName(locationConfig.locationName);
    setLatitude(locationConfig.latitude);
    setLongitude(locationConfig.longitude);
    setRadiusMeters(locationConfig.radiusMeters);
  }, [locationConfig]);

  const handleDetectGPS = async () => {
    setIsDetecting(true);
    showToast('Mendeteksi GPS...', 'Mencari koordinat presisi perangkat Anda saat ini.');
    try {
      const pos = await getCurrentPosition();
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      setLatitude(lat);
      setLongitude(lng);
      setIsDetecting(false);
      showToast('GPS Terdeteksi!', `Koordinat berhasil diisi: ${lat}, ${lng}`);
    } catch (err) {
      setIsDetecting(false);
      const msg = err instanceof Error ? err.message : 'Gagal mendeteksi lokasi GPS.';
      showToast('Gagal GPS', msg, true);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: LocationConfig = {
      enabled,
      locationName: locationName.trim() || "MI Ma'arif Al Ihsan Soborejo",
      latitude: Number(latitude),
      longitude: Number(longitude),
      radiusMeters: Math.max(10, Number(radiusMeters) || 100)
    };
    onSaveLocationConfig(updated);
  };

  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" /> Pengaturan Lokasi & Radius Geolocation GPS Presensi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur titik koordinat sekolah dan radius maksimal meter untuk membatasi lokasi presensi guru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Toggle Button */}
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
              enabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>Validasi GPS: {enabled ? 'AKTIF' : 'NONAKTIF'}</span>
          </button>
        </div>
      </div>

      {/* Info Status Banner */}
      <div
        className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition ${
          enabled
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/70 border-amber-200 text-amber-950'
        }`}
      >
        <Compass className={`w-4 h-4 mt-0.5 shrink-0 ${enabled ? 'text-emerald-700' : 'text-amber-700'}`} />
        <div className="space-y-0.5">
          <div className="font-bold">
            {enabled
              ? 'Validasi Geolocation Aktif'
              : 'Validasi Geolocation Dinonaktifkan'}
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {enabled
              ? `Guru WAJIB berada di dalam radius ${radiusMeters} meter dari titik (${latitude}, ${longitude}) untuk melakukan presensi.`
              : 'Guru dapat melakukan presensi dari lokasi manapun tanpa batasan jarak GPS.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Nama Lokasi */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lokasi / Instansi
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              required
              placeholder="MI Ma'arif Al Ihsan Soborejo"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
            />
          </div>

          {/* Latitude */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Latitude (Garis Lintang)
            </label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
              required
              placeholder="-7.500000"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Longitude */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Longitude (Garis Bujur)
            </label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
              required
              placeholder="110.200000"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Radius Meters */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Radius Maksimal Absensi (Meter)
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                max="5000"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(parseInt(e.target.value) || 50)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                meter
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Jangkauan maksimal dari titik pusat sekolah (Rekomendasi: 50 - 200 meter).
            </p>
          </div>

          {/* Auto Detect GPS Button */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isDetecting}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-amber-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow"
            >
              <Navigation className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Mendeteksi GPS...' : 'Ambil Koordinat Saya Saat Ini'}</span>
            </button>
          </div>

        </div>

        {/* Action Row */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Titik Koordinat di Google Maps</span>
          </a>

          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>Simpan Pengaturan Lokasi</span>
          </button>
        </div>
      </form>
    </div>
  );
};
