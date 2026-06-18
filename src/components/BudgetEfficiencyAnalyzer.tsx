import React from 'react';
import { PiggyBank, TrendingDown, Info, Sparkles, AlertCircle, Percent, HelpCircle, Check, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { Blueprint } from '../types';

interface Props {
  blueprint: Blueprint;
}

export const BudgetEfficiencyAnalyzer: React.FC<Props> = ({ blueprint }) => {
  const [useVolunteersCook, setUseVolunteersCook] = React.useState(false);
  const [usePublicVenue, setUsePublicVenue] = React.useState(false);
  const [useDigitalFlyer, setUseDigitalFlyer] = React.useState(false);
  const [useCarpool, setUseCarpool] = React.useState(false);

  const budgetAllocation = blueprint.operational?.budget_allocation || [];
  const targetBudget = blueprint.event_meta?.budget || 0;

  // 1. Calculate allocated and categories
  const totalAllocated = budgetAllocation.reduce((acc, item) => acc + item.amount, 0);

  // Categorization function
  const categorizeItem = (itemText: string) => {
    const text = itemText.toLowerCase();
    if (
      text.includes('makan') ||
      text.includes('minum') ||
      text.includes('konsumsi') ||
      text.includes('snack') ||
      text.includes('catering') ||
      text.includes('lunch') ||
      text.includes('welfare') ||
      text.includes('food')
    ) {
      return { category: 'Konsumsi & Welfare', icon: '🍲', color: 'bg-emerald-500', textClass: 'text-emerald-700' };
    }
    if (
      text.includes('sewa') ||
      text.includes('alat') ||
      text.includes('panggung') ||
      text.includes('sound') ||
      text.includes('tempat') ||
      text.includes('tenda') ||
      text.includes('ruang') ||
      text.includes('logistik') ||
      text.includes('kursi') ||
      text.includes('meja')
    ) {
      return { category: 'Logistik & Venue', icon: '🎪', color: 'bg-blue-500', textClass: 'text-blue-700' };
    }
    if (
      text.includes('transport') ||
      text.includes('bensin') ||
      text.includes('mobil') ||
      text.includes('ojek') ||
      text.includes('akomodasi') ||
      text.includes('sopir') ||
      text.includes('perjalanan')
    ) {
      return { category: 'Transport & Mobilitas', icon: '🚗', color: 'bg-amber-500', textClass: 'text-amber-700' };
    }
    if (
      text.includes('banner') ||
      text.includes('cetak') ||
      text.includes('media') ||
      text.includes('publikasi') ||
      text.includes('plakat') ||
      text.includes('souvenir') ||
      text.includes('merchandise') ||
      text.includes('pamflet') ||
      text.includes('flyer')
    ) {
      return { category: 'Publikasi & Media', icon: '📢', color: 'bg-purple-500', textClass: 'text-purple-700' };
    }
    return { category: 'Operasional Lainnya', icon: '📦', color: 'bg-slate-500', textClass: 'text-slate-700' };
  };

  // Group allocations by category
  const categoriesMap: Record<string, { total: number; originalTotal: number; items: string[]; icon: string; color: string; textClass: string }> = {};

  budgetAllocation.forEach((item) => {
    const meta = categorizeItem(item.item);
    if (!categoriesMap[meta.category]) {
      categoriesMap[meta.category] = {
        total: 0,
        originalTotal: 0,
        items: [],
        icon: meta.icon,
        color: meta.color,
        textClass: meta.textClass,
      };
    }
    categoriesMap[meta.category].total += item.amount;
    categoriesMap[meta.category].originalTotal += item.amount;
    categoriesMap[meta.category].items.push(item.item);
  });

  // Apply simulated savings
  if (useVolunteersCook && categoriesMap['Konsumsi & Welfare']) {
    categoriesMap['Konsumsi & Welfare'].total = Math.round(categoriesMap['Konsumsi & Welfare'].originalTotal * 0.7);
  }
  if (usePublicVenue && categoriesMap['Logistik & Venue']) {
    categoriesMap['Logistik & Venue'].total = Math.round(categoriesMap['Logistik & Venue'].originalTotal * 0.5);
  }
  if (useDigitalFlyer && categoriesMap['Publikasi & Media']) {
    categoriesMap['Publikasi & Media'].total = Math.round(categoriesMap['Publikasi & Media'].originalTotal * 0.2);
  }
  if (useCarpool && categoriesMap['Transport & Mobilitas']) {
    categoriesMap['Transport & Mobilitas'].total = Math.round(categoriesMap['Transport & Mobilitas'].originalTotal * 0.6);
  }

  // Calculate simulated totals
  const totalSimulated = Object.values(categoriesMap).reduce((acc, cat) => acc + cat.total, 0);
  const totalSavings = totalAllocated - totalSimulated;

  // Efficiency scores
  const efficiencyRatio = targetBudget > 0 ? totalAllocated / targetBudget : 1;
  const isOverBudget = totalAllocated > targetBudget;
  const variance = targetBudget - totalAllocated;

  // Determine health level
  let budgetHealth: 'perfect' | 'warning' | 'starving' = 'perfect';
  let healthLabel = 'Efisien & Terkendali';
  let healthDescription = 'Proporsi anggaran terdistribusi merata dengan porsi yang sangat ideal untuk keberlangsungan tim.';

  if (isOverBudget) {
    budgetHealth = 'warning';
    healthLabel = 'Melebihi Target';
    healthDescription = `Anggaran rencana Anda melebihi pagu dana komunitas sebesar Rp ${Math.abs(variance).toLocaleString('id-ID')}. Perlu pemangkasan logistik taktis.`;
  } else if (efficiencyRatio < 0.5 && targetBudget > 0 && blueprint.event_meta?.scale_classification !== 'Gerilya Scale') {
    budgetHealth = 'starving';
    healthLabel = 'Terlalu Minim (Risiko Kualitas)';
    healthDescription = 'Alokasi anggaran di bawah 50% target. Waspadai kualitas alat, kepuasan audiens, atau asupan konsumsi relawan.';
  }

  // Get recommendations for Gerilya Scale
  const gerilyaRecommendations = [
    {
      title: 'Gotong Royong Konsumsi',
      description: 'Alih-alih katering kardus komersil, berdayakan warga/relawan untuk masak nasi bungkus bersama menggunakan sembako lokal.',
      savings: 'Potensi hemat ~30% pos konsumsi.',
    },
    {
      title: 'Hapus Biaya Sewa Ruang',
      description: 'Lupakan convention hall berbayar. Gunakan balai RT/RW, pekarangan warga, masjid, aula gereja, atau ruko kosong milik simpatisan dengan konsep barter kebaikan.',
      savings: 'Potensi hemat ~50% atau bahkan gratis.',
    },
    {
      title: 'Sosial Media & QR Baliho',
      description: 'Hentikan pencetakan pamflet kertas sekali pakai. Cukup buat 1 banner utama berisi QR Code menuju link materi/kegiatan digital.',
      savings: 'Mengurangi anggaran publikasi hingga 80%.',
    },
    {
      title: 'Tebengan Relawan (Carpooling)',
      description: 'Kelompokkan penjemputan relawan per wilayah tinggal. Gunakan motor/mobil relawan yang searah secara bersamaan.',
      savings: 'Mengurangi beban uang bensin/transportasi hingga 40%.',
    },
  ];

  return (
    <div id="budget-analyzer-section" className="bg-white p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8 md:space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-slate-800 leading-tight">Analisis Efisiensi & Biaya Operasional</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mengukur Realisme Finansial Gerakan</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            Target Pagu: <span className="font-mono font-bold text-slate-800">Rp {targetBudget.toLocaleString('id-ID')}</span>
          </span>
        </div>
      </div>

      {/* Grid Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Rencana Rincian</span>
            <p className="text-2xl font-black font-mono text-slate-800">Rp {totalAllocated.toLocaleString('id-ID')}</p>
          </div>
          <div className="text-[11px] text-slate-500 leading-relaxed">
            Jumlah pengeluaran yang dipecah oleh sistem berdasarkan kebutuhan operasional di lapangan.
          </div>
        </div>

        <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selisih Anggaran (Sisa)</span>
            <p className={`text-2xl font-black font-mono ${variance >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
              {variance >= 0 ? '+' : ''}Rp {variance.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="text-[11px] text-slate-500 leading-relaxed">
            {variance >= 0
              ? 'Anggaran efisien! Anda masih memiliki sisa dana untuk cadangan tim tidak terduga.'
              : 'Defisit! Dana yang dialokasikan melebihi target pendanaan awal.'}
          </div>
        </div>

        {/* Health status gauge card */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
          budgetHealth === 'perfect' ? 'bg-teal-50/30 border-teal-100' :
          budgetHealth === 'warning' ? 'bg-amber-50/30 border-amber-100' : 'bg-rose-50/30 border-rose-100'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Efisiensi</span>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                budgetHealth === 'perfect' ? 'bg-teal-100/70 text-teal-800' :
                budgetHealth === 'warning' ? 'bg-amber-100/70 text-amber-800' : 'bg-rose-100/70 text-rose-800'
              }`}>
                {healthLabel}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {healthDescription}
          </p>
        </div>
      </div>

      {/* Visual Progress Bar Categories */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <span>📊 Alokasi & Estimasi Per Kategori</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(categoriesMap).map(([catName, data]) => {
            const percentage = totalSimulated > 0 ? (data.total / totalSimulated) * 100 : 0;
            const originalPercentage = totalAllocated > 0 ? (data.originalTotal / totalAllocated) * 100 : 0;
            const hasSaving = data.total < data.originalTotal;

            return (
              <div key={catName} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl space-y-3 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{data.icon}</span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-700 leading-none">{catName}</h5>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">
                        {data.items.length} POS ALOKASI
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold font-mono ${hasSaving ? 'text-teal-600' : 'text-slate-700'}`}>
                      Rp {data.total.toLocaleString('id-ID')}
                    </p>
                    {hasSaving && (
                      <p className="text-[9px] font-bold text-slate-400 line-through">
                        Rp {data.originalTotal.toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${data.color}`}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>Proporsi</span>
                    <span>{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive What-If Optimization Simulator */}
      <div className="bg-teal-950 text-white rounded-2xl md:rounded-[2rem] p-6 md:p-8 space-y-6 relative overflow-hidden shadow-xl shadow-teal-900/10 border border-teal-800">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 blur-[50px] -mr-16 -mt-16" />

        <div className="space-y-2 relative">
          <div className="inline-flex items-center gap-1.5 bg-teal-500/10 text-teal-300 border border-teal-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gerilya Simulator Hemat</span>
          </div>
          <h4 className="text-lg font-bold font-display leading-tight">Simulasi Rencana Penghematan Alternatif</h4>
          <p className="text-xs text-teal-300/80 leading-relaxed md:max-w-2xl">
            Aktifkan strategi taktis gotong royong khas Gerilya Mode untuk melihat seberapa jauh kita bisa memangkas biaya operasional tanpa menurunkan motivasi relawan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 relative">
          {/* Toggle 1 */}
          <button
            onClick={() => setUseVolunteersCook(!useVolunteersCook)}
            className={`p-4 rounded-xl border text-left transition-all flex justify-between items-start cursor-pointer select-none ${
              useVolunteersCook
                ? 'bg-teal-900/30 border-teal-500 text-white'
                : 'bg-teal-950/40 border-teal-900/50 hover:border-teal-800 text-teal-100/70'
            }`}
          >
            <div className="space-y-1 max-w-[80%]">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span>🍲</span>
                <span>Masak Mandiri Relawan</span>
              </div>
              <p className="text-[10px] opacity-70 leading-relaxed">
                Manfaatkan partisipasi pasokan sembako dari simpatisan dan masak masakan lokal mandiri.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
              useVolunteersCook ? 'bg-teal-500 border-teal-400 text-white' : 'border-teal-800'
            }`}>
              {useVolunteersCook && <Check className="w-3.5 h-3.5" />}
            </div>
          </button>

          {/* Toggle 2 */}
          <button
            onClick={() => setUsePublicVenue(!usePublicVenue)}
            className={`p-4 rounded-xl border text-left transition-all flex justify-between items-start cursor-pointer select-none ${
              usePublicVenue
                ? 'bg-teal-900/30 border-teal-500 text-white'
                : 'bg-teal-950/40 border-teal-900/50 hover:border-teal-800 text-teal-100/70'
            }`}
          >
            <div className="space-y-1 max-w-[80%]">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span>🎪</span>
                <span>Balai Warga / Fasilitas Publik</span>
              </div>
              <p className="text-[10px] opacity-70 leading-relaxed">
                Gunakan pekarangan kosong, balai RT/RW, aula sekolah, atau sekretariat bersama ber-skema barter sosial.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
              usePublicVenue ? 'bg-teal-500 border-teal-400 text-white' : 'border-teal-800'
            }`}>
              {usePublicVenue && <Check className="w-3.5 h-3.5" />}
            </div>
          </button>

          {/* Toggle 3 */}
          <button
            onClick={() => setUseDigitalFlyer(!useDigitalFlyer)}
            className={`p-4 rounded-xl border text-left transition-all flex justify-between items-start cursor-pointer select-none ${
              useDigitalFlyer
                ? 'bg-teal-900/30 border-teal-500 text-white'
                : 'bg-teal-950/40 border-teal-900/50 hover:border-teal-800 text-teal-100/70'
            }`}
          >
            <div className="space-y-1 max-w-[80%]">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span>📢</span>
                <span>Kampanye Digital & QR (No Print)</span>
              </div>
              <p className="text-[10px] opacity-70 leading-relaxed">
                Alihkan cetakan kertas murni ke file digital, broadcast medsos, dan 1 banner induk dengan QR Code dinamis.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
              useDigitalFlyer ? 'bg-teal-500 border-teal-400 text-white' : 'border-teal-800'
            }`}>
              {useDigitalFlyer && <Check className="w-3.5 h-3.5" />}
            </div>
          </button>

          {/* Toggle 4 */}
          <button
            onClick={() => setUseCarpool(!useCarpool)}
            className={`p-4 rounded-xl border text-left transition-all flex justify-between items-start cursor-pointer select-none ${
              useCarpool
                ? 'bg-teal-900/30 border-teal-500 text-white'
                : 'bg-teal-950/40 border-teal-900/50 hover:border-teal-800 text-teal-100/70'
            }`}
          >
            <div className="space-y-1 max-w-[80%]">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span>🚗</span>
                <span>Carpool & Saling Jemput</span>
              </div>
              <p className="text-[10px] opacity-70 leading-relaxed">
                Kelompokkan akomodasi relawan searah rute transportasi, tebengan motor, atau sewa minibus bersama.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
              useCarpool ? 'bg-teal-500 border-teal-400 text-white' : 'border-teal-800'
            }`}>
              {useCarpool && <Check className="w-3.5 h-3.5" />}
            </div>
          </button>
        </div>

        {/* Live Simulation Outcomes Bar */}
        <div className="border-t border-teal-800 pt-6 mt-2 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div>
            <span className="text-[9px] font-black tracking-widest text-teal-400 uppercase">Rencana Awal</span>
            <p className="text-xl font-bold font-mono text-slate-300">Rp {totalAllocated.toLocaleString('id-ID')}</p>
          </div>

          <div>
            <span className="text-[9px] font-black tracking-widest text-teal-400 uppercase">Simulasi Anggaran Baru</span>
            <p className="text-xl font-black font-mono text-teal-300">Rp {totalSimulated.toLocaleString('id-ID')}</p>
          </div>

          <div className="p-4 bg-teal-900/40 rounded-xl border border-teal-500/20 flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">HEMAT DANA</span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                {totalAllocated > 0 ? ((totalSavings / totalAllocated) * 100).toFixed(0) : 0}% OFF
              </span>
            </div>
            <p className="text-lg font-black font-mono text-emerald-300 mt-1">
              Rp {totalSavings.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
