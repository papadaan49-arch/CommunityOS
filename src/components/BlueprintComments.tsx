import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Trash2, User, Clock } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { BlueprintComment, postComment } from '../services/dbService';
import { toast } from 'sonner';

interface Props {
  blueprintId: string;
}

export const BlueprintComments: React.FC<Props> = ({ blueprintId }) => {
  const [comments, setComments] = React.useState<BlueprintComment[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const commentsRef = collection(db, 'blueprints', blueprintId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlueprintComment[];
      setComments(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `blueprints/${blueprintId}/comments`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [blueprintId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    if (!auth.currentUser) {
      toast.error("Masuk terlebih dahulu untuk berdiskusi.");
      return;
    }

    setIsSubmitting(true);
    try {
      await postComment(blueprintId, newComment.trim());
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Hapus komentar ini?")) return;

    try {
      await deleteDoc(doc(db, 'blueprints', blueprintId, 'comments', commentId));
      toast.success("Komentar dihapus");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `blueprints/${blueprintId}/comments/${commentId}`);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Baru saja';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-xl font-display font-semibold text-slate-800">Ruang Diskusi Kolaborator</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none italic">
            "Berbagi masukan taktis untuk eksekusi yang lebih solid"
          </p>
        </div>
      </div>

      <div className="bg-slate-50/50 rounded-[2.5rem] p-6 md:p-8 space-y-8 border border-slate-100">
        <div className="space-y-6 max-h-[500px] overflow-y-auto px-2 scroll-smooth custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Diskusi...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border border-slate-100 text-slate-200">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-400 italic">Belum ada diskusi di sini.</p>
                <p className="text-[10px] text-slate-300 font-medium uppercase tracking-tight">Jadilah yang pertama memberikan masukan!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`flex flex-col gap-2 max-w-[85%] ${comment.authorId === auth.currentUser?.uid ? 'ml-auto items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 px-1">
                      {comment.authorId !== auth.currentUser?.uid && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{comment.authorName}</span>
                      )}
                      <span className="text-[8px] font-medium text-slate-300 flex items-center gap-1">
                        <Clock className="w-2 h-2" />
                        {formatDate(comment.createdAt)}, {formatTime(comment.createdAt)}
                      </span>
                    </div>

                    <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm relative group ${
                      comment.authorId === auth.currentUser?.uid 
                        ? 'bg-teal-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                    }`}>
                      {comment.text}
                      
                      {comment.authorId === auth.currentUser?.uid && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Tulis masukan taktis Anda di sini..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-200 transition-all font-medium placeholder:text-slate-300"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-300 transition-all active:scale-95 shadow-lg shadow-teal-200 disabled:shadow-none"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>

      <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-4">
        <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-800 leading-relaxed italic font-medium">
          <strong>Budaya Kolaborasi:</strong> Gunakan ruang ini untuk koordinasi teknis yang humanis. Hindari debat kusir, utamakan efektivitas operasional.
        </p>
      </div>
    </div>
  );
};
