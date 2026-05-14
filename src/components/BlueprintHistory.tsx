import React from 'react';
import { History as HistoryIcon, MapPin, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { HistoryItem, getHistory, clearHistory } from '../services/storageService';

interface BlueprintHistoryProps {
  onSelect: (item: HistoryItem) => void;
}

export const BlueprintHistory: React.FC<BlueprintHistoryProps> = ({ onSelect }) => {
  const [history, setHistory] = React.useState<HistoryItem[]>([]);

  React.useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClear = () => {
    if (confirm('Hapus semua riwayat blueprint?')) {
      clearHistory();
      setHistory([]);
    }
  };

  if (history.length === 0) return null;

  return (
    <section className="space-y-8 md:space-y-10">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <HistoryIcon className="w-6 h-6 text-slate-500" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-slate-800">Riwayat Blueprint</h2>
        </div>
        <button 
          onClick={handleClear}
          className="text-[10px] font-semibold text-slate-400 hover:text-rose-500 uppercase tracking-[0.2em] transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Bersihkan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {history.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ y: -6 }}
            whileActive={{ scale: 0.98 }}
            onClick={() => onSelect(item)}
            className="group w-full text-left bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-teal-100 hover:shadow-xl hover:shadow-teal-100/10 transition-all flex items-center gap-6"
          >
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold uppercase tracking-[0.2em]">
                  {item.scale}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold font-mono tracking-wider">
                  {new Date(item.timestamp).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold text-slate-800 group-hover:text-teal-600 transition-colors line-clamp-1">
                {item.title}
              </h3>
              
              <div className="flex items-center gap-5 text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.city}</span>
                </div>
              </div>
            </div>
            
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all">
              <ArrowRight className="w-6 h-6" />
            </div>
          </motion.button>
        ))}
      </div>
      
      <p className="text-center text-[11px] text-slate-400 font-semibold italic tracking-wide">
        "CommunityOS mengingat perjalanan operasional komunitasmu."
      </p>
    </section>
  );
};
