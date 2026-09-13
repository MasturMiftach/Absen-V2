import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, WifiOff } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallGuideModal } from './PWAInstallGuideModal';

export const PWABanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showModal, setShowModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('mi_soborejo_pwa_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('mi_soborejo_pwa_dismissed', 'true');
  };

  const handleOpenInstall = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Offline Alert Badge */}
      {!isOnline && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-full shadow-xl text-xs font-bold border border-rose-300 animate-bounce">
          <WifiOff className="w-4 h-4 text-white" />
          <span>Anda Sedang Offline — Menggunakan Data Tersimpan</span>
        </div>
      )}

      {/* Floating Install Prompt for Mobile & Desktop non-standalone */}
      {!isInstalled && !isDismissed && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm z-40 bg-gradient-to-r from-emerald-950 to-slate-950 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-amber-400/80 animate-fade-in flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shrink-0 border border-amber-400 overflow-hidden">
              <img src="/pwa-192x192.png" alt="Presensi MI" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-amber-300 leading-tight truncate">
                Presensi MI Soborejo
              </p>
              <p className="text-[11px] text-emerald-100/90 leading-tight">
                {isIOS ? 'Pasang di Layar Utama iPhone' : 'Buat pintasan di Layar HP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleOpenInstall}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs rounded-xl shadow transition flex items-center gap-1 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pasang</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              aria-label="Tutup pemberitahuan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Install Instruction Modal */}
      <PWAInstallGuideModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isIOS={isIOS}
        isInstallable={isInstallable}
        onTriggerInstall={install}
      />
    </>
  );
};
