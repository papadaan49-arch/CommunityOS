import React from 'react';
import { Sparkles, Info, CheckCircle2, AlertCircle, Lightbulb, Target, TrendingUp, Rocket } from 'lucide-react';
import { EventData } from '../types';
import { MODE_INFO, validateInputWithAI } from '../services/geminiService';
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
  const [mentorSuggestion, setMentorSuggestion] = React.useState<{
    recommended: 'quick' | 'strategic';
    reason: string;
    plus: string;
    minus: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const [formValues, setFormValues] = React.useState({
    name: '',
    organization: '',
    location: '',
    participants: '',
    staff: '',
    budget: '',
    type: '',
    goal: '',
    spirit: 'idea',
    previous_context: '',
  });

  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const validate = () => {
    return {
      name: formValues.name.length >= 5,
      organization: formValues.organization.length >= 3,
      location: formValues.location.length >= 3,
      participants: parseInt(formValues.participants) >= 5,
      budget: formValues.budget !== '' && parseInt(formValues.budget) >= 0,
      type: formValues.type.length >= 3,
      goal: formValues.goal.length >= 15,
      previous_context: true,
    };
  };

  const validation = validate();
  const isValid = Object.values(validation).every(Boolean);

  // Removed automatic mentor analysis to prevent infinite loops and improve user peace of mind.
  // Analyzing on demand instead.
  const handleRequestMentor = async () => {
    if (!isValid || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const result = await validateInputWithAI({
        ...formValues,
        participants: parseInt(formValues.participants) || 0,
        staff: parseInt(formValues.staff) || 0,
        budget: parseInt(formValues.budget) || 0,
        type: formValues.type,
        spirit: formValues.spirit,
      });
      if (result.mode_suggestion) {
        setMentorSuggestion(result.mode_suggestion);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset suggestion if important fields change significantly
  React.useEffect(() => {
    if (mentorSuggestion) setMentorSuggestion(null);
  }, [formValues.goal, formValues.participants, formValues.location]);

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
        spirit: prefill.spirit || 'idea',
        previous_context: prefill.previous_context || '',
      });
      setTouched({});
    }
  }, [prefill]);

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
      spirit: formValues.spirit,
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
      <div className="relative border-b border-slate-100 pb-6 md:pb-8">
        <h2 className="text-lg md:text-2xl font-display font-black text-slate-800 mb-1">Rancang Kegiatan</h2>
        <p className="text-[10px] md:text-sm text-slate-500 italic">"Lengkapi detail untuk blueprint yang personal."</p>
      </div>

      <div className="space-y-6 md:space-y-10 relative">
        <div>
          <label className={labelClass}>Spirit & Fokus Kegiatan</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                { id: 'idea', label: 'Ide Baru', icon: Lightbulb, desc: 'Mulai dari nol' },
                { id: 'duplicate', label: 'Tiru Sukses', icon: Target, desc: 'Gunakan best-practice' },
                { id: 'growth', label: 'Kembangkan', icon: TrendingUp, desc: 'Naikkan skala' },
                { id: 'innovation', label: 'Inovasi', icon: Rocket, desc: 'Gebrakan baru' }
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFormValues({ ...formValues, spirit: s.id })}
                    className={`p-4 rounded-2xl border text-left transition-all group ${
                      formValues.spirit === s.id 
                        ? 'bg-teal-50 border-teal-200 ring-2 ring-teal-500/10' 
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:rotate-6 ${
                      formValues.spirit === s.id ? 'bg-teal-100 text-teal-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      formValues.spirit === s.id ? 'text-teal-700' : 'text-slate-600'
                    }`}>
                      {s.label}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium leading-tight">
                      {s.desc}
                    </div>
                  </button>
                );
              })}
          </div>
          {formValues.spirit !== 'idea' && (
            <div className="mt-3 flex items-center gap-2 text-[10px] text-teal-600 font-bold bg-teal-50/30 p-3 rounded-xl border border-teal-100/50 animate-in fade-in slide-in-from-top-2">
              <Sparkles className="w-3 h-3" />
              <span>{formValues.spirit === 'duplicate' ? 'Pastikan cantumkan rincian kegiatan sebelumnya di kolom "Referensi" agar blueprint lebih presisi.' : formValues.spirit === 'growth' ? 'Sebutkan pencapaian terakhir di kolom "Referensi" untuk analisis pengembangan.' : 'Jelaskan apa yang ingin diubah secara fundamental di kolom "Tujuan".'}</span>
            </div>
          )}
        </div>

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
            <label className={labelClass}>Estimasi Budget (Rp)</label>
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
        </div>
      </div>

      <div className="pt-2 relative">
        {/* Mentor Suggestion Card */}
        {isValid && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`p-6 rounded-3xl border transition-all duration-500 ${
              isAnalyzing 
                ? 'bg-slate-50 border-slate-100' 
                : mentorSuggestion 
                  ? 'bg-white border-teal-100 shadow-sm' 
                  : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isAnalyzing ? 'bg-slate-200 animate-pulse' : 'bg-teal-500'
                }`}>
                  {isAnalyzing ? (
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Lightbulb className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Analisis Mentor CommunityOS</h3>
                    {isAnalyzing ? (
                      <p className="text-sm text-slate-500 italic">Menganalisis skenario terbaik untukmu...</p>
                    ) : mentorSuggestion ? (
                      <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                        {mentorSuggestion.reason}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-slate-400 italic">Butuh saran untuk memilih mode perencanaan yang paling tepat?</p>
                        <button
                          type="button"
                          onClick={handleRequestMentor}
                          disabled={isAnalyzing}
                          className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 border border-teal-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-100 transition-all group"
                        >
                          <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                          <span>Dapatkan Saran Mentor</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {!isAnalyzing && mentorSuggestion && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Kelebihan</span>
                        </div>
                        <p className="text-xs text-emerald-800/80 leading-relaxed">{mentorSuggestion.plus}</p>
                      </div>
                      <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                        <div className="flex items-center gap-2 mb-2 text-amber-700">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Keterbatasan</span>
                        </div>
                        <p className="text-xs text-amber-800/80 leading-relaxed">{mentorSuggestion.minus}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {mentorSuggestion && (
              <div className="mt-4 ml-14 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Saran: Gunakan <span className="text-teal-600 font-bold">{MODE_INFO[mentorSuggestion.recommended.toUpperCase() as keyof typeof MODE_INFO].name}</span>, silakan sesuaikan di bawah.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-stretch gap-4 mb-8">
          <div
            onClick={() => setMode('quick')}
            className={`flex-1 cursor-pointer flex flex-col items-start gap-2 p-5 rounded-2xl transition-all border ${
              mode === 'quick' 
                ? 'bg-teal-50/50 border-teal-200 ring-4 ring-teal-500/5' 
                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold tracking-widest ${mode === 'quick' ? 'text-teal-700' : 'text-slate-400'}`}>
                {MODE_INFO.QUICK.name}
              </span>
              {mode === 'quick' && <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />}
            </div>
            <p className={`text-xs leading-relaxed ${mode === 'quick' ? 'text-teal-600/80' : 'text-slate-400'}`}>
              {MODE_INFO.QUICK.desc}
            </p>
          </div>
          
          <div
            onClick={() => {
              if (!isLoggedIn && onLoginRequest) {
                onLoginRequest();
              } else {
                setMode('strategic');
              }
            }}
            className={`flex-1 cursor-pointer flex flex-col items-start gap-2 p-5 rounded-2xl transition-all border ${
              mode === 'strategic' 
                ? 'bg-teal-50/50 border-teal-200 ring-4 ring-teal-500/5' 
                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold tracking-widest ${mode === 'strategic' ? 'text-teal-700' : 'text-slate-400'}`}>
                {MODE_INFO.STRATEGIC.name}
              </span>
              {mode === 'strategic' && <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />}
            </div>
            <p className={`text-xs leading-relaxed ${mode === 'strategic' ? 'text-teal-600/80' : 'text-slate-400'}`}>
              {MODE_INFO.STRATEGIC.desc}
            </p>
          </div>
        </div>

        {mode === 'quick' ? (
          <button
            type="submit"
            disabled={loading || cooldown > 0 || (Object.keys(touched).length > 0 && !isValid)}
            className="w-full relative group disabled:cursor-not-allowed"
          >
            <div className="relative bg-slate-900 group-hover:bg-slate-800 text-white font-display font-semibold py-4 rounded-2xl transition-all disabled:opacity-75 flex items-center justify-center gap-2 text-sm md:text-base">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Membuka Diskusi...</span>
                </>
              ) : cooldown > 0 ? (
                `Tunggu ${cooldown}s...`
              ) : (
                <>
                  <span>Mulai Diskusi Gerilya</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </div>
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || cooldown > 0 || (Object.keys(touched).length > 0 && !isValid)}
            className="w-full relative group disabled:cursor-not-allowed"
          >
            <div className="relative bg-gradient-to-r from-teal-600 to-emerald-600 group-hover:from-teal-700 group-hover:to-emerald-700 text-white font-display font-semibold py-4 rounded-2xl transition-all disabled:opacity-75 flex items-center justify-center gap-2 text-sm md:text-base shadow-lg shadow-teal-500/20">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Menyiapkan Rapat Strategis...</span>
                </>
              ) : cooldown > 0 ? (
                `Tunggu ${cooldown}s...`
              ) : (
                <>
                  <span>Mulai Rapat Strategis (Deep Dive)</span>
                  <Sparkles className="w-4 h-4 text-teal-200" />
                </>
              )}
            </div>
          </button>
        )}
      </div>
    </form>
  );
};
