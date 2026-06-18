import React from 'react';
import { Clock, Calendar, CheckCircle2, ChevronRight, Play, AlertCircle, Info, Sparkles, Filter, Users, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Blueprint } from '../types';

interface Props {
  blueprint: Blueprint;
}

export const TimelineVisualizer: React.FC<Props> = ({ blueprint }) => {
  const rundown = blueprint.operational?.rundown || [];
  const [filterQuery, setFilterQuery] = React.useState('');
  const [activeItemIndex, setActiveItemIndex] = React.useState<number | null>(null);

  // Helper: Parse hours and minutes to duration
  const parseTimeToMinutes = (timeStr: string): number => {
    try {
      // Handles formats like "08:00", "08.00", "08:00 - 09:00", etc.
      const match = timeStr.match(/(\d{1,2})[:.](\d{2})/);
      if (match) {
        return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      }
    } catch (e) {
      // Fail silently
    }
    return 0;
  };

  // Build sequential items with calculated gap / duration
  const timelineItems = rundown.map((item, index) => {
    const minutes = parseTimeToMinutes(item.time);
    
    // Guess duration if there's a next item
    let calculatedDuration = '';
    const nextItem = rundown[index + 1];
    if (nextItem) {
      const currentMin = minutes;
      const nextMin = parseTimeToMinutes(nextItem.time);
      if (nextMin > currentMin && currentMin > 0) {
        const diff = nextMin - currentMin;
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        calculatedDuration = hrs > 0 ? `${hrs} jam ${mins} mnt` : `${mins} menit`;
      }
    }

    // Try to guess a representative icon
    const label = item.task.toLowerCase();
    let emoji = '📌';
    let typeLabel = 'Lainnya';
    let typeBg = 'bg-slate-100 text-slate-700';

    if (label.includes('buka') || label.includes('opening') || label.includes('sambutan') || label.includes('regist')) {
      emoji = '🌅';
      typeLabel = 'Pembukaan';
      typeBg = 'bg-emerald-50 text-emerald-700 border-emerald-100';
    } else if (label.includes('makan') || label.includes('coffe') || label.includes('istirahat') || label.includes('isbama') || label.includes('ishoma') || label.includes('sholat') || label.includes('rehat')) {
      emoji = '☕';
      typeLabel = 'Rehat & Ishoma';
      typeBg = 'bg-amber-50 text-amber-700 border-amber-100';
    } else if (label.includes('panitia') || label.includes('briefing') || label.includes('evaluasi') || label.includes('rapat')) {
      emoji = '🤝';
      typeLabel = 'Koordinasi';
      typeBg = 'bg-indigo-50 text-indigo-700 border-indigo-100';
    } else if (label.includes('materi') || label.includes('workshop') || label.includes('sesi') || label.includes('talkshow') || label.includes('panel') || label.includes('diskusi')) {
      emoji = '🎙️';
      typeLabel = 'Sesi Utama';
      typeBg = 'bg-purple-50 text-purple-700 border-purple-100';
    } else if (label.includes('tutup') || label.includes('closing') || label.includes('foto') || label.includes('pulang') || label.includes('pemberesan')) {
      emoji = '🌆';
      typeLabel = 'Penutupan';
      typeBg = 'bg-rose-50 text-rose-700 border-rose-100';
    } else if (label.includes('game') || label.includes('ice') || label.includes('doorprize') || label.includes('kuis') || label.includes('hiburan')) {
      emoji = '🎉';
      typeLabel = 'Ice Breaking';
      typeBg = 'bg-sky-50 text-sky-700 border-sky-100';
    }

    return {
      ...item,
      minutes,
      duration: calculatedDuration,
      emoji,
      typeLabel,
      typeBg,
      originalIndex: index
    };
  });

  // Filter items
  const filteredItems = timelineItems.filter(item => 
    item.task.toLowerCase().includes(filterQuery.toLowerCase()) ||
    item.time.toLowerCase().includes(filterQuery.toLowerCase()) ||
    item.typeLabel.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // Stats
  const totalDurationMinutes = (() => {
    if (timelineItems.length < 2) return 0;
    const start = timelineItems[0].minutes;
    const end = timelineItems[timelineItems.length - 1].minutes;
    if (end > start && start > 0) return end - start;
    return 0;
  })();

  const formatTotalTime = (totalMins: number) => {
    if (totalMins === 0) return 'Tidak terdeteksi';
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs} Jam ${mins} Menit` : `${mins} Menit`;
  };

  return (
    <div id="timeline-visualizer-section" className="bg-white p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8 md:space-y-10">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-slate-800 leading-tight">Visualisasi Linimasa & Alur Acara</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pemetaan Rantai Kegiatan Sistematis & Humanis</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {totalDurationMinutes > 0 && (
            <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg">
              ESTIMASI TOTAL: {formatTotalTime(totalDurationMinutes).toUpperCase()}
            </span>
          )}
          <span className="text-[10px] font-extrabold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg uppercase">
            {rundown.length} Agenda Kegiatan
          </span>
        </div>
      </div>

      {/* Info message */}
      <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-3 text-xs text-emerald-800 items-start">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 font-sans leading-relaxed">
          <p className="font-bold">Pemetaan Kronologis Taktis</p>
          <p className="text-emerald-700">
            Linimasa di bawah diurutkan secara sekuensial berdasarkan jam pelaksanaan. Klik pada kartu kegiatan mana pun untuk melihat rincian alur transisi dan tips pelaksanaan lapangan.
          </p>
        </div>
      </div>

      {/* Direct Search / Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari agenda, jam, atau jenis sesi..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-medium focus:outline-none transition-colors"
          />
        </div>
        
        {/* Quick filter pill buttons */}
        <div className="flex flex-wrap gap-1.5">
          {['Semua', 'Sesi Utama', 'Ishoma', 'Pembukaan', 'Penutupan'].map((label) => {
            const isSelected = 
              label === 'Semua' ? filterQuery === '' : 
              label === 'Sesi Utama' ? filterQuery === 'Sesi Utama' :
              label === 'Ishoma' ? filterQuery === 'Rehat' : 
              filterQuery === label;

            return (
              <button
                key={label}
                onClick={() => {
                  if (label === 'Semua') setFilterQuery('');
                  else if (label === 'Ishoma') setFilterQuery('Rehat');
                  else setFilterQuery(label);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-teal-600 border-teal-500 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-100 text-slate-600'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Timeline Diagram Canvas */}
      <div className="relative">
        {/* Left vertical timeline bar connector */}
        <div className="absolute left-6 md:left-8 top-8 bottom-8 w-1 bg-gradient-to-b from-teal-500/30 via-sky-500/30 to-amber-500/30 rounded-full" />

        <div className="space-y-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-medium">
              Tidak ada agenda kegiatan yang cocok dengan filter pencarian Anda.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = activeItemIndex === item.originalIndex;
              const isLast = idx === filteredItems.length - 1;

              return (
                <div key={idx} className="relative pl-12 md:pl-16">
                  
                  {/* Visual timeline circle indicator */}
                  <button
                    onClick={() => setActiveItemIndex(isSelected ? null : item.originalIndex)}
                    className={`absolute left-3.5 md:left-5 top-2.5 w-6 h-6 rounded-full flex items-center justify-center z-10 border shadow-md hover:scale-115 transition-all cursor-pointer text-xs ${
                      isSelected 
                        ? 'bg-teal-600 border-teal-500 text-white ring-4 ring-teal-100' 
                        : 'bg-white border-slate-300 text-slate-500 hover:border-teal-500 hover:text-teal-600'
                    }`}
                  >
                    <span className="text-[10px] font-bold">{item.originalIndex + 1}</span>
                  </button>

                  <div 
                    onClick={() => setActiveItemIndex(isSelected ? null : item.originalIndex)}
                    className={`p-4 md:p-5 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-slate-50 border-teal-300 shadow-sm ring-1 ring-teal-200' 
                        : 'bg-white hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg" role="img" aria-label="agenda icon">{item.emoji}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${item.typeBg}`}>
                            {item.typeLabel}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            🕒 {item.time}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold font-display text-slate-800 tracking-tight">
                          {item.task}
                        </h4>
                      </div>

                      {/* Right metadata (duration & action) */}
                      <div className="text-left md:text-right flex md:flex-col items-center md:items-end gap-2 shrink-0">
                        {item.duration ? (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            ⏳ Estimasi: {item.duration}
                          </span>
                        ) : (
                          !isLast && (
                            <span className="text-[9px] font-bold text-slate-400 italic">
                              Sesi fleksibel
                            </span>
                          )
                        )}
                        <span className="text-[9px] font-black text-teal-600 uppercase tracking-wider flex items-center gap-0.5">
                          {isSelected ? 'Klik Tutup ▲' : 'Rincian Tips ▼'}
                        </span>
                      </div>
                    </div>

                    {/* Detailed expandable insights for this timeline point */}
                    {isSelected && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-slate-600 leading-relaxed"
                        onClick={(e) => e.stopPropagation()} // Prevent closing on inner click
                      >
                        <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                          <p className="font-bold text-slate-700 flex items-center gap-1.5">
                            <span>🛡️ Manajemen Energi Tim:</span>
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {item.typeLabel === 'Rehat & Ishoma' 
                              ? 'Maksimalkan rehat ini untuk melepas penat panitia. Hindari koordinasi teknis yang berisik selama sesi ibadah atau makan berlangsung agar mental tim kembali segar.'
                              : item.typeLabel === 'Ice Breaking'
                              ? 'Fokuskan pada keceriaan santai. Ice breaking tidak perlu lama, cukup 5-10 menit untuk mende-eskalasi kecemasan audiens dan merekatkan relasi.'
                              : item.typeLabel === 'Koordinasi'
                              ? 'Gunakan checklist ringkas. Bagikan air putih atau camilan kecil untuk menjaga stabilitas gula darah panitia selama rapat darurat.'
                              : 'Beri ruang delegasi bagi relawan magang. Pantau tingkat stres di balik layar dan pastikan air mineral tersedia melimpah di panggung.'}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                          <p className="font-bold text-slate-700 flex items-center gap-1.5">
                            <span>📍 Operational Checklist:</span>
                          </p>
                          <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1">
                            <li>Pastikan sound system, mikrofon, dan kelistrikan aman sebelum masuk ke segmen ini.</li>
                            <li>Tunjuk 1 penanggung jawab utama sesi ini untuk memandu audiens tepat waktu.</li>
                            {item.duration && <li>Siapkan kode isyarat 5-menit-terakhir untuk pembicara/pemimpin sesi.</li>}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
      
    </div>
  );
};
