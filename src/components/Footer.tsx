import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Zap, MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from 'lucide-react';
import { getWhatsAppUrl, DISPLAY_PHONE } from '../utils/whatsapp.ts';
import { WhatsAppIconSVG } from './FloatingWhatsApp.tsx';

export const Footer: React.FC = () => {
  const { navigate, setSelectedCategory } = useApp();

  return (
    <footer className="bg-[#070b14] border-t border-slate-800 text-slate-400 text-xs mt-16">
      
      {/* Top Value Banner */}
      <div className="border-b border-slate-800/80 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-sm">EV Green Revolution</h5>
              <p className="text-[11px] text-slate-400">Zero petrol cost, fast home charging</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
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
              <p className="text-[11px] text-slate-400">Direct booking at 0321-0424424</p>
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
          
          {/* Brand Info */}
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
              VoltGlide Scooty Hub is Pakistan's premier destination for cutting-edge electric scooties and dependable petrol scooters. Offering premium comfort, unmatched fuel economy, and full spare-parts backing across the country.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={getWhatsAppUrl('Hello VoltGlide! I would like to chat with a sales representative.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-emerald-300 hover:bg-[#25D366]/30 text-xs font-bold transition-colors"
              >
                <WhatsAppIconSVG className="w-4 h-4 text-emerald-400" />
                <span>0321-0424424 (WhatsApp)</span>
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
                <button onClick={() => navigate('about')} className="hover:text-cyan-400 transition-colors">
                  About Our Brand
                </button>
              </li>
              <li>
                <button onClick={() => navigate('reviews')} className="hover:text-cyan-400 transition-colors">
                  Customer Reviews
                </button>
              </li>
              <li>
                <button onClick={() => navigate('contact')} className="hover:text-cyan-400 transition-colors">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Showroom Addresses in Pakistan */}
          <div className="space-y-3">
            <h5 className="text-white font-bold text-sm font-heading tracking-wide">Showrooms</h5>
            <ul className="space-y-2.5 text-[11px]">
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
            </ul>
          </div>

          {/* Contact Details & Working Hours */}
          <div className="space-y-3">
            <h5 className="text-white font-bold text-sm font-heading tracking-wide">Help & Hours</h5>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-white">{DISPLAY_PHONE}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300">sales@voltglide.com</span>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>
                  Mon - Sat: 10:00 AM - 9:00 PM<br />
                  Sunday: 2:00 PM - 8:00 PM
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
