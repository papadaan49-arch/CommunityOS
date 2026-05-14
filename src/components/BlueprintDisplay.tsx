import React from 'react';
import { Calendar, CreditCard, MapPin, Share2, Copy, Check, Zap, Gauge, AlertTriangle, UserMinus, ClipboardList, Handshake, FileDown, Loader2, Settings2, RefreshCcw, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';
import { Blueprint } from '../types';
import { WellbeingGuard } from './WellbeingGuard';
import { FeedbackSection } from './FeedbackSection';

interface Props {
  blueprint: Blueprint;
  onRevision: () => void;
}

export const BlueprintDisplay: React.FC<Props> = ({ blueprint, onRevision }) => {
  const [copiedType, setCopiedType] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [includeFeedback, setIncludeFeedback] = React.useState(false);
  const blueprintRef = React.useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleExportPDF = async () => {
    if (!blueprintRef.current || exporting) return;
    
    // Start loading state
    setExporting(true);

    // Give browser a moment to render the loading state before heavy processing
    await new Promise(resolve => setTimeout(resolve, 500));

    const element = blueprintRef.current;
    const fileName = `CommunityOS-${blueprint.event_meta.title.replace(/\s+/g, '-')}.pdf`;
    
    // Detect mobile for lower scale to prevent crash
    const isMobile = window.innerWidth < 768;
    const exportScale = isMobile ? 1.5 : 2;

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.95 },
      html2canvas: { 
        scale: exportScale, 
        useCORS: true,
        logging: false,
        letterRendering: true,
        allowTaint: true,
        onclone: (clonedDoc: Document) => {
          const feedbackElement = clonedDoc.getElementById('feedback-section-container');
          if (feedbackElement && !includeFeedback) {
            feedbackElement.style.display = 'none';
          }
          
          // Force a consistent width for the export container in the clone
          const cloneContainer = clonedDoc.querySelector('.pdf-export');
          if (cloneContainer instanceof HTMLElement) {
            cloneContainer.style.width = '750px'; // Optimized for A4 aspect ratio and mobile-friendly render
            cloneContainer.style.padding = '30px';
          }
        }
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all' as const, 'css' as const, 'legacy' as const] }
    };

    try {
      element.classList.add('pdf-export');
      
      // Use the promise-based API for more stable execution
      const worker = html2pdf().from(element).set(opt);
      await worker.save();
      
      toast.success("Blueprint berhasil diunduh.");
    } catch (error) {
      console.error('PDF Export failed:', error);
      toast.error("Sistem sedang mengoptimalkan dokumen unduhan. Silakan coba beberapa saat lagi 🙏");
    } finally {
      element.classList.remove('pdf-export');
      setExporting(false);
    }
  };

  const getScaleBadgeColor = (scale: string) => {
    switch (scale) {
      case 'Gerilya Scale': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Community Scale': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Regional Scale': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Massive Scale': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-16 md:space-y-24 max-w-2xl mx-auto pb-32">
      {/* Export Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-lg p-5 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 sticky top-6 z-50 overflow-hidden"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
            <Settings2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-slate-800 uppercase tracking-[0.2em]">Opsi Export</span>
            <label className="flex items-center gap-2 cursor-pointer group mt-1">
              <input 
                type="checkbox" 
                checked={includeFeedback} 
                onChange={(e) => setIncludeFeedback(e.target.checked)}
                className="w-4 h-4 rounded border-slate-200 text-teal-600 focus:ring-teal-500/20"
              />
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-wider">Sertakan Feedback Form</span>
            </label>
          </div>
        </div>

        <button 
          onClick={handleExportPDF}
          disabled={exporting}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-teal-600 transition-all disabled:bg-slate-200 disabled:cursor-not-allowed shadow-lg shadow-slate-100"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          <span>{exporting ? 'Menyiapkan PDF...' : 'Download PDF Blueprint'}</span>
        </button>
      </motion.div>

      <div ref={blueprintRef} className="ios-spacing print:p-0">
        {/* Event Meta Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 blur-[130px] -mr-48 -mt-48" />
        
        <div className="relative space-y-10">
          <div className="flex flex-wrap gap-3">
            <span className="text-[10px] font-semibold bg-white/10 px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/5">
              Strategy: {blueprint.event_meta.strategy}
            </span>
            <span className={`text-[10px] font-semibold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border ${getScaleBadgeColor(blueprint.event_meta.scale_classification)}`}>
              {blueprint.event_meta.scale_classification}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold">
            {blueprint.event_meta.title}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                <MapPin className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em]">Lokasi Kegiatan</p>
                <p className="text-base md:text-lg font-semibold text-white/90">{blueprint.event_meta.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em]">Estimasi Alokasi Dana</p>
                <p className="text-base md:text-lg font-semibold text-emerald-300">Rp {blueprint.event_meta.budget.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Operational Metadata */}
      <section className="bg-white p-10 md:p-14 rounded-[3rem] shadow-sm border border-slate-100 space-y-12">
        <div className="flex items-center gap-3">
          <Settings2 className="w-5 h-5 text-slate-300" />
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Operational Metadata</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Scale Classification */}
          <div className={`p-6 rounded-[2rem] border ${getScaleBadgeColor(blueprint.event_meta.scale_classification)} flex flex-col gap-4 group transition-all`}>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-50">Blueprint Scale</span>
              <Gauge className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-display font-semibold">{blueprint.event_meta.scale_classification}</h4>
              <p className="text-xs font-medium opacity-70 leading-relaxed">
                {blueprint.event_meta.scale_classification === 'Gerilya Scale' && "Taktis & Efisien"}
                {blueprint.event_meta.scale_classification === 'Community Scale' && "Standar Komunitas"}
                {blueprint.event_meta.scale_classification === 'Regional Scale' && "Dampak Luas"}
                {blueprint.event_meta.scale_classification === 'Massive Scale' && "Kompleksitas Tinggi"}
              </p>
            </div>
          </div>

          {/* Operational Complexity */}
          <div className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex flex-col gap-5">
            <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span>Complexity</span>
              <span className="text-slate-800 font-mono">{blueprint.event_meta.operational_complexity}%</span>
            </div>
            <div className="space-y-3">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${blueprint.event_meta.operational_complexity}%` }}
                  className={`h-full rounded-full ${
                    blueprint.event_meta.operational_complexity < 40 ? 'bg-emerald-400' :
                    blueprint.event_meta.operational_complexity < 75 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {blueprint.event_meta.operational_complexity < 40 ? 'Ringan' :
                 blueprint.event_meta.operational_complexity < 75 ? 'Menengah' : 'Kompleks'}
              </p>
            </div>
          </div>

          {/* Burnout Risk */}
          <div className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex flex-col gap-5">
            <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span>Burnout Risk</span>
              <span className="text-slate-800 font-mono">{blueprint.event_meta.burnout_risk}%</span>
            </div>
            <div className="space-y-3">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${blueprint.event_meta.burnout_risk}%` }}
                  className={`h-full rounded-full ${
                    blueprint.event_meta.burnout_risk < 30 ? 'bg-emerald-400' :
                    blueprint.event_meta.burnout_risk < 60 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {blueprint.event_meta.burnout_risk < 30 ? 'Terjaga' :
                 blueprint.event_meta.burnout_risk < 60 ? 'Waspada' : 'Kritis'}
              </p>
            </div>
          </div>

          {/* Budget Pressure */}
          <div className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex flex-col gap-5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <span>Budget Pressure</span>
              <span className="text-slate-800 font-mono">{blueprint.event_meta.budget_pressure}%</span>
            </div>
            <div className="space-y-3">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${blueprint.event_meta.budget_pressure}%` }}
                  className={`h-full rounded-full ${
                    blueprint.event_meta.budget_pressure < 30 ? 'bg-emerald-400' :
                    blueprint.event_meta.budget_pressure < 70 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {blueprint.event_meta.budget_pressure < 30 ? 'Longgar' :
                 blueprint.event_meta.budget_pressure < 70 ? 'Cukup' : 'Ketat'}
              </p>
            </div>
          </div>

          {/* Coordination Intensity */}
          <div className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex flex-col gap-5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <span>Coordination</span>
              <span className="text-slate-800 font-mono">{blueprint.event_meta.coordination_intensity}%</span>
            </div>
            <div className="space-y-3">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${blueprint.event_meta.coordination_intensity}%` }}
                  className={`h-full rounded-full ${
                    blueprint.event_meta.coordination_intensity < 40 ? 'bg-emerald-400' :
                    blueprint.event_meta.coordination_intensity < 80 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {blueprint.event_meta.coordination_intensity < 40 ? 'Santai' :
                 blueprint.event_meta.coordination_intensity < 80 ? 'Intens' : 'Sangat Padat'}
              </p>
            </div>
          </div>

          {/* Fatigue Analysis Summary */}
          <div className="p-8 rounded-[2.5rem] border border-rose-100 bg-rose-50/20 md:col-span-2 lg:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-500">
              <AlertTriangle className="w-4 h-4" />
              <span>Analisis Lelah</span>
            </div>
            <p className="text-[13px] md:text-sm text-slate-600 leading-[1.8] font-medium italic">
              {blueprint.wellbeing_guard.fatigue_analysis}
            </p>
          </div>
        </div>
      </section>

      {/* Wellbeing Guard Hero Section */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
        <WellbeingGuard guard={blueprint.wellbeing_guard} />
      </div>

      {/* Operational Section */}
      <div className="grid grid-cols-1 gap-8">
        {/* Budget Allocation */}
        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-xl font-display font-semibold text-slate-800">Budget Survival</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {blueprint.operational.budget_allocation.map((item, index) => (
              <motion.div 
                key={index} 
                className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-slate-100 hover:border-teal-100 transition-colors group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">Pos Alokasi</span>
                    <h3 className="font-semibold text-xl text-slate-800 group-hover:text-teal-600 transition-colors">{item.item}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">Estimasi</span>
                    <p className="text-teal-700 font-mono font-bold text-lg">Rp {item.amount.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-sm text-slate-600 italic flex items-start gap-4">
                    <Zap className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span className="leading-[1.7]">{item.label}</span>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Rundown */}
        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-display font-semibold text-slate-800">Rundown Manusiawi</h2>
            </div>
            <button
              onClick={() => {
                const text = blueprint.operational.rundown.map(r => `${r.time}: ${r.task}`).join('\n');
                copyToClipboard(text, 'rundown');
              }}
              className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 hover:text-teal-600 uppercase tracking-[0.2em] transition-colors"
            >
              {copiedType === 'rundown' ? <Check className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
              {copiedType === 'rundown' ? 'Tersalin' : 'Salin Rundown'}
            </button>
          </div>
          <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10 relative">
            <div className="absolute left-10 md:left-14 top-14 bottom-14 w-px bg-slate-100" />
            
            {blueprint.operational.rundown.map((item, index) => (
              <div key={index} className="flex items-start gap-6 md:gap-10 relative group">
                <div className="w-5 h-5 rounded-full bg-white border-[4px] border-emerald-500 z-10 flex-shrink-0 mt-1 shadow-sm group-hover:scale-125 transition-transform" />
                <div className="space-y-3">
                  <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold uppercase tracking-[0.2em]">{item.time}</span>
                  <p className="text-slate-800 font-semibold text-lg md:text-xl leading-relaxed">{item.task}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Outreach Section */}
      <section className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-14">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center shadow-lg shadow-indigo-100/50">
            <Share2 className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-slate-800">Outreach & Partner</h2>
        </div>
        
        <div className="space-y-12">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] opacity-70">Partner Lokal Potensial</h3>
              <button
                onClick={() => copyToClipboard(blueprint.outreach.local_partners.join(', '), 'partners')}
                className="text-[10px] font-semibold text-slate-300 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                {copiedType === 'partners' ? <Check className="w-4 h-4" /> : <Handshake className="w-4 h-4" />}
                Salin Partner
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {blueprint.outreach.local_partners.map((partner, index) => (
                <span key={index} className="bg-white text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-indigo-200 cursor-default">
                  {partner}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] opacity-70">Instagram Caption Kit</h3>
              <button
                onClick={() => copyToClipboard(blueprint.outreach.ig_caption, 'caption')}
                className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors"
              >
                {copiedType === 'caption' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedType === 'caption' ? 'Tersalin' : 'Salin Caption'}
              </button>
            </div>
            <div className="p-8 bg-slate-50/50 rounded-[2.5rem] text-[15px] md:text-base text-slate-600 whitespace-pre-wrap font-sans border border-slate-100 leading-[1.8] italic shadow-inner">
              {blueprint.outreach.ig_caption}
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <div id="feedback-section-container" className="space-y-12">
        <FeedbackSection />
        
        {/* Revision & Continuity Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onRevision}
            className="flex items-start gap-4 p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-teal-200 transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all flex-shrink-0 shadow-sm">
              <RefreshCcw className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-800">Perbaiki Strategi</p>
              <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"Buat Versi Revisi untuk hasil yang lebih presisi"</p>
            </div>
          </button>
          
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-start gap-4 p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-teal-200 transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all flex-shrink-0 shadow-sm">
              <ArrowLeft className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-800">Lanjutkan Blueprint</p>
              <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"Simpan sebagai aksi dan mulai eksekusi"</p>
            </div>
          </button>
        </div>
      </div>

      <div className="text-center pt-8 border-t border-slate-100/50">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.4em] mb-2">
          Community<span className="text-teal-500">OS</span>
        </p>
        <p className="text-[8px] text-slate-300 font-semibold uppercase tracking-widest italic">
          AI Operating System for Communities in Indonesia
        </p>
      </div>
    </div>
  </div>
  );
};
