import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Coffee, Upload, Camera, Check, ExternalLink } from 'lucide-react';
import { getAppSetting, updateAppSetting } from '../services/dbService';
import { toast } from 'sonner';
import { ImageCropper } from './ImageCropper';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export const DonationModal: React.FC<Props> = ({ isOpen, onClose, userEmail }) => {
  const [qrisImage, setQrisImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [isCropping, setIsCropping] = React.useState(false);
  const [tempImage, setTempImage] = React.useState<string | null>(null);
  const isAdmin = !!userEmail;

  React.useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    const savedQris = await getAppSetting('donation_qris');
    if (savedQris) {
      setQrisImage(savedQris);
    }
    setLoading(false);
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
      await updateAppSetting('donation_qris', croppedImage);
      setQrisImage(croppedImage);
      toast.success("QRIS berhasil diperbarui! Terima kasih atas dukungannya.");
    } catch (err) {
      toast.error("Gagal menyimpan QRIS.");
    } finally {
      setUploading(false);
      setTempImage(null);
    }
  };

  return (
    <>
      <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden"
          >
            <div className="absolute top-6 right-6 z-10">
              <button 
                onClick={onClose}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 md:p-10">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 shadow-inner">
                  <Coffee className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900">
                    Traktir Kopi CommunityOS ☕
                  </h2>
                  <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                    Setiap dukungan kecil membantu kami menjaga sistem AI tetap stabil dan terus mengembangkan fitur Wellbeing Guard untuk kita semua.
                  </p>
                </div>

                <div className="w-full relative group">
                  <div className="aspect-square w-64 mx-auto bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center overflow-hidden relative">
                    {loading ? (
                      <div className="animate-pulse flex flex-col items-center gap-3">
                        <div className="w-32 h-32 bg-slate-200 rounded-2xl" />
                        <div className="w-24 h-4 bg-slate-100 rounded-full" />
                      </div>
                    ) : qrisImage ? (
                      <img src={qrisImage} alt="QRIS Donation" className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="text-center p-6 space-y-3">
                        <Camera className="w-10 h-10 text-slate-200 mx-auto" />
                        <p className="text-xs font-medium text-slate-400">QRIS belum diunggah</p>
                      </div>
                    )}

                    {isAdmin && (
                      <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-xs font-bold uppercase tracking-widest">Update QRIS</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                    )}
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-[2rem]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Mengunggah...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex flex-col gap-3 w-full">
                  <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    Dukungan Anda Terjaga
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed text-center italic">
                    "Gotong royong digital untuk ekosistem komunitas yang lebih sehat."
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 flex items-center justify-center gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terima Kasih, Pejuang Komunitas!</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
      {tempImage && (
        <ImageCropper
          image={tempImage}
          isOpen={isCropping}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setIsCropping(false);
            setTempImage(null);
          }}
          aspectRatio={1} // QRIS is usually square or near square, let's keep it 1 for consistency or maybe 3/4? 1 is safer for QR codes.
        />
      )}
    </>
  );
};
