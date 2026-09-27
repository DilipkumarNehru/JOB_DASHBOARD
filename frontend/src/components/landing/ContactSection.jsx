import { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';

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
    // Simulate a brief delay — no backend contact endpoint currently exists
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <section id="contact" className="landing-section bg-white">
      <div className="landing-container">
        <div className="section-header">
          <div className="section-badge">Contact</div>
          <h2 className="section-heading">
            Get in{' '}
            <span className="section-heading-accent">Touch</span>
          </h2>
          <p className="section-subtext">
            Have a question or feedback about JOB DASHBOARD? Send us a message.
          </p>
        </div>

        <div className="contact-grid">
          {/* Info side */}
          <div className="contact-info-col">
            <div className="contact-info-card">
              <div className="contact-icon-wrapper">
                <Mail className="h-6 w-6 text-brand-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Email</h3>
                <p className="text-sm text-slate-500 mt-1">
                  For questions and support, use the contact form on this page.
                </p>
              </div>
            </div>
            <div className="contact-info-card">
              <div className="contact-icon-wrapper">
                <MessageSquare className="h-6 w-6 text-brand-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Feedback</h3>
                <p className="text-sm text-slate-500 mt-1">
                  We welcome product feedback and feature suggestions from users.
                </p>
              </div>
            </div>
            <div className="contact-notice">
              <p className="text-xs text-slate-500">
                <strong>Note:</strong> The contact form currently collects your message on the
                frontend. Backend email delivery functionality can be enabled by connecting
                an email service (e.g. SendGrid, Nodemailer) to the backend API.
              </p>
            </div>
          </div>

          {/* Form side */}
          <div className="contact-form-card">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
                <h3 className="text-lg font-semibold text-slate-900">Message Received!</h3>
                <p className="text-sm text-slate-500">
                  Thank you for reaching out. We will get back to you shortly.
                </p>
                <button
                  className="landing-btn-primary mt-2"
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }); }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="contact-name" className="contact-label">Name</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="contact-input"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="contact-label">Email</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="contact-input"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="contact-label">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Write your question or feedback here…"
                    className="contact-input resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="landing-btn-primary w-full flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
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
