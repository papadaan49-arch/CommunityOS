import React from 'react';
import { Heart, Coffee, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { BrandLogo } from './BrandLogo';

export const CommunityGuidelines: React.FC = () => {
  const guidelines = [
    {
      icon: <Heart className="w-5 h-5 text-rose-500" />,
      title: "Proritaskan Manusia",
      description: "Relawan adalah manusia, bukan mesin. Pastikan beban kerja realistis dengan jadwal kuliah atau kerja mereka.",
      color: "bg-rose-50 border-rose-100"
    },
    {
      icon: <Coffee className="w-5 h-5 text-amber-500" />,
      title: "Minimalisir Rapat",
      description: "Gunakan WhatsApp koordinasi yang efektif. Tidak semua hal harus diselesaikan lewat rapat offline yang melelahkan.",
      color: "bg-amber-50 border-amber-100"
    },
    {
      icon: <Users className="w-5 h-5 text-blue-500" />,
      title: "Budaya Apresiasi",
      description: "Terima kasih sekecil apa pun sangat berarti. Rayakan progres kecil bersama tim untuk menjaga semangat.",
      color: "bg-blue-50 border-blue-100"
    },
    {
      icon: <Zap className="w-5 h-5 text-teal-500" />,
      title: "Fokus Dampak, Bukan Gengsi",
      description: "Acara tidak harus mewah untuk berdampak. Jika budget mepet, fokuslah pada pengalaman peserta dan kenyamanan tim.",
      color: "bg-teal-50 border-teal-100"
    }
  ];

  return (
    <section className="py-12 px-4 border-t border-slate-100">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
            <BrandLogo size="xs" variant="wellbeing" />
            CommunityOS Philosophy
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Prinsip Perjuangan Komunitas
          </h2>
          <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto">
            Panduan praktis untuk menjaga keberlanjutan energi tim dan kesuksesan kegiatan grassroot di Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guidelines.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-3xl border ${item.color} space-y-4 hover:shadow-lg hover:shadow-slate-100 transition-all`}
            >
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                {item.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-slate-800">{item.title}</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-teal-500/20 transition-colors" />
          <div className="relative z-10 space-y-6">
            <h3 className="text-xl md:text-2xl font-display font-extrabold text-white">Ingatlah: Tim Sehat, Acara Hebat.</h3>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed italic">
              "Tujuan utama kita adalah berdampak, namun dampak tersebut tidak akan maksimal jika penggeraknya tumbang satu per satu karena kelelahan."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
