import React from 'react';
import { EventData } from '../types';

interface Props {
  onSubmit: (data: EventData) => void;
  loading: boolean;
  prefill?: EventData | null;
}

export const EventForm: React.FC<Props> = ({ onSubmit, loading, prefill }) => {
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
      setCooldown(45);
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
    if (cooldown > 0 || loading || !isValid) return;

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
      className="bg-white p-8 md:p-14 rounded-[2.5rem] md:rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-10 md:space-y-12 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
      
      <div className="relative border-b border-slate-100 pb-8">
        <h2 className="text-xl md:text-2xl font-display font-bold text-slate-800 mb-2 md:mb-3">Konfigurasi Acara</h2>
        <p className="text-xs md:text-sm text-slate-500 mb-4 italic leading-relaxed">"Lengkapi detail untuk hasil yang lebih akurat dan personal."</p>
      </div>
      
      <div className="space-y-8 md:space-y-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className={labelClass}>Nama Kegiatan</label>
            <input
              type="text"
              className={inputClass('name')}
              placeholder="Contoh: EduAction IELTS Sharing Session"
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
        <button
          type="submit"
          disabled={loading || cooldown > 0 || Object.keys(touched).length > 0 && !isValid}
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
