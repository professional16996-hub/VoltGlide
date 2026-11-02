import React, { useState } from 'react';
import { WHATSAPP_NUMBER, getWhatsAppUrl, DISPLAY_PHONE } from '../utils/whatsapp.ts';
import { X, Send, Sparkles } from 'lucide-react';

export const WhatsAppIconSVG: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M16 2a13.9 13.9 0 0 0-12 21L2 30l7.2-1.9A14 14 0 1 0 16 2zm0 25.5a11.5 11.5 0 0 1-5.9-1.6l-.4-.3-4.3 1.1 1.2-4.2-.3-.4A11.5 11.5 0 1 1 16 27.5zm6.3-8.6c-.3-.2-2-.9-2.3-1s-.6-.2-.8.2-.9 1-1.1 1.3-.4.3-.7.1a9.2 9.2 0 0 1-2.7-1.7 10.1 10.1 0 0 1-1.9-2.3c-.2-.3 0-.5.1-.7s.3-.4.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5s-.8-1.9-1-2.6c-.3-.7-.6-.6-.8-.6h-.7c-.3 0-.7.1-1 .4a4.3 4.3 0 0 0-1.3 3.2c0 1.9 1.4 3.7 1.6 3.9.2.3 2.7 4.1 6.5 5.8 3.8 1.6 3.8 1.1 4.5 1 .7 0 2.2-.9 2.5-1.7.3-.9.3-1.6.2-1.8s-.3-.2-.6-.4z"
    />
  </svg>
);

export const FloatingWhatsApp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  const quickPrompts = [
    'Hi! I want to check scooty availability and delivery time.',
    'What are the monthly installment plans available?',
    'Can I book a test ride at your showroom?',
    'I want to order a scooty with Cash on Delivery.'
  ];

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const text = customMsg.trim() || 'Hello VoltGlide Motors! I need assistance with a scooty.';
    window.open(getWhatsAppUrl(text), '_blank');
    setCustomMsg('');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Quick Chat Popup Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-[#0f172a] rounded-2xl shadow-2xl border border-emerald-500/30 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* WhatsApp Header */}
          <div className="bg-gradient-to-r from-[#128C7E] to-[#25D366] p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 p-1 flex items-center justify-center">
                <WhatsAppIconSVG className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-wide">VoltGlide Scooty Hub</h4>
                <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></span>
                  <span>Online • Instant Reply</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-black/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="p-4 bg-[#0b0f19] text-xs space-y-3 max-h-80 overflow-y-auto">
            <div className="bg-slate-800/90 text-slate-200 p-3 rounded-2xl rounded-tl-none border border-slate-700/80 max-w-[90%] shadow">
              <p className="font-medium text-slate-100 mb-1">
                Assalam-o-Alaikum! 👋
              </p>
              <p>
                Welcome to VoltGlide Scooty Hub! How can we assist you today? You can order directly or choose a quick topic below:
              </p>
              <span className="block text-[10px] text-slate-400 mt-1 text-right">0321-0424424</span>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Quick Inquiries:
              </p>
              {quickPrompts.map((prompt, idx) => (
                <a
                  key={idx}
                  href={getWhatsAppUrl(prompt)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-left p-2 rounded-xl bg-slate-900/90 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 transition-all font-medium text-[11px]"
                >
                  {prompt}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Input Form */}
          <form onSubmit={handleSendCustom} className="p-3 bg-[#0a0f1d] border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="flex-1 bg-slate-900 text-xs text-white placeholder-slate-500 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="bg-[#25D366] hover:bg-[#20ba59] text-white p-2 rounded-xl flex items-center justify-center transition-colors shadow-lg"
              title="Send to WhatsApp"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <div className="relative group">
        {/* Pulse halo */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none"></span>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#128C7E] via-[#25D366] to-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/40 cursor-pointer"
          aria-label="Contact on WhatsApp 03210424424"
          title="WhatsApp 03210424424"
        >
          <WhatsAppIconSVG className="w-8 h-8 text-white drop-shadow-md" />
        </button>
      </div>
    </div>
  );
};
