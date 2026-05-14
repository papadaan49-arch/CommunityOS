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
      <div className={`p-10 md:p-14 rounded-[calc(3rem-2px)] h-full ${theme.bg} border ${theme.border}`}>
        <div className="flex items-center justify-between mb-12 md:mb-16">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 md:w-24 md:h-24 rounded-[1.75rem] bg-white overflow-hidden flex items-center justify-center shadow-xl shadow-black/5`}>
              <img 
                src="/icon-512.png" 
                alt="CommunityOS Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-800">Wellbeing Guard</h2>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] md:text-xs uppercase tracking-[0.2em] font-semibold px-3 py-1 rounded-full ${theme.badge}`}>
                  Level Risiko: {guard.risk_level}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mb-12 md:mb-16 pl-4 md:pl-0">
          <div className="absolute -left-4 md:-left-10 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-slate-200/50 to-transparent opacity-50" />
          <p className="text-slate-600 text-lg md:text-2xl leading-[1.8] font-medium italic">
            "{guard.burnout_analysis}"
          </p>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200/50" />
            <h3 className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-[0.3em]">Rekomendasi Sehat</h3>
            <div className="h-px flex-1 bg-slate-200/50" />
          </div>
          
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            {guard.action_items.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-5 bg-white/90 backdrop-blur-sm p-5 rounded-[1.75rem] border border-white/50 shadow-sm hover:shadow-md transition-all group"
              >
                <div className={`p-2 rounded-xl ${theme.bg} group-hover:scale-110 transition-transform flex-shrink-0`}>
                  <Heart className={`w-5 h-5 ${theme.icon}`} />
                </div>
                <span className="text-[15px] font-semibold text-slate-800 leading-[1.4]">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
        
        {isWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex items-start gap-4 p-5 bg-white/50 rounded-[2rem] border border-dashed border-slate-200 shadow-inner"
          >
            <AlertCircle className="w-6 h-6 text-slate-300 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
              "Ingat, tujuan kita adalah menciptakan dampak yang berkelanjutan. Jaga kesehatan tim di atas segalanya."
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
