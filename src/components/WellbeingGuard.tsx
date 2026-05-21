import React from 'react';
import { HeartHandshake, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Blueprint } from '../types';
import { BrandLogo } from './BrandLogo';
import { HelpTooltip } from './HelpTooltip';
import { GUIDANCE_DATA } from '../constants/guidance';

interface Props {
  guard: Blueprint['wellbeing_guard'];
}

export const WellbeingGuard: React.FC<Props> = ({ guard }) => {
  if (!guard) return null;

  const riskLevel = guard.risk_level || 'Green';
  const isWarning = riskLevel === 'Amber' || riskLevel === 'Yellow' || riskLevel === 'Red';
  
  const theme = ({
    Red: {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      icon: 'text-rose-500',
      badge: 'bg-rose-100 text-rose-700',
      accent: 'bg-rose-500',
      glow: 'shadow-rose-100'
    },
    Amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      icon: 'text-amber-500',
      badge: 'bg-amber-100 text-amber-700',
      accent: 'bg-amber-500',
      glow: 'shadow-amber-100'
    },
    Yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-100',
      icon: 'text-yellow-500',
      badge: 'bg-yellow-100 text-yellow-700',
      accent: 'bg-yellow-500',
      glow: 'shadow-yellow-100'
    },
    Green: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      icon: 'text-emerald-500',
      badge: 'bg-emerald-100 text-emerald-700',
      accent: 'bg-emerald-500',
      glow: 'shadow-emerald-100'
    }
  } as Record<string, any>)[riskLevel] || {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    icon: 'text-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    accent: 'bg-emerald-500',
    glow: 'shadow-emerald-100'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-1 rounded-[2.5rem] md:rounded-[4rem] bg-gradient-to-br transition-all duration-700 shadow-2xl ${
        riskLevel === 'Red' ? 'from-rose-500/20 via-rose-50 to-rose-100/20 shadow-rose-200/50' : 
        riskLevel === 'Amber' ? 'from-amber-500/20 via-amber-50 to-amber-100/20 shadow-amber-200/50' : 
        riskLevel === 'Yellow' ? 'from-yellow-500/20 via-yellow-50 to-yellow-100/20 shadow-yellow-200/50' :
        'from-emerald-500/20 via-emerald-50 to-emerald-100/20 shadow-emerald-200/50'
      }`}
    >
      <div className={`p-8 md:p-16 rounded-[calc(2.5rem-4px)] md:rounded-[calc(4rem-4px)] h-full ${theme.bg} border border-white relative overflow-hidden backdrop-blur-sm`}>
        {/* Abstract Background Element */}
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] -mr-32 -mt-32 opacity-20 ${theme.accent}`} />
        
        <div className="relative z-10 flex flex-col gap-10 md:gap-16">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-500 ${theme.bg} border border-white/50`}>
                <HeartHandshake className={`w-10 h-10 md:w-12 md:h-12 ${theme.icon}`} />
              </div>
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-2xl md:text-4xl font-display font-black text-slate-900 tracking-tight leading-none">
                  Wellbeing Guard
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${theme.accent}`} />
                  <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] ${theme.icon}`}>
                    Status: {riskLevel}
                  </span>
                </div>
              </div>
            </div>
            
            <div className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-3 backdrop-blur-md ${theme.badge} border-white/20 shadow-sm`}>
              <Heart className="w-5 h-5 fill-current" />
              <span className="text-xs md:text-sm font-black uppercase tracking-widest whitespace-nowrap">
                Aksi Berkelanjutan
              </span>
            </div>
          </div>

          {/* Analysis Quote */}
          <div className="relative">
            <div className={`absolute -left-4 top-0 w-1 h-full rounded-full opacity-30 ${theme.accent}`} />
            <p className="text-lg md:text-3xl text-slate-800 leading-relaxed md:leading-[1.5] font-display font-medium italic pl-6">
              "{guard.burnout_analysis || 'Keamanan tim terjaga dengan baik sesuai blueprint.'}"
            </p>
          </div>

          {/* Action Kit Grid */}
          <div className="space-y-8 md:space-y-10">
            <div className="flex items-center gap-4">
              <h3 className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Wellbeing Action Kit</h3>
              <div className="h-px flex-1 bg-slate-200/50" />
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(guard.action_items || []).map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white/80 p-6 rounded-3xl border border-white shadow-sm shadow-slate-100 flex flex-col gap-4 group transition-all hover:shadow-xl hover:shadow-teal-900/5 hover:border-teal-100"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:scale-110 ${theme.bg}`}>
                    <CheckCircle2 className={`w-5 h-5 ${theme.icon}`} />
                  </div>
                  <span className="text-sm md:text-base font-bold text-slate-800 leading-snug">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Burnout Prevention Bar */}
          <div className="bg-white/40 p-6 md:p-10 rounded-[2.5rem] border border-white border-dashed shadow-inner">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="flex flex-col items-center gap-1">
                 <AlertCircle className={`w-8 h-8 md:w-10 md:h-10 ${theme.icon}`} />
                 <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest text-center">Safety Check</span>
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm md:text-lg text-slate-600 font-medium leading-relaxed italic text-center md:text-left">
                  "Blueprint ini dirancang untuk dampak jangka panjang. {isWarning ? 'Segera delegasikan tugas jika beban mulai terasa berat.' : 'Lanjutkan ritme positif ini bersama tim Anda.'}"
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <BrandLogo size="xs" variant="wellbeing" />
                    Protokol Wellbeing Aktif
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
