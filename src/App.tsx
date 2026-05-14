import React from 'react';
import { EventForm } from './components/EventForm';
import { BlueprintDisplay } from './components/BlueprintDisplay';
import { LoadingState } from './components/LoadingState';
import { CommunityGuidelines } from './components/CommunityGuidelines';
import { QuickTemplates } from './components/QuickTemplates';
import { InstallPWA } from './components/InstallPWA';
import { BlueprintHistory } from './components/BlueprintHistory';
import { BrandLogo } from './components/BrandLogo';
import { generateBlueprint, validateInputWithAI, refineBlueprint } from './services/geminiService';
import { saveBlueprintToHistory, HistoryItem, clearHistory as clearLocalHistory, clearSessionCache } from './services/storageService';
import { generateMetadata, saveOperationalMetadata } from './services/metadataService';
import { saveBlueprintToCloud, getBlueprintFromCloud, updateBlueprintInCloud } from './services/dbService';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Blueprint, EventData } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, MessageCircle, AlertCircle, Sparkles, LogIn, LogOut, User as UserIcon, Link } from 'lucide-react';
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

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      loadCloudBlueprint(id);
    }
  }, []);

  const loadCloudBlueprint = async (id: string) => {
    setLoading(true);
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
      setError("Gagal memuat blueprint dari cloud.");
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
    let interval: NodeJS.Timeout;
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

  const handleGenerate = async (data: EventData) => {
    setLoading(true);
    setError(null);
    setCurrentEventData(data);
    try {
      // Step 1: AI Sanity Check
      const validation = await validateInputWithAI(data);
      if (!validation.isValid) {
        throw new Error(validation.message || 'Input kegiatan masih terlalu singkat untuk dianalisis.');
      }

      // Step 2: Generate Blueprint
      const result = await generateBlueprint(data);
      
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
      
      // Step 5: Save operational metadata to Firestore (silent)
      const metadata = generateMetadata(data, result);
      saveOperationalMetadata(metadata);
      
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
      
      // If it's a specific human-centered validation message from AI, show it
      if (errorMessage.includes('Input kegiatan') || errorMessage.includes('Tambahkan detail')) {
        setError(errorMessage);
        return;
      }
      
      // Default human-centered error message for technical failures
      let message = 'Sistem sedang menyesuaikan kapasitas operasional agar blueprint tetap stabil dan realistis. Silakan coba lagi beberapa saat lagi.';
      
      if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('400') || errorMessage.includes('API_KEY_INVALID')) {
        message = 'CommunityOS sedang dalam proses pemeliharaan ringan untuk menjaga kualitas layanan. Mohon maaf atas ketidaknyamanan ini.';
      } else if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        message = 'CommunityOS sedang menerima trafik cukup tinggi. Silakan coba kembali beberapa saat lagi 🙏';
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
        message = 'Koneksi ke sistem sedang terputus. Silakan periksa jaringan internet kamu atau coba kembali dalam beberapa saat.';
      }
      
      setError(message);
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
      setError('Gagal memperbarui blueprint. Sistem sedang melakukan penyesuaian kapasitas, silakan coba lagi.');
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
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <BrandLogo size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-display font-bold text-slate-900 leading-tight">CommunityOS</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">AI Operating System</span>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-3">
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

      <main className="max-w-2xl mx-auto content-padding pt-12 md:pt-20 pb-24 md:pb-32">
        <AnimatePresence mode="wait">
          {loading ? (
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
              <header className="space-y-8 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="border-4 border-white rounded-[2rem] shadow-2xl shadow-teal-100"
                  >
                    <BrandLogo size="lg" />
                  </motion.div>
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Planning Assistant
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900">
                      Halo, Teman Perjuangan! 👋
                    </h1>
                  </div>
                </div>
                <p className="text-slate-600 text-lg md:text-xl leading-[1.8] max-w-xl">
                  Kami bantu merancang blueprint kegiatan komunitas yang efisien, berdampak, dan dilengkapi <span className="text-teal-600 font-semibold">Wellbeing Guard</span> untuk menjaga kesehatan tim.
                </p>
              </header>

              <div className="space-y-16 md:space-y-20">
                <QuickTemplates onSelect={setPrefillData} disabled={loading} />
                <EventForm onSubmit={handleGenerate} loading={loading} prefill={prefillData} />
                <BlueprintHistory onSelect={handleHistorySelect} />
              </div>

              {error && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-start gap-4 text-red-600 text-sm">
                  <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <section className="pt-12 border-t border-slate-100/50">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-slate-400 group text-center md:text-left">
                  <div className="flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <BrandLogo size="md" variant="wellbeing" />
                  </div>
                  <p className="text-sm leading-relaxed italic max-w-md">
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
                onRevision={handleRevision} 
                onRefine={handleRefine}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <InstallPWA />
    </div>
  );
}
