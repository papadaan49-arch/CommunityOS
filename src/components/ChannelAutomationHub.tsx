import React from 'react';
import { Network, Laptop, Users, CheckCircle, Sparkles, AlertCircle, RefreshCw, Send, ArrowRight, MessageSquare, HeartHandshake, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Blueprint } from '../types';

interface Props {
  blueprint: Blueprint;
}

export const ChannelAutomationHub: React.FC<Props> = ({ blueprint }) => {
  const [selectedChannel, setSelectedChannel] = React.useState<'all' | 'online' | 'offline'>('all');
  const [syncing, setSyncing] = React.useState(false);
  const [completedTasks, setCompletedTasks] = React.useState<Record<string, boolean>>({});
  const [customBrief, setCustomBrief] = React.useState('');
  const [showAiSuggestion, setShowAiSuggestion] = React.useState(false);
  const [aiResponse, setAiResponse] = React.useState<string>('');

  const rundown = blueprint.operational?.rundown || [];
  const location = blueprint.event_meta?.location || 'Tempat Pelaksanaan';
  const scale = blueprint.event_meta?.scale_classification || 'Gerilya Scale';

  // 1. Classify tasks into Online vs Offline dynamically using helper
  const classifyTask = (taskName: string): 'online' | 'offline' => {
    const name = taskName.toLowerCase();
    if (
      name.includes('buka') || 
      name.includes('datang') || 
      name.includes('registrasi') || 
      name.includes('makan') || 
      name.includes('ibadah') || 
      name.includes('salat') || 
      name.includes('foto') ||
      name.includes('tanya jawab') ||
      name.includes('panggung') ||
      name.includes('bersih') ||
      name.includes('logistik') ||
      name.includes('penutupan')
    ) {
      return 'offline';
    }
    return 'online';
  };

  const tasksList = rundown.map((item, index) => {
    const channel = classifyTask(item.task);
    return {
      id: `task-${index}`,
      time: item.time,
      task: item.task,
      channel,
      // Provide dynamic coordination suggestions based on scale and channel
      coordination: channel === 'online' 
        ? 'Gunakan koordinasi instan via Whatsapp group panitia & update status via lembar kerja digital.'
        : `Lakukan koordinasi visual tatap muka langsung di posko ${location}.`,
      status: completedTasks[`task-${index}`] || false
    };
  });

  const filteredTasks = tasksList.filter(t => selectedChannel === 'all' || t.channel === selectedChannel);
  
  const totalTasks = tasksList.length;
  const onlineCount = tasksList.filter(t => t.channel === 'online').length;
  const offlineCount = tasksList.filter(t => t.channel === 'offline').length;
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const toggleTask = (id: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const simulateAiAudit = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setShowAiSuggestion(true);
      
      const isGerilya = scale === 'Gerilya Scale';
      const promptResponse = isGerilya 
        ? `💡 **Rekomendasi Efisiensi Gerilya (Hibrida):**
- **Kanal Online**: Batasi rapat koordinasi Google Meet. Cukup gunakan satu dokumen checklist digital dan update berkala melalui Voice Note di Group WhatsApp untuk menghemat paket data relawan.
- **Kanal Offline**: Maksimalkan "Briefing Berdiri" 5 menit sebelum acara di lokasi demi penghematan energi panitia. Tidak perlu ruang khusus, cukup melingkar hangat.
- **Sinkronisasi**: Sistem mendeteksi ${onlineCount} agenda online yang bisa diautomasikan dengan template broadcast, mengurangi beban mengetik berulang.`
        : `💡 **Sistem Otomasi Sinkronisasi Komunitas:**
- **Kanal Online**: Siapkan presensi digital menggunakan Google Form yang terintegrasi dengan pengingat otomatis H-1 acara.
- **Kanal Offline**: Alokasikan relawan khusus sebagai penghubung (Liaison Officer) antara kru panggung (offline) dan admin pengendali update media sosial (online).
- **Aspek Efisiensi**: ${offlineCount} agenda tatap muka memerlukan kesiapan fisik prima, letakkan asupan air mineral di 3 titik posko fisik.`;

      setAiResponse(promptResponse);
    }, 1200);
  };

  return (
    <div id="channel-automation-hub" className="bg-white p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8 md:space-y-10">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
            <Network className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-slate-800 leading-tight">Otomasi Kanal Ganda (Online & Offline)</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sinergi Efisien Gerakan Digital & Aksi Lapangan</p>
          </div>
        </div>

        {/* Channels Tracker Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
            <Laptop className="w-3.5 h-3.5" /> ONLINE: {onlineCount} Sesi
          </span>
          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> OFFLINE: {offlineCount} Sesi
          </span>
        </div>
      </div>

      {/* Progress & Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Progress Card */}
        <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Penyelesaian Agenda</span>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black font-mono text-slate-800">{completionPercentage}%</span>
              <span className="text-[10px] font-bold text-slate-500">{completedCount} / {totalTasks} Beres</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div style={{ width: `${completionPercentage}%` }} className="h-full bg-teal-500 rounded-full transition-all duration-500" />
            </div>
          </div>
        </div>

        {/* Online Automation Description */}
        <div className="p-4 bg-blue-50/20 border border-blue-100/50 rounded-xl space-y-1.5">
          <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <Laptop className="w-3 h-3" /> Otomasi Digital
          </span>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Menghilangkan tugas repetitif seperti broadcast WhatsApp dan form kehadiran dengan sistem template AI sekali klik.
          </p>
        </div>

        {/* Offline Optimization Description */}
        <div className="p-4 bg-amber-50/20 border border-amber-100/50 rounded-xl space-y-1.5">
          <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3" /> Optimasi Lapangan
          </span>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Fokus pada aksi tatap muka humanis, asupan energi panitia, serta manajemen logistik gotong royong non-birokratis.
          </p>
        </div>
      </div>

      {/* Interactive Task Channel Router */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <span>📋 Daftar Alur berdasarkan Prioritas Kanal</span>
          </h4>
          
          <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 self-start sm:self-auto">
            {(['all', 'online', 'offline'] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                  selectedChannel === ch
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {ch === 'all' ? 'Semua Kanal' : ch}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-inner bg-slate-50/10 max-h-[300px] overflow-y-auto">
          {filteredTasks.map((t) => (
            <div 
              key={t.id} 
              className={`p-3.5 flex items-start gap-3 transition-colors hover:bg-slate-50/50 ${
                t.status ? 'bg-slate-50/40 opacity-70' : ''
              }`}
            >
              <button
                onClick={() => toggleTask(t.id)}
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 mt-0.5 cursor-pointer ${
                  t.status ? 'bg-teal-500 border-teal-400 text-white shadow-sm' : 'border-slate-300 hover:border-teal-500 bg-white'
                }`}
              >
                {t.status && <CheckCircle className="w-4.5 h-4.5" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{t.time}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                    t.channel === 'online' 
                      ? 'bg-blue-50 text-blue-700 border-blue-100' 
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {t.channel}
                  </span>
                </div>
                <p className={`text-xs font-bold text-slate-800 ${t.status ? 'line-through text-slate-400' : ''}`}>
                  {t.task}
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {t.coordination}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Smart Sync Audit Coordinator */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl md:rounded-[2rem] p-6 md:p-8 space-y-6 relative overflow-hidden ring-1 ring-white/10 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -mr-32 -mt-32 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Copilot Sinkronisasi</span>
          </div>
          <h4 className="text-lg font-bold font-display leading-tight">Audit Alur Komunikasi Hibrida</h4>
          <p className="text-xs text-indigo-300/80 leading-relaxed md:max-w-2xl">
            Sistem menganalisis seluruh item kegiatan di atas untuk mengidentifikasi potensi penumpukan pesan koordinasi (online) vs kesiapan logistik fisik (offline) agar tim tidak cepat lelah.
          </p>
        </div>

        {/* Live trigger action */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 relative z-10">
          <button
            onClick={simulateAiAudit}
            disabled={syncing}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menganalisis Pola Kanal...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Audit Otomatis AI</span>
              </>
            )}
          </button>

          <span className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-wider">
            Didukung Audit Taktis Gerilya Scale
          </span>
        </div>

        {/* Clean outcome display */}
        <AnimatePresence>
          {showAiSuggestion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 md:p-5 bg-white/5 border border-white/10 rounded-xl space-y-3 relative text-[11px] leading-relaxed text-indigo-100"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <AlertCircle className="w-4 h-4 text-emerald-400" />
                <span className="font-extrabold text-[10px] tracking-wider text-emerald-400 uppercase">HASIL REKOMENDASI AI SINKRONISASI</span>
              </div>
              <div className="whitespace-pre-wrap font-sans space-y-2 text-indigo-100/90 leading-relaxed md:max-w-3xl">
                {aiResponse}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
