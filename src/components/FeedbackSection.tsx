import React from 'react';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FeedbackSection: React.FC = () => {
  const [rating, setRating] = React.useState<number>(0);
  const [hoveredRating, setHoveredRating] = React.useState<number>(0);
  const [feedback, setFeedback] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
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
          <h3 className="text-xl font-display font-extrabold text-teal-900">Terima Kasih!</h3>
          <p className="text-sm text-teal-700/70 font-medium">Feedback Anda membantu Community<span className="text-teal-600">OS</span> menjadi lebih baik.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-display font-extrabold text-slate-800">Bantu Kami Berkembang</h3>
        <p className="text-sm text-slate-500 font-medium">Seberapa membantu blueprint ini untuk kegiatan Anda?</p>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none transition-transform active:scale-90"
          >
            <Star 
              className={`w-8 h-8 ${
                (hoveredRating || rating) >= star 
                  ? 'fill-amber-400 text-amber-400' 
                  : 'text-slate-200'
              } transition-colors duration-200`}
            />
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Kesan & Saran (Opsional)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Apa yang bisa kami tingkatkan?"
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all placeholder:text-slate-300 text-sm italic min-h-[100px] resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={rating === 0 || loading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-teal-600 disabled:bg-slate-200 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-slate-100"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Kirim Feedback</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
};
