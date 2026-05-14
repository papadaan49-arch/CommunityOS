import React from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can add to home screen
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Filter for common mobile browsers (Android Chrome, etc.)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Also check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const closePromo = () => {
    setIsVisible(false);
    // Optional: store in session storage to not show again in same session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Check if dismissed in this session
  React.useEffect(() => {
    if (sessionStorage.getItem('pwa-prompt-dismissed') === 'true') {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-4 right-4 z-[60] md:left-auto md:right-6 md:max-w-sm"
      >
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-1">
            <button 
              onClick={closePromo}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          
          <div className="w-12 h-12 bg-white rounded-xl flex-shrink-0 flex items-center justify-center p-2 shadow-inner">
            <img src="/icon-512.png" alt="CommunityOS" className="w-full h-full object-cover rounded-md" />
          </div>
          
            <div className="flex-1 space-y-1 pr-6">
            <h4 className="text-sm font-semibold">Pasang CommunityOS ✨</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Akses cepat blueprint kegiatan komunitas langsung dari layar utama kamu tanpa buka browser lagi.
            </p>
          </div>
          
          <button
            onClick={handleInstall}
            className="bg-teal-500 hover:bg-teal-400 text-slate-900 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 shadow-lg shadow-teal-500/20 uppercase"
          >
            <Download className="w-3.5 h-3.5" />
            PASANG
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
