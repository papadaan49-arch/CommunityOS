import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, X, Shield, Mail, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addCollaborator, getBlueprintFromCloud } from '../services/dbService';
import { auth } from '../lib/firebase';

interface Props {
  blueprintId: string;
}

export const CollaboratorsManager: React.FC<Props> = ({ blueprintId }) => {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [collaborators, setCollaborators] = React.useState<string[]>([]);
  const [isOwner, setIsOwner] = React.useState(false);

  const fetchCollaborators = async () => {
    const doc = await getBlueprintFromCloud(blueprintId);
    if (doc) {
      setCollaborators(doc.collaborators);
      setIsOwner(doc.ownerId === auth.currentUser?.uid);
    }
  };

  React.useEffect(() => {
    fetchCollaborators();
  }, [blueprintId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error("Masukkan email yang valid.");
      return;
    }

    setLoading(true);
    try {
      await addCollaborator(blueprintId, email.trim().toLowerCase());
      toast.success(`${email} ditambahkan ke tim!`);
      setEmail('');
      fetchCollaborators();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan teman tim.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
          <Users className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h3 className="text-lg font-display font-semibold text-slate-800">Kolaborasi Tim</h3>
          <p className="text-xs text-slate-400 font-medium italic">Undang panitia lain untuk melihat dan mengubah blueprint ini.</p>
        </div>
      </div>

      {isOwner && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email panitia..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-200 transition-all font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>Undang</span>
          </button>
        </form>
      )}

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Anggota Tim Terdaftar</p>
        <div className="space-y-1.5">
          {collaborators.length === 0 ? (
            <div className="p-4 bg-slate-50/50 border border-slate-100 border-dashed rounded-xl text-center">
              <p className="text-xs text-slate-400 font-medium italic">Belum ada kolaborator. Blueprint ini masih bersifat privat.</p>
            </div>
          ) : (
            collaborators.map((userId) => (
              <div key={userId} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">User ID: {userId.substring(0, 8)}...</p>
                    <p className="text-[10px] text-teal-600 font-medium">Collaborator</p>
                  </div>
                </div>
                <Check className="w-4 h-4 text-teal-500" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
