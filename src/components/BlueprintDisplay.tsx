import React from 'react';
import { Calendar, CreditCard, MapPin, Share2, Copy, Check, Zap, Gauge, AlertTriangle, UserMinus, ClipboardList, Handshake, FileDown, Loader2, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Blueprint } from '../types';
import { WellbeingGuard } from './WellbeingGuard';
import { FeedbackSection } from './FeedbackSection';

interface Props {
  blueprint: Blueprint;
}

export const BlueprintDisplay: React.FC<Props> = ({ blueprint }) => {
  const [copiedType, setCopiedType] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [includeFeedback, setIncludeFeedback] = React.useState(false);
  const blueprintRef = React.useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleExport = async () => {
    if (!blueprintRef.current) return;
    setExporting(true);

    try {
      // Small delay to ensure animations are settled if any
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(blueprintRef.current, {
        scale: 2, // Better resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const feedbackElement = clonedDoc.getElementById('feedback-section-container');
          if (feedbackElement && !includeFeedback) {
            feedbackElement.style.display = 'none';
          }
        },
        windowWidth: 1200, // Ensure desktop-ish layout for PDF
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${blueprint.event_meta.title.replace(/\s+/g, '_')}_Blueprint.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
    } finally {
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
    <div className="space-y-8 max-w-2xl mx-auto pb-16">
      {/* Export Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-50 overflow-hidden"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest">Opsi Export</span>
            <label className="flex items-center gap-1.5 cursor-pointer group mt-0.5">
              <input 
                type="checkbox" 
                checked={includeFeedback} 
                onChange={(e) => setIncludeFeedback(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-200 text-teal-600 focus:ring-teal-500/20"
              />
              <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-wider">Sertakan Feedback Form</span>
            </label>
          </div>
        </div>

        <button 
          onClick={handleExport}
          disabled={exporting}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-extrabold hover:bg-teal-600 transition-all disabled:bg-slate-200 disabled:cursor-not-allowed shadow-lg shadow-slate-100"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          <span>{exporting ? 'Menyiapkan PDF...' : 'Download PDF Blueprint'}</span>
        </button>
      </motion.div>

      <div ref={blueprintRef} className="space-y-8 print:p-0">
        {/* Event Meta Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 p-6 md:p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[100px] -mr-32 -mt-32" />
        
        <div className="relative space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-[9px] font-extrabold bg-white/10 px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-white/5">
              Strategy: {blueprint.event_meta.strategy}
            </span>
            <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-[0.2em] border ${getScaleBadgeColor(blueprint.event_meta.scale_classification)}`}>
              {blueprint.event_meta.scale_classification}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-extrabold leading-tight tracking-tight">
            {blueprint.event_meta.title}
          </h1>
          
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <MapPin className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Lokasi</p>
                <p className="text-xs md:text-sm font-semibold">{blueprint.event_meta.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Budget</p>
                <p className="text-xs md:text-sm font-semibold text-emerald-300">Rp {blueprint.event_meta.budget.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Operational Metadata */}
      <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Operational Metadata</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Scale Classification */}
          <div className={`p-5 rounded-2xl border ${getScaleBadgeColor(blueprint.event_meta.scale_classification)} flex flex-col gap-3 group transition-all`}>
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Blueprint Scale</span>
              <Gauge className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-display font-extrabold leading-tight">{blueprint.event_meta.scale_classification}</h4>
              <p className="text-[10px] font-medium opacity-80 leading-relaxed">
                {blueprint.event_meta.scale_classification === 'Gerilya Scale' && "Taktis & Efisien"}
                {blueprint.event_meta.scale_classification === 'Community Scale' && "Standar Komunitas"}
                {blueprint.event_meta.scale_classification === 'Regional Scale' && "Dampak Luas"}
                {blueprint.event_meta.scale_classification === 'Massive Scale' && "Kompleksitas Tinggi"}
              </p>
            </div>
          </div>

          {/* Operational Complexity */}
          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4">
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span>Complexity</span>
              <span className="text-slate-800">{blueprint.event_meta.operational_complexity}%</span>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${blueprint.event_meta.operational_complexity}%` }}
                  className={`h-full rounded-full ${
                    blueprint.event_meta.operational_complexity < 40 ? 'bg-emerald-400' :
                    blueprint.event_meta.operational_complexity < 75 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                />
              </div>
              <p className="text-xs font-bold text-slate-700">
                {blueprint.event_meta.operational_complexity < 40 ? 'Ringan' :
                 blueprint.event_meta.operational_complexity < 75 ? 'Menengah' : 'Kompleks'}
              </p>
            </div>
          </div>

          {/* Burnout Risk */}
          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4">
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span>Burnout Risk</span>
              <span className="text-slate-800">{blueprint.event_meta.burnout_risk}%</span>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${blueprint.event_meta.burnout_risk}%` }}
                  className={`h-full rounded-full ${
                    blueprint.event_meta.burnout_risk < 30 ? 'bg-emerald-400' :
                    blueprint.event_meta.burnout_risk < 60 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                />
              </div>
              <p className="text-xs font-bold text-slate-700">
                {blueprint.event_meta.burnout_risk < 30 ? 'Terjaga' :
                 blueprint.event_meta.burnout_risk < 60 ? 'Waspada' : 'Kritis'}
              </p>
            </div>
          </div>

          {/* Budget Pressure */}
          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4">
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span>Budget Pressure</span>
              <span className="text-slate-800">{blueprint.event_meta.budget_pressure}%</span>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${blueprint.event_meta.budget_pressure}%` }}
                  className={`h-full rounded-full ${
                    blueprint.event_meta.budget_pressure < 30 ? 'bg-emerald-400' :
                    blueprint.event_meta.budget_pressure < 70 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                />
              </div>
              <p className="text-xs font-bold text-slate-700">
                {blueprint.event_meta.budget_pressure < 30 ? 'Longgar' :
                 blueprint.event_meta.budget_pressure < 70 ? 'Cukup' : 'Ketat'}
              </p>
            </div>
          </div>

          {/* Coordination Intensity */}
          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4">
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span>Coordination</span>
              <span className="text-slate-800">{blueprint.event_meta.coordination_intensity}%</span>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${blueprint.event_meta.coordination_intensity}%` }}
                  className={`h-full rounded-full ${
                    blueprint.event_meta.coordination_intensity < 40 ? 'bg-emerald-400' :
                    blueprint.event_meta.coordination_intensity < 80 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                />
              </div>
              <p className="text-xs font-bold text-slate-700">
                {blueprint.event_meta.coordination_intensity < 40 ? 'Santai' :
                 blueprint.event_meta.coordination_intensity < 80 ? 'Intens' : 'Sangat Padat'}
              </p>
            </div>
          </div>

          {/* Fatigue Analysis Summary */}
          <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/20 md:col-span-2 lg:col-span-1 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-rose-500">
              <AlertTriangle className="w-3 h-3" />
              <span>Analisis Lelah</span>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed font-medium line-clamp-3">
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
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-teal-600" />
              </div>
              <h2 className="text-lg font-display font-extrabold text-slate-800">Budget Survival</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {blueprint.operational.budget_allocation.map((item, index) => (
              <motion.div 
                key={index} 
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-teal-100 transition-colors group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-400">Pos Alokasi</span>
                    <h3 className="font-bold text-slate-800 group-hover:text-teal-600 transition-colors">{item.item}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] uppercase tracking-widest font-extrabold text-slate-400">Estimasi</span>
                    <p className="text-teal-700 font-mono font-bold text-sm">Rp {item.amount.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-100/50">
                  <p className="text-[11px] text-slate-500 italic flex items-start gap-2">
                    <Zap className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Rundown */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-lg font-display font-extrabold text-slate-800">Rundown Manusiawi</h2>
            </div>
            <button
              onClick={() => {
                const text = blueprint.operational.rundown.map(r => `${r.time}: ${r.task}`).join('\n');
                copyToClipboard(text, 'rundown');
              }}
              className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 hover:text-teal-600 uppercase tracking-wider transition-colors"
            >
              {copiedType === 'rundown' ? <Check className="w-3 h-3" /> : <ClipboardList className="w-3 h-3" />}
              {copiedType === 'rundown' ? 'Tersalin' : 'Salin Rundown'}
            </button>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6 relative">
            <div className="absolute left-8 md:left-10 top-10 bottom-10 w-px bg-slate-100" />
            
            {blueprint.operational.rundown.map((item, index) => (
              <div key={index} className="flex items-start gap-4 md:gap-6 relative">
                <div className="w-4 h-4 rounded-full bg-white border-[3px] border-emerald-500 z-10 flex-shrink-0 mt-1" />
                <div className="space-y-0.5 md:space-y-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">{item.time}</span>
                  <p className="text-slate-800 font-bold text-sm md:text-base leading-snug">{item.task}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Outreach Section */}
      <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-xl font-display font-extrabold text-slate-800">Outreach & Partner</h2>
        </div>
        
        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] opacity-70">Partner Lokal Potensial</h3>
              <button
                onClick={() => copyToClipboard(blueprint.outreach.local_partners.join(', '), 'partners')}
                className="text-[9px] font-extrabold text-slate-300 hover:text-indigo-600 uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                {copiedType === 'partners' ? <Check className="w-3 h-3" /> : <Handshake className="w-3 h-3" />}
                Salin Partner
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {blueprint.outreach.local_partners.map((partner, index) => (
                <span key={index} className="bg-white text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors cursor-default">
                  {partner}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] opacity-70">Instagram Caption Kit</h3>
              <button
                onClick={() => copyToClipboard(blueprint.outreach.ig_caption, 'caption')}
                className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors"
              >
                {copiedType === 'caption' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedType === 'caption' ? 'Tersalin' : 'Salin Caption'}
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 whitespace-pre-wrap font-sans border border-slate-100 leading-relaxed italic">
              {blueprint.outreach.ig_caption}
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <div id="feedback-section-container">
        <FeedbackSection />
      </div>
    </div>

      <div className="text-center pt-8 border-t border-slate-100/50">
        <p className="text-[10px] text-slate-300 font-extrabold uppercase tracking-[0.4em] mb-2">
          Community<span className="text-teal-500">OS</span>
        </p>
        <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest italic">
          AI Operating System for Communities in Indonesia
        </p>
      </div>
    </div>
  );
};
