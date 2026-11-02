import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Zap, ShieldCheck, MapPin, Truck, Award, Users, CheckCircle2 } from 'lucide-react';
import { getWhatsAppUrl, DISPLAY_PHONE } from '../utils/whatsapp.ts';
import { WhatsAppIconSVG } from '../components/FloatingWhatsApp.tsx';

export const AboutPage: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="bg-blue-600/20 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full border border-cyan-500/30 uppercase tracking-wider">
          ABOUT VOLTGLIDE SCOOTY HUB
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
          Revolutionizing Everyday Urban Mobility Across Pakistan
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Founded with a clear vision: to empower commuters, students, and professionals in Pakistan with ultra-reliable, fuel-free electric scooties and premium commuter motorbikes.
        </p>
      </div>

      {/* Story & Image Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white font-heading">
            Our Mission: Ride Your Dreams, Enjoy Your Freedom
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            In Pakistan, fuel prices have surged while congested traffic makes cars and bulky vehicles impractical. VoltGlide is the modern answer. We curate the highest-spec electric scooters featuring waterproof brushless motors, automotive-grade lithium batteries, and smart digital consoles that charge on standard 220V home wall outlets.
          </p>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Alongside our cutting-edge electric models, we maintain authorized stock of renowned Japanese and Italian petrol legends—including Honda Activa and Vespa Primavera—ensuring that every rider finds their perfect partner on the road.
          </p>

          <div className="pt-2 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>3 Showrooms Across Pakistan</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>3 Years Battery Warranty</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>100% Genuine Spare Parts</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Free Doorstep Delivery</span>
            </div>
          </div>
        </div>

        <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
          <img
            src="/images/electric_scooty_blue_1793645309587.jpg"
            alt="VoltGlide Showroom Experience"
            className="w-full h-96 object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
            <p className="text-xs font-bold text-white">VoltGlide Flagship Experience Center</p>
            <p className="text-[11px] text-slate-400">Main Boulevard, Gulberg III, Lahore, Pakistan</p>
          </div>
        </div>
      </div>

      {/* Showroom Locations */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h3 className="text-2xl font-bold text-white font-heading">Our Showrooms & Dealerships</h3>
          <p className="text-xs text-slate-400">
            Visit us in person for a free test ride, financing consultation, and immediate handover.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Lahore Central Showroom</h4>
              <p className="text-xs text-slate-400 mt-1">
                Plot 18-A, Main Boulevard, Gulberg III (Near Siddiq Trade Center & Kalma Chowk)
              </p>
              <p className="text-xs text-cyan-300 font-mono mt-2">Tel: 0321-0424424</p>
            </div>
          </div>

          <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Karachi Coastal Center</h4>
              <p className="text-xs text-slate-400 mt-1">
                Suite 4, Commercial Avenue, DHA Phase 6 / Shahrah-e-Faisal, Karachi
              </p>
              <p className="text-xs text-cyan-300 font-mono mt-2">Tel: 0321-0424424</p>
            </div>
          </div>

          <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Islamabad Capital Hub</h4>
              <p className="text-xs text-slate-400 mt-1">
                Block 8-C, Jinnah Avenue, Blue Area, Islamabad
              </p>
              <p className="text-xs text-cyan-300 font-mono mt-2">Tel: 0321-0424424</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-8 rounded-3xl text-center border border-blue-500/30 space-y-4 shadow-xl">
        <h3 className="text-2xl font-bold text-white font-heading">Have Questions Before You Buy?</h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Our bike advisors are ready 7 days a week to guide you on battery longevity, charging time, registration process, and installment plans.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <a
            href={getWhatsAppUrl('Hello VoltGlide! I want to speak with a showroom representative.')}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center gap-2 shadow"
          >
            <WhatsAppIconSVG className="w-4 h-4 text-white" />
            Chat on WhatsApp ({DISPLAY_PHONE})
          </a>
          <button
            onClick={() => navigate('scooties')}
            className="py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700"
          >
            Browse Scooties
          </button>
        </div>
      </div>

    </div>
  );
};
