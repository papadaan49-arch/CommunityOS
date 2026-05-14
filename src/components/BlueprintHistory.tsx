import React from 'react';
import { History as HistoryIcon, MapPin, Calendar, ArrowRight, Trash2, Cloud, User as UserIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HistoryItem, getHistory, clearHistory } from '../services/storageService';
import { auth } from '../lib/firebase';
import { getUserBlueprints, BlueprintDocument } from '../services/dbService';
import { onAuthStateChanged } from 'firebase/auth';

interface BlueprintHistoryProps {
  onSelect: (item: HistoryItem) => void;
}

export const BlueprintHistory: React.FC<BlueprintHistoryProps> = ({ onSelect }) => {
  const [localHistory, setLocalHistory] = React.useState<HistoryItem[]>([]);
  const [cloudHistory, setCloudHistory] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState(auth.currentUser);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchCloudHistory();
      } else {
        setCloudHistory([]);
      }
    });

    setLocalHistory(getHistory());
    return () => unsubscribe();
  }, []);

  const fetchCloudHistory = async () => {
    setLoading(true);
    try {
      const blueprints = await getUserBlueprints();
      const mappedHistory: HistoryItem[] = blueprints.map(doc => ({
        id: doc.id,
        cloudId: doc.id,
        title: doc.data.event_meta.title,
        city: doc.data.event_meta.location,
        scale: doc.data.event_meta.scale_classification,
        timestamp: doc.updatedAt?.seconds * 1000 || Date.now(),
        data: doc.data,
        originalData: doc.originalData
      }));
      setCloudHistory(mappedHistory);
    } catch (error) {
      console.error("Failed to fetch cloud history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    const message = user 
      ? 'Bersihkan riwayat sesi lokal? (Blueprint di Cloud tetap tersimpan aman)' 
      : 'Hapus semua riwayat blueprint lokal Anda?';
      
    if (confirm(message)) {
      clearHistory();
      setLocalHistory([]);
    }
  };

  // Combine or choose based on user state
  // If logged in, we show Cloud history primarily. 
  // If guest, we show local history.
  // Actually, some users might have local history before logging in. 
  // But prompt says "Separate guest-mode local history from authenticated user history."
  const displayHistory = user ? cloudHistory : localHistory;

  if (displayHistory.length === 0 && !loading) {
    return (
      <section className="py-12 px-6 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
          <HistoryIcon className="w-8 h-8 text-slate-200" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-800">Belum ada riwayat</h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            Blueprint komunitas pertamamu akan muncul di sini setelah kamu membuatnya.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8 md:space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user ? 'bg-teal-50' : 'bg-slate-100'}`}>
            {user ? <Cloud className="w-6 h-6 text-teal-600" /> : <HistoryIcon className="w-6 h-6 text-slate-500" />}
          </div>
          <div>
            <h2 className="text-2xl font-display font-semibold text-slate-800">
              {user ? 'Arsip Blueprint Cloud' : 'Riwayat Lokal (Guest)'}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {user ? user.email : 'Belum Tersinkronisasi'}
            </p>
          </div>
        </div>
        {!user && localHistory.length > 0 && (
          <button 
            onClick={handleClear}
            className="text-[10px] font-bold text-slate-300 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2 self-end md:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            Bersihkan Riwayat
          </button>
        )}
        {user && (
          <button 
            onClick={fetchCloudHistory}
            disabled={loading}
            className="text-[10px] font-bold text-slate-300 hover:text-teal-600 uppercase tracking-widest transition-colors flex items-center gap-2 self-end md:self-auto"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HistoryIcon className="w-4 h-4" />}
            Refresh Arsip
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 relative">
        {loading && displayHistory.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-4 text-slate-400 italic">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            <p className="text-sm">Menghubungkan ke arsip cloud...</p>
          </div>
        )}

        <AnimatePresence>
          {displayHistory.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileActive={{ scale: 0.98 }}
              onClick={() => onSelect(item)}
              className="group w-full text-left bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-teal-100 hover:shadow-xl hover:shadow-teal-100/5 transition-all flex items-center gap-6"
            >
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${user ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-400'}`}>
                    {item.scale}
                  </span>
                  <span className="text-[10px] text-slate-300 font-bold font-mono tracking-widest">
                    {new Date(item.timestamp).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                
                <h3 className="text-lg md:text-xl font-semibold text-slate-800 group-hover:text-teal-600 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                
                <div className="flex items-center gap-5 text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{item.city}</span>
                  </div>
                </div>
              </div>
              
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                <ArrowRight className="w-5 h-5" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      
      <p className="text-center text-[10px] text-slate-300 font-bold italic tracking-widest leading-relaxed max-w-xs mx-auto">
        {user 
          ? "Blueprint Anda tersimpan aman di infrastruktur cloud CommunityOS."
          : "Riwayat lokal bersifat sementara. Masuk untuk simpan blueprint secara permanen."}
      </p>
    </section>
  );
};
