import React from 'react';
import { EventForm } from './components/EventForm';
import { BlueprintDisplay } from './components/BlueprintDisplay';
import { LoadingState } from './components/LoadingState';
import { CommunityGuidelines } from './components/CommunityGuidelines';
import { QuickTemplates } from './components/QuickTemplates';
import { InstallPWA } from './components/InstallPWA';
import { BlueprintHistory } from './components/BlueprintHistory';
import { generateBlueprint, validateInputWithAI } from './services/geminiService';
import { saveBlueprintToHistory, HistoryItem } from './services/storageService';
import { generateMetadata, saveOperationalMetadata } from './services/metadataService';
import { Blueprint, EventData } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, MessageCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Toaster } from 'sonner';

export default function App() {
  const [blueprint, setBlueprint] = React.useState<Blueprint | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = React.useState(0);
  const [prefillData, setPrefillData] = React.useState<EventData | null>(null);

  const loadingMessages = [
    "Membaca konteks komunitas...",
    "Menganalisis kapasitas panitia...",
    "Menghitung risiko burnout...",
    "Menyusun strategi operasional...",
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
    try {
      // Step 1: AI Sanity Check
      const validation = await validateInputWithAI(data);
      if (!validation.isValid) {
        throw new Error(validation.message || 'Input kegiatan masih terlalu singkat untuk dianalisis.');
      }

      // Step 2: Generate Blueprint
      const result = await generateBlueprint(data);
      
      // Step 3: Save to history
      saveBlueprintToHistory(result, data);
      
      // Step 4: Save operational metadata to Firestore (silent)
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

  const handleHistorySelect = (item: HistoryItem) => {
    setBlueprint(item.data);
    setPrefillData(item.originalData || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRevision = () => {
    setBlueprint(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      <Toaster position="top-center" expand={false} richColors />
      {/* Global Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 content-padding py-5 md:py-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2.5"
          >
            <img 
              src="/icon-512.png" 
              alt="CommunityOS Logo" 
              className="w-9 h-9 rounded-xl shadow-lg shadow-teal-200 object-cover" 
            />
            <span className="text-xl font-display font-bold text-slate-800">Community<span className="text-teal-600">OS</span></span>
          </motion.div>
          {blueprint && !loading && (
            <motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setBlueprint(null)}
              className="text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              Ulang Planning
            </motion.button>
          )}
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
                    className="w-20 h-20 md:w-28 md:h-28 rounded-[2rem] overflow-hidden shadow-2xl shadow-teal-100 border-4 border-white"
                  >
                    <img 
                      src="/icon-512.png" 
                      alt="CommunityOS Logo" 
                      className="w-full h-full object-cover" 
                    />
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
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all flex-shrink-0">
                    <img 
                      src="/icon-512.png" 
                      alt="CommunityOS" 
                      className="w-full h-full object-cover" 
                    />
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
              <BlueprintDisplay blueprint={blueprint} onRevision={handleRevision} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <InstallPWA />
    </div>
  );
}
