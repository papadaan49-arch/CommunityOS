import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const BrandLogo: React.FC<{ size?: 'sm' | 'md' | 'lg', variant?: 'brand' | 'wellbeing' }> = ({ size = 'md', variant = 'brand' }) => {
  const sizes = {
    sm: { container: 'w-8 h-8 rounded-lg', icon: 'w-5 h-5' },
    md: { container: 'w-10 h-10 rounded-xl', icon: 'w-6 h-6' },
    lg: { container: 'w-20 h-20 md:w-28 md:h-28 rounded-[2rem]', icon: 'w-12 h-12 md:w-16 md:h-16' },
  };

  if (variant === 'brand') {
    return (
      <div className={`${sizes[size].container} overflow-hidden shadow-lg shadow-teal-500/10 border border-slate-100`}>
        <img 
          src="/icon-512.png" 
          alt="CommunityOS" 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${sizes[size].container} bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white`}>
      <ShieldCheck className={sizes[size].icon} />
    </div>
  );
};
