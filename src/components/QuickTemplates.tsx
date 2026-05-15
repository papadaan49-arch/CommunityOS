import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, GraduationCap, Users, Recycle, Heart, Gift } from 'lucide-react';

interface Template {
  id: string;
  label: string;
  icon: React.ReactNode;
  data: {
    name: string;
    organization: string;
    location: string;
    participants: number;
    staff: number;
    budget: number;
    type: string;
    goal: string;
    previous_context?: string;
  };
}

const templates: Template[] = [
  {
    id: 'ielts',
    label: 'IELTS Sharing',
    icon: <GraduationCap className="w-4 h-4" />,
    data: {
      name: "EduAction IELTS Sharing Session",
      organization: "EduAction Indonesia",
      location: "Jakarta",
      participants: 100,
      staff: 15,
      budget: 2000000,
      type: "Seminar Edukasi",
      goal: "Membantu mahasiswa persiapan IELTS dengan tips praktis dari expert dan simulasi singkat.",
      previous_context: "EduAction #1 tahun lalu sukses dengan 60 peserta, ingin ditingkatkan menjadi 100 peserta."
    }
  },
  {
    id: 'mengajar',
    label: 'TurunTangan Mengajar',
    icon: <Users className="w-4 h-4" />,
    data: {
      name: "TurunTangan Mengajar Desa",
      organization: "TurunTangan",
      location: "Yogyakarta",
      participants: 50,
      staff: 20,
      budget: 1500000,
      type: "Volunteering",
      goal: "Memberikan akses pendidikan tambahan dan motivasi belajar bagi anak-anak di pelosok desa."
    }
  },
  {
    id: 'bersih',
    label: 'Aksi Bersih Sungai',
    icon: <Recycle className="w-4 h-4" />,
    data: {
      name: "Sungai Bersih Masa Depan",
      organization: "Green Movement",
      location: "Bandung",
      participants: 150,
      staff: 30,
      budget: 5000000,
      type: "Community Service",
      goal: "Membersihkan sampah plastik di bantaran sungai dan melakukan edukasi pemilahan sampah ke warga."
    }
  },
  {
    id: 'gathering',
    label: 'Volunteer Gathering',
    icon: <Heart className="w-4 h-4" />,
    data: {
      name: "IndoVolunteer Annual Gathering",
      organization: "IndoVolunteer",
      location: "Bali",
      participants: 40,
      staff: 10,
      budget: 3000000,
      type: "Networking & Bonding",
      goal: "Mempererat hubungan emosional antar relawan lama dan menyambut relawan baru agar tidak burnout."
    }
  },
  {
    id: 'ramadan',
    label: 'Donasi Ramadan',
    icon: <Gift className="w-4 h-4" />,
    data: {
      name: "Berbagi Berkah Ramadan",
      organization: "Dompet Dhuafa",
      location: "Surabaya",
      participants: 200,
      staff: 25,
      budget: 10000000,
      type: "Charity",
      goal: "Menyalurkan paket sembako berkualitas dan mengadakan buka puasa bersama anak yatim piatu."
    }
  }
];

interface Props {
  onSelect: (data: Template['data']) => void;
  disabled?: boolean;
}

export const QuickTemplates: React.FC<Props> = ({ onSelect, disabled }) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-500" />
        <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Template Demo Cepat</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <motion.button
            key={template.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(template.data)}
            disabled={disabled}
            className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white border border-slate-100 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-semibold text-slate-600 shadow-sm hover:shadow-md hover:border-teal-100 hover:text-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap"
          >
            <span className="p-1 md:p-1.5 bg-slate-50 rounded-lg group-hover:bg-teal-50 transition-colors">
              <span className="w-3.5 h-3.5 md:w-4 md:h-4 flex items-center justify-center">
                {template.icon}
              </span>
            </span>
            {template.label}
          </motion.button>
        ))}
      </div>
      
      <p className="text-[9px] md:text-[10px] text-slate-400 font-medium italic px-1">
        *Klik salah satu template untuk mengisi form secara otomatis.
      </p>
    </section>
  );
};
