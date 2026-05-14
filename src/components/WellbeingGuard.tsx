import React from 'react';
import { ShieldCheck, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Blueprint } from '../types';

interface Props {
  guard: Blueprint['wellbeing_guard'];
}

export const WellbeingGuard: React.FC<Props> = ({ guard }) => {
  const isWarning = guard.risk_level === 'Amber' || guard.risk_level === 'Red';
  
  const theme = {
    Red: {
      bg: 'bg-rose-50/50',
      border: 'border-rose-100/50',
      icon: 'text-rose-500',
      badge: 'bg-rose-100/30 text-rose-600',
      accent: 'bg-rose-500',
      glow: 'shadow-rose-100'
    },
    Amber: {
      bg: 'bg-amber-50/50',
      border: 'border-amber-100/50',
      icon: 'text-amber-500',
      badge: 'bg-amber-100/30 text-amber-600',
      accent: 'bg-amber-500',
      glow: 'shadow-amber-100'
    },
    Green: {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-100/50',
      icon: 'text-emerald-500',
      badge: 'bg-emerald-100/30 text-emerald-600',
      accent: 'bg-emerald-500',
      glow: 'shadow-emerald-100'
    }
  }[guard.risk_level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 1 }}
      className={`p-0.5 rounded-3xl bg-gradient-to-br transition-all duration-700 ${
        guard.risk_level === 'Red' ? 'from-rose-100 to-rose-50' : 
        guard.risk_level === 'Amber' ? 'from-amber-100 to-amber-50' : 
        'from-emerald-100 to-emerald-50'
      }`}
    >
      <div className={`p-6 md:p-8 rounded-[calc(1.5rem+4px)] h-full ${theme.bg} border ${theme.border}`}>
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-lg shadow-black/5`}>
              <img 
                src="/icon-512.png" 
                alt="CommunityOS Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-display font-extrabold text-slate-800 tracking-tight">Wellbeing Guard</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[9px] md:text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
                  Level Risiko: {guard.risk_level}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mb-6 md:mb-8">
          <div className="absolute -left-5 md:-left-6 top-0 bottom-0 w-0.5 md:w-1 bg-gradient-to-b from-transparent via-slate-200 to-transparent opacity-50" />
          <p className="text-slate-600 text-sm md:text-lg leading-relaxed font-medium italic">
            "{guard.burnout_analysis}"
          </p>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px flex-1 bg-slate-200" />
            <h3 className="text-[9px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Rekomendasi Sehat</h3>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
            {guard.action_items.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 bg-white/70 backdrop-blur-sm p-3 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all group"
              >
                <div className={`p-1 rounded-lg ${theme.bg} group-hover:scale-110 transition-transform flex-shrink-0`}>
                  <Heart className={`w-3.5 h-3.5 ${theme.icon}`} />
                </div>
                <span className="text-xs font-bold text-slate-700 leading-tight">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
        
        {isWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-start gap-3 p-4 bg-white/40 rounded-2xl border border-dashed border-slate-300"
          >
            <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
              "Ingat, tujuan kita berdampak, bukan jadi sempurna. Jaga kesehatan tim di atas segalanya."
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
