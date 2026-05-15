import React from 'react';
import { EventData } from '../types';
import { HelpTooltip } from './HelpTooltip';
import { GUIDANCE_DATA } from '../constants/guidance';

interface Props {
  onSubmit: (data: EventData & { mode?: 'quick' | 'strategic' }) => void;
  loading: boolean;
  prefill?: EventData | null;
  isLoggedIn?: boolean;
  userEmail?: string | null;
  onLoginRequest?: () => void;
}

export const EventForm: React.FC<Props> = ({ onSubmit, loading, prefill, isLoggedIn, userEmail, onLoginRequest }) => {
  const [mode, setMode] = React.useState<'quick' | 'strategic'>('quick');
  const [formValues, setFormValues] = React.useState({
    name: '',
    organization: '',
    location: '',
    participants: '',
    staff: '',
    budget: '',
    type: '',
    goal: '',
    previous_context: '',
  });

  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (prefill) {
      setFormValues({
        name: prefill.name,
        organization: prefill.organization,
        location: prefill.location,
        participants: prefill.participants.toString(),
        staff: prefill.staff.toString(),
        budget: prefill.budget.toString(),
        type: prefill.type,
        goal: prefill.goal,
        previous_context: prefill.previous_context || '',
      });
      // Clear touched state when prefilled
      setTouched({});
    }
  }, [prefill]);

  const validate = () => {
    return {
      name: formValues.name.length >= 5,
      organization: formValues.organization.length >= 3,
      location: formValues.location.length >= 3,
      participants: parseInt(formValues.participants) >= 5,
      budget: formValues.budget !== '' && parseInt(formValues.budget) >= 0,
      type: formValues.type.length >= 3,
      goal: formValues.goal.length >= 15,
      previous_context: true, // Always valid as it is optional
    };
  };

  const validation = validate();
  const isValid = Object.values(validation).every(Boolean);

  const [cooldown, setCooldown] = React.useState(0);
  const prevLoading = React.useRef(loading);

  React.useEffect(() => {
    if (prevLoading.current === true && loading === false) {
      setCooldown(20);
    }
    prevLoading.current = loading;
  }, [loading]);

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || cooldown > 0 || !isValid) return;

    onSubmit({
      name: formValues.name,
      organization: formValues.organization,
      location: formValues.location,
      participants: parseInt(formValues.participants) || 0,
      staff: parseInt(formValues.staff) || 0,
      budget: parseInt(formValues.budget) || 0,
      type: formValues.type,
      goal: formValues.goal,
      previous_context: formValues.previous_context,
      mode: mode,
    });
  };

  const inputClass = (field: string) => `w-full p-4 bg-slate-50 border ${
    touched[field] && !validation[field as keyof typeof validation] 
      ? 'border-amber-400 focus:ring-amber-500/10 focus:border-amber-500' 
      : 'border-slate-100 focus:ring-teal-500/10 focus:border-teal-500'
  } rounded-2xl focus:bg-white outline-none transition-all placeholder:text-slate-300 text-slate-800 text-sm md:text-base`;
  
  const labelClass = "block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1";
  const errorClass = "text-[10px] font-medium text-amber-600 mt-2 ml-1 animate-in fade-in slide-in-from-top-1 px-1 leading-relaxed";

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white p-6 md:p-14 rounded-[2.5rem] md:rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8 md:space-y-12 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
      
      <div className="relative border-b border-slate-100 pb-6 md:pb-8">
        <h2 className="text-lg md:text-2xl font-display font-black text-slate-800 mb-1">Rancang Kegiatan</h2>
        <p className="text-[10px] md:text-sm text-slate-500 italic">"Lengkapi detail untuk blueprint yang personal."</p>
      </div>

      <div className="space-y-6 md:space-y-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className={labelClass}>Nama Kegiatan</label>
            <input
              type="text"
              className={inputClass('name')}
              placeholder="Contoh: EduAction Sharing Session"
              value={formValues.name}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              onBlur={() => handleBlur('name')}
              required
              disabled={loading || cooldown > 0}
            />
            {touched.name && !validation.name && (
              <p className={errorClass}>Nama kegiatan minimal 5 karakter agar identitasnya jelas 🙌</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Organisasi / Komunitas</label>
            <input
              type="text"
              className={inputClass('organization')}
              placeholder="Contoh: TurunTangan Banjarmasin"
              value={formValues.organization}
              onChange={(e) => setFormValues({ ...formValues, organization: e.target.value })}
              onBlur={() => handleBlur('organization')}
              required
              disabled={loading || cooldown > 0}
            />
            {touched.organization && !validation.organization && (
              <p className={errorClass}>Minimal 3 karakter untuk nama komunitas kamu ya ✨</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className={labelClass}>Lokasi / Kota</label>
            <input
              type="text"
              className={inputClass('location')}
              placeholder="Contoh: Banjarmasin"
              value={formValues.location}
              onChange={(e) => setFormValues({ ...formValues, location: e.target.value })}
              onBlur={() => handleBlur('location')}
              required
              disabled={loading || cooldown > 0}
            />
            {touched.location && !validation.location && (
              <p className={errorClass}>Minimal 3 karakter untuk lokasi atau kota kegiatan 📍</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Jenis / Kategori Acara</label>
            <input
              type="text"
              className={inputClass('type')}
              placeholder="Contoh: Seminar Edukasi"
              value={formValues.type}
              onChange={(e) => setFormValues({ ...formValues, type: e.target.value })}
              onBlur={() => handleBlur('type')}
              required
              disabled={loading || cooldown > 0}
            />
            {touched.type && !validation.type && (
              <p className={errorClass}>Beri tahu kami kategori acaranya minimal 3 karakter 🏷️</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div>
            <label className={labelClass}>Target Peserta</label>
            <input
              type="number"
              className={inputClass('participants')}
              placeholder="Contoh: 50"
              value={formValues.participants}
              onChange={(e) => setFormValues({ ...formValues, participants: e.target.value })}
              onBlur={() => handleBlur('participants')}
              required
              disabled={loading || cooldown > 0}
            />
            {touched.participants && !validation.participants && (
              <p className={errorClass}>Minimal target 5 orang agar blueprint lebih akurat 👨‍👩‍👧‍👦</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Jumlah Panitia</label>
            <input
              type="number"
              className={inputClass('staff')}
              placeholder="Contoh: 15"
              value={formValues.staff}
              onChange={(e) => setFormValues({ ...formValues, staff: e.target.value })}
              required
              disabled={loading || cooldown > 0}
            />
          </div>
          <div>
            <label className={labelClass}>Estimasi Budget (IDR)</label>
            <input
              type="number"
              className={inputClass('budget')}
              placeholder="Contoh: 500000"
              value={formValues.budget}
              onChange={(e) => setFormValues({ ...formValues, budget: e.target.value })}
              onBlur={() => handleBlur('budget')}
              required
              disabled={loading || cooldown > 0}
            />
            {touched.budget && !validation.budget && (
              <p className={errorClass}>Masukkan angka budget yang valid untuk strategi yang tepat 💰</p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Tujuan Utama Kegiatan</label>
          <textarea
            className={`${inputClass('goal')} min-h-[100px] resize-none`}
            placeholder="Contoh: Meningkatkan skor IELTS anggota komunitas melalui sharing session eksklusif."
            value={formValues.goal}
            onChange={(e) => setFormValues({ ...formValues, goal: e.target.value })}
            onBlur={() => handleBlur('goal')}
            required
            disabled={loading || cooldown > 0}
          />
          {touched.goal && !validation.goal && (
            <p className={errorClass}>Tambahkan sedikit konteks (min. 15 karakter) agar CommunityOS bisa memberikan blueprint yang lebih realistis dan relevan 🙌</p>
          )}
        </div>

        <div>
          <label className={labelClass}>Referensi atau kegiatan sebelumnya (opsional)</label>
          <textarea
            className={`${inputClass('previous_context')} min-h-[80px] resize-none`}
            placeholder="Contoh: EduAction #1 dengan 60 peserta dan 12 panitia."
            value={formValues.previous_context}
            onChange={(e) => setFormValues({ ...formValues, previous_context: e.target.value })}
            disabled={loading || cooldown > 0}
          />
          <p className="text-[9px] text-slate-400 mt-1.5 ml-1 leading-relaxed">
            Memberikan konteks sejarah membantu CommunityOS menyusun strategi yang lebih realistis.
          </p>
        </div>
      </div>

      <div className="pt-2 relative">
        {/* Live Operational Insight Component */}
        <div className="mb-6 p-5 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Operational Insight</span>
          </div>

          {(() => {
            const staff = parseInt(formValues.staff) || 0;
            const participants = parseInt(formValues.participants) || 0;
            const budget = parseInt(formValues.budget) || 0;

            if (staff === 0 && participants === 0) {
              return <p className="text-xs text-slate-400 italic">"Lengkapi jumlah panitia dan peserta untuk melihat estimasi beban kerja."</p>;
            }

            const ratio = participants / (staff || 1);
            let riskMsg = "";
            let riskLevel = "Normal";

            if (ratio > 25) {
              riskLevel = "Tinggi";
              riskMsg = "Rasio peserta per panitia sangat tinggi. Risiko burnout operasional terdeteksi.";
            } else if (ratio > 15) {
              riskLevel = "Sedang";
              riskMsg = "Beban kerja tim cukup intensif. Pastikan pembagian delegasi jelas.";
            } else if (staff > 0) {
              riskLevel = "Aman";
              riskMsg = "Kapasitas tim terlihat ideal untuk jumlah peserta ini.";
            }

            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Estimasi Intensitas</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    riskLevel === 'Tinggi' ? 'bg-rose-100 text-rose-600' : 
                    riskLevel === 'Sedang' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {riskLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                  "{riskMsg}"
                </p>
                {budget > 0 && budget < 200000 && participants > 30 && (
                  <div className="flex items-start gap-2 p-2.5 bg-white border border-slate-100 rounded-xl mt-2">
                    <span className="text-xs">💡</span>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Budget terbatas untuk peserta sebanyak ini. CommunityOS akan prioritaskan strategi <span className="font-bold text-teal-600">Gerilya Scale</span>.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="flex items-center gap-2 mb-6 p-1.5 bg-slate-50 rounded-2xl w-full md:w-fit mx-auto border border-slate-100">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setMode('quick')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMode('quick'); }}
            className={`flex-1 md:flex-none cursor-pointer flex flex-col items-center gap-1.5 px-3 md:px-6 py-3 rounded-2xl transition-all border ${
              mode === 'quick' 
                ? 'bg-white shadow-xl shadow-teal-900/5 text-teal-600 border-teal-100 scale-[1.02] md:scale-105' 
                : 'text-slate-400 hover:text-slate-500 border-transparent hover:bg-white/50'
            }`}
          >
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">Quick Mode</span>
              <HelpTooltip {...GUIDANCE_DATA.QUICK_MODE} />
            </div>
            <span className="text-[7px] md:text-[8px] font-medium opacity-60">Taktis & Cepat</span>
          </div>
          <div className="w-px h-6 md:h-8 bg-slate-200/50" />
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!isLoggedIn && onLoginRequest) {
                onLoginRequest();
              } else {
                setMode('strategic');
              }
            }}
            onKeyDown={(e) => { 
              if (e.key === 'Enter' || e.key === ' ') {
                if (!isLoggedIn && onLoginRequest) {
                  onLoginRequest();
                } else {
                  setMode('strategic');
                }
              }
            }}
            className={`flex-1 md:flex-none cursor-pointer flex flex-col items-center gap-1.5 px-3 md:px-6 py-3 rounded-2xl transition-all border ${
              mode === 'strategic' 
                ? 'bg-white shadow-xl shadow-teal-900/5 text-teal-600 border-teal-100 scale-[1.02] md:scale-105' 
                : 'text-slate-400 hover:text-slate-500 border-transparent hover:bg-white/50'
            }`}
          >
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="flex flex-col items-center">
                <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest leading-none whitespace-nowrap">Strategic Mode</span>
                {!isLoggedIn && <span className="text-[6px] md:text-[7px] text-amber-500 font-bold mt-0.5">LOCKED</span>}
              </div>
              <HelpTooltip {...GUIDANCE_DATA.STRATEGIC_MODE} />
            </div>
            <span className="text-[7px] md:text-[8px] font-medium opacity-60">Analisis Mendalam</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || cooldown > 0 || (Object.keys(touched).length > 0 && !isValid)}
          className="w-full relative group disabled:cursor-not-allowed"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
          <div className="relative bg-slate-900 group-hover:bg-slate-800 text-white font-display font-semibold py-3.5 md:py-4 rounded-2xl transition-all disabled:opacity-75 flex flex-col items-center justify-center gap-0.5 text-sm md:text-base">
            {loading ? (
              'Menganalisis...'
            ) : cooldown > 0 ? (
              <span className="text-teal-400">Cooldown aktif • {cooldown}s</span>
            ) : (
              'Mulai Rancang Blueprint'
            )}
          </div>
        </button>
        {cooldown > 0 && !loading && (
          <p className="text-center text-[10px] font-semibold text-slate-400 mt-3 animate-pulse">
            Community<span className="text-teal-600">OS</span> sedang menjaga stabilitas sistem ✨
          </p>
        )}
      </div>
    </form>
  );
};
