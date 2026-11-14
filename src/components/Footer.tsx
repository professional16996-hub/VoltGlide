import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Zap, MapPin, Phone, Mail, Clock, ShieldCheck, Youtube, Instagram, Facebook, Globe } from 'lucide-react';
import { getWhatsAppUrl } from '../utils/whatsapp.ts';
import { WhatsAppIconSVG } from './FloatingWhatsApp.tsx';

export const Footer: React.FC = () => {
  const { navigate, setSelectedCategory, settings } = useApp();

  const phone = settings?.phone || '0321-0424424';
  const whatsappNum = settings?.whatsappNumber || '03210424424';
  const email = settings?.email || 'sales@voltglide.com';
  const workingHours = settings?.workingHours || 'Mon - Sat: 10:00 AM - 9:00 PM | Sunday: 2:00 PM - 8:00 PM';
  const footerText = settings?.footerText || 'VoltGlide Scooty Hub is Pakistan\'s premier destination for cutting-edge electric scooties and dependable petrol scooters.';
  const socials = settings?.socialLinks || {};

  return (
    <footer className="bg-[#080a11] border-t border-white/[0.08] text-slate-400 text-xs mt-16 w-full max-w-full overflow-x-hidden">
      
      {/* Top Value Banner */}
      <div className="border-b border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] text-cyan-400 flex items-center justify-center border border-white/[0.08]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-sm">EV Green Revolution</h5>
              <p className="text-[11px] text-slate-400">Zero petrol cost, fast home charging</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] text-cyan-400 flex items-center justify-center border border-white/[0.08]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-sm">Official Brand Warranty</h5>
              <p className="text-[11px] text-slate-400">Up to 3 years battery & motor cover</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <WhatsAppIconSVG className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h5 className="font-bold text-white text-sm">Instant WhatsApp Orders</h5>
              <p className="text-[11px] text-slate-400">Direct booking at {phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-sm">Nationwide Delivery</h5>
              <p className="text-[11px] text-slate-400">Free delivery in LHR, KHI, ISB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Info & Social Media Links */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onClick={() => navigate('home')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 p-0.5 shadow-md">
                <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                </div>
              </div>
              <span className="text-xl font-extrabold text-white font-heading tracking-tight">
                VOLT<span className="text-cyan-400">GLIDE</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {footerText}
            </p>

            {/* Social Media Channels (Configured via Admin Panel) */}
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Follow Us & Official Channels:</p>
              <div className="flex items-center flex-wrap gap-2.5">
                {/* WhatsApp */}
                <a
                  href={socials.whatsapp || getWhatsAppUrl('Hello VoltGlide! I want to inquire about a scooty.', whatsappNum)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/30 text-emerald-400 border border-[#25D366]/40 flex items-center justify-center transition-all hover:scale-105"
                  title="WhatsApp Channel"
                >
                  <WhatsAppIconSVG className="w-4 h-4" />
                </a>

                {/* YouTube */}
                {socials.youtube && (
                  <a
                    href={socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-rose-600/15 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 flex items-center justify-center transition-all hover:scale-105"
                    title="YouTube Channel"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}

                {/* Instagram */}
                {socials.instagram && (
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-pink-600/15 hover:bg-pink-600/30 text-pink-400 border border-pink-500/40 flex items-center justify-center transition-all hover:scale-105"
                    title="Instagram Profile"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}

                {/* Facebook */}
                {socials.facebook && (
                  <a
                    href={socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center transition-all hover:scale-105"
                    title="Facebook Page"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}

                {/* TikTok */}
                {socials.tiktok && (
                  <a
                    href={socials.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-cyan-600/15 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/40 flex items-center justify-center transition-all hover:scale-105"
                    title="TikTok Account"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={getWhatsAppUrl('Hello VoltGlide! I would like to chat with a sales representative.', whatsappNum)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-emerald-300 hover:bg-[#25D366]/30 text-xs font-bold transition-colors"
              >
                <WhatsAppIconSVG className="w-4 h-4 text-emerald-400" />
                <span>{phone} (WhatsApp Helpline)</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h5 className="text-white font-bold text-sm font-heading tracking-wide">Quick Links</h5>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigate('home')} className="hover:text-cyan-400 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    navigate('scooties');
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  All Scooties
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('Electric');
                    navigate('scooties');
                  }}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Electric Scooties
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('Petrol');
                    navigate('scooties');
                  }}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Petrol Scooters
                </button>
              </li>
              <li>
                <button onClick={() => navigate('analysis')} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  4-Type Analysis & ROI
                </button>
              </li>
              <li>
                <button onClick={() => navigate('about')} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  About Our Brand
                </button>
              </li>
              <li>
                <button onClick={() => navigate('reviews')} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Customer Reviews
                </button>
              </li>
              <li>
                <button onClick={() => navigate('contact')} className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Showroom Addresses in Pakistan */}
          <div className="space-y-3">
            <h5 className="text-white font-bold text-sm font-heading tracking-wide">Showrooms</h5>
            <ul className="space-y-2.5 text-[11px]">
              {settings?.showrooms && settings.showrooms.length > 0 ? (
                settings.showrooms.map((sh, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white block">{sh.title || sh.city}:</strong>
                      {sh.address}
                    </span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white block">Lahore Showroom:</strong>
                      Main Boulevard, Gulberg III, Near Siddiq Trade Center
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white block">Karachi Center:</strong>
                      Plot 14-C, Shahrah-e-Faisal / DHA Phase 6
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white block">Islamabad Branch:</strong>
                      Block 8-C, Jinnah Avenue, Blue Area
                    </span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact Details & Working Hours */}
          <div className="space-y-3">
            <h5 className="text-white font-bold text-sm font-heading tracking-wide">Help & Hours</h5>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-white">{phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300">{email}</span>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="whitespace-pre-line leading-relaxed">
                  {workingHours}
                </span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => navigate('admin-login')}
                  className="text-slate-500 hover:text-cyan-400 transition-colors text-[10px] underline"
                >
                  Admin Portal Access
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 mt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500">
            © {new Date().getFullYear()} VoltGlide Scooty Hub Pakistan. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span>Cash on Delivery</span> • <span>Bank Transfer / Raast</span> • <span>Easy Installments</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
