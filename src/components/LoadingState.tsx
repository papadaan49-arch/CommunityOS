import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface Props {
  message: string;
  progress: number;
}

export const LoadingState: React.FC<Props> = ({ message, progress }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 px-6 text-center space-y-10">
      <div className="relative">
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-teal-100 border border-slate-50 relative z-10 overflow-hidden p-4"
        >
          <img 
            src="/icon-512.png" 
            alt="CommunityOS Logo" 
            className="w-full h-full object-cover rounded-xl" 
          />
        </motion.div>
        
        {/* Animated Orbs */}
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          className="absolute -top-6 -right-6 w-16 h-16 bg-emerald-400 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-6 -left-6 w-20 h-20 bg-teal-300 rounded-full blur-2xl"
        />
      </div>

      <div className="space-y-8 w-full max-w-sm px-4">
        <div className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-xl md:text-2xl font-display font-semibold text-slate-900 leading-tight">
              AI Sedang Memproses
            </h2>
            <span className="text-sm font-bold text-teal-600 font-mono tracking-tighter">
              {progress}<span className="text-[10px] ml-0.5">%</span>
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
            <motion.div 
              className="h-full bg-slate-900 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 20, stiffness: 50 }}
            />
          </div>
        </div>
        
        <div className="h-10 relative flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={message}
              initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -20, opacity: 0, filter: 'blur(10px)' }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                <span className="text-slate-700 font-semibold text-xs tracking-wide whitespace-nowrap">
                  {message}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div 
            key={i}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className="w-1.5 h-1.5 rounded-full bg-teal-600" 
          />
        ))}
      </div>
    </div>
  );
};
