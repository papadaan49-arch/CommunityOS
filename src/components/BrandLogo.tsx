import React from 'react';
import { Shield } from 'lucide-react';

export const BrandLogo: React.FC<{ size?: 'sm' | 'md' | 'lg', variant?: 'brand' | 'wellbeing' }> = ({ size = 'md', variant = 'brand' }) => {
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 'w-8 h-8', textSize: 'text-[10px]' },
    md: { container: 'w-10 h-10', icon: 'w-10 h-10', textSize: 'text-xs' },
    lg: { container: 'w-24 h-24 md:w-32 md:h-32', icon: 'w-24 h-24 md:w-32 md:h-32', textSize: 'text-3xl md:text-5xl' },
  };

  const isWellbeing = variant === 'wellbeing';

  return (
    <div className={`${sizes[size].container} relative flex items-center justify-center group`}>
      {/* The Shield Identity - Using solid fill for strength */}
      <Shield 
        className={`${sizes[size].icon} ${isWellbeing ? 'text-teal-500 fill-teal-500/10' : 'text-teal-600 fill-teal-600'} drop-shadow-xl transition-all duration-500 group-hover:scale-105`} 
        strokeWidth={1.5}
      />
      
      {/* The "C" Identity - Positioned slightly higher to fit shield geometry */}
      <span className={`absolute ${sizes[size].textSize} font-display font-black tracking-tighter select-none mb-1.5 transition-colors duration-500 ${isWellbeing ? 'text-teal-600' : 'text-white'}`}>
        C
      </span>

      {/* Operational Resilience Glow */}
      <div className={`absolute inset-0 blur-2xl rounded-full opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none duration-700 ${isWellbeing ? 'bg-emerald-400' : 'bg-teal-400'}`} />
    </div>
  );
};
