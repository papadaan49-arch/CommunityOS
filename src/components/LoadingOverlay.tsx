import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

import { BrandLogo } from './BrandLogo';

interface Props {
  isVisible: boolean;
  message: string;
}

export const LoadingOverlay: React.FC<Props> = ({ isVisible, message }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white p-12 rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] text-center space-y-10 max-w-sm w-full border border-white/20"
          >
            <div className="relative mx-auto flex justify-center">
              <div className="absolute inset-0 bg-teal-500/20 rounded-full scale-150 blur-3xl animate-pulse" />
              <BrandLogo size="lg" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-display font-semibold text-slate-900 tracking-tight">Menyiapkan Dokumen</h3>
              <p className="text-sm font-medium text-slate-400 italic leading-relaxed px-4">
                {message}
              </p>
            </div>

            <div className="pt-2">
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                  className="h-full w-1/3 bg-teal-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
