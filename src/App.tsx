import React from 'react';
import { EventForm } from './components/EventForm';
import { BlueprintDisplay } from './components/BlueprintDisplay';
import { LoadingState } from './components/LoadingState';
import { CommunityGuidelines } from './components/CommunityGuidelines';
import { QuickTemplates } from './components/QuickTemplates';
import { BlueprintHistory } from './components/BlueprintHistory';
import { BrandLogo } from './components/BrandLogo';
import { DonationModal } from './components/DonationModal';
import { CreatorProfile } from './components/CreatorProfile';
import { generateBlueprint, validateInputWithAI, refineBlueprint } from './services/geminiService';
import { saveBlueprintToHistory, HistoryItem, clearHistory as clearLocalHistory, clearSessionCache } from './services/storageService';
import { saveBlueprintToCloud, getBlueprintFromCloud, updateBlueprintInCloud, getAppSetting, updateBlueprintRealizationStatus, restoreLocalFromIndexedDB } from './services/dbService';
import { auth, loginWithGoogle, logout, onAuthStateChanged, User } from './services/firebase';
import { Blueprint, EventData } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, MessageCircle, AlertCircle, Sparkles, LogIn, LogOut, User as UserIcon, Link, Coffee, BarChart3, ArrowLeft, X, ExternalLink, Monitor } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [blueprint, setBlueprint] = React.useState<Blueprint | null>(null);
  const [currentBlueprintId, setCurrentBlueprintId] = React.useState<string | null>(null);
  const [realizationStatus, setRealizationStatus] = React.useState<'draft' | 'ready' | 'realized'>('draft');
  const [realizationDetails, setRealizationDetails] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = React.useState(0);
  const [prefillData, setPrefillData] = React.useState<EventData | null>(null);
  const [currentEventData, setCurrentEventData] = React.useState<EventData | null>(null);
   const [user, setUser] = React.useState<User | null>(null);
  const [isDonationOpen, setIsDonationOpen] = React.useState(false);
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const [guestName, setGuestName] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [broadcast, setBroadcast] = React.useState<string | null>(null);
  const [isBroadcastDismissed, setIsBroadcastDismissed] = React.useState(false);
  const [appVersion, setAppVersion] = React.useState<string>('Beta');

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [msg, version] = await Promise.all([
          getAppSetting('community_broadcast'),
          getAppSetting('app_version')
        ]);
        if (msg) {
          setBroadcast(msg);
        }
        if (version) {
          setAppVersion(version);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, []);

  React.useEffect(() => {
    // Memeriksa apakah ada sesi Relawan Mandiri (offline guest) yang aktif secara lokal
    const checkGuestSession = () => {
      const savedGuest = localStorage.getItem('communityos_guest_user');
      if (savedGuest) {
        try {
          setUser(JSON.parse(savedGuest));
          return true;
        } catch (e) {
          console.error("Gagal memproses sesi tamu lokal:", e);
        }
      }
      return false;
    };

    const runInit = async () => {
      try {
        await restoreLocalFromIndexedDB();
      } catch (e) {
        console.error("Gagal memulihkan cadangan dari IndexedDB:", e);
      }
      checkGuestSession();
    };

    runInit();

    let unsubscribe = () => {};
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (u) {
          setUser(u);
          localStorage.removeItem('communityos_guest_user');
          try {
            const { recalculateAndSyncOrganizationStats } = await import('./services/dbService');
            await recalculateAndSyncOrganizationStats();
          } catch (e) {
            console.warn("Auto-sync database gagal pada saat login:", e);
          }
        } else {
          const guestActive = localStorage.getItem('communityos_guest_user');
          if (guestActive) {
            try {
              setUser(JSON.parse(guestActive));
            } catch (e) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      });
    }
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (id) {
      loadCloudBlueprint(id);
    }
  }, []);

  React.useEffect(() => {
    const checkAI = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (!data.ai_configured) {
            toast.warning("Konfigurasi AI belum lengkap. Harap masukkan API Key di panel Settings > Secrets agar CommunityOS bisa bekerja.", {
              duration: 10000
            });
          }
        }
      } catch (err) {
        console.error("Health check failed", err);
      }
    };
    checkAI();
  }, []);

  const loadCloudBlueprint = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const doc = await getBlueprintFromCloud(id);
      if (doc) {
        setBlueprint(doc.data);
        setCurrentEventData(doc.originalData);
        setCurrentBlueprintId(doc.id);
        setRealizationStatus(doc.realizationStatus || 'draft');
        setRealizationDetails(doc.realizationDetails || null);
      } else {
        setError("Blueprint tidak ditemukan atau Anda tidak memiliki akses.");
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memuat blueprint. Pastikan koneksi internet Anda stabil atau link valid.");
    } finally {
      setLoading(false);
    }
  };

  const loadingMessages = [
    "Membuka ruang diskusi...",
    "Memosisikan diri sebagai partner...",
    "Menganalisis realitas lapangan...",
    "Menghitung beban kerja tim...",
    "Mencari referensi strategis...",
    "Menyusun usulan terbaik untukmu...",
  ];

  React.useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingProgress(0);
      setLoadingMessageIndex(0);
      
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + Math.floor(Math.random() * 5) + 2;
        });
        
        setLoadingMessageIndex((prev) => {
          if (prev >= loadingMessages.length - 1) return prev;
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async (data: EventData & { mode?: 'quick' | 'strategic' }) => {
    setLoading(true);
    setError(null);
    setRealizationStatus('draft');
    setRealizationDetails(null);
    setCurrentEventData(data);
    try {
      // Step 1: AI Sanity Check
      const validation = await validateInputWithAI(data);
      if (!validation.isValid) {
        throw new Error(validation.feedback_taktis || 'Input kegiatan masih terlalu singkat untuk dianalisis.');
      }

      // If valid but has an insight message, show it as a tactical tip
      if (validation.feedback_taktis) {
        toast.info("Insight Strategis", {
          description: validation.feedback_taktis,
          duration: 8000,
        });
      }

      // Step 2: Generate Blueprint
      const generateTimeout = setTimeout(() => {
        if (loading) {
          setError("Proses memakan waktu lebih lama dari biasanya. Silakan periksa koneksi atau coba lagi.");
          setLoading(false);
        }
      }, 45000); // 45s safety timeout

      const result = await generateBlueprint(data);
      clearTimeout(generateTimeout);
      
      let cloudIdForHistory = null;
      // Step 4: Save to Cloud if logged in
      if (auth?.currentUser) {
        const cloudId = await saveBlueprintToCloud(result, data);
        if (cloudId) {
          cloudIdForHistory = cloudId;
          setCurrentBlueprintId(cloudId);
          // Update URL without reload
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('id', cloudId);
          window.history.pushState({ id: cloudId }, '', newUrl);
        }
      }

      // Step 3: Save to history (Local + Cloud ID if available)
      saveBlueprintToHistory(result, data, cloudIdForHistory);
      
      setLoadingProgress(100);
      setTimeout(() => {
        setBlueprint(result);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 800);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      
      const errorMessage = err.message || '';
      
      // AI insights or instructions on how to improve the input
      if (errorMessage.includes('Input') || errorMessage.includes('analisis') || errorMessage.includes('vague')) {
        setError(errorMessage);
        return;
      }
      
      // Default human-centered error message for technical failures
      const finalError = errorMessage || 'Terjadi gangguan koneksi ke server AI. CommunityOS sedang mencoba pemulihan otomatis, silakan coba lagi dalam beberapa saat.';
      setError(finalError);
    }
  };

  const handleRefine = async (instructions: string) => {
    if (!blueprint || !currentEventData) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await refineBlueprint(blueprint, instructions, currentEventData);
      
      // Update cloud version if exists
      if (currentBlueprintId) {
        await updateBlueprintInCloud(currentBlueprintId, result, currentEventData);
      }
      
      // Save revised version to history too
      saveBlueprintToHistory(result, currentEventData, currentBlueprintId);
      
      setLoadingProgress(100);
      setTimeout(() => {
        setBlueprint(result);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 800);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      const errorMessage = err.message || 'Gagal memperbarui blueprint. Silakan coba lagi beberapa saat.';
      setError(errorMessage);
    }
  };

  const handleHistorySelect = async (item: HistoryItem) => {
    setBlueprint(item.data);
    setCurrentEventData(item.originalData || null);
    setPrefillData(item.originalData || null);
    setCurrentBlueprintId(item.cloudId || null);
    setRealizationStatus('draft');
    setRealizationDetails(null);
    
    // If it has cloud ID, load its real-time status dynamically
    if (item.cloudId) {
      try {
        const doc = await getBlueprintFromCloud(item.cloudId);
        if (doc) {
          setRealizationStatus(doc.realizationStatus || 'draft');
          setRealizationDetails(doc.realizationDetails || null);
        }
      } catch (err) {
        console.error("Failed to fetch cloud status for history item", err);
      }
    }
    
    // Update URL
    const newUrl = new URL(window.location.href);
    if (item.cloudId) {
      newUrl.searchParams.set('id', item.cloudId);
    } else {
      newUrl.searchParams.delete('id');
    }
    window.history.pushState({}, '', newUrl);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    clearLocalHistory();
    clearSessionCache();
    toast.success("Riwayat telah dibersihkan.");
    // Force re-render if needed, though most components listen to state
    window.location.reload(); 
  };

  const handleRevision = () => {
    setBlueprint(null);
    setCurrentBlueprintId(null);
    setRealizationStatus('draft');
    setRealizationDetails(null);
    // Clear ID from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('id');
    window.history.pushState({}, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        setUser(user);
        setIsLoginOpen(false);
        toast.success("Berhasil masuk! Sesi cloud disinkronkan & database dipulihkan.");
      }
    } catch (err: any) {
      console.warn("Gagal masuk via Google:", err);
      const isIframe = window.self !== window.top;
      if (isIframe) {
        toast.error("Masuk Google diblokir oleh iFrame. Silakan gunakan 'Buka di Tab Baru' atau masuk dengan Mode Gerilya Offline.");
      } else {
        toast.error("Gagal masuk. Silakan coba lagi.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuestLogin = (customName: string) => {
    const name = customName.trim() || 'Relawan Mandiri';
    const guestUid = 'gerilya_guest_' + Math.random().toString(36).substring(2, 9);
    const guestUser = {
      uid: guestUid,
      displayName: name,
      email: 'relawan.mandiri@communityos.id',
      photoURL: null,
      emailVerified: true,
      isGuest: true
    };
    localStorage.setItem('communityos_guest_user', JSON.stringify(guestUser));
    setUser(guestUser as any);
    setIsLoginOpen(false);
    toast.success(`Selamat datang, ${name}! Sesi lokal Gerilya Mode berhasil diaktifkan.`);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      <Toaster position="top-center" expand={false} richColors />
      {/* Global Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 md:gap-3"
          >
            <BrandLogo size="xs md:sm" />
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-display font-bold text-slate-900 leading-tight">CommunityOS</span>
              <span className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                {appVersion.toLowerCase() === 'beta' ? 'AI OS Beta' : `AI OS Ver. ${appVersion}`}
              </span>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setIsDonationOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all border border-rose-100/50"
            >
              <Coffee className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span className="hidden sm:inline">Traktir Kopi</span>
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const url = window.location.origin + '?id=' + currentBlueprintId;
                    navigator.clipboard.writeText(url);
                    toast.success("Link kolaborasi disalin!");
                  }}
                  className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium ${currentBlueprintId ? 'bg-teal-50 text-teal-700 hover:bg-teal-100' : 'bg-slate-50 text-slate-300 cursor-not-allowed'} transition-all`}
                  disabled={!currentBlueprintId}
                  title="Bagikan Link Kolaborasi"
                >
                  <Link className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bagikan</span>
                </button>
                <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
                  <div className="flex flex-col items-end mr-1 text-right">
                    <span className="text-[10px] font-bold text-slate-700 leading-none">
                      {user.displayName || 'Pengguna'}
                    </span>
                    {(user as any).isGuest && (
                      <span className="text-[7px] font-extrabold text-teal-600 uppercase tracking-widest leading-none mt-1">
                        Gerilya Mode
                      </span>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-100">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-teal-50 flex items-center justify-center text-[10px] font-bold text-teal-600">
                        🎒
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        await logout();
                      } catch (e) {
                        // ignore failures during offline logout
                      }
                      localStorage.removeItem('communityos_guest_user');
                      clearLocalHistory();
                      clearSessionCache();
                      setUser(null);
                      setBlueprint(null);
                      setCurrentBlueprintId(null);
                      toast.success("Berhasil keluar. Sesi telah dibersihkan.");
                    }}
                    className="text-slate-300 hover:text-red-500 transition-colors pointer-events-auto cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm active:scale-95 cursor-pointer pointer-events-auto"
              >
                Masuk
              </button>
            )}
            {blueprint && !loading && (
              <button 
                onClick={handleRevision}
                className="text-xs font-semibold text-slate-400 hover:text-teal-600 transition-colors px-2 py-1 rounded-md"
              >
                Ulang
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Broadcast Banner */}
      {broadcast && !isBroadcastDismissed && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-teal-50 border-b border-teal-100 px-4 py-3 text-slate-700"
        >
          <div className="max-w-4xl mx-auto flex items-start sm:items-center justify-between gap-3 text-left">
            <div className="flex gap-2.5 items-start">
              <span className="text-sm select-none">📢</span>
              <p className="text-xs font-semibold leading-relaxed text-slate-700">
                {broadcast}
              </p>
            </div>
            <button
              onClick={() => setIsBroadcastDismissed(true)}
              className="text-[10px] font-bold uppercase tracking-wider text-teal-600 hover:text-teal-800 transition-colors pr-1 self-start sm:self-center"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      )}

      {user && (user as any).isGuest && (
        <div className="bg-teal-500/10 border-b border-teal-500/20 px-4 py-2.5 text-teal-800 text-[11px] font-bold tracking-wide text-center flex items-center justify-center gap-1.5 shadow-sm">
          <span>🎒</span> 
          <span>Mode Gerilya Aktif (Offline-First): Seluruh data disimpan secara lokal dengan aman di perangkat Anda. 100% Mandiri!</span>
        </div>
      )}

      <main className="max-w-4xl mx-auto content-padding pt-safe-area pt-4 md:pt-12 pb-safe-area pb-16 md:pb-24">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState 
                message={`${loadingMessages[loadingMessageIndex]}${currentEventData?.mode === 'strategic' ? ' (Deep Dive Mode)' : ''}`} 
                progress={loadingProgress} 
              />
            </motion.div>
          ) : !blueprint ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-16 md:space-y-28"
            >
              <header className="space-y-6 md:space-y-8 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex-shrink-0"
                  >
                    <BrandLogo size="md md:lg" />
                  </motion.div>
                  <div className="space-y-3 md:space-y-4">
                    <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-widest border border-teal-100/50">
                      <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5" />
                      Your Strategic Sparring Partner
                    </div>
                    <h1 className="text-3xl md:text-6xl font-display font-bold text-slate-900 tracking-tight leading-[1.2] md:leading-[1.1]">
                      Halo, Rekan Perjuangan! 👋
                    </h1>
                  </div>
                </div>
                <p className="text-slate-600 text-base md:text-xl leading-[1.7] md:leading-[1.8] max-w-xl mx-auto md:mx-0">
                  Sistem operasi komunitas yang dirancang untuk menjadi teman diskusi strategismu. Jelajahi blueprint yang logis, grounded, dan dilengkapi <span className="text-teal-600 font-semibold">Wellbeing Guard</span> demi keberlanjutan bersama.
                </p>
              </header>

              <div className="space-y-12 md:space-y-20">
                <QuickTemplates onSelect={setPrefillData} disabled={loading} />
                <div className="pt-2">
                  <EventForm 
                    onSubmit={handleGenerate} 
                    loading={loading} 
                    prefill={prefillData} 
                    isLoggedIn={!!user}
                    userEmail={user?.email}
                    onLoginRequest={handleLogin}
                  />
                </div>
                <BlueprintHistory onSelect={handleHistorySelect} />
              </div>

              {error && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-start gap-4 text-red-600 text-sm">
                  <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <section className="pt-8 md:pt-12 border-t border-slate-100/50">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-slate-400 group text-center md:text-left bg-white/40 p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-slate-50">
                  <div className="flex-shrink-0">
                    <BrandLogo size="sm md:md" variant="wellbeing" />
                  </div>
                  <p className="text-[13px] md:text-sm leading-relaxed italic max-w-md font-medium text-slate-500">
                    "Dilengkapi dengan <strong>Wellbeing Guard</strong> untuk mendeteksi risiko burnout panitia lebih dini, karena komunitas hebat dimulai dari tim yang sehat."
                  </p>
                </div>
              </section>

              <div className="pt-8">
                <CommunityGuidelines />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="blueprint"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <BlueprintDisplay 
                blueprint={blueprint} 
                blueprintId={currentBlueprintId}
                userEmail={user?.email}
                initialRealizationStatus={realizationStatus}
                initialRealizationDetails={realizationDetails}
                originalEventData={currentEventData}
                onUpdateRealizationStatus={(status, details) => {
                  setRealizationStatus(status);
                  if (details) setRealizationDetails(details);
                }}
                onRevision={handleRevision} 
                onRefine={handleRefine}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <CreatorProfile userEmail={user?.email} />
      </main>

      <DonationModal 
        isOpen={isDonationOpen} 
        onClose={() => setIsDonationOpen(false)} 
        userEmail={user?.email} 
      />

      {/* Elegant Login / Database Restore Dialog */}
      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 p-6 md:p-8 space-y-6 text-left"
            >
              {/* Close button */}
              <button 
                onClick={() => setIsLoginOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors pointer-events-auto cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <div className="inline-flex p-3 bg-teal-50 rounded-xl text-teal-600 mb-2">
                  <UserIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-display font-semibold text-slate-800 font-sans">Masuk ke CommunityOS</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Pilih metode masuk untuk menyelaraskan blueprint kegiatan Anda secara rill di cloud atau kelola mandiri secara offline.
                </p>
              </div>

              {/* Warning inside iframe */}
              {window.self !== window.top && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100/70 text-amber-800 text-xs flex gap-2.5 items-start font-sans">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold leading-none">Iframe Terdeteksi (AI Studio Preview)</p>
                    <p className="leading-relaxed text-[11px] text-amber-700">
                      Login Google Pop-up diblokir oleh iFrame browser demi keamanan. Silakan gunakan <strong>Mode Gerilya</strong> secara instan atau buka aplikasi di tab baru.
                    </p>
                    <button 
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="inline-flex items-center gap-1 font-bold text-amber-900 border-b border-amber-900/30 hover:border-amber-900 shrink-0 text-[10px] mt-1.5 transition-all pointer-events-auto cursor-pointer"
                    >
                      Buka di Tab Baru <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                {/* Google Sign-in Option */}
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 pointer-events-auto"
                >
                  {isLoggingIn ? (
                    <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12.24 10.285V14.4h6.818c-.29 1.64-1.925 4.825-6.818 4.825-4.225 0-7.67-3.495-7.67-7.8s3.445-7.8 7.67-7.8c2.4 0 4.015 1.025 4.935 1.91l3.3-3.175C18.33 1.155 15.54 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c7.055 0 11.75-4.965 11.75-11.97 0-.795-.085-1.4-.195-2.225H12.24z"/>
                    </svg>
                  )}
                  <span className="font-sans">{isLoggingIn ? "Menghubungkan..." : "Masuk via Google Cloud"}</span>
                </button>

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Atau</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                {/* Local Guest Option ("Mode Gerilya") */}
                <div className="bg-slate-50/70 rounded-xl border border-slate-100 p-4 space-y-3 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-sm select-none">🎒</span>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Mode Gerilya Offline-First</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Anda (Opsional)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Relawan Mandiri" 
                      value={guestName} 
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-500 transition-colors pointer-events-auto"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleGuestLogin(guestName);
                        }
                      }}
                    />
                  </div>

                  <button 
                    onClick={() => handleGuestLogin(guestName)}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer pointer-events-auto"
                  >
                    Masuk Instan (Bypass Iframe)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
