import React from 'react';
import { ThumbsUp, ThumbsDown, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FeedbackSection: React.FC = () => {
  const [reaction, setReaction] = React.useState<'up' | 'down' | null>(null);
  const [feedback, setFeedback] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reaction) return;
    
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-teal-50 border border-teal-100 p-8 rounded-[2rem] text-center space-y-4"
      >
        <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-teal-200">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-display font-bold text-teal-900">Terima Kasih! 🙌</h3>
          <p className="text-sm text-teal-700/70 font-medium leading-relaxed">Feedback operasional kamu membantu CommunityOS terus berkembang.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <section className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-slate-100 space-y-10">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-teal-600">
          <MessageSquare className="w-5 h-5" />
          <h3 className="text-xl font-display font-bold text-slate-800">Evaluasi Operational</h3>
        </div>
        <p className="text-base text-slate-500 font-medium leading-relaxed italic">"Apakah blueprint ini cukup realistis untuk dijalankan?"</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setReaction('up')}
          className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all active:scale-95 ${
            reaction === 'up' 
              ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-lg shadow-teal-100' 
              : 'bg-white border-slate-50 text-slate-400 hover:border-teal-200 hover:text-teal-600'
          }`}
        >
          <ThumbsUp className={`w-8 h-8 ${reaction === 'up' ? 'fill-teal-700' : ''}`} />
          <span className="text-xs font-bold uppercase tracking-widest">Membantu</span>
        </button>
        
        <button
          type="button"
          onClick={() => setReaction('down')}
          className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all active:scale-95 ${
            reaction === 'down' 
              ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-lg shadow-rose-100' 
              : 'bg-white border-slate-50 text-slate-400 hover:border-rose-200 hover:text-rose-600'
          }`}
        >
          <ThumbsDown className={`w-8 h-8 ${reaction === 'down' ? 'fill-rose-700' : ''}`} />
          <span className="text-xs font-bold uppercase tracking-widest">Kurang Relevan</span>
        </button>
      </div>

      <AnimatePresence>
        {reaction && (
          <motion.form 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                {reaction === 'up' ? 'Apa yang paling membantu?' : 'Bagian mana yang kurang realistis?'}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Berikan masukan singkat kamu..."
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all placeholder:text-slate-300 text-sm italic min-h-[120px] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-teal-600 disabled:bg-slate-200 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-slate-100 text-sm uppercase tracking-widest"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Kirim Feedback</span>
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
};

