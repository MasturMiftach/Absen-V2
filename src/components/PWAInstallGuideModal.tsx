import React from 'react';
import { X, Share2, PlusSquare, Smartphone, CheckCircle2, ArrowRight, Download, Sparkles } from 'lucide-react';

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isInstallable: boolean;
  onTriggerInstall: () => Promise<boolean>;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isInstallable,
  onTriggerInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Header with App Brand Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white p-5 text-center relative border-b-2 border-amber-400">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto w-16 h-16 bg-white p-1 rounded-2xl border-2 border-amber-400 shadow-lg flex items-center justify-center mb-3">
            <img
              src="/pwa-192x192.png"
              alt="Logo Presensi MI"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/40 uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3" /> PWA Home Screen Shortcut
          </span>
          <h2 className="text-lg font-extrabold text-white">Pasang Aplikasi di HP</h2>
          <p className="text-xs text-emerald-200 mt-0.5">
            MI Ma'arif Al Ihsan Soborejo
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quick highlight benefit */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 space-y-0.5">
              <p className="font-bold text-emerald-950">Lebih Cepat, Praktis & Seperti Aplikasi Asli!</p>
              <p className="text-[11px] text-emerald-800">
                Ikon aplikasi akan otomatis tampil di layar utama (Home Screen) HP Anda tanpa perlu instal lewat Play Store / App Store.
              </p>
            </div>
          </div>

          {/* Android Direct One-Click Flow (if installable prompt ready) */}
          {isInstallable && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
                <p className="font-bold mb-1">Perangkat Siap Pasang Otomatis</p>
                <p className="text-[11px]">
                  Klik tombol di bawah untuk langsung memunculkan konfirmasi instalasi dari sistem Android / Chrome Anda.
                </p>
              </div>

              <button
                onClick={async () => {
                  const success = await onTriggerInstall();
                  if (success) onClose();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-700/30 transition flex items-center justify-center gap-2 transform active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>TAMBAHKAN KE LAYAR UTAMA SEKARANG</span>
              </button>
            </div>
          )}

          {/* iOS Safari Guided Steps */}
          {isIOS && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Panduan Pasang di iPhone / iPad (Safari)
                </h3>
              </div>

              <div className="space-y-2.5">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    1
                  </div>
                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Ketuk tombol Bagikan (Share)</span>
                      <Share2 className="w-4 h-4 text-blue-600 inline" />
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ikon kotak dengan tanda panah ke atas di bilah menu bawah browser Safari iPhone Anda.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    2
                  </div>
                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Pilih "Tambahkan ke Layar Utama"</span>
                      <PlusSquare className="w-4 h-4 text-emerald-700 inline" />
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Gulir daftar menu ke bawah hingga menemukan opsi <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    3
                  </div>
                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-slate-900">
                      Ketuk "Tambah" (Add) di pojok kanan atas
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pintasan aplikasi dengan logo <strong>Presensi MI</strong> akan langsung muncul di Home Screen iPhone Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Android Manual Browser Guide (when prompt was already dismissed or unavailable) */}
          {!isIOS && !isInstallable && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Panduan Pasang di Android (Chrome / Browser Lain)
                </h3>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    1
                  </div>
                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-slate-900">Ketuk Menu Titik Tiga (⋮)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Terletak di sudut kanan atas browser Google Chrome atau browser Android Anda.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    2
                  </div>
                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-slate-900">Pilih "Instal Aplikasi" / "Tambahkan ke Layar Utama"</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilih tombol <strong>Instal</strong> atau <strong>Add to Home screen</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    3
                  </div>
                  <div className="text-xs text-slate-700">
                    <p className="font-bold text-slate-900">Selesai!</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ikon Presensi MI akan langsung siap digunakan di Home Screen HP Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
