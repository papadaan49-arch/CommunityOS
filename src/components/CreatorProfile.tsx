import React from 'react';
import { motion } from 'motion/react';
import { Instagram, Linkedin, Heart, ShieldCheck, Camera, Megaphone, BarChart3, Globe, Users, Coins, Trash2, Send, Layers } from 'lucide-react';
import { getAppSetting, updateAppSetting, getAllOrgProfiles, OrganizationProfile } from '../services/dbService';
import { toast } from 'sonner';

import { ADMIN_EMAILS } from '../constants/admins';
import { SocialPreviewGenerator } from './SocialPreviewGenerator';

interface Props {
  userEmail?: string | null;
}

export const CreatorProfile: React.FC<Props> = ({ userEmail }) => {
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const isAdmin = !!userEmail && ADMIN_EMAILS.includes(userEmail); 

  const [broadcastInput, setBroadcastInput] = React.useState('');
  const [currentBroadcast, setCurrentBroadcast] = React.useState<string | null>(null);
  const [versionInput, setVersionInput] = React.useState('Beta');
  const [currentVersion, setCurrentVersion] = React.useState('Beta');
  const [globalOrgs, setGlobalOrgs] = React.useState<OrganizationProfile[]>([]);
  const [loadingOrgs, setLoadingOrgs] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'broadcast' | 'analytics'>('broadcast');
  const [resetting, setResetting] = React.useState(false);

  React.useEffect(() => {
    loadProfilePhoto();
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const loadProfilePhoto = async () => {
    const savedPhoto = await getAppSetting('creator_photo');
    if (savedPhoto) setPhoto(savedPhoto);
  };

  const loadAdminData = async () => {
    setLoadingOrgs(true);
    try {
      const [activeMsg, activeVersion] = await Promise.all([
        getAppSetting('community_broadcast'),
        getAppSetting('app_version')
      ]);
      if (activeMsg) {
        setCurrentBroadcast(activeMsg);
        setBroadcastInput(activeMsg);
      }
      if (activeVersion) {
        setCurrentVersion(activeVersion);
        setVersionInput(activeVersion);
      }
      const profiles = await getAllOrgProfiles();
      setGlobalOrgs(profiles);
    } catch (err) {
      console.error("Admin data loading failed", err);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleResetAndRecalculate = async () => {
    setResetting(true);
    toast.info("Sedang menyisir blueprint & menyelaraskan dashboard dampak nasional...");
    try {
      const { recalculateAndSyncOrganizationStats } = await import('../services/dbService');
      const success = await recalculateAndSyncOrganizationStats();
      if (success) {
        toast.success("✅ Sukses menyapu data lama! Semua statistik kini rill bersumber dari event terlaksana.");
        await loadAdminData();
      } else {
        toast.error("Gagal membersihkan data lama.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi galat teknis saat pembersihan.");
    } finally {
      setResetting(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastInput.trim()) {
      toast.error("Isi pesan pengumuman terlebih dahulu.");
      return;
    }
    try {
      await updateAppSetting('community_broadcast', broadcastInput);
      setCurrentBroadcast(broadcastInput);
      toast.success("Pengumuman resmi disiarkan ke seluruh pengurus & relawan!");
    } catch (err) {
      toast.error("Gagal mengirim pengumuman.");
    }
  };

  const handleUpdateVersion = async () => {
    if (!versionInput.trim()) {
      toast.error("Isi nomor versi terlebih dahulu.");
      return;
    }
    try {
      await updateAppSetting('app_version', versionInput.trim());
      setCurrentVersion(versionInput.trim());
      toast.success(`Versi aplikasi berhasil diupdate ke ${versionInput.trim()}! Silakan refresh halaman untuk melihat perubahan.`);
    } catch (err) {
      toast.error("Gagal mengupdate versi aplikasi.");
    }
  };

  const handleClearBroadcast = async () => {
    try {
      await updateAppSetting('community_broadcast', '');
      setCurrentBroadcast(null);
      setBroadcastInput('');
      toast.success("Pengumuman berhasil dihentikan / dihapus.");
    } catch (err) {
      toast.error("Gagal menghapus pengumuman.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2000000) {
      toast.error("Ukuran foto terlalu besar. Gunakan foto di bawah 2MB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        await updateAppSetting('creator_photo', base64);
        setPhoto(base64);
        toast.success("Foto profil diperbarui!");
      } catch (err) {
        toast.error("Gagal menyimpan foto.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
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
                <span className="text-[9px] md:text-[10px] font-black text-teal-700 uppercase tracking-[0.3em] bg-teal-50 px-5 py-2 rounded-full border border-teal-100 shadow-sm inline-block">Community Architect</span>
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
      {isAdmin && (
        <div className="mt-12 bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm space-y-8 max-w-4xl mx-auto text-left">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-teal-100">
                <ShieldCheck className="w-3 h-3" />
                Pusat Kontrol Gerakan (Admin Hub)
              </div>
              <h4 className="text-xl font-display font-black text-slate-900 tracking-tight">
                CommunityOS Workspace Console
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kelola siaran pengumuman real-time untuk seluruh relawan dan pantau metrik pertumbuhan aktivitas komunitas di Indonesia secara agregat.
              </p>
            </div>
            
            {/* Tab Toggles */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('broadcast')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'broadcast'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Siaran</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Dampak</span>
              </button>
            </div>
          </div>

          {activeTab === 'broadcast' ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Pengumuman & Siaran Pengurus (Real-Time Broadcast Message)
                </label>
                <textarea
                  value={broadcastInput}
                  onChange={(e) => setBroadcastInput(e.target.value)}
                  rows={3}
                  maxLength={250}
                  className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800 resize-none leading-relaxed"
                  placeholder="Ketik pengumuman atau anjuran untuk seluruh relawan di sini... (Maks 250 karakter)"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
                <span className="text-[10px] text-slate-400 font-medium pl-1 italic">
                  *Akan otomatis muncul di banner atas aplikasi semua relawan yang membuka platform ini.
                </span>
                <div className="flex gap-2 self-end">
                  {currentBroadcast && (
                    <button
                      type="button"
                      onClick={handleClearBroadcast}
                      className="flex items-center gap-1.5 px-4 py-2 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Siaran
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSendBroadcast}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Siarkan Sekarang
                  </button>
                </div>
              </div>

              {currentBroadcast && (
                <div className="mt-2 p-4 rounded-2xl bg-teal-50/50 border border-teal-100/60 leading-relaxed text-xs text-teal-800">
                  <span className="font-extrabold uppercase tracking-wider text-[9px] text-teal-600 block mb-1">Status Siaran Aktif:</span>
                  "{currentBroadcast}"
                </div>
              )}

              {/* Version Controller Settings */}
              <div className="pt-5 border-t border-slate-100/80 space-y-3 text-left">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1">
                    Sistem Operasi Versi (Dynamic OS Version)
                  </label>
                  <p className="text-[10px] text-slate-400 pl-1 mb-2">
                    Ubah label versi aplikasi secara instan (contoh: <code>Beta</code>, <code>1.2</code>, <code>2.0-Beta</code>).
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={versionInput}
                    onChange={(e) => setVersionInput(e.target.value)}
                    maxLength={15}
                    placeholder="Contoh: Beta, 1.2, 2.0-beta"
                    className="flex-1 w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleUpdateVersion}
                    className="flex items-center justify-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
                  >
                    Simpan Versi
                  </button>
                </div>
                {currentVersion && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 leading-normal text-[11px] text-slate-600">
                    <span className="font-bold uppercase tracking-wider text-[8px] text-slate-400 block mb-0.5">Versi Aktif Saat Ini di Header:</span>
                    <span className="font-bold text-slate-700">AI OS </span>
                    <span className="font-extrabold text-teal-600">
                      {currentVersion.toLowerCase() === 'beta' ? 'Beta' : `Ver. ${currentVersion}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Aggregated Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Globe className="w-4 h-4 text-teal-600" />
                    <span className="text-[9px] font-bold tracking-wider uppercase">Lembaga</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 mt-2">{globalOrgs.length}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <span className="text-[9px] font-bold tracking-wider uppercase">Event Aktif</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 mt-2">
                    {globalOrgs.reduce((acc, curr) => acc + (curr.totalEvents || 0), 0)}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span className="text-[9px] font-bold tracking-wider uppercase">Total Relawan</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 mt-2">
                    {globalOrgs.reduce((acc, curr) => acc + (curr.totalParticipants || 0), 0).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Coins className="w-4 h-4 text-teal-600" />
                    <span className="text-[9px] font-bold tracking-wider uppercase">Total Rencana Dana</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 mt-2 text-ellipsis overflow-hidden">
                    Rp {globalOrgs.reduce((acc, curr) => acc + (curr.totalBudget || 0), 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* List of Registered Organizations */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pl-1">
                  <h5 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    Daftar Ekosistem Komunitas Aktif
                  </h5>
                  <button
                    type="button"
                    onClick={handleResetAndRecalculate}
                    disabled={resetting || loadingOrgs}
                    className="self-start sm:self-center bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100/60 rounded-xl px-2.5 py-1.5 text-[9px] font-black tracking-widest uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {resetting ? (
                      <>
                        <div className="w-2.5 h-2.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                        <span>Mereset...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset & Sinkronisasi Riil 🔄</span>
                      </>
                    )}
                  </button>
                </div>
                {loadingOrgs ? (
                  <p className="text-xs text-slate-400 italic pl-1">Memuat data ekosistem...</p>
                ) : globalOrgs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic pl-1">Belum ada profil gerakan terdaftar di database.</p>
                ) : (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-inner max-h-[250px] overflow-y-auto">
                    {globalOrgs.map((org) => (
                      <div key={org.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                        <div className="space-y-1 text-left">
                          <p className="font-extrabold text-slate-800 text-sm">{org.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                            Wilayah: {org.locations?.join(', ') || 'Kalimantan Selatan'}
                          </p>
                        </div>
                        <div className="flex gap-4 text-right">
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gelar Acara</p>
                            <p className="font-black text-slate-700">{org.totalEvents || 1} Kali</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audiens</p>
                            <p className="font-black text-teal-600">{(org.totalParticipants || 0).toLocaleString('id-ID')} Jiwa</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {isAdmin && <SocialPreviewGenerator />}
    </motion.div>
  );
};
