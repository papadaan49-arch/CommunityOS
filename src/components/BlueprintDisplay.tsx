import React from 'react';
import { Calendar, CreditCard, MapPin, Share2, Copy, Check, Zap, Gauge, AlertTriangle, UserMinus, ClipboardList, Handshake, FileText, FileDown, Loader2, Settings2, RefreshCcw, ArrowLeft, HelpCircle, ExternalLink, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Blueprint } from '../types';
import { BrandLogo } from './BrandLogo';
import { WellbeingGuard } from './WellbeingGuard';
import { FeedbackSection } from './FeedbackSection';
import { CollaboratorsManager } from './CollaboratorsManager';
import { LoadingOverlay } from './LoadingOverlay';
import { HelpTooltip } from './HelpTooltip';
import { GUIDANCE_DATA } from '../constants/guidance';
import { generateDocx } from '../services/docxService';

interface Props {
  blueprint: Blueprint;
  blueprintId?: string | null;
  onRevision: () => void;
  onRefine: (instructions: string) => void;
}

const ADMIN_WHATSAPP = "6285828676589";

export const BlueprintDisplay: React.FC<Props> = ({ blueprint, blueprintId, onRevision, onRefine }) => {
  const [copiedType, setCopiedType] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [exportStatus, setExportStatus] = React.useState('Sistem sedang merangkai blueprint Anda...');
  const [refinementText, setRefinementText] = React.useState('');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success(`Berhasil menyalin ${type}`);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleFullCopy = () => {
    const text = `
BLUEPRINT OPERASIONAL: ${blueprint.event_meta.title}
Lokasi: ${blueprint.event_meta.location}
Budget: Rp ${blueprint.event_meta.budget.toLocaleString('id-ID')}
Strategi: ${blueprint.event_meta.strategy}

ANALISIS WELLBEING:
${blueprint.wellbeing_guard.fatigue_analysis}

RUNDOWN:
${blueprint.operational.rundown.map(r => `${r.time}: ${r.task}`).join('\n')}

BUDGET SURVIVAL:
${blueprint.operational.budget_allocation.map(b => `${b.item}: Rp ${b.amount.toLocaleString('id-ID')} (${b.label})`).join('\n')}

Dihasilkan oleh CommunityOS.
    `.trim();
    
    copyToClipboard(text, 'Seluruh Blueprint');
  };

  const handleConsultation = () => {
    if (!ADMIN_WHATSAPP) return;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}`, '_blank');
  };

  const handleExportTxt = () => {
    const text = `
DRAFT OPERASIONAL: ${blueprint.event_meta.title}
================================================

RINGKASAN ACARA
---------------
Lokasi: ${blueprint.event_meta.location}
Budget: Rp ${blueprint.event_meta.budget.toLocaleString('id-ID')}
Skala: ${blueprint.event_meta.scale_classification}
Strategi: ${blueprint.event_meta.strategy}

ANALISIS WELLBEING & BURNOUT
----------------------------
Analisis Lelah: ${blueprint.wellbeing_guard.fatigue_analysis}
Kerumitan: ${blueprint.event_meta.operational_complexity}%
Risiko Burnout: ${blueprint.event_meta.burnout_risk}%

RUNDOWN MANUSIAWI
-----------------
${blueprint.operational.rundown.map(r => `[${r.time}] ${r.task}`).join('\n')}

ALOKASI BUDGET SURVIVAL
-----------------------
${blueprint.operational.budget_allocation.map(b => `- ${b.item}: Rp ${b.amount.toLocaleString('id-ID')} (${b.label})`).join('\n')}

OUTREACH & KOLABORASI
---------------------
Partner Lokal: ${blueprint.outreach.local_partners.join(', ')}

Dihasilkan secara otomatis oleh CommunityOS.
    `.trim();

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const fileName = `CommunityOS-Draft-${blueprint.event_meta.title.replace(/\s+/g, '-')}.txt`;
    
    // Using file-saver which is already installed
    import('file-saver').then(fs => fs.saveAs(blob, fileName));
    toast.success("Draft .txt berhasil diunduh.");
  };

  const handleExportDocx = async () => {
    if (exporting) return;
    setExporting(true);
    setExportStatus('Menyiapkan draft operasional editable...');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await generateDocx(blueprint);
      toast.success("Draft operasional .docx berhasil diunduh. Silakan upload ke Google Docs untuk koordinasi tim.");
    } catch (error) {
      console.error('Docx Export failed:', error);
      toast.error("Gagal membuat draft. Silakan salin teks secara manual.");
    } finally {
      setExporting(false);
    }
  };

  const getScaleBadgeColor = (scale: string) => {
    switch (scale) {
      case 'Gerilya Scale': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Community Scale': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Regional Scale': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Massive Scale': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-20 md:space-y-32 max-w-2xl mx-auto pb-48">
      <LoadingOverlay 
        isVisible={exporting} 
        message={exportStatus} 
      />

      {/* Operational Coordination Hub */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-6 sticky top-6 z-50 px-8"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <BrandLogo size="sm" variant="brand" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-extrabold text-slate-900 tracking-tight leading-none uppercase">Kolaborasi Blueprint</span>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Kembangkan strategi ini bersama tim</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
            <button 
              onClick={handleFullCopy}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-[11px] font-extrabold transition-all border border-slate-100 hover:bg-slate-50 text-slate-700 active:scale-95 uppercase tracking-wider"
              title="Salin ke Clipboard"
            >
              <Copy className="w-4 h-4" />
              <span>Salin</span>
            </button>

            <button 
              onClick={handleExportTxt}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-[11px] font-extrabold transition-all border border-slate-100 hover:bg-slate-50 text-slate-700 active:scale-95 uppercase tracking-wider"
              title="Unduh Draft .txt"
            >
              <FileDown className="w-4 h-4" />
              <span>Draft .txt</span>
            </button>
            
            <button 
              onClick={handleExportDocx}
              disabled={exporting}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[11px] font-extrabold transition-all shadow-lg active:scale-95 ${
                exporting 
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed shadow-none' 
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-100 uppercase tracking-widest'
              }`}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              <span>{exporting ? 'MENYIAPKAN...' : 'LANJUTKAN DI GOOGLE DOCS'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      <div className="ios-spacing print:p-0">
        {/* Event Meta Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 p-10 md:p-16 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] -mr-64 -mb-64" />
        
        <div className="relative space-y-14">
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-extrabold bg-white/10 px-4 py-2 rounded-full border border-white/20 tracking-widest uppercase mb-1 pdf-badge-fix">
              Strategi: {blueprint.event_meta.strategy}
            </span>
            <span className={`text-[10px] font-extrabold px-4 py-2 rounded-full border tracking-widest uppercase pdf-badge-fix ${getScaleBadgeColor(blueprint.event_meta.scale_classification)}`}>
              {blueprint.event_meta.scale_classification}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-bold leading-[1.1] tracking-tight text-white drop-shadow-sm max-w-2xl">
            {blueprint.event_meta.title}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-14 border-t border-white/10">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-teal-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Lokasi Kegiatan</p>
                <p className="text-lg font-bold text-white tracking-tight">{blueprint.event_meta.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-emerald-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Alokasi Dana</p>
                <p className="text-lg font-black text-emerald-400 tracking-tight">Rp {blueprint.event_meta.budget.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Operational Metadata */}
      <section className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-14">
        <div className="flex items-center gap-3">
          <Settings2 className="w-4 h-4 text-slate-300" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Analisis Operasional</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Scale Classification */}
          <div className={`p-6 rounded-[2rem] border ${getScaleBadgeColor(blueprint.event_meta.scale_classification)} flex flex-col gap-4 group transition-all`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5 opacity-50">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Skala Blueprint</span>
                <HelpTooltip {...GUIDANCE_DATA.BLUEPRINT_SCALE} />
              </div>
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
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <div className="flex items-center gap-1.5 leading-none">
                <span>Kerumitan</span>
                <HelpTooltip {...GUIDANCE_DATA.OPERATIONAL_COMPLEXITY} />
              </div>
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
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <div className="flex items-center gap-1.5 leading-none">
                <span>Risiko Burnout</span>
                <HelpTooltip {...GUIDANCE_DATA.BURNOUT_RISK} />
              </div>
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
              <div className="flex items-center gap-1.5 leading-none">
                <span>Tekanan Dana</span>
                <HelpTooltip {...GUIDANCE_DATA.BUDGET_PRESSURE} />
              </div>
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
              <div className="flex items-center gap-1.5 leading-none">
                <span>Intensitas Rapat</span>
                <HelpTooltip {...GUIDANCE_DATA.COORDINATION_INTENSITY} />
              </div>
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
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-xl font-display font-semibold text-slate-800">Budget Survival</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8">
            {blueprint.operational.budget_allocation.map((item, index) => (
              <motion.div 
                key={index} 
                className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-teal-100 transition-colors group"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Pos Alokasi</span>
                    <h3 className="font-semibold text-xl text-slate-800 group-hover:text-teal-600 transition-colors">{item.item}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Estimasi</span>
                    <p className="text-teal-700 font-mono font-bold text-lg">Rp {item.amount.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-sm text-slate-600 italic flex items-start gap-4">
                    <Zap className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span className="leading-[1.7] font-medium">{item.label}</span>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Rundown */}
        <section>
          <div className="flex items-center justify-between mb-8 px-2">
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
              className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors"
            >
              {copiedType === 'rundown' ? <Check className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
              {copiedType === 'rundown' ? 'Tersalin' : 'Salin Rundown'}
            </button>
          </div>
          <div className="bg-white p-10 md:p-16 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-12 relative overflow-hidden">
            <div className="absolute left-10 md:left-16 top-16 bottom-16 w-px bg-slate-100" />
            
            {blueprint.operational.rundown.map((item, index) => (
              <div key={index} className="flex items-start gap-8 md:gap-12 relative group">
                <div className="w-4 h-4 rounded-full bg-white border-[3px] border-emerald-500 z-10 flex-shrink-0 mt-1.5 shadow-sm group-hover:scale-125 transition-transform" />
                <div className="space-y-3">
                  <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest">{item.time}</span>
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
          <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center">
            <Share2 className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-display font-semibold text-slate-800">Outreach & Partner</h2>
        </div>
        
        <div className="space-y-14">
          <div>
            <div className="flex justify-between items-center mb-8 px-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Partner Lokal Potensial</h3>
              <button
                onClick={() => copyToClipboard(blueprint.outreach.local_partners.join(', '), 'partners')}
                className="text-[10px] font-bold text-slate-300 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                {copiedType === 'partners' ? <Check className="w-4 h-4" /> : <Handshake className="w-4 h-4" />}
                Salin Partner
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {blueprint.outreach.local_partners.map((partner, index) => (
                <span key={index} className="bg-slate-50 text-slate-700 text-xs font-semibold px-5 py-3 rounded-2xl border border-slate-100 transition-all hover:border-indigo-100 cursor-default">
                  {partner}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-8 px-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Instagram Caption Kit</h3>
              <button
                onClick={() => copyToClipboard(blueprint.outreach.ig_caption, 'caption')}
                className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors"
              >
                {copiedType === 'caption' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Salin Caption
              </button>
            </div>
            <div className="p-10 bg-slate-50/50 rounded-[2.5rem] text-sm md:text-base text-slate-600 whitespace-pre-wrap font-sans border border-slate-100 leading-relaxed italic shadow-inner">
              {blueprint.outreach.ig_caption}
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <div id="feedback-section-container" className="space-y-12">
        <FeedbackSection />

        {/* Collaboration Hub */}
        {blueprintId && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-xl shadow-teal-900/5 border border-teal-100/50"
          >
            <CollaboratorsManager blueprintId={blueprintId} />
          </motion.section>
        )}

        {/* Refinement Hub - Iterative Planning */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-xl shadow-teal-900/5 border border-teal-100/50 space-y-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px] -mr-32 -mt-32" />
          
          <div className="space-y-6 relative">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[1.5rem] bg-teal-50 flex items-center justify-center shadow-lg shadow-teal-100/50">
                <Settings2 className="w-7 h-7 text-teal-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-display font-semibold text-slate-800">Refinement Hub</h2>
                <p className="text-sm text-slate-400 font-medium leading-relaxed italic">"Iterasi blueprint ini agar lebih presisi dan manusiawi"</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">
                Apa yang ingin Anda sesuaikan?
              </label>
              <textarea
                value={refinementText}
                onChange={(e) => setRefinementText(e.target.value)}
                placeholder="Contoh: Budgetnya terlalu mahal, tolong kurangi. Atau: Kurangi jumlah panitia agar tidak terlalu padat."
                className="w-full min-h-[120px] p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-200 transition-all resize-none font-medium leading-relaxed"
              />
              <div className="flex flex-col md:flex-row items-center gap-4 pt-2">
                <button
                  onClick={() => {
                    if (refinementText.trim()) {
                      onRefine(refinementText);
                      setRefinementText('');
                    } else {
                      toast.error("Berikan instruksi revisi terlebih dahulu.");
                    }
                  }}
                  className="w-full md:flex-1 bg-teal-600 text-white p-5 rounded-[1.5rem] text-sm font-bold shadow-lg shadow-teal-200 hover:bg-teal-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <RefreshCcw className="w-5 h-5" />
                  <span>Update Blueprint Progressif</span>
                </button>
                <div className="hidden md:block w-px h-10 bg-slate-100" />
                <button
                  onClick={onRevision}
                  className="w-full md:w-auto px-8 p-5 bg-white border border-slate-200 text-slate-600 rounded-[1.5rem] text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                >
                  Mulai Dari Awal
                </button>
              </div>
            </div>
            
            <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed italic font-medium">
                <strong>Catatan Operasional:</strong> CommunityOS akan menjaga konteks awal komunitas Anda sembari menyesuaikan elemen-elemen spesifik berdasarkan feedback ini.
              </p>
            </div>
          </div>
        </motion.section>
        
        {/* Revision & Continuity Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ADMIN_WHATSAPP && (
            <button
              onClick={handleConsultation}
              className="flex items-start gap-4 p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-teal-200 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all flex-shrink-0 shadow-sm">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-800">Konsultasi Lanjut</p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"Hubungi fasilitator CommunityOS untuk mentoring"</p>
              </div>
            </button>
          )}
          
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-start gap-4 p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-teal-200 transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all flex-shrink-0 shadow-sm">
              <ArrowLeft className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-800">Tinjau Ulang Blueprint</p>
              <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"Kembali ke bagian atas untuk detail operasional"</p>
            </div>
          </button>
        </div>
      </div>

      <div className="text-center pt-8 border-t border-slate-100/50 space-y-4">
        <div className="flex justify-center">
          <BrandLogo size="sm" variant="brand" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">
            Community<span className="text-teal-600 font-black">OS</span>
          </p>
          <p className="text-[8px] text-slate-300 font-extrabold uppercase tracking-widest italic leading-none">
            AI Operating System for Communities in Indonesia
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};
