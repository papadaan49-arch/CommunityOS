import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  GraduationCap, 
  Users, 
  Recycle, 
  Heart, 
  Gift, 
  TrendingUp, 
  Compass, 
  Award, 
  Trees, 
  BookOpen, 
  ArrowRight, 
  UserCheck, 
  Coins, 
  ShieldAlert,
  Info
} from 'lucide-react';

interface Template {
  id: string;
  label: string;
  category: 'preset' | 'crowdsourced';
  icon: React.ReactNode;
  tags: string[];
  description: string;
  successRate: string; // e.g. "98% Anggota Puas"
  wellbeingInsight: string; // e.g. "Rapat offline dibatasi 2x"
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
  // Curator Presets (preset)
  {
    id: 'ielts',
    label: 'IELTS Sharing Session',
    category: 'preset',
    icon: <GraduationCap className="w-4 h-4 text-emerald-600" />,
    tags: ['Eduaksi', 'Gerilya Scale'],
    description: 'Seminar edukasi singkat padat dengan simulasi kilat IELTS. Hemat tenaga panitia.',
    successRate: '96% Sukses',
    wellbeingInsight: 'Persiapan H-7 cukup online, batasi rapat demi energi panitia.',
    data: {
      name: "EduAction IELTS Sharing Session",
      organization: "EduAction Indonesia",
      location: "Banjarmasin",
      participants: 100,
      staff: 12,
      budget: 1200000,
      type: "Seminar Edukasi",
      goal: "Membantu pelajar/mahasiswa regional menguasai persiapan IELTS secara praktis tanpa biaya mahal.",
      previous_context: "Sukses mengumpulkan 80 audiens tahun lalu dengan panitia yang minim burnout."
    }
  },
  {
    id: 'mengajar',
    label: 'Relawan TurunTangan Mengajar',
    category: 'preset',
    icon: <Users className="w-4 h-4 text-emerald-600" />,
    tags: ['Edukasi', 'Community Scale'],
    description: 'Mengajar anak-anak di pelosok/bantaran sungai dengan metode interaktif (Gamification).',
    successRate: '98% Berdampak',
    wellbeingInsight: 'Maksimum mengajar 3 jam. Wajib jeda bonding internal relawan.',
    data: {
      name: "TurunTangan Mengajar Menggembirakan",
      organization: "TurunTangan Regional Kalsel",
      location: "Martapura Barat",
      participants: 50,
      staff: 15,
      budget: 800000,
      type: "Volunteering & Education",
      goal: "Menginspirasi anak-anak marjinal agar tetap semangat sekolah, dibalut permainan edukasi ceria."
    }
  },
  {
    id: 'bersih',
    label: 'Aksi Gerakan Bersih Sungai',
    category: 'preset',
    icon: <Recycle className="w-4 h-4 text-emerald-600" />,
    tags: ['Lingkungan', 'Gerilya Scale'],
    description: 'Aksi bersih sampah plastik di bantaran sungai dipadu kampanye sadar lingkungan ke warga.',
    successRate: '94% Bersih',
    wellbeingInsight: 'Siapkan konsumsi segar & obat-obatan lengkap. Wajib istirahat teduh per 45 menit.',
    data: {
      name: "Sungai Bersih Komunitas Mandiri",
      organization: "Green Movement Borneo",
      location: "Banjarmasin Selatan",
      participants: 60,
      staff: 10,
      budget: 1500000,
      type: "Aksi Lingkungan",
      goal: "Memulihkan kebersihan aliran air sungai lokal dan mendistribusikan tempat sampah organik-anorganik."
    }
  },
  {
    id: 'gathering',
    label: 'Volunteer Bonding & Gathering',
    category: 'preset',
    icon: <Heart className="w-4 h-4 text-emerald-600" />,
    tags: ['Kesejahteraan', 'Gerilya Scale'],
    description: 'Kegiatan khusus relawan untuk relawan. Fokus ke relaksasi mental dan apresiasi tulus.',
    successRate: '100% Antiloyo',
    wellbeingInsight: 'Nol tuntutan kerja. Murni kumpul makan bersama, curhat, dan main game santai.',
    data: {
      name: "IndoVolunteer Rest & Recharge Gathering",
      organization: "IndoVolunteers Regional Kalsel",
      location: "Banjarbaru",
      participants: 30,
      staff: 6,
      budget: 1000000,
      type: "Networking & Bonding",
      goal: "Mempererat chemistry relawan pasca-event besar, menyembuhkan kepenatan, serta menyambut relawan baru."
    }
  },

  // Crowd-sourced dynamic trends from Indonesia (crowdsourced)
  {
    id: 'tanam-pohon',
    label: 'Penanaman Mangrove Pesisir',
    category: 'crowdsourced',
    icon: <Trees className="w-4 h-4 text-teal-600" />,
    tags: ['Ekologi Terpopuler', 'Community Scale'],
    description: 'Saran aktivitas ekosistem pesisir Kalimantan & Jawa. Kolaborasi warga dan kelompok pramuka.',
    successRate: '97% Tumbuh',
    wellbeingInsight: 'Eksekusi pagi hari pukul 07.00 - 09.30 WITA untuk menghindari terik matahari ekstrem.',
    data: {
      name: "Sabuk Hijau Relawan Pesisir",
      organization: "Koalisi Penyelamat Bakau Raya",
      location: "Takisung",
      participants: 120,
      staff: 18,
      budget: 4500000,
      type: "Aksi Lingkungan Hidup",
      goal: "Menanam 500 bibit mangrove pelindung abrasi pantai sekaligus mengedukasi masyarakat sekitar pesisir."
    }
  },
  {
    id: 'coding-desa',
    label: 'Digital Literacy / Coding Class',
    category: 'crowdsourced',
    icon: <BookOpen className="w-4 h-4 text-teal-600" />,
    tags: ['Teknologi', 'Gerilya Scale'],
    description: 'Tren gerakan mahasiswa IT mengenalkan dunia digital & AI secara gratis untuk adik-adik panti.',
    successRate: '95% Pemahaman',
    wellbeingInsight: 'Satu mentor maksimal memegang 3 anak agar penyampaian fokus dan tidak melelahkan mentor.',
    data: {
      name: "Piksel Cantik Kelas Literasi Digital",
      organization: "Himpunan Pengembang Muda",
      location: "Banjarbaru Utara",
      participants: 25,
      staff: 8,
      budget: 500000,
      type: "Workshop Teknologi Community",
      goal: "Membekali skill dasar desain Canva dan perkenalan AI dasar secara asyik dengan alat seadanya."
    }
  },
  {
    id: 'sembako-subsidi',
    label: 'Pasar Sembako Murah Relawan',
    category: 'crowdsourced',
    icon: <Gift className="w-4 h-4 text-teal-600" />,
    tags: ['Sosial Terpopuler', 'Regional Scale'],
    description: 'Gerakan pangan murah mandiri bersubsidi untuk keluarga pra-sejahtera. Sangat disukai relawan ibu-ibu.',
    successRate: '99% Tersalurkan',
    wellbeingInsight: 'Gunakan sistem kupon bernomor antrean agar penumpukan massa tidak menekan mental panitia.',
    data: {
      name: "Sembako Gotong Royong Kita",
      organization: "Lembaga Swadaya Masyarakat Peduli Banua",
      location: "Martapura",
      participants: 250,
      staff: 35,
      budget: 15000000,
      type: "Aksi Kepedulian Sosial",
      goal: "Menyediakan 250 paket sembako bersubsidi 50% untuk warga prasejahtera menggunakan skema donasi lokal."
    }
  }
];

interface Props {
  onSelect: (data: Template['data']) => void;
  disabled?: boolean;
}

export const QuickTemplates: React.FC<Props> = ({ onSelect, disabled }) => {
  const [activeCategory, setActiveCategory] = React.useState<'preset' | 'crowdsourced'>('preset');
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);

  const getIndonesianMonthYear = () => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const d = new Date();
    const monthName = months[d.getMonth()] || 'Mei';
    const year = d.getFullYear();
    return `EDISI ${monthName.toUpperCase()} ${year}`;
  };

  const filteredTemplates = templates.filter(t => t.category === activeCategory);
  const activeTemplateDetails = templates.find(t => t.id === selectedTemplateId);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    onSelect(template.data);
  };

  return (
    <section className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 md:p-6 space-y-5 text-left transition-all">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-teal-700">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <h3 className="text-xs md:text-sm font-display font-black uppercase tracking-wider">
              Rekomendasi Kegiatan & Demo Cetak
            </h3>
          </div>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium">
            Pilih konsep acara yang tervalidasi sukses & ramah energi di Indonesia untuk mengisi formulir instan.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {activeCategory === 'crowdsourced' && (
            <span className="text-[8px] font-black tracking-widest bg-amber-500/15 text-amber-600 px-2 py-1 rounded-md uppercase animate-pulse">
              📅 {getIndonesianMonthYear()}
            </span>
          )}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-center">
            <button
              type="button"
              onClick={() => {
                setActiveCategory('preset');
                setSelectedTemplateId(null);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                activeCategory === 'preset'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>💡 Demo Preset</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('crowdsourced');
                setSelectedTemplateId(null);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                activeCategory === 'crowdsourced'
                  ? 'bg-white text-teal-850 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-amber-500" />
              <span>🔥 Tren Crowd-AI (Bulanan)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          return (
            <motion.div
              key={template.id}
              whileHover={{ y: -2 }}
              onClick={() => !disabled && handleSelectTemplate(template)}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                isSelected 
                  ? 'bg-teal-50/70 border-teal-200 ring-2 ring-teal-600/10' 
                  : 'bg-white border-slate-100 shadow-sm hover:shadow hover:border-teal-100/80 hover:bg-slate-50/40'
              } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <div className="space-y-2">
                {/* Icons & Tags */}
                <div className="flex items-center justify-between gap-2">
                  <span className="p-2 bg-slate-50 rounded-xl group-hover:bg-teal-50 transition-colors">
                    {template.icon}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md tracking-wider ${
                          activeCategory === 'crowdsourced' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-teal-50 text-teal-700 border border-teal-100'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-teal-900 transition-colors">
                    {template.label}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>

              {/* Success Badge */}
              <div className="flex items-center justify-between text-[8px] font-extrabold text-slate-400 border-t border-slate-50 pt-2 group-hover:border-teal-50 transition-colors">
                <span className="flex items-center gap-1 text-emerald-600">
                  <Award className="w-3 h-3" />
                  {template.successRate}
                </span>
                <span className="flex items-center gap-0.5 text-teal-600 uppercase tracking-wide">
                  Selengkapnya <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Advanced dynamic information deck below selections */}
      <AnimatePresence mode="wait">
        {activeTemplateDetails ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-teal-600/5 border border-teal-500/10 space-y-3 relative overflow-hidden text-left"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-extrabold text-teal-800 uppercase tracking-widest flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Pratinjau Pola Kerja Sehat ({activeTemplateDetails.label})
                </p>
                <p className="text-xs font-bold text-slate-800 leading-normal">
                  Diusulkan oleh: <span className="text-teal-700 font-extrabold">{activeTemplateDetails.data.organization}</span>
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100/60 border border-emerald-200 text-emerald-800 rounded-full text-[9px] font-bold uppercase tracking-wider">
                Wellbeing Active 🟢
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px] font-medium text-slate-600 leading-relaxed border-t border-teal-500/5">
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Sasaran Wilayah</span>
                <span className="font-bold text-slate-850 flex items-center gap-0.5">{activeTemplateDetails.data.location}, Indonesia</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Estimasi Dana</span>
                <span className="font-bold text-slate-850 flex items-center gap-0.5">Rp {activeTemplateDetails.data.budget.toLocaleString('id-ID')}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Wellbeing Guard Tip</span>
                <span className="font-bold text-teal-800 italic">"{activeTemplateDetails.wellbeingInsight}"</span>
              </div>
            </div>

            {activeTemplateDetails.wellbeingInsight && (
              <div className="flex items-center gap-1.5 p-2 bg-emerald-50 text-emerald-800 rounded-xl text-[10px] font-bold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Kombinasi parameter ini telah tervalidasi ramah dari ancaman lelah berlebih relawan.</span>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-100/50 border border-slate-100 text-center">
            <p className="text-[10px] md:text-xs text-slate-500 font-medium italic">
              *Pilih salah satu kartu template di atas untuk melihat detail analisis keberhasilan operasional & kesejahteraan relawan.
            </p>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
