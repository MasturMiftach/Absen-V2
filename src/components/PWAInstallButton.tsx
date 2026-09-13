import React, { useState } from 'react';
import { Smartphone, Download, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallGuideModal } from './PWAInstallGuideModal';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'login' | 'inline' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed in standalone mode, show clean installed badge or hide
  if (isInstalled) {
    if (variant === 'login') {
      return (
        <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Aplikasi Terpasang di Perangkat</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  if (variant === 'navbar') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-emerald-950 font-extrabold rounded-xl text-[11px] sm:text-xs transition shadow-md flex items-center gap-1.5 border border-amber-300 transform active:scale-95 whitespace-nowrap ${className}`}
          title="Pasang Pintasan Aplikasi di Layar Utama HP / PC"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-950 shrink-0" />
          <span>Pasang Aplikasi</span>
        </button>

        <PWAInstallGuideModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          isIOS={isIOS}
          isInstallable={isInstallable}
          onTriggerInstall={install}
        />
      </>
    );
  }

  if (variant === 'login') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-400/20 transition flex items-center justify-center gap-2.5 border-2 border-amber-300 transform active:scale-98 ${className}`}
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-900 text-amber-300 flex items-center justify-center shrink-0">
            <Download className="w-3.5 h-3.5" />
          </div>
          <span>PASANG APLIKASI DI HP (ANDROID & IPHONE)</span>
        </button>

        <PWAInstallGuideModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          isIOS={isIOS}
          isInstallable={isInstallable}
          onTriggerInstall={install}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 ${className}`}
      >
        <Smartphone className="w-4 h-4" />
        <span>Pasang Aplikasi</span>
      </button>

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
