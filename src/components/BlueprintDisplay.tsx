import React from 'react';
import { Calendar, CreditCard, MapPin, Share2, Copy, Check, Zap, Gauge, AlertTriangle, ClipboardList, Handshake, FileText, FileDown, Loader2, Settings2, RefreshCcw, ArrowLeft, ExternalLink, MessageSquare, HeartHandshake, Clock, Sparkles, ShieldCheck } from 'lucide-react';
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
import { updateBlueprintRealizationStatus } from '../services/dbService';

interface Props {
  blueprint: Blueprint;
  blueprintId?: string | null;
  userEmail?: string | null;
  initialRealizationStatus?: 'draft' | 'ready' | 'realized';
  initialRealizationDetails?: any;
  originalEventData?: any;
  onUpdateRealizationStatus?: (status: 'draft' | 'ready' | 'realized', details?: any) => void;
  onRevision: () => void;
  onRefine: (instructions: string) => void;
}

const ADMIN_WHATSAPP = "6285828676589";

export const BlueprintDisplay: React.FC<Props> = ({ 
  blueprint, 
  blueprintId, 
  userEmail, 
  initialRealizationStatus, 
  initialRealizationDetails, 
  originalEventData, 
  onUpdateRealizationStatus, 
  onRevision, 
  onRefine 
}) => {
  const [copiedType, setCopiedType] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [exportStatus, setExportStatus] = React.useState('Sistem sedang merangkai blueprint Anda...');
  const [refinementText, setRefinementText] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'meta' | 'operational' | 'wellbeing' | 'outreach'>('meta');

  const [realStatus, setRealStatus] = React.useState<'draft' | 'ready' | 'realized'>(initialRealizationStatus || 'draft');
  const [realDetails, setRealDetails] = React.useState<any>(initialRealizationDetails || null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  
  // Form states
  const [actVolunteers, setActVolunteers] = React.useState(originalEventData?.staff || 10);
  const [actParticipants, setActParticipants] = React.useState(originalEventData?.participants || 50);
  const [fieldNotes, setFieldNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // Mentor Sparring Chat states
  const [mentorQuestion, setMentorQuestion] = React.useState('');
  const [mentorAnswer, setMentorAnswer] = React.useState<string | null>(null);
  const [askingMentor, setAskingMentor] = React.useState(false);

  // Field Execution checklist states (Ide No.1)
  const [isExecutionMode, setIsExecutionMode] = React.useState(false);
  const [completedRundownItems, setCompletedRundownItems] = React.useState<Record<number, boolean>>({});
  const [rundownFieldNotes, setRundownFieldNotes] = React.useState<Record<number, string>>({});
  const [activeNoteEditIndex, setActiveNoteEditIndex] = React.useState<number | null>(null);
  const [tempNoteText, setTempNoteText] = React.useState('');

  // Time clash & Weather safety scanner state (Ide No.3)
  const [showTimeAnalysis, setShowTimeAnalysis] = React.useState(false);

  // Mini-map visibility state (Gerilya Scale tactical map)
  const [showMiniMap, setShowMiniMap] = React.useState(false);

  // Sync checklist and notes with localStorage for continuity
  React.useEffect(() => {
    if (!blueprint) return;
    const titleKey = blueprint.event_meta.title.replace(/\s+/g, '_');
    
    // Load completed checklist
    try {
      const storedCompleted = localStorage.getItem(`c_run_comp_${titleKey}`);
      if (storedCompleted) {
        setCompletedRundownItems(JSON.parse(storedCompleted));
      } else {
        setCompletedRundownItems({});
      }
    } catch (_) {
      setCompletedRundownItems({});
    }

    // Load rundown local notes
    try {
      const storedNotes = localStorage.getItem(`c_run_notes_${titleKey}`);
      if (storedNotes) {
        setRundownFieldNotes(JSON.parse(storedNotes));
      } else {
        setRundownFieldNotes({});
      }
    } catch (_) {
      setRundownFieldNotes({});
    }
  }, [blueprint]);

  const handleToggleRundownItem = (index: number) => {
    const titleKey = blueprint.event_meta.title.replace(/\s+/g, '_');
    const updated = {
      ...completedRundownItems,
      [index]: !completedRundownItems[index]
    };
    setCompletedRundownItems(updated);
    localStorage.setItem(`c_run_comp_${titleKey}`, JSON.stringify(updated));

    if (updated[index]) {
      toast.success(`✨ Agenda "${blueprint.operational.rundown[index].task}" selesai dilalui! Semangat tim tetap terjaga.`);
    }
  };

  const handleSaveRundownNote = (index: number, text: string) => {
    const titleKey = blueprint.event_meta.title.replace(/\s+/g, '_');
    const updated = {
      ...rundownFieldNotes,
      [index]: text
    };
    setRundownFieldNotes(updated);
    localStorage.setItem(`c_run_notes_${titleKey}`, JSON.stringify(updated));
    
    // Auto populate main realization form if they decide to report later!
    if (text.trim() && !fieldNotes.includes(text)) {
      setFieldNotes(prev => {
        const header = "Refleksi Lapangan:\n";
        const cleanPrev = prev.replace("Acara sukses dijalankan", "").trim();
        return `${cleanPrev ? cleanPrev : header}- ${text}`.trim();
      });
    }

    setActiveNoteEditIndex(null);
    setTempNoteText('');
    toast.success("📝 Catatan lapangan berhasil diabadikan!");
  };

  const analyzeTimeItem = (timeStr: string) => {
    const cleanTime = timeStr.replace(/[\.:]/g, ':').toLowerCase();
    const conflicts: { icon: string; title: string; color: string; advice: string }[] = [];
    
    // Dzuhur (around 12:00)
    if (cleanTime.includes('11:4') || cleanTime.includes('12:') || cleanTime.includes('13:0')) {
      conflicts.push({
        icon: '🕌',
        title: 'Potensi Bentrokan Dzuhur / ISOMA',
        color: 'text-amber-700 bg-amber-50/80 border-amber-200',
        advice: 'Beri jeda minimal 45-60 menit agar panitia & relawan beragama Muslim sempat ibadah & Isoma.'
      });
    }
    
    // Ashar (around 15:00 - 16:00)
    if (cleanTime.includes('15:') || cleanTime.includes('16:0')) {
      conflicts.push({
        icon: '🕌',
        title: 'Jeda Shalat Ashar',
        color: 'text-amber-700 bg-amber-50/80 border-amber-200',
        advice: 'Waktu Ashar biasanya mendesak di sore hari. Hindari materi berat atau rapat panjang tanpa jeda regregasi.'
      });
    }

    // Maghrib (extremely critical in ID)
    if (cleanTime.includes('17:4') || cleanTime.includes('18:') || cleanTime.includes('19:0')) {
      conflicts.push({
        icon: '🔥',
        title: 'Batas Kritis Maghrib & Sunset',
        color: 'text-rose-700 bg-rose-50/80 border-rose-200',
        advice: 'Fase kritis! Hindari agenda fisik di luar ruangan selama Maghrib. Seluruh operasional disarankan break total demi keadilan relawan.'
      });
    }

    // Isya (around 19:15 - 20:00)
    if (cleanTime.includes('19:1') || cleanTime.includes('19:2') || cleanTime.includes('19:3') || cleanTime.includes('19:4')) {
      conflicts.push({
        icon: '🌙',
        title: 'Batas Isya Malam',
        color: 'text-slate-700 bg-slate-50 border-slate-200',
        advice: 'Ingatkan jeda ibadah sebelum agenda malam ditiup mulainya.'
      });
    }

    return conflicts;
  };

  const getWeatherAdviceForLocation = (loc: string) => {
    const l = (loc || '').toLowerCase();
    if (l.includes('malang') || l.includes('bandung') || l.includes('bogor') || l.includes('batu') || l.includes('sleman')) {
      return {
        climate: 'Pegunungan & Sejuk',
        warning: 'Cenderung mendung tebal setelah jam 14.00 atau hujan sore tiba-tiba. Siapkan terpal cadangan dan pastikan perkabelan panggung tertutup rapat.',
        icon: '⛰️'
      };
    }
    if (l.includes('jakarta') || l.includes('surabaya') || l.includes('semarang') || l.includes('banjarmasin') || l.includes('makassar') || l.includes('medan')) {
      return {
        climate: 'Dataran Rendah / Pesisir Tropis Terik',
        warning: 'Suhu menyengat dan kelembaban udara sangat tinggi di siang bolong. Sediakan pos minum air putih melimpah demi menjauhkan relawan dari heatstroke.',
        icon: '☀️'
      };
    }
    return {
      climate: 'Suhu Tropis Umum',
      warning: 'Jika acara dijalankan outdoor, pastikan ada pelindung atap semi-permanen karena pergeseran cuaca tropis pancaroba sering mendatangkan awan hitam kilat.',
      icon: '🌦️'
    };
  };

  React.useEffect(() => {
    setRealStatus(initialRealizationStatus || 'draft');
    setRealDetails(initialRealizationDetails || null);
    if (initialRealizationDetails) {
      setActVolunteers(initialRealizationDetails.actualStaff || originalEventData?.staff || 10);
      setActParticipants(initialRealizationDetails.actualParticipants || originalEventData?.participants || 50);
      setFieldNotes(initialRealizationDetails.fieldNotes || '');
    } else {
      setActVolunteers(originalEventData?.staff || 10);
      setActParticipants(originalEventData?.participants || 50);
    }
  }, [initialRealizationStatus, initialRealizationDetails, blueprint, originalEventData]);

  const handleSubmitRealization = async (status: 'draft' | 'ready' | 'realized', customDetails?: any) => {
    setSubmitting(true);
    try {
      const payloadDetails = customDetails || (status === 'realized' ? {
        actualStaff: actVolunteers,
        actualParticipants: Number(actParticipants),
        fieldNotes: fieldNotes || 'Acara sukses dijalankan',
        completedAt: new Date().toISOString()
      } : null);

      if (blueprintId) {
        // Online mode (logged in)
        const success = await updateBlueprintRealizationStatus(
          blueprintId, 
          status, 
          payloadDetails, 
          originalEventData
        );
        if (success) {
          setRealStatus(status);
          if (payloadDetails) setRealDetails(payloadDetails);
          onUpdateRealizationStatus?.(status, payloadDetails);
          toast.success(
            status === 'ready' 
              ? "🚀 Blueprint dikunci & dinyatakan SIAP LAPANGAN!" 
              : status === 'draft'
              ? "↩️ Blueprint dikembalikan ke status DRAFT."
              : "🎉 Selamat! Laporan kebaikan berhasil disumbangkan ke Dampak Nasional!"
          );
          if (status === 'realized') {
            setIsFormOpen(false);
          }
        } else {
          toast.error("Gagal memperbarui status ke server. Silakan coba lagi.");
        }
      } else {
        // Offline tracking (update in localStorage)
        const historyJson = localStorage.getItem('communityos_history');
        if (historyJson) {
          let history = JSON.parse(historyJson);
          const index = history?.findIndex((h: any) => h.data.event_meta.title === blueprint.event_meta.title);
          if (index !== -1) {
            history[index].realizationStatus = status;
            history[index].realizationDetails = payloadDetails;
            localStorage.setItem('communityos_history', JSON.stringify(history));
          }
        }
        setRealStatus(status);
        if (payloadDetails) setRealDetails(payloadDetails);
        onUpdateRealizationStatus?.(status, payloadDetails);
        toast.info(
          status === 'ready'
            ? "🚀 Blueprint Siap Lapangan (Lokal)!"
            : status === 'draft'
            ? "↩️ Status diubah kembali menjadi draft (Lokal)."
            : "🎉 Laporan tersimpan di memori lokal browser Anda!"
        );
        if (status === 'realized') {
          setIsFormOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Masalah koneksi database.");
    } finally {
      setSubmitting(false);
    }
  };

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

  const parseInlineFormatting = (text: string): React.ReactNode[] => {
    if (!text) return [];
    
    const result: React.ReactNode[] = [];
    let keyIdx = 0;
    let tempText = text;
    
    while (tempText.length > 0) {
      const boldIdx = tempText.indexOf('**');
      const codeIdx = tempText.indexOf('`');
      
      // For single asterisk, make sure it's not part of **
      let italicIdx = -1;
      for (let i = 0; i < tempText.length; i++) {
        if (tempText[i] === '*' && tempText[i+1] !== '*' && tempText[i-1] !== '*') {
          italicIdx = i;
          break;
        }
      }
      
      // Find closest marker
      const markers = [
        { type: 'bold', index: boldIdx, marker: '**' },
        { type: 'code', index: codeIdx, marker: '`' },
        { type: 'italic', index: italicIdx, marker: '*' }
      ].filter(m => m.index !== -1).sort((a, b) => a.index - b.index);
      
      if (markers.length === 0) {
        result.push(<React.Fragment key={keyIdx++}>{tempText}</React.Fragment>);
        break;
      }
      
      const first = markers[0];
      if (first.index > 0) {
        result.push(<React.Fragment key={keyIdx++}>{tempText.substring(0, first.index)}</React.Fragment>);
      }
      
      const rest = tempText.substring(first.index + first.marker.length);
      const closeIdx = rest.indexOf(first.marker);
      
      if (closeIdx === -1) {
        result.push(<React.Fragment key={keyIdx++}>{first.marker}</React.Fragment>);
        tempText = rest;
        continue;
      }
      
      const matchedContent = rest.substring(0, closeIdx);
      if (first.type === 'bold') {
        result.push(<strong key={keyIdx++} className="font-bold text-slate-900 bg-teal-50/50 px-1 rounded">{matchedContent}</strong>);
      } else if (first.type === 'code') {
        result.push(<code key={keyIdx++} className="bg-indigo-50 text-indigo-700 border border-indigo-100/50 px-1 py-0.5 rounded font-mono text-xs">{matchedContent}</code>);
      } else if (first.type === 'italic') {
        result.push(<em key={keyIdx++} className="italic text-slate-600">{matchedContent}</em>);
      }
      
      tempText = rest.substring(closeIdx + first.marker.length);
    }
    
    return result;
  };

  const renderFormattedMentorAnswer = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    const blocks: React.ReactNode[] = [];
    let keyIdx = 0;

    let currentListType: 'ul' | 'ol' | null = null;
    let currentListItems: React.ReactNode[][] = [];

    const commitList = () => {
      if (!currentListType) return;
      const items = [...currentListItems];
      const type = currentListType;
      currentListType = null;
      currentListItems = [];

      if (type === 'ul') {
        blocks.push(
          <ul key={`list-${keyIdx++}`} className="list-disc pl-5 space-y-2 my-3 text-slate-700">
            {items.map((item, idx) => (
              <li key={idx} className="leading-relaxed text-[12px] md:text-sm">{item}</li>
            ))}
          </ul>
        );
      } else {
        blocks.push(
          <ol key={`list-${keyIdx++}`} className="list-decimal pl-5 space-y-2 my-3 text-slate-700">
            {items.map((item, idx) => (
              <li key={idx} className="leading-relaxed text-[12px] md:text-sm">{item}</li>
            ))}
          </ol>
        );
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();

      if (!line) {
        commitList();
        continue;
      }

      // Blockquotes / Callout boxes starting with "> "
      if (line.startsWith('>')) {
        commitList();
        const quoteText = line.substring(1).trim();
        blocks.push(
          <blockquote key={`quote-${keyIdx++}`} className="border-l-4 border-indigo-400 bg-indigo-50/40 pl-4 py-2.5 pr-2.5 my-3 rounded-r-xl italic text-slate-600 text-[12px] md:text-sm">
            {parseInlineFormatting(quoteText)}
          </blockquote>
        );
        continue;
      }

      // Headings
      if (line.startsWith('#')) {
        commitList();
        const match = line.match(/^(#+)\s*(.*)$/);
        if (match) {
          const level = match[1].length;
          const headingText = match[2];
          const headingSizeClass = level === 1 ? 'text-base md:text-lg font-bold mt-5' 
                                 : level === 2 ? 'text-sm md:text-base font-bold mt-4'
                                 : 'text-xs md:text-sm font-semibold mt-3';
          blocks.push(
            <h4 key={`heading-${keyIdx++}`} className={`${headingSizeClass} font-display text-slate-800 mb-1.5`}>
              {parseInlineFormatting(headingText)}
            </h4>
          );
        }
        continue;
      }

      // Unordered lists: starts with "* ", "- ", "• ", "+ "
      const ulMatch = line.match(/^([*\-•+])\s+(.*)$/);
      if (ulMatch) {
        if (currentListType !== 'ul') {
          commitList();
          currentListType = 'ul';
        }
        currentListItems.push(parseInlineFormatting(ulMatch[2]));
        continue;
      }

      // Ordered lists: starts with digits like "1. ", "2) "
      const olMatch = line.match(/^(\d+)[\.\)]\s+(.*)$/);
      if (olMatch) {
        if (currentListType !== 'ol') {
          commitList();
          currentListType = 'ol';
        }
        currentListItems.push(parseInlineFormatting(olMatch[2]));
        continue;
      }

      // Regular line paragraphs
      commitList();
      blocks.push(
        <p key={`p-${keyIdx++}`} className="text-slate-600 leading-relaxed my-2 text-[12px] md:text-sm">
          {parseInlineFormatting(line)}
        </p>
      );
    }

    commitList();
    return <div className="space-y-1">{blocks}</div>;
  };

  const handleAskMentor = async (question: string) => {
    if (!question.trim()) return;
    setAskingMentor(true);
    setMentorAnswer(null);
    try {
      const { askMentorAboutBlueprint } = await import('../services/geminiService');
      const ans = await askMentorAboutBlueprint(blueprint, question, originalEventData);
      setMentorAnswer(ans);
    } catch (err: any) {
      toast.error("Gagal mendiskusikan rencana dengan mentor.");
    } finally {
      setAskingMentor(false);
    }
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

  const handleExportGoogleCalendar = () => {
    const title = encodeURIComponent(`[Rapat & Aksi] ${blueprint.event_meta.title}`);
    
    // Build a formatted description for standard Google Calendar template scheduling
    const details = encodeURIComponent(
      `Blueprint Rencana Operasional oleh CommunityOS\n` +
      `--------------------------------------------------\n\n` +
      `Skala Gerakan: ${blueprint.event_meta.scale_classification}\n` +
      `Prakiraan Anggaran Rencana: Rp ${blueprint.event_meta.budget.toLocaleString('id-ID')}\n` +
      `Risiko Tim Burnout: ${blueprint.event_meta.burnout_risk}%\n\n` +
      `RUNDOWN MANUSIAWI (PANDUAN ACARA):\n` +
      blueprint.operational.rundown.map(r => `• [${r.time}] ${r.task}`).join('\n') +
      `\n\nSaran Wellbeing Mentor:\n` +
      blueprint.wellbeing_guard.action_items.map(item => `- ${item}`).join('\n') +
      `\n\n---\nDiproduksi oleh CommunityOS (AI Operating System Komunitas Indonesia)`
    );
    
    const location = encodeURIComponent(blueprint.event_meta.location);
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2); // default mock scheduled date (2 days from now)
    const dateYMD = targetDate.toISOString().split('T')[0].replace(/-/g, '');
    const datesStr = `${dateYMD}T140000/${dateYMD}T170000`; // Local time agnostic layout

    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${datesStr}`;
    window.open(googleCalUrl, '_blank');
    toast.success("🗓️ Membuka tab Google Calendar untuk menjadwalkan kegiatan!");
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
    <div className="space-y-12 md:space-y-20 max-w-4xl mx-auto pb-48">
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

          <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 md:gap-3 w-full md:w-auto">
            <button 
              onClick={handleShareLink}
              className="w-full sm:w-auto sm:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-extrabold transition-all bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100 active:scale-95 uppercase tracking-wider"
              title="Bagikan Link"
            >
              <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Bagikan</span>
            </button>

            <button 
              onClick={handleFullCopy}
              className="w-full sm:w-auto sm:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-extrabold transition-all border border-slate-100 hover:bg-slate-50 text-slate-700 active:scale-95 uppercase tracking-wider"
              title="Salin Blueprint"
            >
              <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Salin</span>
            </button>

            <button 
              onClick={handleExportTxt}
              className="w-full sm:w-auto sm:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-extrabold transition-all border border-slate-100 hover:bg-slate-50 text-slate-700 active:scale-95 uppercase tracking-wider"
              title="Simpan Versi Teks"
            >
              <FileDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Teks</span>
            </button>

            <button 
              onClick={handleExportGoogleCalendar}
              className="w-full sm:w-auto sm:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-extrabold transition-all border border-slate-100 hover:bg-slate-50 text-slate-700 active:scale-95 uppercase tracking-wider"
              title="Jadwalkan di Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#1a73e8]" />
              <span>Kalender</span>
            </button>
            
            <button 
              onClick={handleExportDocx}
              disabled={exporting}
              className={`w-full sm:w-auto sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-extrabold transition-all shadow-lg active:scale-95 ${
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
              {/* Pusat Papan Validasi & Realisasi Dampak */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-teal-900/10 border border-teal-500/20 relative overflow-hidden"
              >
                {/* Background ambient glowing light */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -ml-32 -mb-32" />

                <div className="relative space-y-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                        <ShieldCheck className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[9px] font-extrabold text-teal-400 tracking-widest uppercase">Papan Dampak & Keterpakaian Riil</p>
                        <h3 className="text-lg font-bold font-display text-white tracking-tight">Status Pelaksanaan Kegiatan</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       {realStatus === 'draft' && (
                         <span className="px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-slate-800 text-slate-300 border border-slate-700/50">
                           📝 Draft Rencana
                         </span>
                       )}
                       {realStatus === 'ready' && (
                         <span className="px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-teal-900/50 text-teal-300 border border-teal-500/30">
                           🚀 Siap Lapangan
                         </span>
                       )}
                       {realStatus === 'realized' && (
                         <span className="px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                           ✅ Terealisasi (Lapor Sukses)
                         </span>
                       )}
                    </div>
                  </div>

                  {realStatus === 'draft' && (
                    <div className="space-y-4">
                      <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                        Blueprint Anda saat ini berstatus <strong>Draft Rencana</strong>. Untuk mengaktifkan monitoring dampak komunitas secara akurat dan mencegah sampah data koordinasi, silakan klaim jika blueprint ini siap digunakan atau dilaporkan sukses.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={() => handleSubmitRealization('ready')}
                          disabled={submitting}
                          className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-extrabold tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
                        >
                          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                          Kunci & Siap Lapangan
                        </button>
                        <button
                          onClick={() => setIsFormOpen(!isFormOpen)}
                          className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-extrabold tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest border border-slate-700 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Lapor Sukses Acara
                        </button>
                      </div>
                    </div>
                  )}

                  {realStatus === 'ready' && (
                    <div className="space-y-4">
                      <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                        👍 Mantap! Tim Anda telah menandai bahwa blueprint ini <strong>siap dilaunching</strong>. Ketika acara selesai dilaksanakan, mari luangkan waktu 1 menit untuk melaporkan angka riil peserta & relawan guna merayakan kesuksesan bersama!
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={() => setIsFormOpen(!isFormOpen)}
                          className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Lapor Realisasi Acara
                        </button>
                        <button
                          onClick={() => handleSubmitRealization('draft')}
                          disabled={submitting}
                          className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-extrabold tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest border border-slate-700 cursor-pointer"
                        >
                          Ubah ke Draft
                        </button>
                      </div>
                    </div>
                  )}

                  {realStatus === 'realized' && (
                    <div className="space-y-4 bg-emerald-950/20 p-5 rounded-2xl border border-emerald-500/10 animate-fade-in">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs md:text-sm text-emerald-200 font-extrabold uppercase tracking-wide">Laporan Kontribusi Terverifikasi</p>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Blueprint ini sukses dilaksanakan dengan penyesuaian di lapangan! Terima kasih telah berkontribusi menjaga kesehatan dan produktivitas relawan Indonesia.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Relawan Terbantu</p>
                          <p className="text-lg md:text-xl font-black text-emerald-400">{realDetails?.actualStaff || 10} Orang</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Penerima Manfaat</p>
                          <p className="text-lg md:text-xl font-black text-emerald-400">{realDetails?.actualParticipants || 50} Jiwa</p>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Catatan Refleksi</p>
                          <p className="text-xs text-slate-300 italic truncate" title={realDetails?.fieldNotes}>
                            "{realDetails?.fieldNotes || 'Acara terlaksana dengan luar biasa'}"
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSubmitRealization('draft')}
                        disabled={submitting}
                        className="mt-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold tracking-wider transition-all active:scale-95 uppercase cursor-pointer"
                      >
                        Reset Laporan / Edit
                      </button>
                    </div>
                  )}

                  {/* Expandable Form */}
                  <AnimatePresence>
                    {isFormOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-slate-800 pt-5 mt-5 space-y-4"
                      >
                        <h4 className="text-sm font-bold text-teal-400 font-display flex items-center gap-1.5 uppercase tracking-wide">
                          ✍️ Formulir Refleksi & Realisasi Lapangan
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Jumlah Relawan Riil Terlibat (Panitia)
                            </label>
                            <input
                              type="number"
                              value={actVolunteers}
                              onChange={(e) => setActVolunteers(Math.max(1, Number(e.target.value)))}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-teal-500 font-bold"
                            />
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">Diambil dari estimasi personil tim</p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Jumlah Peserta / Audiens Riil Hadir
                            </label>
                            <input
                              type="number"
                              value={actParticipants}
                              onChange={(e) => setActParticipants(Math.max(1, Number(e.target.value)))}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-teal-500 font-bold"
                            />
                            <p className="text-[9px] text-slate-500 font-semibold uppercase">Potensi jangkauan riil dari tim lapangan</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Catatan Singkat Refleksi Lapangan
                          </label>
                          <textarea
                            value={fieldNotes}
                            onChange={(e) => setFieldNotes(e.target.value)}
                            placeholder="Contoh: Acara berjalan lancar, rundown dengan jeda istimewa sangat efektif meminimalkan rasa lelah panitia..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-teal-500 h-20"
                          />
                        </div>

                        {!blueprintId && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 leading-relaxed font-medium">
                            💡 <strong>Catatan Luring (Offline Mode):</strong> Karena Anda belum masuk (Sign-In), laporan ini hanya tersimpan di browser ini. Masuk dengan akun Google untuk mengirimkan kontribusi dampak kegiatan ini ke <strong>Dasbor Dampak Nasional</strong>!
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSubmitRealization('realized')}
                            disabled={submitting}
                            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold tracking-wider transition-all active:scale-95 uppercase tracking-wide flex items-center gap-1.5 cursor-pointer"
                          >
                            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Kunci Laporan Sukses
                          </button>
                          <button
                            onClick={() => setIsFormOpen(false)}
                            className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-[11px] font-extrabold uppercase transition-all cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

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
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-4">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(blueprint.event_meta.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 md:gap-5 group hover:opacity-95 transition-all cursor-pointer flex-1"
                        >
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-100/50 text-teal-600 shadow-sm group-hover:bg-teal-100 transition-colors flex-shrink-0">
                            <MapPin className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-105 transition-transform" />
                          </div>
                          <div className="space-y-0.5 md:space-y-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-widest uppercase">Lokasi Kegiatan</p>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-base md:text-xl font-bold text-slate-800 tracking-tight group-hover:text-teal-700 underline decoration-dotted decoration-slate-300 group-hover:decoration-teal-500 transition-colors leading-tight">{blueprint.event_meta.location}</p>
                          </div>
                        </a>
                        
                        <button
                          onClick={() => {
                            setShowMiniMap(!showMiniMap);
                            if(!showMiniMap) {
                              toast.success("🗺️ Peta interaktif berhasil dibuka di layar!");
                            }
                          }}
                          className={`self-start px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap ${
                            showMiniMap 
                              ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100' 
                              : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100'
                          }`}
                        >
                          {showMiniMap ? 'Tutup Peta' : 'Peta Interaktif 📍'}
                        </button>
                      </div>

                      {/* Interactive responsive sandbox-friendly iframe */}
                      {showMiniMap && (
                        <div className="w-full mt-2 rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-inner bg-slate-100 h-[220px] relative animate-in fade-in slide-in-from-top-3 duration-300">
                          <iframe
                            title="Peta Lokasi Kegiatan"
                            width="100%"
                            height="100%"
                            className="border-0 rounded-[1.5rem]"
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(blueprint.event_meta.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      )}
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-lg shadow-emerald-100/50">
                      <Calendar className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-display font-semibold text-slate-800">Rundown Manusiawi</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alur Pelaksanaan Acara</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action button 1: Mode Lapangan Toggle */}
                    <button
                      onClick={() => {
                        setIsExecutionMode(!isExecutionMode);
                        if (!isExecutionMode) {
                          toast.info("🚀 Mode Eksekusi Lapangan Aktif! Anda kini bisa mencentang agenda rill di lapangan & mencatat evaluasi.");
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                        isExecutionMode 
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-100' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                      }`}
                    >
                      <span>🚀 Mode Lapangan {isExecutionMode ? 'On' : 'Off'}</span>
                    </button>

                    {/* Action button 2: Time Scanner Toggle */}
                    <button
                      onClick={() => {
                        setShowTimeAnalysis(!showTimeAnalysis);
                        if (!showTimeAnalysis) {
                          toast.info("🕌 Berhasil memindai keselarasan waktu rundown untuk relawan!");
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                        showTimeAnalysis 
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                      }`}
                    >
                      <span>🕌 Analisis Waktu {showTimeAnalysis ? 'On' : 'Off'}</span>
                    </button>

                    {/* Copy Button */}
                    <button
                      onClick={() => {
                        const text = blueprint.operational.rundown.map(r => `${r.time}: ${r.task}`).join('\n');
                        copyToClipboard(text, 'rundown');
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-200 cursor-pointer"
                    >
                      {copiedType === 'rundown' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ClipboardList className="w-3.5 h-3.5" />}
                      {copiedType === 'rundown' ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                </div>

                {/* Progress Bar / Weather Indicator */}
                {(isExecutionMode || showTimeAnalysis) && (
                  <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 space-y-4 animate-in fade-in slide-in-from-top-3">
                    {isExecutionMode && (
                      <div className="space-y-2">
                        {(() => {
                          const total = blueprint.operational.rundown.length;
                          const done = Object.values(completedRundownItems).filter(Boolean).length;
                          const percent = total > 0 ? Math.round((done / total) * 100) : 0;
                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">🏃 Progress Eksekusi Acara Hari-H:</span>
                                <span className="font-mono font-black text-emerald-600 text-[10px]">{done} dari {total} Kegiatan Selesai ({percent}%)</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium italic">Sentuh bulatan angka rundown untuk menandai segmen yang telah beres secara rill.</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    
                    {showTimeAnalysis && (
                      <div className="p-4 bg-white border border-indigo-50/60 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 format-sans text-slate-700">
                          <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">💡 Pengondisian Cuaca Taktis:</span>
                          {(() => {
                            const advice = getWeatherAdviceForLocation(blueprint.event_meta.location);
                            return (
                              <div className="flex gap-2.5 items-start">
                                <span className="text-xl mt-0.5">{advice.icon}</span>
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-slate-700">{blueprint.event_meta.location || 'Lokasi Kegiatan'} ({advice.climate})</p>
                                  <p className="text-[11px] text-slate-500 leading-relaxed">{advice.warning}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                          <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">🕌 Waktu Sholat Indonesia:</span>
                          <p className="text-[11px] text-slate-500 leading-relaxed text-slate-700">
                            Aplikasi menelusuri penulisan rundown dan menandai potensi bentrokan waktu Shalat Dzuhur, Ashar, Maghrib, atau Isya agar panitia senantiasa menyisipkan jeda humanis.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Rundown List */}
                  <div className="lg:col-span-2 bg-white p-7 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 space-y-10 md:space-y-12 relative overflow-hidden">
                    <div className="absolute left-7 md:left-14 top-14 md:top-14 bottom-14 md:bottom-14 w-1 bg-slate-50 rounded-full" />
                    
                    {blueprint.operational.rundown.map((item, index) => {
                      const isCompleted = !!completedRundownItems[index];
                      const conflicts = showTimeAnalysis ? analyzeTimeItem(item.time) : [];
                      
                      return (
                        <div key={index} className={`flex items-start gap-6 md:gap-10 relative group transition-opacity duration-200 ${isCompleted && isExecutionMode ? 'opacity-50' : 'opacity-100'}`}>
                          
                          {/* Left indicator bubble (interactive check block in execution mode) */}
                          {isExecutionMode ? (
                            <button
                              onClick={() => handleToggleRundownItem(index)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center z-10 flex-shrink-0 mt-1 shadow-md hover:scale-110 active:scale-[0.93] transition-all text-xs border font-bold cursor-pointer ${
                                isCompleted 
                                  ? 'bg-emerald-500 text-white border-emerald-500' 
                                  : 'bg-white text-slate-400 hover:text-emerald-500 border-slate-300 hover:border-emerald-500'
                              }`}
                              title={isCompleted ? "Tandai Belum Selesai" : "Tandai Selesai"}
                            >
                              {isCompleted ? '✓' : index + 1}
                            </button>
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-white border-4 border-emerald-400 z-10 flex-shrink-0 mt-2 shadow-md group-hover:scale-125 transition-transform" />
                          )}
                          
                          <div className="space-y-2.5 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                isCompleted && isExecutionMode ? 'bg-slate-100 text-slate-400 line-through' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {item.time}
                              </span>
                              
                              {/* Field log editor inside execution mode */}
                              {isExecutionMode && (
                                <button
                                  onClick={() => {
                                    if (activeNoteEditIndex === index) {
                                      setActiveNoteEditIndex(null);
                                    } else {
                                      setActiveNoteEditIndex(index);
                                      setTempNoteText(rundownFieldNotes[index] || '');
                                    }
                                  }}
                                  className="text-[9px] font-bold text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-md border border-teal-100 flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <span>📝</span>
                                  <span>{rundownFieldNotes[index] ? 'Edit Catatan' : 'Catatan Lapangan'}</span>
                                </button>
                              )}
                            </div>

                            <p className={`text-slate-800 font-bold text-base md:text-lg leading-snug transition-all ${
                              isCompleted && isExecutionMode ? 'line-through text-slate-400 font-medium' : 'group-hover:text-teal-600 font-medium'
                            }`}>
                              {item.task}
                            </p>

                            {/* Render active notes on this rundown item */}
                            {rundownFieldNotes[index] && (
                              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-900 text-xs flex items-start gap-2 max-w-lg mt-1 animate-in fade-in">
                                <span className="font-extrabold text-amber-500">📝</span>
                                <div className="space-y-1">
                                  <p className="font-bold text-[9px] uppercase text-amber-700/60 leading-none">Evaluasi Rill:</p>
                                  <p className="italic font-medium text-slate-700 leading-relaxed">{rundownFieldNotes[index]}</p>
                                </div>
                                {isExecutionMode && (
                                  <button 
                                    onClick={() => handleSaveRundownNote(index, '')}
                                    className="text-[9px] text-amber-600 hover:text-red-500 font-bold ml-auto cursor-pointer"
                                    title="Hapus Catatan"
                                  >
                                    Hapus
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Note Editor Box */}
                            {activeNoteEditIndex === index && (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 max-w-lg mt-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Catat kendala / keterlambatan pada segmen ini:</label>
                                <textarea
                                  value={tempNoteText}
                                  onChange={(e) => setTempNoteText(e.target.value)}
                                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white text-slate-700 font-medium resize-none shadow-inner"
                                  placeholder="Contoh: Terlambat 10 menit karena penyiapan sound system & hujan tumpah..."
                                  rows={2}
                                />
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    onClick={() => setActiveNoteEditIndex(null)}
                                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    onClick={() => handleSaveRundownNote(index, tempNoteText)}
                                    className="px-3.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer"
                                  >
                                    Simpan Catatan
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Time analysis conflict warning banners */}
                            {showTimeAnalysis && conflicts.map((conflict, cIdx) => (
                              <div key={cIdx} className={`p-4 border rounded-2xl flex items-start gap-3 mt-2 text-[11px] leading-relaxed animate-in fade-in ${conflict.color}`}>
                                <span className="text-base mt-0.5">{conflict.icon}</span>
                                <div className="space-y-0.5">
                                  <p className="font-extrabold uppercase text-[9px] tracking-wider leading-none mb-1">{conflict.title}</p>
                                  <p className="font-medium text-slate-700">{conflict.advice}</p>
                                </div>
                              </div>
                            ))}

                          </div>
                        </div>
                      );
                    })}
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

        {/* Tanya Mentor AI - Interactive Consultation Segment */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-7 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl shadow-indigo-900/5 border border-indigo-100/50 space-y-8 md:space-y-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32" />
          
          <div className="space-y-6 relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-[1.5rem] bg-indigo-50 flex items-center justify-center shadow-lg shadow-indigo-100/50">
                <HeartHandshake className="w-6 h-6 md:w-7 md:h-7 text-indigo-600" />
              </div>
              <div className="space-y-0.5 md:space-y-1">
                <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full inline-block">Fitur Sparring</span>
                <h2 className="text-xl md:text-3xl font-display font-semibold text-slate-800">Tanya Mentor Lapangan</h2>
                <p className="text-[11px] md:text-sm text-slate-400 font-medium leading-relaxed italic">"Diskusikan keraguan, minimalkan burnout, dan temukan solusi taktis hemat biaya"</p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-3xl">
              Memiliki kendala khusus atau keraguan operasional untuk agenda <strong>{blueprint.event_meta.title}</strong>? Tanya mentor AI kami yang paham betul situasi lapangan di <strong>{blueprint.event_meta.location}</strong>.
            </p>

            {/* Quick Template Questions */}
            <div className="space-y-3">
              <h4 className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pertanyaan Pilihan Cepat:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: "budget_zero",
                    label: "💡 Bagaimana cara membuat anggaran acara ini menjadi 0 Rupiah (Mandiri)?",
                    question: "Bagaimana cara memangkas dan mengoptimalkan seluruh anggaran acara ini agar bisa berjalan dengan nol rupiah (bergerak mandiri/gerilya)?"
                  },
                  {
                    id: "staff_burnout",
                    label: "🧘 Bagaimana pembagian tugas panitia agar bebas dari rasa jenuh/burnout?",
                    question: "Bagaimana pembagian tugas ideal untuk staff/panitia kami yang terbatas agar semua beban kerja terbagi adil tanpa ada yang mengalami kelelahan ekstrem?"
                  },
                  {
                    id: "local_partner",
                    label: "🤝 Bagaimana trik mengajak vendor/mitra lokal berkolaborasi cuma-cuma?",
                    question: "Bagaimana cara meyakinkan serta memikat calon mitra lokal potensial di lokasi kami untuk bekerja sama atau meminjamkan fasilitas secara cuma-cuma?"
                  },
                  {
                    id: "marketing_low",
                    label: "📣 Tulis teks promosi yang menggugah warga agar antusias berhadir!",
                    question: "Tuliskan 3 alternatif naskah promosi/headline yang sangat menyentuh hati warga setempat agar tergerak untuk antusias mengikuti kegiatan ini."
                  }
                ].map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setMentorQuestion(tmpl.question);
                      handleAskMentor(tmpl.question);
                    }}
                    disabled={askingMentor}
                    className="p-4 bg-slate-50/50 hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-100/60 rounded-2xl text-left text-[11px] md:text-xs font-semibold text-slate-700 transition-all active:scale-[0.98] cursor-pointer inline-block"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Question input */}
            <div className="space-y-4 pt-2">
              <textarea
                value={mentorQuestion}
                onChange={(e) => setMentorQuestion(e.target.value)}
                placeholder="Ajukan pertanyaan khusus Anda ke mentor... (Misal: Bagaimana cara mengantisipasi hujan di lokasi outdoor kami?)"
                className="w-full min-h-[80px] p-4 md:p-5 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] md:text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all resize-none font-medium leading-relaxed"
              />
              
              <div className="flex justify-end font-display">
                <button
                  type="button"
                  onClick={() => handleAskMentor(mentorQuestion)}
                  disabled={askingMentor || !mentorQuestion.trim()}
                  className="w-full sm:w-auto bg-indigo-600 font-bold hover:bg-indigo-700 text-white text-xs px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  {askingMentor ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mentor Sedang Berpikir Taktis...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Ajukan Ke Mentor AI ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Interactive Answer Bubble */}
            <AnimatePresence>
              {(askingMentor || mentorAnswer) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 md:p-10 bg-indigo-50/40 border border-indigo-100/40 rounded-[2rem] space-y-4 mt-6 shadow-sm relative text-left"
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-indigo-100/30">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-extrabold text-indigo-700 tracking-widest uppercase">Wejangan & Solusi Praktis Mentor</span>
                  </div>
                  
                  {askingMentor ? (
                    <div className="space-y-3 py-4">
                      <div className="h-3 bg-indigo-100/80 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-indigo-100/80 rounded animate-pulse w-5/6" />
                      <div className="h-3 bg-indigo-100/80 rounded animate-pulse w-2/3" />
                    </div>
                  ) : (
                    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-sans">
                      {renderFormattedMentorAnswer(mentorAnswer || "")}
                    </div>
                  )}

                  {!askingMentor && mentorAnswer && (
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => {
                          copyToClipboard(mentorAnswer, 'Jawaban Mentor');
                        }}
                        className="text-[9px] md:text-[10px] font-black text-indigo-700 hover:text-indigo-900 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                      >
                        {copiedType === 'Jawaban Mentor' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Salin Wejangan Mentor</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

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
