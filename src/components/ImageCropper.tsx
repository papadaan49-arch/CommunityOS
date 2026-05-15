import React, { useState, useCallback, useRef } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  isOpen: boolean;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

const getCroppedImg = (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No 2d context'));
        return;
      }

      // Set canvas size to the cropped pixel size
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    image.onerror = (error) => reject(error);
  });
};

export const ImageCropper: React.FC<ImageCropperProps> = ({
  image,
  isOpen,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = async () => {
    if (croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels);
        onCropComplete(croppedImage);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-lg font-display font-black text-slate-900 tracking-tight">Sesuaikan Gambar</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Geser dan perbesar untuk menyesuaikan</p>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-[350px] md:h-[450px] bg-slate-100">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={onCropChange}
                onCropComplete={onCropCompleteInternal}
                onZoomChange={onZoomChange}
              />
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-6">
                <ZoomOut className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => onZoomChange(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <ZoomIn className="w-4 h-4 text-slate-400" />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-6 py-4 border-2 border-slate-100 text-slate-600 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleCrop}
                  className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
