import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  title: string;
  description: string;
}

export const HelpTooltip: React.FC<Props> = ({ title, description }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 text-slate-300 hover:text-teal-500 transition-colors focus:outline-none"
        aria-label={`Informasi tentang ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <div 
              className="fixed inset-0 z-[100] bg-slate-900/5 backdrop-blur-[2px] md:hidden" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 5 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[280px] z-[110] bg-white text-slate-800 p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600">{title}</span>
                  <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-slate-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs leading-relaxed font-medium text-slate-600">
                  {description}
                </p>
              </div>
              
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-white" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
