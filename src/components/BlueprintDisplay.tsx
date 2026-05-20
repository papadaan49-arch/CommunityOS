import React from 'react';
import { Calendar, CreditCard, MapPin, Share2, Copy, Check, Zap, Gauge, AlertTriangle, ClipboardList, Handshake, FileText, FileDown, Loader2, Settings2, RefreshCcw, ArrowLeft, ExternalLink, MessageSquare, HeartHandshake, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Blueprint } from '../types';
import { BrandLogo } from './BrandLogo';
import { WellbeingGuard } from './WellbeingGuard';
import { FeedbackSection } from './FeedbackSection';
import { LoadingOverlay } from './LoadingOverlay';
import { HelpTooltip } from './HelpTooltip';
import { GUIDANCE_DATA } from '../constants/guidance';
import { generateDocx } from '../services/docxService';

interface Props {
  blueprint: Blueprint;
  blueprintId?: string | null;
  userEmail?: string | null;
  onRevision: () => void;
  onRefine: (instructions: string) => void;
}

const ADMIN_WHATSAPP = "6285828676589";

export const BlueprintDisplay: React.FC<Props> = ({ blueprint, blueprintId, userEmail, onRevision, onRefine }) => {
  const [copiedType, setCopiedType] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [exportStatus, setExportStatus] = React.useState('Sistem sedang merangkai blueprint Anda...');
  const [refinementText, setRefinementText] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'meta' | 'operational' | 'wellbeing' | 'outreach'>('meta');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    
    let message = "Berhasil disalin ke clipboard.";
    const lowerType = type.toLowerCase();
    if (lowerType === 'link blueprint') {
      message = "Tautan kolaborasi atau edit blueprint berhasil disalin ke clipboard. Siap dibagikan ke tim!";
    } else if (lowerType === 'seluruh blueprint') {
      message = "Seluruh rancangan blueprint operasional berhasil disalin ke clipboard.";
    } else if (lowerType === 'rundown') {
      message = "Alur rundown manusiawi berhasil disalin ke clipboard.";
    } else if (lowerType === 'partners') {
      message = "Rekomendasi partner lokal berhasil disalin ke clipboard.";
    } else if (lowerType === 'caption') {
      message = "Caption narasi Instagram sudah tersalin ke clipboard.";
    } else {
      message = `Berhasil menyalin ${type} ke clipboard.`;
    }

    toast.success(message);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleShareLink = () => {
    const url = blueprintId ? `${window.location.origin}?id=${blueprintId}` : window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Blueprint CommunityOS: ${blueprint.event_meta.title}`,
        text: `Cek blueprint operasional untuk ${blueprint.event_meta.title} di CommunityOS.`,
        url: url,
      }).catch(() => {
        copyToClipboard(url, 'Link Blueprint');
      });
    } else {
      copyToClipboard(url, 'Link Blueprint');
    }
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
    <div className="space-y-12 md:space-y-32 max-w-2xl mx-auto pb-48">
      <LoadingOverlay 
        isVisible={exporting} 
        message={exportStatus} 
      />

      {/* Operational Coordination Hub with Section Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-4 md:gap-6 sticky top-4 md:top-6 z-50 px-5 md:px-8"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
            <div className="flex-shrink-0">
              <BrandLogo size="xs md:sm" variant="brand" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] md:text-[11px] font-extrabold text-slate-900 tracking-tight leading-none uppercase flex items-center gap-1.5">
                Kolaborasi Blueprint
                <HelpTooltip {...GUIDANCE_DATA.EXPORT_WORKFLOWS} />
              </span>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Strategi Tim</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 w-full md:w-auto">
            <button 
              onClick={handleShareLink}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-extrabold transition-all bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100 active:scale-95 uppercase tracking-wider"
              title="Bagikan Link"
            >
              <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Bagikan</span>
            </button>

            <button 
              onClick={handleFullCopy}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-extrabold transition-all border border-slate-100 hover:bg-slate-50 text-slate-700 active:scale-95 uppercase tracking-wider"
              title="Salin Blueprint"
            >
              <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Salin</span>
            </button>

            <button 
              onClick={handleExportTxt}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-extrabold transition-all border border-slate-100 hover:bg-slate-50 text-slate-700 active:scale-95 uppercase tracking-wider"
              title="Simpan Versi Teks"
            >
              <FileDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Teks</span>
            </button>
            
            <button 
              onClick={handleExportDocx}
              disabled={exporting}
              className={`flex-[2] md:flex-none flex items-center justify-center gap-2 px-6 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-extrabold transition-all shadow-lg active:scale-95 ${
                exporting 
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed shadow-none' 
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-100 uppercase tracking-widest'
              }`}
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin text-white" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
              )}
              <span className="whitespace-nowrap">{exporting ? 'MENYIAPKAN...' : 'Draft .DOCX'}</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="grid grid-cols-4 md:flex md:items-center gap-1 md:gap-1.5 py-1 border-t border-slate-50 pt-3 mt-1 w-full">
          {[
            { id: 'meta', label: 'Meta', icon: FileText },
            { id: 'operational', label: 'Operasional', icon: Settings2 },
            { id: 'wellbeing', label: 'Wellbeing', icon: HeartHandshake },
            { id: 'outreach', label: 'Outreach', icon: Share2 },
          ].map((item, idx) => (
            <React.Fragment key={item.id}>
              <button
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col md:flex-row items-center justify-center text-center md:text-left gap-1 md:gap-1.5 px-1 md:px-4 py-2 md:py-2 rounded-xl text-[8px] xs:text-[9px] md:text-[11px] font-bold transition-all uppercase tracking-normal xs:tracking-wider md:tracking-widest whitespace-normal md:whitespace-nowrap ${
                  activeTab === item.id 
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-100 md:scale-105' 
                    : 'text-slate-500 hover:text-teal-600 hover:bg-teal-50/50'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 ${activeTab === item.id ? 'animate-pulse' : ''}`} />
                <span className="truncate max-w-full">{item.label}</span>
              </button>
              {idx < 3 && <div className="hidden md:block w-1 h-1 rounded-full bg-slate-200 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      <div className="ios-spacing print:p-0">
        <AnimatePresence mode="wait">
          {activeTab === 'meta' && (
            <motion.div
              key="meta"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6 md:space-y-8"
            >
              {/* Event Meta Header - Refined for clarity and "adem" look */}
              <div
                className="bg-white p-7 md:p-16 rounded-[2.5rem] md:rounded-[4rem] text-slate-900 shadow-xl shadow-teal-900/5 border border-teal-50 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/50" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200/20 blur-[100px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/20 blur-[100px] -ml-48 -mb-48" />
                
                <div className="relative space-y-8 md:space-y-12">
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    <span className={`inline-flex items-center gap-1.5 text-[9px] md:text-[10px] font-extrabold px-3 md:px-4 py-1.5 md:py-2 rounded-full border tracking-widest uppercase transition-colors ${getScaleBadgeColor(blueprint.event_meta.scale_classification)}`}>
                      <span>{blueprint.event_meta.scale_classification}</span>
                      {blueprint.event_meta.scale_classification === 'Gerilya Scale' && (
                        <HelpTooltip {...GUIDANCE_DATA.GERILYA_SCALE} />
                      )}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-6xl font-display font-bold leading-[1.2] md:leading-[1.05] tracking-tight text-slate-900 drop-shadow-sm max-w-2xl">
                    {blueprint.event_meta.title}
                  </h1>
                  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 pt-8 md:pt-12 border-t border-slate-100">
                    <div className="flex items-center gap-4 md:gap-5">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-100/50 text-teal-600 shadow-sm">
                        <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <div className="space-y-0.5 md:space-y-1">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-widest uppercase">Lokasi Kegiatan</p>
                        <p className="text-base md:text-xl font-bold text-slate-800 tracking-tight">{blueprint.event_meta.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-5">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600 shadow-sm">
                        <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <div className="space-y-0.5 md:space-y-1">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-widest uppercase">Alokasi Dana</p>
                        <p className="text-base md:text-xl font-black text-emerald-600 tracking-tight">Rp {blueprint.event_meta.budget.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategy Card - Full Display */}
              <div 
                className="bg-slate-900 p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5 group"
              >
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 blur-[100px] -mr-48 -mt-48 transition-all group-hover:bg-teal-500/30" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -ml-32 -mb-32" />
                
                <div className="relative space-y-6 md:space-y-8">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                      <MessageSquare className="w-5 h-5 text-teal-300" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-[10px] md:text-xs font-black text-teal-400 uppercase tracking-[0.3em] leading-none">Hasil Diskusi Strategis</h3>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Logic & Execution Strategy</p>
                    </div>
                  </div>
                  <p className="text-xl md:text-3xl font-display font-bold leading-relaxed md:leading-[1.4] tracking-tight text-white italic">
                    "{blueprint.event_meta.strategy}"
                  </p>
                  <div className="pt-4 border-t border-white/5 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <p className="text-[10px] font-bold text-teal-400/60 uppercase tracking-widest">Disusun Berdasarkan Realitas Lapangan</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'operational' && (
            <motion.div
              key="operational"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8 md:space-y-12"
            >
              {/* Operational Metadata */}
              <section className="bg-white p-7 md:p-14 rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-slate-100 space-y-10 md:space-y-14">
                <div className="flex items-center gap-3">
                  <Settings2 className="w-4 h-4 text-slate-300" />
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Analisis Operasional</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {/* Scale Classification */}
                  <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border ${getScaleBadgeColor(blueprint.event_meta.scale_classification)} flex flex-col gap-4 md:gap-6 group transition-all`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 opacity-60">
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em]">Skala Blueprint</span>
                        <HelpTooltip {...GUIDANCE_DATA.BLUEPRINT_SCALE} />
                      </div>
                      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center border transition-all ${getScaleBadgeColor(blueprint.event_meta.scale_classification)}`}>
                        <Gauge className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      <h4 className="text-xl md:text-2xl font-display font-bold leading-tight">{blueprint.event_meta.scale_classification}</h4>
                      <p className="text-[13px] md:text-sm font-medium opacity-80 leading-relaxed">
                        {blueprint.event_meta.scale_classification === 'Gerilya Scale' && "Taktis, efisien, dan fokus pada dampak sosial mendasar."}
                        {blueprint.event_meta.scale_classification === 'Community Scale' && "Kolaboratif dengan standar koordinasi komunitas lokal."}
                        {blueprint.event_meta.scale_classification === 'Regional Scale' && "Skala menengah dengan jangkauan audiens yang lebih luas."}
                        {blueprint.event_meta.scale_classification === 'Massive Scale' && "Skala besar dengan kerumitan logistik dan koordinasi tinggi."}
                      </p>
                    </div>
                  </div>

                  {/* Operational Complexity */}
                  <div className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex flex-col gap-5">
                    <div className="flex justify-between items-center text-[10px] font-bold tracking-[0.2em] text-slate-400">
                      <div className="flex items-center gap-1.5 leading-none">
                        <span>Kerumitan</span>
                        <HelpTooltip {...GUIDANCE_DATA.OPERATIONAL_COMPLEXITY} />
                      </div>
                      <span className="text-slate-800 font-mono">{blueprint.event_meta.operational_complexity}%</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div 
                          style={{ width: `${blueprint.event_meta.operational_complexity}%` }}
                          className={`h-full rounded-full transition-all duration-1000 ${
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
                    <div className="flex justify-between items-center text-[10px] font-bold tracking-[0.2em] text-slate-400">
                      <div className="flex items-center gap-1.5 leading-none">
                        <span>Risiko Burnout</span>
                        <HelpTooltip {...GUIDANCE_DATA.BURNOUT_RISK} />
                      </div>
                      <span className="text-slate-800 font-mono">{blueprint.event_meta.burnout_risk}%</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div 
                          style={{ width: `${blueprint.event_meta.burnout_risk}%` }}
                          className={`h-full rounded-full transition-all duration-1000 ${
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
                </div>
              </section>

              {/* Budget Allocation */}
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-teal-600" />
                    </div>
                    <h2 className="text-xl font-display font-semibold text-slate-800">Budget Survival</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:gap-8">
                  {blueprint.operational.budget_allocation.map((item, index) => (
                    <div 
                      key={index} 
                      className="bg-white p-7 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-teal-100 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-6 md:mb-8">
                        <div className="space-y-1 md:space-y-1.5">
                          <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-slate-400">Pos Alokasi</span>
                          <h3 className="font-semibold text-lg md:text-xl text-slate-800 group-hover:text-teal-600 transition-colors">{item.item}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-slate-400">Estimasi</span>
                          <p className="text-teal-700 font-mono font-bold text-base md:text-lg whitespace-nowrap">Rp {item.amount.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="p-5 md:p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <p className="text-[13px] md:text-sm text-slate-600 italic flex items-start gap-3 md:gap-4">
                          <Zap className="w-4 h-4 md:w-5 md:h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed md:leading-[1.7] font-medium">{item.label}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Rundown & Wellbeing Insight Integration */}
              <section className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-lg shadow-emerald-100/50">
                      <Calendar className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-display font-semibold text-slate-800">Rundown Manusiawi</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alur Pelaksanaan Acara</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const text = blueprint.operational.rundown.map(r => `${r.time}: ${r.task}`).join('\n');
                      copyToClipboard(text, 'rundown');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-200"
                  >
                    {copiedType === 'rundown' ? <Check className="w-4 h-4 text-emerald-500" /> : <ClipboardList className="w-4 h-4" />}
                    {copiedType === 'rundown' ? 'Tersalin' : 'Salin Rundown'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Rundown List */}
                  <div className="lg:col-span-2 bg-white p-7 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 space-y-10 md:space-y-12 relative overflow-hidden">
                    <div className="absolute left-7 md:left-14 top-14 md:top-14 bottom-14 md:bottom-14 w-1 bg-slate-50 rounded-full" />
                    
                    {blueprint.operational.rundown.map((item, index) => (
                      <div key={index} className="flex items-start gap-6 md:gap-10 relative group">
                        <div className="w-4 h-4 rounded-full bg-white border-4 border-emerald-500 z-10 flex-shrink-0 mt-2 shadow-md group-hover:scale-125 transition-transform" />
                        <div className="space-y-2">
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-tight">{item.time}</span>
                          <p className="text-slate-800 font-bold text-base md:text-lg leading-snug group-hover:text-teal-600 transition-colors">{item.task}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sidebar Wellbeing Context */}
                  <div className="space-y-6">
                    <div className={`p-6 md:p-8 rounded-[2rem] border transition-all shadow-lg ${
                      blueprint.wellbeing_guard.risk_level === 'Red' ? 'bg-rose-50 border-rose-100 shadow-rose-100/50' : 
                      blueprint.wellbeing_guard.risk_level === 'Amber' || blueprint.wellbeing_guard.risk_level === 'Yellow' ? 'bg-amber-50 border-amber-100 shadow-amber-100/50' : 
                      'bg-emerald-50 border-emerald-100 shadow-emerald-100/50'
                    }`}>
                      <div className="flex items-center gap-2 mb-4">
                        <HeartHandshake className={`w-5 h-5 ${
                          blueprint.wellbeing_guard.risk_level === 'Red' ? 'text-rose-500' : 
                          blueprint.wellbeing_guard.risk_level === 'Amber' || blueprint.wellbeing_guard.risk_level === 'Yellow' ? 'text-amber-500' : 
                          'text-emerald-500'
                        }`} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Cek Beban Tim</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Analisis Rundown</p>
                          <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                            "{blueprint.wellbeing_guard.fatigue_analysis}"
                          </p>
                        </div>
                        <div className="pt-4 border-t border-black/5">
                           <p className={`text-xs font-black uppercase tracking-widest text-center ${
                             blueprint.wellbeing_guard.risk_level === 'Red' ? 'text-rose-600' : 
                             blueprint.wellbeing_guard.risk_level === 'Amber' || blueprint.wellbeing_guard.risk_level === 'Yellow' ? 'text-amber-600' : 
                             'text-emerald-600'
                           }`}>
                             RISIKO: {blueprint.wellbeing_guard.risk_level?.toUpperCase()}
                           </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 rounded-[2rem] bg-slate-900 text-white shadow-xl">
                      <div className="flex items-center gap-2 mb-4 text-teal-400">
                        <Zap className="w-4 h-4" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em]">Saran Cepat</h4>
                      </div>
                      <p className="text-xs font-medium leading-relaxed italic text-slate-300">
                        {blueprint.wellbeing_guard.risk_level === 'Red' 
                          ? "Skala ini sangat padat. Pastikan ada backup personil untuk setiap pos koordinasi."
                          : "Jadwal ini terlihat proporsional. Tetap jaga komunikasi antar tim."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'wellbeing' && (
            <motion.div
              key="wellbeing"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8 md:space-y-12"
            >
              <div className="flex items-center gap-4 md:gap-6">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center shadow-lg transition-all ${
                  blueprint.wellbeing_guard.risk_level === 'Red' ? 'bg-rose-50 text-rose-600 shadow-rose-100' : 
                  blueprint.wellbeing_guard.risk_level === 'Amber' || blueprint.wellbeing_guard.risk_level === 'Yellow' ? 'bg-amber-50 text-amber-600 shadow-amber-100' : 
                  'bg-emerald-50 text-emerald-600 shadow-emerald-100'
                }`}>
                  <HeartHandshake className="w-8 h-8 md:w-9 md:h-9" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl md:text-4xl font-display font-black text-slate-800 tracking-tight">Wellbeing Center</h2>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Penjaga Energi Komunitas</p>
                </div>
              </div>

              {/* Fatigue Analysis Hero */}
              <div className={`p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border flex flex-col gap-6 md:gap-8 relative overflow-hidden transition-all shadow-xl ${
                blueprint.wellbeing_guard.risk_level === 'Red' ? 'bg-rose-50/30 border-rose-100 shadow-rose-900/5' : 
                blueprint.wellbeing_guard.risk_level === 'Amber' || blueprint.wellbeing_guard.risk_level === 'Yellow' ? 'bg-amber-50/30 border-amber-100 shadow-amber-900/5' : 
                'bg-emerald-50/30 border-emerald-100 shadow-emerald-900/5'
              }`}>
                <div className="flex items-center gap-3 relative z-10 text-rose-500">
                  <AlertTriangle className={`w-5 h-5 ${
                    blueprint.wellbeing_guard.risk_level === 'Red' ? 'text-rose-500' : 
                    blueprint.wellbeing_guard.risk_level === 'Amber' || blueprint.wellbeing_guard.risk_level === 'Yellow' ? 'text-amber-500' : 
                    'text-emerald-500'
                  }`} />
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                    blueprint.wellbeing_guard.risk_level === 'Red' ? 'text-rose-500' : 
                    blueprint.wellbeing_guard.risk_level === 'Amber' || blueprint.wellbeing_guard.risk_level === 'Yellow' ? 'text-amber-500' : 
                    'text-emerald-500'
                  }`}>
                    Analisis Kelelahan Tim
                  </span>
                </div>
                <p className="text-base md:text-2xl text-slate-800 leading-relaxed md:leading-[1.6] font-display font-medium italic relative z-10">
                  "{blueprint.wellbeing_guard.fatigue_analysis}"
                </p>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 blur-[80px] -mr-32 -mt-32" />
              </div>

              {/* Wellbeing Guard Component */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                <WellbeingGuard guard={blueprint.wellbeing_guard} />
              </div>
            </motion.div>
          )}

          {activeTab === 'outreach' && (
            <motion.div
              key="outreach"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8 md:space-y-12"
            >
              <section className="bg-white p-7 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-slate-100 space-y-10 md:space-y-14">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-[1.5rem] bg-indigo-50 flex items-center justify-center">
                    <Share2 className="w-6 h-6 md:w-7 md:h-7 text-indigo-600" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-display font-semibold text-slate-800">Outreach & Partner</h2>
                </div>
                
                <div className="space-y-10 md:space-y-14">
                  <div>
                    <div className="flex justify-between items-center mb-6 md:mb-8 px-1">
                      <h3 className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Partner Lokal Potensial</h3>
                      <button
                        onClick={() => copyToClipboard(blueprint.outreach.local_partners.join(', '), 'partners')}
                        className="text-[9px] md:text-[10px] font-bold text-slate-300 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        {copiedType === 'partners' ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Handshake className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        <span>Salin</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {blueprint.outreach.local_partners.map((partner, index) => (
                        <span key={index} className="bg-slate-50 text-slate-700 text-[11px] md:text-xs font-semibold px-4 md:px-5 py-2.5 md:py-3 rounded-[1rem] md:rounded-2xl border border-slate-100 transition-all hover:border-indigo-100 cursor-default">
                          {partner}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-6 md:mb-8 px-1">
                      <h3 className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Instagram Caption (Storytelling)</h3>
                      <button
                        onClick={() => copyToClipboard(blueprint.outreach.ig_caption, 'caption')}
                        className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors"
                      >
                        {copiedType === 'caption' ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        <span>Salin</span>
                      </button>
                    </div>
                    <div className="p-7 md:p-10 bg-slate-50/50 rounded-[2rem] md:rounded-[2.5rem] text-[13px] md:text-base text-slate-600 whitespace-pre-wrap font-sans border border-slate-100 leading-relaxed italic shadow-inner">
                      {blueprint.outreach.ig_caption}
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-12 mt-12">
        <FeedbackSection />

        {/* Refinement Hub - Iterative Planning */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-7 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl shadow-teal-900/5 border border-teal-100/50 space-y-8 md:space-y-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px] -mr-32 -mt-32" />
          
          <div className="space-y-6 md:space-y-6 relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-[1.5rem] bg-teal-50 flex items-center justify-center shadow-lg shadow-teal-100/50">
                <Settings2 className="w-6 h-6 md:w-7 md:h-7 text-teal-600" />
              </div>
              <div className="space-y-0.5 md:space-y-1">
                <h2 className="text-xl md:text-3xl font-display font-semibold text-slate-800">Refinement Hub</h2>
                <p className="text-[11px] md:text-sm text-slate-400 font-medium leading-relaxed italic">"Iterasi blueprint ini agar lebih presisi"</p>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">
                Apa yang ingin Anda sesuaikan?
              </label>
              <textarea
                value={refinementText}
                onChange={(e) => setRefinementText(e.target.value)}
                placeholder="Contoh: Budgetnya terlalu mahal, tolong kurangi. Atau: Kurangi jumlah panitia agar tidak terlalu padat."
                className="w-full min-h-[100px] md:min-h-[120px] p-5 md:p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] text-[13px] md:text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-200 transition-all resize-none font-medium leading-relaxed"
              />
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setRefinementText(prev => prev + (prev.length > 0 ? " " : "") + "Tolong perdalam secara strategis dengan riset data lapangan riil.")}
                  className="px-4 py-2 rounded-full bg-teal-50/50 border border-teal-100/50 text-[10px] font-bold text-teal-700 hover:bg-teal-100 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-3 h-3" />
                  Deep Dive Analysis
                </button>
                <button 
                  onClick={() => setRefinementText(prev => prev + (prev.length > 0 ? " " : "") + "Buat budget lebih hemat/gerilya.")}
                  className="px-4 py-2 rounded-full bg-emerald-50/50 border border-emerald-100/50 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-all flex items-center gap-2"
                >
                  <CreditCard className="w-3 h-3" />
                  Lebih Hemat (Gerilya)
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 pt-2">
                <button
                  onClick={() => {
                    if (refinementText.trim()) {
                      onRefine(refinementText);
                      setRefinementText('');
                    } else {
                      toast.error("Berikan instruksi revisi terlebih dahulu.");
                    }
                  }}
                  className="w-full md:flex-1 bg-teal-600 text-white p-4 md:p-5 rounded-xl md:rounded-[1.5rem] text-sm font-bold shadow-lg shadow-teal-200 hover:bg-teal-700 transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-[0.98]"
                >
                  <RefreshCcw className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Update Blueprint Progressif</span>
                </button>
                <div className="hidden md:block w-px h-10 bg-slate-100" />
                <button
                  onClick={onRevision}
                  className="w-full md:w-auto px-8 p-4 md:p-5 bg-white border border-slate-200 text-slate-600 rounded-xl md:rounded-[1.5rem] text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 md:gap-3"
                >
                  Mulai Dari Awal
                </button>
              </div>
            </div>
            
            <div className="p-5 md:p-6 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-4">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] md:text-[11px] text-amber-800 leading-relaxed italic font-medium">
                <strong>Catatan Operasional:</strong> CommunityOS akan menjaga konteks awal komunitas Anda.
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

    </div>
  );
};
