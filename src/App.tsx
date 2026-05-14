import React from 'react';
import { EventForm } from './components/EventForm';
import { BlueprintDisplay } from './components/BlueprintDisplay';
import { LoadingState } from './components/LoadingState';
import { CommunityGuidelines } from './components/CommunityGuidelines';
import { QuickTemplates } from './components/QuickTemplates';
import { generateBlueprint, validateInputWithAI } from './services/geminiService';
import { Blueprint, EventData } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, MessageCircle, AlertCircle, Sparkles } from 'lucide-react';

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
      setLoadingProgress(100);
      setTimeout(() => {
        setBlueprint(result);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 800);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      let message = err.message || 'Gagal membuat blueprint. Pastikan koneksi internet stabil dan coba lagi.';
      
      if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED')) {
        message = 'Akses ditolak (403). Silakan periksa API Key di panel Settings > Secrets.';
      } else if (err.message?.includes('400') || err.message?.includes('API_KEY_INVALID')) {
        message = 'API Key tidak valid. Silakan periksa kembali di panel Settings > Secrets.';
      } else if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        message = 'Quota API habis (429). Silakan coba lagi beberapa saat lagi.';
      }
      
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      {/* Global Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
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
            <span className="text-xl font-display font-extrabold tracking-tight text-slate-800">Community<span className="text-teal-600">OS</span></span>
          </motion.div>
          {blueprint && !loading && (
            <motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setBlueprint(null)}
              className="text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              Ulang Planning
            </motion.button>
          )}
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-24 md:pb-32">
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
              className="space-y-8 md:space-y-10"
            >
              <header className="space-y-4 md:space-y-6 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 md:w-24 md:h-24 rounded-3xl overflow-hidden shadow-2xl shadow-teal-100 border-4 border-white"
                  >
                    <img 
                      src="/icon-512.png" 
                      alt="CommunityOS Logo" 
                      className="w-full h-full object-cover" 
                    />
                  </motion.div>
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5" />
                      AI Planning Assistant
                    </div>
                    <h1 className="text-3xl md:text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-tight">
                      Halo, Teman Perjuangan! 👋
                    </h1>
                  </div>
                </div>
                <p className="text-slate-600 text-sm md:text-lg leading-relaxed max-w-lg">
                  Kami bantu merancang blueprint kegiatan komunitas yang efisien, berdampak, dan dilengkapi <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-semibold whitespace-nowrap">Wellbeing Guard</span> untuk menjaga kesehatan tim.
                </p>
              </header>

              <QuickTemplates onSelect={setPrefillData} disabled={loading} />

              <EventForm onSubmit={handleGenerate} loading={loading} prefill={prefillData} />

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-pulse">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <section className="pt-8 border-t border-slate-100">
                <div className="flex items-center gap-4 text-slate-400 group">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                    <img 
                      src="/icon-512.png" 
                      alt="CommunityOS" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <p className="text-xs leading-relaxed italic max-w-xs">
                    "Dilengkapi dengan <strong>Wellbeing Guard</strong> untuk mendeteksi risiko burnout panitia lebih dini."
                  </p>
                </div>
              </section>

              <CommunityGuidelines />
            </motion.div>
          ) : (
            <motion.div
              key="blueprint"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <BlueprintDisplay blueprint={blueprint} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
