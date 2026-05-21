import React from 'react';
import { Download, Sparkles, MapPin, Share2, HelpCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const SocialPreviewGenerator: React.FC = () => {
  const [title, setTitle] = React.useState('CommunityOS — AI Operating System for Communities');
  const [subtitle, setSubtitle] = React.useState('Rancang blueprint taktis, sederhanakan manajemen operasional, dan jaga wellbeing energi relawan.');
  const [location, setLocation] = React.useState('Banjarmasin, Indonesia');
  const [scaleLabel, setScaleLabel] = React.useState('Community Scale');
  const [logoType, setLogoType] = React.useState<'communityos' | 'custom'>('communityos');
  const [customLogoText, setCustomLogoText] = React.useState('K');
  const [brandingName, setBrandingName] = React.useState('C O M M U N I T Y O S   P L A T F O R M');
  const [brandingTagline, setBrandingTagline] = React.useState('Operating System for Communities');
  
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const drawCanvas = (downloadMode: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Standard high-res dimensions (1200x630 fits standard Open Graph 1.91:1 ratio)
    const width = 1200;
    const height = 630;
    
    canvas.width = width;
    canvas.height = height;

    // 1. Background Gradient (Soft warm off-white to clean teal backdrop)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#fafaf9'); // stone-50
    gradient.addColorStop(0.5, '#ffffff'); // pure white
    gradient.addColorStop(1, '#f0fdfa'); // teal-50
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw community connecting nodes (Geometric network overlay)
    ctx.strokeStyle = 'rgba(13, 148, 136, 0.08)'; // teal-600/8%
    ctx.lineWidth = 2.5;
    
    const nodes = [
      { x: 100, y: 150 }, { x: 220, y: 120 }, { x: 300, y: 250 },
      { x: 180, y: 380 }, { x: 450, y: 180 }, { x: 850, y: 120 },
      { x: 1050, y: 200 }, { x: 1100, y: 450 }, { x: 920, y: 500 },
      { x: 750, y: 320 }, { x: 380, y: 520 }, { x: 600, y: 550 }
    ];

    // Connect node lines
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (dist < 320) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw solid node dots
    nodes.forEach((n, idx) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, idx % 3 === 0 ? 8 : 4, 0, Math.PI * 2);
      ctx.fillStyle = idx % 3 === 0 ? 'rgba(13, 148, 136, 0.2)' : 'rgba(244, 63, 94, 0.1)'; // teal vs rose dot
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(n.x, n.y, idx % 3 === 0 ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = idx % 3 === 0 ? '#0d9488' : '#f43f5e';
      ctx.fill();
    });

    // 3. Draw Brand Badge / Logo
    const logoX = 100;
    const logoY = 80;
    const size = 100; // Shield bounding box

    if (logoType === 'communityos') {
      ctx.save();
      ctx.translate(logoX, logoY);

      // Background subtle fill (rgba(204, 251, 241, 0.4))
      ctx.beginPath();
      ctx.moveTo(50, 8);
      ctx.lineTo(13, 24);
      ctx.lineTo(13, 46);
      ctx.bezierCurveTo(13, 71, 29, 86, 50, 96);
      ctx.bezierCurveTo(71, 86, 87, 71, 87, 46);
      ctx.lineTo(87, 24);
      ctx.closePath();
      ctx.fillStyle = 'rgba(204, 251, 241, 0.4)';
      ctx.fill();

      // Outer Shield Line (#0D9488 with strokeWidth 4.5)
      ctx.beginPath();
      ctx.moveTo(50, 8);
      ctx.lineTo(13, 24);
      ctx.lineTo(13, 46);
      ctx.bezierCurveTo(13, 71, 29, 86, 50, 96);
      ctx.bezierCurveTo(71, 86, 87, 71, 87, 46);
      ctx.lineTo(87, 24);
      ctx.closePath();
      ctx.strokeStyle = '#0D9488';
      ctx.lineWidth = 4.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Inner decorative network shield with opacity 0.7
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(50, 19);
      ctx.lineTo(24, 31);
      ctx.lineTo(24, 49);
      ctx.bezierCurveTo(24, 67, 34, 78, 50, 85);
      ctx.bezierCurveTo(66, 78, 76, 67, 76, 49);
      ctx.lineTo(76, 31);
      ctx.closePath();
      ctx.strokeStyle = '#0D9488';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();

      // Connecting Network Lines
      ctx.beginPath();
      ctx.moveTo(50, 8); ctx.lineTo(50, 19);
      ctx.moveTo(13, 24); ctx.lineTo(24, 31);
      ctx.moveTo(87, 24); ctx.lineTo(76, 31);
      ctx.moveTo(13, 46); ctx.lineTo(24, 49);
      ctx.moveTo(87, 46); ctx.lineTo(76, 49);
      ctx.strokeStyle = '#0D9488';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Center 'C' representing Community
      ctx.beginPath();
      ctx.moveTo(63, 41);
      ctx.bezierCurveTo(57, 32, 43, 32, 37, 41);
      ctx.bezierCurveTo(31, 50, 31, 62, 37, 71);
      ctx.bezierCurveTo(43, 80, 57, 80, 63, 71);
      ctx.strokeStyle = '#0F766E';
      ctx.lineWidth = 6.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Network Nodes (Circles) Outer shield
      ctx.fillStyle = '#0F766E';
      ctx.beginPath(); ctx.arc(50, 8, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(50, 96, 3.5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#0D9488';
      ctx.beginPath(); ctx.arc(13, 24, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(87, 24, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(13, 46, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(87, 46, 3, 0, Math.PI * 2); ctx.fill();

      // Inner C nodes
      ctx.fillStyle = '#0F766E';
      ctx.beginPath(); ctx.arc(63, 41, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(63, 71, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(33.5, 56, 5, 0, Math.PI * 2); ctx.fill();

      // Center core connection
      ctx.fillStyle = '#0D9488';
      ctx.beginPath(); ctx.arc(50, 56, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(38.5, 56);
      ctx.lineTo(47, 56);
      ctx.strokeStyle = '#0D9488';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(logoX, logoY);

      // Elegant blue custom shield background
      ctx.beginPath();
      ctx.moveTo(size / 2, size * 0.08); // 50, 8
      ctx.lineTo(size * 0.13, size * 0.24); // 13, 24
      ctx.lineTo(size * 0.13, size * 0.46); // 13, 46
      ctx.quadraticCurveTo(size * 0.13, size * 0.71, size / 2, size * 0.96); 
      ctx.quadraticCurveTo(size * 0.87, size * 0.71, size * 0.87, size * 0.46); 
      ctx.lineTo(size * 0.87, size * 0.24); 
      ctx.closePath();
      ctx.fillStyle = '#f0fdfa'; // light teal/white fill
      ctx.fill();

      ctx.strokeStyle = '#0d9488'; // teal outer
      ctx.lineWidth = 4.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Inner minor border
      ctx.beginPath();
      ctx.moveTo(50, 19);
      ctx.lineTo(24, 31);
      ctx.lineTo(24, 49);
      ctx.bezierCurveTo(24, 67, 34, 78, 50, 85);
      ctx.bezierCurveTo(66, 78, 76, 67, 76, 49);
      ctx.lineTo(76, 31);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Render custom initial text in the center
      ctx.fillStyle = '#0f766e'; // teal-800
      ctx.font = 'bold 36px "Inter", ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(customLogoText.toUpperCase(), 50, 54);

      ctx.restore();
    }

    // 5. Title & Tagline Branding
    ctx.fillStyle = '#0d9488'; // teal branding color
    ctx.font = '900 14px "Inter", ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(brandingName.toUpperCase(), 230, 115);

    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.font = 'bold 36px "Inter", ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(brandingTagline, 230, 160);

    // 6. Draw central Divider Bar
    const devGrad = ctx.createLinearGradient(100, 220, 1100, 220);
    devGrad.addColorStop(0, '#0d9488');
    devGrad.addColorStop(0.5, '#f43f5e');
    devGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = devGrad;
    ctx.fillRect(100, 220, 1000, 4);

    // 7. Write Main User-Customized Title (Bold display font)
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.font = '800 48px "Inter", ui-sans-serif, sans-serif';
    
    // Handle title wrapping up to 2 lines
    const titleWords = title.split(' ');
    let line = '';
    let titleY = 300;
    const maxTitleWidth = 1000;
    
    for (let n = 0; n < titleWords.length; n++) {
      const testLine = line + titleWords[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxTitleWidth && n > 0) {
        ctx.fillText(line, 100, titleY);
        line = titleWords[n] + ' ';
        titleY += 60;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 100, titleY);

    // 8. Write Subtitle (Description with wrap support)
    ctx.fillStyle = '#475569'; // slate-600
    ctx.font = '500 24px "Inter", ui-sans-serif, sans-serif';
    
    let subY = titleY + 65;
    const subWords = subtitle.split(' ');
    let subLine = '';
    const maxSubWidth = 1000;

    for (let i = 0; i < subWords.length; i++) {
      const testSub = subLine + subWords[i] + ' ';
      const metricsSub = ctx.measureText(testSub);
      if (metricsSub.width > maxSubWidth && i > 0) {
        ctx.fillText(subLine, 100, subY);
        subLine = subWords[i] + ' ';
        subY += 34;
      } else {
        subLine = testSub;
      }
    }
    ctx.fillText(subLine, 100, subY);

    // 9. Write Meta Bottom badging: Location & Scale badge
    const bottomY = 560;

    // Location badge
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(115, bottomY - 8, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 18px "Inter", ui-sans-serif, sans-serif';
    ctx.fillText(location.toUpperCase(), 135, bottomY - 2);

    // Scale badge (Teal pill)
    const scaleText = scaleLabel.toUpperCase();
    ctx.font = 'bold 18px "Inter", ui-sans-serif, sans-serif';
    const textWidth = ctx.measureText(scaleText).width;

    ctx.fillStyle = '#f0fdfa';
    ctx.fillRect(1000 - textWidth, bottomY - 26, textWidth + 30, 36);
    
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1000 - textWidth, bottomY - 26, textWidth + 30, 36);

    ctx.fillStyle = '#0f766e';
    ctx.fillText(scaleText, 1015 - textWidth, bottomY - 2);

    // Wellbeing Guaranteed branding
    ctx.fillStyle = '#f43f5e'; // rose logo key
    ctx.font = '900 16px "Inter", ui-sans-serif, sans-serif';
    ctx.fillText('WELLBEING SHIELD ACTIVE', 100, bottomY + 30);
  };

  React.useEffect(() => {
    drawCanvas();
  }, [title, subtitle, location, scaleLabel, logoType, customLogoText, brandingName, brandingTagline]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Gagal menyusun gambar.");
      return;
    }
    
    // Ensure accurate re-draw before download
    drawCanvas(true);

    try {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'og-image.png';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Berhasil mengunduh `og-image.png`! Silakan ganti `/public/og-image.png` Anda.");
    } catch (e) {
      toast.error("Terjadi kesalahan mendownload gambar.");
    }
  };

  const handleSyncOgImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Pratinjau gambar belum siap.");
      return;
    }

    setIsSyncing(true);
    drawCanvas(true);

    try {
      const url = canvas.toDataURL('image/png');
      const response = await fetch('/api/save-og-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: url }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Sukses! og-image.png berhasil diperbarui di server dan siap didistribusikan.");
      } else {
        throw new Error(data.error || "Terjadi kesalahan di server.");
      }
    } catch (e: any) {
      toast.error(`Gagal sinkronisasi: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm space-y-8 max-w-4xl mx-auto mt-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1.5 text-left w-full md:max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-teal-100">
            <Sparkles className="w-3 h-3" />
            Social Media Branding Kit
          </div>
          <h4 className="text-xl font-display font-black text-slate-900 tracking-tight">
            Pembuat & Ekspor OG Image Instan
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sesuaikan draf visual, buat preview tautan medsos mandiri, lalu unduh atau langsung simpan/sinkronkan ke server secara otomatis tanpa batas kuota AI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            onClick={handleSyncOgImage}
            disabled={isSyncing}
            className={`flex-1 sm:w-auto sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all border ${
              isSyncing 
                ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:text-emerald-800'
            } active:scale-95 uppercase tracking-wider`}
            title="Simpan langsung ke /public/og-image.png"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyimpan...' : 'Simpan ke Server'}</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="flex-1 sm:w-auto sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-100 hover:shadow-xl active:scale-95 uppercase tracking-wider"
          >
            <Download className="w-4 h-4" />
            <span>Unduh PNG</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Settings */}
        <div className="space-y-4 text-left">
          {/* Custom Identity Section */}
          <div className="bg-teal-50/50 border border-teal-100 relative overflow-hidden rounded-2xl p-4 space-y-4">
            <h5 className="text-[10px] font-extrabold text-teal-800 uppercase tracking-widest">Identitas & Logo Komunitas</h5>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-teal-700 uppercase tracking-widest pl-1">Jenis Logo</label>
                <select
                  value={logoType}
                  onChange={(e) => setLogoType(e.target.value as 'communityos' | 'custom')}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-teal-100 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800"
                >
                  <option value="communityos">Logo Perisai C (CommunityOS)</option>
                  <option value="custom">Logo Kustom Relawan</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-teal-700 uppercase tracking-widest pl-1">Inisial Logo (Kustom)</label>
                <input
                  type="text"
                  maxLength={4}
                  disabled={logoType !== 'custom'}
                  value={customLogoText}
                  onChange={(e) => setCustomLogoText(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-teal-100 bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800"
                  placeholder="Contoh: GDG"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-teal-700 uppercase tracking-widest pl-1">Slogan Banner Atas</label>
                <input
                  type="text"
                  value={brandingName}
                  onChange={(e) => setBrandingName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-teal-100 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800"
                  placeholder="Contoh: COMMUNITYOS PLATFORM"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-teal-700 uppercase tracking-widest pl-1">Tagline Sub-banner</label>
                <input
                  type="text"
                  value={brandingTagline}
                  onChange={(e) => setBrandingTagline(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-teal-100 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800"
                  placeholder="Contoh: Operating System for Communities"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Judul / Slogan Utama</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800"
              placeholder="Judul Open Graph..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Deskripsi / Ringkasan</label>
            <textarea
              value={subtitle}
              rows={3}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 resize-none leading-relaxed"
              placeholder="Deskripsi..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Kota / Lokasi</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800"
                placeholder="Lokasi..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Label Skala (Badge)</label>
              <select
                value={scaleLabel}
                onChange={(e) => setScaleLabel(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800"
              >
                <option value="Gerilya Scale">Gerilya Scale</option>
                <option value="Community Scale">Community Scale</option>
                <option value="Regional Scale">Regional Scale</option>
                <option value="Massive Scale">Massive Scale</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex gap-3 text-[11px] leading-relaxed text-slate-500">
            <Share2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-700">Cara Sinkronisasi Medsos Preview:</p>
              <ol className="list-decimal list-inside space-y-1 mt-1 text-slate-500 font-medium">
                <li>Sesuaikan identitas, judul, dan deskripsi di atas sesuai kebutuhan Anda.</li>
                <li>Klik tombol <strong className="text-emerald-700">Simpan ke Server</strong> untuk langsung memperbarui berkas <code className="bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded">/public/og-image.png</code> web secara otomatis tanpa perlu unggah manual!</li>
                <li>Atau klik <strong className="text-teal-600">Unduh PNG</strong> untuk menyimpan di penyimpanan lokal perangkat Anda kapan pun Anda mau.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Live Canvas Preview */}
        <div className="flex flex-col justify-center items-center space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center self-start pl-1">
            Live Preview (Peta Skala 1:2)
          </p>
          <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-auto aspect-[1.91/1] shadow-lg rounded-xl border border-slate-200/50 bg-white"
            />
          </div>
          <p className="text-[10px] text-slate-400 text-center flex items-center gap-1.5 italic font-medium">
            <HelpCircle className="w-3 h-3" /> Ukuran asli saat diunduh adalah 1200 x 630 piksel (Rekomendasi Facebook/Meta/WhatsApp).
          </p>
        </div>
      </div>
    </div>
  );
};
