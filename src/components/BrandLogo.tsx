import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const BrandLogo: React.FC<{ size?: string, variant?: 'brand' | 'wellbeing' }> = ({ size = 'md', variant = 'brand' }) => {
  const isBrand = variant === 'brand';
  
  // Parse responsive size
  const sizeClasses = size.split(' ').map(s => {
    const parts = s.split(':');
    const sizeKey = (parts.length > 1 ? parts[1] : parts[0]) as 'xs' | 'sm' | 'md' | 'lg';
    const prefix = parts.length > 1 ? `${parts[0]}:` : '';
    
    return {
      container: `${prefix}w-${sizeKey === 'xs' ? '5' : sizeKey === 'sm' ? '8' : sizeKey === 'md' ? '12' : '24 md:w-32'} ${prefix}h-${sizeKey === 'xs' ? '5' : sizeKey === 'sm' ? '8' : sizeKey === 'md' ? '12' : '24 md:h-32'}`,
      icon: `${prefix}w-${sizeKey === 'xs' ? '5' : sizeKey === 'sm' ? '8' : sizeKey === 'md' ? '12' : '24 md:w-32'} ${prefix}h-${sizeKey === 'xs' ? '5' : sizeKey === 'sm' ? '8' : sizeKey === 'md' ? '12' : '24 md:h-32'}`,
      radius: sizeKey === 'xs' ? `${prefix}rounded-md` : sizeKey === 'sm' ? `${prefix}rounded-lg` : sizeKey === 'md' ? `${prefix}rounded-2xl` : `${prefix}rounded-[3rem]`,
      iconInner: `${prefix}w-${sizeKey === 'xs' ? '3' : sizeKey === 'sm' ? '4' : sizeKey === 'md' ? '6' : '12 md:w-16'} ${prefix}h-${sizeKey === 'xs' ? '3' : sizeKey === 'sm' ? '4' : sizeKey === 'md' ? '6' : '12 md:h-16'}`
    };
  });

  const mergedClasses = sizeClasses.reduce((acc, curr) => ({
    container: `${acc.container} ${curr.container}`,
    icon: `${acc.icon} ${curr.icon}`,
    radius: `${acc.radius} ${curr.radius}`,
    iconInner: `${acc.iconInner} ${curr.iconInner}`
  }), { container: '', icon: '', radius: '', iconInner: '' });

  return (
    <div className={`${mergedClasses.container} relative flex items-center justify-center group shrink-0`}>
      {isBrand ? (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${mergedClasses.icon} drop-shadow-sm transition-transform duration-500 group-hover:scale-105 shrink-0`}>
          {/* Background subtle fill */}
          <path d="M50 8 L13 24 V46 C13 71 29 86 50 96 C71 86 87 71 87 46 V24 L50 8 Z" fill="#CCFBF1" fillOpacity="0.4"/>
          
          {/* Outer Shield Line */}
          <path d="M50 8 L13 24 V46 C13 71 29 86 50 96 C71 86 87 71 87 46 V24 L50 8 Z" stroke="#0D9488" strokeWidth="4.5" strokeLinejoin="round"/>
          
          {/* Inner decorative network shield */}
          <path d="M50 19 L24 31 V49 C24 67 34 78 50 85 C66 78 76 67 76 49 V31 L50 19 Z" stroke="#0D9488" strokeWidth="1.5" strokeLinejoin="round" opacity="0.7"/>
          
          {/* Connecting Network Lines */}
          <path d="M50 8 V19 M13 24 L24 31 M87 24 L76 31 M13 46 L24 49 M87 46 L76 49" stroke="#0D9488" strokeWidth="2" strokeLinecap="round"/>
          
          {/* Center 'C' representing Community */}
          <path d="M63 41 C57 32 43 32 37 41 C31 50 31 62 37 71 C43 80 57 80 63 71" stroke="#0F766E" strokeWidth="6.5" strokeLinecap="round"/>
          
          {/* Network Nodes (Circles) Outer shield */}
          <circle cx="50" cy="8" r="3.5" fill="#0F766E"/>
          <circle cx="13" cy="24" r="3" fill="#0D9488"/>
          <circle cx="87" cy="24" r="3" fill="#0D9488"/>
          <circle cx="13" cy="46" r="3" fill="#0D9488"/>
          <circle cx="87" cy="46" r="3" fill="#0D9488"/>
          <circle cx="50" cy="96" r="3.5" fill="#0F766E"/>
          
          {/* Inner C nodes */}
          <circle cx="63" cy="41" r="4.5" fill="#0F766E"/>
          <circle cx="63" cy="71" r="4.5" fill="#0F766E"/>
          <circle cx="33.5" cy="56" r="5" fill="#0F766E"/>
          
          {/* Center core connection */}
          <circle cx="50" cy="56" r="3" fill="#0D9488"/>
          <line x1="38.5" y1="56" x2="47" y2="56" stroke="#0D9488" strokeWidth="2"/>
        </svg>
      ) : (
        <div className={`${mergedClasses.icon} ${mergedClasses.radius} bg-teal-600 flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-105`}>
          <ShieldCheck 
            className={`${mergedClasses.iconInner} text-white drop-shadow-md`} 
            strokeWidth={2.5}
          />
        </div>
      )}

      {/* Subtle background glow */}
      <div 
        className={`absolute inset-0 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none duration-700 ${isBrand ? 'bg-teal-500' : 'bg-emerald-400'}`} 
      />
    </div>
  );
};
