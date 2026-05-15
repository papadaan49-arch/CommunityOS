import React from 'react';
import { motion } from 'motion/react';
import { Instagram, Linkedin, Heart, ShieldCheck, Upload, Camera } from 'lucide-react';
import { getAppSetting, updateAppSetting } from '../services/dbService';
import { toast } from 'sonner';
import { ImageCropper } from './ImageCropper';

interface Props {
  userEmail?: string | null;
}

export const CreatorProfile: React.FC<Props> = ({ userEmail }) => {
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [isCropping, setIsCropping] = React.useState(false);
  const [tempImage, setTempImage] = React.useState<string | null>(null);
  const isAdmin = !!userEmail; 

  React.useEffect(() => {
    loadProfilePhoto();
  }, []);

  const loadProfilePhoto = async () => {
    const savedPhoto = await getAppSetting('creator_photo');
    if (savedPhoto) setPhoto(savedPhoto);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2000000) {
      toast.error("Ukuran foto terlalu besar. Gunakan foto di bawah 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImage(reader.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handleCropComplete = async (croppedImage: string) => {
    setUploading(true);
    setIsCropping(false);
    try {
      await updateAppSetting('creator_photo', croppedImage);
      setPhoto(croppedImage);
      toast.success("Foto profil berhasil diperbarui!");
    } catch (err) {
      toast.error("Gagal menyimpan foto.");
    } finally {
      setUploading(false);
      setTempImage(null);
    }
  };

  return (
    <>
      <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-16 md:mt-32 border-t border-slate-100 pt-12 md:pt-24"
    >
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-[2.5rem] md:rounded-[3.5rem] p-7 md:p-14 border border-slate-100 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-700">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-400/5 blur-[100px] -mr-40 -mt-40 transition-all group-hover:bg-teal-400/10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-400/5 blur-[100px] -ml-40 -mb-40 transition-all group-hover:bg-rose-400/10" />
        
        <div className="relative flex flex-col items-center gap-10 text-center">
          {/* Avatar / Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 md:w-36 md:h-36 bg-slate-900 rounded-[2.2rem] md:rounded-[2.8rem] flex items-center justify-center text-white shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500 overflow-hidden border-4 border-white">
              {photo ? (
                <img src={photo} alt="Muhammad Hadi" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl md:text-5xl font-display font-black tracking-tighter">MH</span>
              )}

              {isAdmin && (
                <label className="absolute inset-0 bg-slate-900/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                  {uploading ? (
                    <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 md:w-6 md:h-6 mb-1" />
                      <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest">Update</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                </label>
              )}
            </div>
            <div className="absolute -inset-3 bg-gradient-to-br from-teal-500 to-rose-500 rounded-[3rem] md:rounded-[3.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-white p-2 md:p-2.5 rounded-xl md:rounded-2xl shadow-xl border border-slate-50 z-20">
              <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-teal-600" />
            </div>
          </div>

          <div className="w-full max-w-2xl space-y-10 md:space-y-12">
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <span className="text-[9px] md:text-[10px] font-black text-teal-700 uppercase tracking-[0.3em] bg-teal-50 px-5 py-2 rounded-full border border-teal-100 shadow-sm inline-block">Designer Komunitas</span>
                <h3 className="text-4xl md:text-6xl font-display font-black text-slate-900 tracking-tight leading-none">Muhammad Hadi</h3>
                <div className="flex flex-col items-center">
                  <p className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-[0.2em] max-w-xs md:max-w-none leading-relaxed">
                    Koordinator Umum
                  </p>
                  <p className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
                    TurunTangan Banjarmasin
                  </p>
                  <p className="text-[9px] md:text-[10px] font-black text-teal-600/80 uppercase tracking-widest mt-2 px-3 py-1 bg-teal-50 rounded-full border border-teal-100/50 inline-block">
                    Periode 2026/2027
                  </p>
                </div>
              </div>
              
              <div className="relative px-6 pt-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent rounded-full" />
                <p className="text-slate-600 text-sm md:text-xl leading-relaxed font-medium italic max-w-xl mx-auto">
                  "CommunityOS dirancang bukan sekadar untuk efisiensi, tapi untuk memastikan setiap relawan pulang dengan energi yang tetap terjaga."
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0">
              <a 
                href="https://www.instagram.com/mhdmd.hd?igsh=NmI5NHhlZnhiMmc1" 
                target="_blank" 
                rel="noreferrer"
                className="group/btn w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-slate-100/50 hover:border-rose-500 hover:text-rose-600 active:scale-95"
              >
                <Instagram className="w-5 h-5 text-[#E4405F] group-hover/btn:scale-110 transition-transform" />
                <span>Instagram</span>
              </a>
              <a 
                href="https://www.linkedin.com/in/mhdmdhd99" 
                target="_blank" 
                rel="noreferrer"
                className="group/btn w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl text-xs font-bold transition-all hover:border-[#0A66C2] hover:text-[#0A66C2] active:scale-95 shadow-lg shadow-slate-100/50"
              >
                <Linkedin className="w-5 h-5 text-[#0A66C2] group-hover/btn:scale-110 transition-transform" />
                <span>LinkedIn</span>
              </a>
            </div>

            <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Made in Banjarmasin</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Taktis & Grounded</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
      
      {tempImage && (
        <ImageCropper
          image={tempImage}
          isOpen={isCropping}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setIsCropping(false);
            setTempImage(null);
          }}
          aspectRatio={1}
        />
      )}
    </>
  );
};
