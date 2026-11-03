import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { getWhatsAppUrl, DISPLAY_PHONE } from '../utils/whatsapp.ts';
import { WhatsAppIconSVG } from '../components/FloatingWhatsApp.tsx';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { sendContactMessage } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Scooty Purchase Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) return;

    setIsSubmitting(true);
    const ok = await sendContactMessage({
      name,
      phone,
      email,
      subject,
      message
    });

    setIsSubmitting(false);
    if (ok) {
      setSubmitted(true);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 w-full max-w-full overflow-x-hidden">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
          GET IN TOUCH
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-heading">
          Contact VoltGlide Scooty Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Have an inquiry regarding prices, home delivery, or installment plans? Send us a message or chat immediately on WhatsApp at <strong className="text-emerald-400 font-mono">0321-0424424</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contact Information & WhatsApp Box */}
        <div className="space-y-6">
          
          {/* Quick WhatsApp Card */}
          <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 rounded-3xl p-6 border border-emerald-500/40 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-emerald-900/50">
                <WhatsAppIconSVG className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Direct WhatsApp Support</h3>
                <p className="text-xs text-emerald-300">Instant response 7 days a week</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Order any scooty, ask for video walk-arounds, or get bank installment sheets directly in chat.
            </p>

            <a
              href={getWhatsAppUrl('Hello VoltGlide! I want to inquire about scooty models and pricing.')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.01]"
            >
              <WhatsAppIconSVG className="w-4 h-4 text-white" />
              Chat on WhatsApp ({DISPLAY_PHONE})
            </a>
          </div>

          {/* Details */}
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 space-y-4 text-xs">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Showroom Contact Info</h4>
            
            <div className="flex items-start gap-3 text-slate-300">
              <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-500 text-[11px]">Primary Hotline</p>
                <p className="font-bold text-white font-mono text-sm">{DISPLAY_PHONE}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-300">
              <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-500 text-[11px]">Email Support</p>
                <p className="font-semibold text-white">support@voltglide.com / sales@voltglide.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-300">
              <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-500 text-[11px]">Working Hours</p>
                <p className="font-medium text-white">Monday - Saturday: 10:00 AM - 9:00 PM</p>
                <p className="text-slate-400">Sunday: 2:00 PM - 8:00 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-300 pt-2 border-t border-slate-800">
              <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-500 text-[11px]">Primary Showroom</p>
                <p className="font-medium text-white">Main Boulevard, Gulberg III, Lahore, Pakistan</p>
              </div>
            </div>
          </div>

        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-[#0f172a] rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white font-heading">
                Send an Online Inquiry
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Fill in the form below and our bike specialist will call or WhatsApp you within 30 minutes.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white font-heading">Inquiry Received!</h4>
                <p className="text-xs text-slate-300">
                  Thank you for reaching out. One of our sales advisors is reviewing your request and will connect via WhatsApp or phone shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-2 py-2 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tariq Mehmood"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">WhatsApp Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0300-1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="tariq@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400 text-xs"
                    >
                      <option value="Scooty Purchase Inquiry">Scooty Purchase Inquiry</option>
                      <option value="Installment Plan Details">Installment Plan Details</option>
                      <option value="Book Showroom Test Ride">Book Showroom Test Ride</option>
                      <option value="Electric Battery / Warranty Question">Electric Battery / Warranty Question</option>
                      <option value="Dealership / Wholesale">Dealership / Wholesale</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Message or Requirements *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us which scooty model you are interested in, your city, and any questions you have..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
