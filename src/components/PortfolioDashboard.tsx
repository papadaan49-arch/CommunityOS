import React from 'react';
import { motion } from 'motion/react';
import { Building2, Users, Zap, BarChart3, MapPin, Calendar, TrendingUp, Share2, Award, Heart, Plus } from 'lucide-react';
import { OrganizationProfile, getOrgProfiles, getUserStats } from '../services/dbService';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';

interface Props {
  targetOrgId?: string | null;
}

export const PortfolioDashboard: React.FC<Props> = ({ targetOrgId }) => {
  const [orgs, setOrgs] = React.useState<OrganizationProfile[]>([]);
  const [userStats, setUserStats] = React.useState({ totalBlueprints: 0, totalParticipants: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (targetOrgId) {
      // Public view of a specific org
      import('firebase/firestore').then(async ({ doc, getDoc }) => {
        const { db } = await import('../lib/firebase');
        const snap = await getDoc(doc(db, 'organizations', targetOrgId));
        if (snap.exists()) {
          setOrgs([{ id: snap.id, ...snap.data() } as OrganizationProfile]);
        }
        setLoading(false);
      });
    } else {
      Promise.all([
        getOrgProfiles(),
        getUserStats()
      ]).then(([orgData, stats]) => {
        setOrgs(orgData);
        setUserStats(stats);
        setLoading(false);
      });
    }
  }, [targetOrgId]);

  const handleShare = (org: OrganizationProfile) => {
    const url = `${window.location.origin}?orgId=${org.id}`;
    navigator.clipboard.writeText(url);
    toast.success(`Link portofolio ${org.name} disalin!`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-6 h-6 border-2 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menganalisis Pertumbuhan...</span>
    </div>
  );

  if (orgs.length === 0) return (
    <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm space-y-6">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
        <Building2 className="w-8 h-8 text-slate-300" />
      </div>
      <div className="space-y-2">
        <h4 className="text-xl font-display font-bold text-slate-900 leading-tight">Belum Ada Portofolio</h4>
        <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed italic">
          "Setiap langkah kecil adalah benih perubahan."
        </p>
      </div>
      {!targetOrgId && (
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Mulai rancang blueprint kegiatan Anda di halaman utama. CommunityOS akan mendata pertumbuhan dampak Anda secara otomatis.
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-12 mt-8">
      {/* User Personal Impact Card - Only show in private view */}
      {!targetOrgId && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] p-8 md:p-12 text-slate-900 relative overflow-hidden border border-slate-200 shadow-sm"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/[0.03] rounded-full -mr-32 -mt-32" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-xl">
                {auth.currentUser?.photoURL ? (
                  <img src={auth.currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-3xl font-display font-black text-slate-300">
                    {auth.currentUser?.displayName?.charAt(0) || 'R'}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-slate-100">
                <Award className="w-5 h-5 text-teal-600" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-5">
              <div className="space-y-1">
                <h2 className="text-3xl font-display font-black tracking-tight text-slate-900">
                  {auth.currentUser?.displayName || 'Relawan'}
                </h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="text-teal-600 font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 bg-teal-50 rounded-full border border-teal-100">Pilar Pergerakan</span>
                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100">Portfolio Aktif</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 md:gap-12 pt-2">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Blueprint</span>
                  <span className="text-3xl font-display font-black text-slate-800">{userStats.totalBlueprints}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Impact Reach</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-display font-black text-teal-600">
                      {userStats.totalParticipants >= 1000 ? `${(userStats.totalParticipants/1000).toFixed(1)}rb` : userStats.totalParticipants}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-tight text-slate-300">Jiwa</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Dedikasi</span>
                  <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg inline-block">
                    {userStats.totalBlueprints >= 5 ? 'Elite Planner' : 'Active Contributor'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col items-center text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">
          <BarChart3 className="w-3 h-3" />
          {targetOrgId ? 'Portofolio Publik' : 'Portofolio & Dampak Komunitas'}
        </div>
        <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">
          {targetOrgId ? 'Ekosistem Perubahan' : 'Kekuatan Kolektif Anda'}
        </h3>
        <p className="text-sm text-slate-500 max-w-md italic">"Data berbicara tentang dedikasi yang telah Anda berikan di lapangan."</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orgs.map((org) => (
          <motion.div
            key={org.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-500 relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xl font-display font-bold text-slate-900 group-hover:text-teal-600 transition-colors">{org.name}</h4>
                    <button 
                      onClick={() => handleShare(org)}
                      className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <MapPin className="w-3 h-3 text-teal-500" />
                    {org.locations.length} Lokasi Perjuangan
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                    <Zap className="w-3 h-3 text-teal-500" />
                    Kegiatan
                  </div>
                  <p className="text-xl font-display font-black text-slate-800">{org.totalEvents}</p>
                </div>
                <div className="space-y-1 border-x border-slate-100 px-4">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                    <Users className="w-3 h-3 text-teal-500" />
                    Peserta
                  </div>
                  <p className="text-xl font-display font-black text-slate-800">
                    {org.totalParticipants >= 1000 ? `${(org.totalParticipants/1000).toFixed(1)}rb` : org.totalParticipants}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                    <TrendingUp className="w-3 h-3 text-teal-500" />
                    Ekosistem
                  </div>
                  <p className="text-xl font-display font-black text-slate-800">{Object.keys(org.eventTypes).length}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Distribusi Dampak</span>
                  <span className="text-teal-600">Terakhir: {new Date(org.lastActive?.toDate()).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(org.eventTypes).map(([type, count]) => (
                    <span 
                      key={type}
                      className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-bold border border-slate-100/50"
                    >
                      {type} ({count})
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (org.totalEvents / 10) * 100)}%` }}
                    className="h-full bg-teal-500"
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-2 text-right uppercase tracking-widest">
                  Evolution Progress: {org.totalEvents >= 10 ? 'Elite Scale' : 'Growth Scale'}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
