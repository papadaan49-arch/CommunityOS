import React from 'react';
import { EventForm } from './components/EventForm';
import { BlueprintDisplay } from './components/BlueprintDisplay';
import { LoadingState } from './components/LoadingState';
import { CommunityGuidelines } from './components/CommunityGuidelines';
import { QuickTemplates } from './components/QuickTemplates';
import { BlueprintHistory } from './components/BlueprintHistory';
import { PortfolioDashboard } from './components/PortfolioDashboard';
import { BrandLogo } from './components/BrandLogo';
import { DonationModal } from './components/DonationModal';
import { generateBlueprint, validateInputWithAI, refineBlueprint } from './services/geminiService';
import { saveBlueprintToHistory, HistoryItem, clearHistory as clearLocalHistory, clearSessionCache } from './services/storageService';
import { saveBlueprintToCloud, getBlueprintFromCloud, updateBlueprintInCloud } from './services/dbService';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Blueprint, EventData } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, MessageCircle, AlertCircle, Sparkles, LogIn, LogOut, User as UserIcon, Link, Coffee, BarChart3, ArrowLeft } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [blueprint, setBlueprint] = React.useState<Blueprint | null>(null);
  const [currentBlueprintId, setCurrentBlueprintId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = React.useState(0);
  const [prefillData, setPrefillData] = React.useState<EventData | null>(null);
  const [currentEventData, setCurrentEventData] = React.useState<EventData | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [isDonationOpen, setIsDonationOpen] = React.useState(false);
  const [activeView, setActiveView] = React.useState<'home' | 'portfolio'>('home');
  const [targetOrgId, setTargetOrgId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const orgId = params.get('orgId');
    
    if (id) {
      loadCloudBlueprint(id);
    } else if (orgId) {
      setTargetOrgId(orgId);
      setActiveView('portfolio');
    }
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
    "Menganalisis kondisi komunitas...",
    "Menyesuaikan strategi operasional...",
    "Menimbang risiko lelah mental...",
    "Menilai kerumitan logistik...",
    "Memetakan ritme kolaborasi...",
    "Finalisasi blueprint komunitas...",
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
    setCurrentEventData(data);
    try {
      // Step 1: AI Sanity Check
      const validation = await validateInputWithAI(data);
      if (!validation.isValid) {
        throw new Error(validation.message || 'Input kegiatan masih terlalu singkat untuk dianalisis.');
      }

      // If valid but has an insight message, show it as a tactical tip
      if (validation.message) {
        toast.info("Insight Strategis", {
          description: validation.message,
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
      if (auth.currentUser) {
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
      setError('Terjadi gangguan koneksi ke server AI. Silakan coba lagi dalam beberapa saat.');
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
      setError('Gagal memperbarui blueprint. Silakan coba lagi beberapa saat.');
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setBlueprint(item.data);
    setCurrentEventData(item.originalData || null);
    setPrefillData(item.originalData || null);
    setCurrentBlueprintId(item.cloudId || null);
    
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
    // Clear ID from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('id');
    window.history.pushState({}, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        // Save public profile
        const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('./lib/firebase');
        await setDoc(doc(db, 'users', user.uid, 'public', 'profile'), {
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Also save indexed email for lookup
        await setDoc(doc(db, 'users_by_email', user.email || ''), {
          uid: user.uid,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      toast.success("Berhasil masuk! Sekarang blueprint Anda akan tersimpan di cloud.");
    } catch (err) {
      toast.error("Gagal masuk. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      <Toaster position="top-center" expand={false} richColors />
      {/* Global Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 md:gap-3"
          >
            <BrandLogo size="xs md:sm" />
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-display font-bold text-slate-900 leading-tight">CommunityOS</span>
              <span className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase tracking-widest">AI OS Ver. 1</span>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-2 md:gap-3">
            {user && (
              <button 
                onClick={() => setActiveView(prev => prev === 'home' ? 'portfolio' : 'home')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all border ${activeView === 'portfolio' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                {activeView === 'portfolio' ? 'Tutup Portofolio' : 'Portofolio Di Sini'}
              </button>
            )}
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
                  className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${currentBlueprintId ? 'bg-teal-50 text-teal-700 hover:bg-teal-100' : 'bg-slate-50 text-slate-300 cursor-not-allowed'} transition-all`}
                  disabled={!currentBlueprintId}
                >
                  <Link className="w-3.5 h-3.5" />
                  Bagikan
                </button>
                <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-100">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {user.displayName?.charAt(0) || user.email?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={async () => {
                      await logout();
                      clearLocalHistory();
                      clearSessionCache();
                      setBlueprint(null);
                      setCurrentBlueprintId(null);
                      toast.success("Berhasil keluar. Riwayat lokal dibersihkan.");
                    }}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
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

      <main className="max-w-2xl mx-auto content-padding pt-8 md:pt-20 pb-20 md:pb-32">
        <AnimatePresence mode="wait">
          {activeView === 'portfolio' ? (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {targetOrgId && (
                <button 
                  onClick={() => {
                    setTargetOrgId(null);
                    setActiveView('home');
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('orgId');
                    window.history.pushState({}, '', newUrl);
                  }}
                  className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-teal-600 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Kembali ke Dashboard Utama
                </button>
              )}
              <PortfolioDashboard targetOrgId={targetOrgId} />
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState 
                message={loadingMessages[loadingMessageIndex]} 
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
                      AI Planning Assistant
                    </div>
                    <h1 className="text-3xl md:text-6xl font-display font-bold text-slate-900 tracking-tight leading-[1.2] md:leading-[1.1]">
                      Halo, Teman Perjuangan! 👋
                    </h1>
                  </div>
                </div>
                <p className="text-slate-600 text-base md:text-xl leading-[1.7] md:leading-[1.8] max-w-xl mx-auto md:mx-0">
                  Sistem operasi komunitas yang terus berevolusi. Rancang blueprint yang efisien, berdampak, dan dilengkapi <span className="text-teal-600 font-semibold">Wellbeing Guard</span> berbasis <span className="italic">data lapangan</span>.
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
                onRevision={handleRevision} 
                onRefine={handleRefine}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <DonationModal 
        isOpen={isDonationOpen} 
        onClose={() => setIsDonationOpen(false)} 
        userEmail={user?.email} 
      />
    </div>
  );
}
