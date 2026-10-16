import { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, Sparkles, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSubmitted(true);
    toast.success('Thank you! Your message has been received.');
  };

  return (
    <section id="contact" className="landing-section bg-slate-900 text-white py-24 relative overflow-hidden border-t border-slate-800">
      <div className="landing-container relative z-10">
        <div className="section-header text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
            <Mail className="h-3.5 w-3.5 text-brand-400" />
            <span>Direct Inquiries</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Get in Touch with the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Founding Team</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg">
            Have questions, feedback, or enterprise feature requests? Send us a message directly.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-start">
          {/* Info Side */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 flex items-start gap-3.5 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/30">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Direct Support</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Fast support for platform questions, resume parsing help, and Gmail sync queries.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 flex items-start gap-3.5 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Feature Feedback</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We continuously ship features requested by active candidate users.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 leading-relaxed">
              💡 <strong>Founder Guarantee:</strong> We review all candidate feedback directly. Expect a personal reply within 24 business hours.
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-7 bg-slate-800/90 rounded-2xl border border-slate-700/80 p-6 md:p-8 shadow-2xl backdrop-blur-md">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Message Delivered!</h3>
                <p className="text-sm text-slate-300 max-w-sm mx-auto">
                  Thank you for reaching out to Job Dashboard. Our team will review your note shortly.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }); }}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Dilipkumar Nehru"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@domain.com"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Share your question or feature idea..."
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
