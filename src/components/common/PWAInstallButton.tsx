import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle2, Share2, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if app is already running in standalone mode (installed)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 3. Listen for browser PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setTimeout(() => setInstalled(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native browser install prompt (Chrome, Edge, Android)
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // Show iOS Safari instructions modal
      setShowIOSModal(true);
    } else {
      // Desktop or general fallback modal
      setShowIOSModal(true);
    }
  };

  // If already running inside installed standalone app, don't clutter the header
  if (isStandalone) {
    return (
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>App Mode</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install EcoRoute as a Mobile or Desktop App"
        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-sm shadow-emerald-900/30 transition-all active:scale-95 border border-emerald-400/40 animate-pulse"
      >
        <Smartphone className="w-3.5 h-3.5 text-white" />
        <span className="hidden sm:inline font-bold">Install App</span>
        <span className="sm:hidden font-bold">Install</span>
      </button>

      {/* iOS & Desktop Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-3xl p-6 max-w-md w-full border border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center p-2.5 shadow-lg shadow-emerald-500/20">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">Install EcoRoute App</h3>
                <p className="text-xs text-slate-400">Run as a fast, native standalone app</p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-sm">
                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  Safari on iPhone / iPad Steps:
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Tap the <b className="text-white">Share button</b> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> at the bottom toolbar of Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Scroll down and tap <b className="text-white">Add to Home Screen</b> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Tap <b className="text-white">Add</b> in the top right corner. EcoRoute will appear as an app icon!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-sm">
                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  Chrome / Edge / Android Steps:
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Look for the <b className="text-white">Install icon</b> (<Download className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />) on the right side of your browser address bar.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Click <b className="text-white">Install</b> when prompted. The app will launch in a standalone window with its own icon in your app drawer or taskbar!
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-sm text-slate-200 transition-colors"
            >
              Got it, close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
