import React from 'react';
import { HeartHandshake, Coffee, Sparkles, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { BrandLogo } from './BrandLogo';

export const CommunityGuidelines: React.FC = () => {
  const guidelines = [
    {
      icon: <HeartHandshake className="w-5 h-5 text-rose-500" />,
      title: "Prioritaskan Manusia",
      description: "Relawan adalah manusia, bukan mesin. Pastikan beban kerja luar biasa realistis, menghargai waktu istirahat, serta jadwal kuliah atau kerja mereka.",
      color: "from-rose-50/50 to-white hover:border-rose-200 border-rose-100/75 bg-gradient-to-br"
    },
    {
      icon: <Coffee className="w-5 h-5 text-amber-500" />,
      title: "Minimalisir Rapat",
      description: "Lebih banyak ngopi santai dan komunikasi asinkron lewat WhatsApp yang taktis. Hindari rapat offline formal berhari-hari yang menguras energi.",
      color: "from-amber-50/50 to-white hover:border-amber-200 border-amber-100/75 bg-gradient-to-br"
    },
    {
      icon: <Sparkles className="w-5 h-5 text-teal-600" />,
      title: "Budaya Apresiasi",
      description: "Terima kasih dan apresiasi sekecil apa pun sangat berharga. Rayakan setiap langkah maju bersama seluruh jajaran tim relawan.",
      color: "from-teal-50/50 to-white hover:border-teal-200 border-teal-100/75 bg-gradient-to-br"
    },
    {
      icon: <Target className="w-5 h-5 text-blue-500" />,
      title: "Fokus Dampak, Bukan Gengsi",
      description: "Acara tidak harus megah untuk bermakna. Jika anggaran ketat, prioritaskan kualitas pengalaman peserta dan kesejahteraan panitia pelaksana.",
      color: "from-blue-50/50 to-white hover:border-blue-200 border-blue-100/75 bg-gradient-to-br"
    }
  ];

  return (
    <section className="py-10 md:py-12 px-2 md:px-4 border-t border-slate-100">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 md:px-3 py-1 md:py-1.5 bg-slate-100 text-slate-600 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest leading-none">
            <BrandLogo size="xs" variant="brand" />
            Filosofi CommunityOS
          </div>
          <h2 className="text-xl md:text-3xl font-display font-extrabold text-slate-900 tracking-tight px-4">
            Prinsip Perjuangan Komunitas
          </h2>
          <p className="text-slate-500 text-xs md:text-base max-w-xl mx-auto px-6">
            Panduan praktis menjaga energi tim dan keberlanjutan gerakan komunitas.
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

        <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-7 md:p-12 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-teal-500/20 transition-colors" />
          <div className="relative z-10 space-y-4 md:space-y-6">
            <h3 className="text-lg md:text-2xl font-display font-extrabold text-white">Tim Sehat, Acara Hebat.</h3>
            <p className="text-slate-400 text-[13px] md:text-base max-w-2xl mx-auto leading-relaxed italic">
              "Tujuan utama kita adalah berdampak, namun dampak tersebut tidak akan maksimal jika penggeraknya tumbang karena kelelahan."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
