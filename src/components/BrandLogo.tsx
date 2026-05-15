import React from 'react';
import { Shield } from 'lucide-react';

export const BrandLogo: React.FC<{ size?: 'xs' | 'sm' | 'md' | 'lg', variant?: 'brand' | 'wellbeing' }> = ({ size = 'md', variant = 'brand' }) => {
  const gradientId = React.useId();
  const sizes = {
    xs: { container: 'w-5 h-5', icon: 'w-5 h-5', textSize: 'text-[6px]' },
    sm: { container: 'w-8 h-8', icon: 'w-8 h-8', textSize: 'text-[10px]' },
    md: { container: 'w-10 h-10', icon: 'w-10 h-10', textSize: 'text-[13px]' },
    lg: { container: 'w-24 h-24 md:w-32 md:h-32', icon: 'w-24 h-24 md:w-32 md:h-32', textSize: 'text-3xl md:text-[2.75rem]' },
  };

  const isBrand = variant === 'brand';
  const isWellbeing = variant === 'wellbeing';
  
  const currentGradientId = `shieldGradient-${gradientId.replace(/:/g, '')}`;

  return (
    <div className={`${sizes[size].container} relative flex items-center justify-center group`}>
      {/* SVG definitions for premium gradients */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={currentGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {isBrand ? (
              <>
                <stop offset="0%" stopColor="#0F766E" /> {/* Teal 700 */}
                <stop offset="100%" stopColor="#14B8A6" /> {/* Teal 500 */}
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#CCFBF1" stopOpacity="0.8" /> {/* Teal 50 */}
                <stop offset="100%" stopColor="#99F6E4" stopOpacity="0.4" /> {/* Teal 200 */}
              </>
            )}
          </linearGradient>
        </defs>
      </svg>

      {/* The Shield Identity */}
      <Shield 
        className={`${sizes[size].icon} drop-shadow-xl transition-all duration-500 group-hover:scale-105`} 
        strokeWidth={isBrand ? 1.5 : 1.75}
        stroke={isBrand ? '#0D9488' : '#14B8A6'} // Teal 600 vs Teal 500
        fill={`url(#${currentGradientId})`}
      />
      
      {/* The "C" Identity - Positioned perfectly inside the shield */}
      <span 
        className={`absolute ${sizes[size].textSize} font-display font-black tracking-tighter select-none transition-colors duration-500 ${isBrand ? 'text-white drop-shadow-sm' : 'text-teal-700'}`}
        style={{ marginTop: '-4%' }}
      >
        C
      </span>

      {/* Operational Resilience Glow */}
      <div 
        className={`absolute inset-0 blur-2xl rounded-full opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none duration-700 ${isBrand ? 'bg-teal-400/30' : 'bg-emerald-400/20'}`} 
      />
    </div>
  );
};
