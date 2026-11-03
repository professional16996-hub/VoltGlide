import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { WhatsAppIconSVG } from '../components/FloatingWhatsApp.tsx';
import { getWhatsAppUrl } from '../utils/whatsapp.ts';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  TrendingDown,
  Sparkles,
  PhoneCall,
  Clock,
  Star,
  Fuel,
  BatteryCharging,
  Layers,
  ChevronRight
} from 'lucide-react';
import { CategoryType } from '../types.ts';

export const HomePage: React.FC = () => {
  const { products, banners, reviews, navigate, setSelectedCategory, restoreDemoProducts } = useApp();
  const [activeTab, setActiveTab] = useState<CategoryType>('All');

  // Filter products by active tab
  const filteredProducts = activeTab === 'All'
    ? products
    : products.filter(p => p.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="space-y-16 w-full max-w-full overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[580px] lg:min-h-[680px] flex items-center justify-center overflow-hidden border-b border-slate-800">
        
        {/* Background Image with Dark Electric Blue Gradients */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_scooty_neon_1793645413607.jpg"
            alt="VoltGlide Scooty in Night City"
            className="w-full h-full object-cover object-center filter brightness-[0.45] contrast-110 scale-105"
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070b14] via-[#070b14]/85 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-black/70"></div>
          
          {/* Subtle Electric Neon Orbs */}
          <div className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl space-y-6">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/60 border border-cyan-400/30 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Pakistan's Premier Scooty Dealership • Electric & Petrol</span>
            </div>

            {/* Powerful Headline explicitly requested */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight font-heading">
              Ride Your Dreams,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-white">
                Enjoy Your Freedom.
              </span>
            </h1>

            {/* Short Business Introduction explicitly requested */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              VoltGlide is Pakistan’s leading destination for modern electric and high-mileage petrol scooters. Engineered for urban commuters, students, and professionals seeking effortless efficiency, zero fuel costs on EV models, and unmatched street style.
            </p>

            {/* Action Buttons: Shop Now and Explore Scooties */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  navigate('scooties');
                }}
                className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-blue-500/30 flex items-center gap-2 transform hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setSelectedCategory('Electric');
                  navigate('scooties');
                }}
                className="py-3.5 px-7 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-400 font-bold text-sm backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 text-cyan-400" />
                Explore Scooties
              </button>
            </div>

            {/* Quick Hero Value Metrics */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div>
                <p className="text-2xl font-black text-cyan-400 font-heading">0%</p>
                <p className="text-xs text-slate-400">Petrol Cost on EVs</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white font-heading">120 KM</p>
                <p className="text-xs text-slate-400">Max Single Charge</p>
              </div>
              <div>
                <p className="text-2xl font-black text-cyan-400 font-heading">3 YEARS</p>
                <p className="text-xs text-slate-400">Motor & Battery Cover</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white font-heading">FREE</p>
                <p className="text-xs text-slate-400">Doorstep Delivery</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. PROMOTIONAL BANNERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`p-6 rounded-2xl bg-gradient-to-br ${banner.bgGradient} border border-slate-800 hover:border-cyan-500/50 shadow-xl transition-all duration-300 flex flex-col justify-between group`}
            >
              <div className="space-y-3">
                <span className="inline-block px-2.5 py-1 rounded-md bg-blue-500/20 text-cyan-300 font-extrabold text-[10px] tracking-wider uppercase border border-cyan-500/30">
                  {banner.tag}
                </span>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors font-heading">
                  {banner.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {banner.subtitle}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-white/10">
                {banner.ctaLink.startsWith('http') ? (
                  <a
                    href={banner.ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-white transition-colors"
                  >
                    {banner.ctaText}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      if (banner.ctaLink.includes('Electric')) {
                        setSelectedCategory('Electric');
                      }
                      navigate('scooties');
                    }}
                    className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {banner.ctaText}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED & LATEST SCOOTY MODELS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Showroom Showcase</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              Featured & Latest Scooty Models
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              From zero-emission smart electric rides to high-mileage Honda and Vespa classics. Fully tested, registered, and ready for delivery.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(['All', 'Electric', 'Petrol', 'Sports', 'City', 'Kids'] as CategoryType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-cyan-400'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab === 'Electric' && '⚡ '}
                {tab === 'Petrol' && '⛽ '}
                {tab === 'All' ? 'All Models' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
            <p className="text-white font-bold text-base">No Scooties currently visible in "{activeTab}"</p>
            <p className="text-slate-400 text-xs">Tap below to display all verified demo scooties.</p>
            <button
              onClick={() => {
                setActiveTab('All');
                restoreDemoProducts();
              }}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              Show All Demo Scooties
            </button>
          </div>
        )}

        {/* View All Button */}
        <div className="text-center pt-6">
          <button
            onClick={() => {
              setSelectedCategory('All');
              navigate('scooties');
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 hover:border-cyan-400 transition-all cursor-pointer shadow-lg"
          >
            <span>View All {products.length} Scooties & Compare</span>
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </section>

      {/* 4. ELECTRIC VS PETROL COMPARISON HIGHLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#0d1527] via-[#090e1a] to-[#0d1527] border border-blue-500/30 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
              COMMUTER SAVINGS CALCULATOR
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-heading">
              Why Switch to VoltGlide Electric Scooty in Pakistan?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              With petrol prices at record highs, an electric scooty charges for just PKR 40-60 on your standard home socket and runs up to 90 km. The average commuter saves over PKR 18,000 every month!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-2">
                  <Fuel className="w-4 h-4" />
                  Regular Petrol Scooty
                </div>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li>• Monthly fuel expense: ~PKR 20,000 - 25,000</li>
                  <li>• Regular oil filter & tuning charges</li>
                  <li>• Noise, vibration & tailpipe emissions</li>
                </ul>
              </div>

              <div className="bg-blue-950/40 p-4 rounded-xl border border-cyan-500/40 shadow-inner">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-2">
                  <BatteryCharging className="w-4 h-4" />
                  VoltGlide Electric Scooty
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li>• Monthly electricity expense: <strong className="text-emerald-400">~PKR 1,500</strong></li>
                  <li>• Zero engine oil changes or spark plug repairs</li>
                  <li>• 100% silent, vibration-free, smooth cruise</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <button
                onClick={() => {
                  setSelectedCategory('Electric');
                  navigate('scooties');
                }}
                className="py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/30 flex items-center gap-2 cursor-pointer"
              >
                Explore EV Models
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={getWhatsAppUrl('Hello VoltGlide! Can you calculate my monthly savings if I switch from petrol bike to an electric scooty?')}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center gap-2 shadow"
              >
                <WhatsAppIconSVG className="w-4 h-4 text-white" />
                Ask On WhatsApp (0321-0424424)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CUSTOMER REVIEWS & RATINGS PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>Real Customer Feedback</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              Trusted by 1,500+ Happy Riders Across Pakistan
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Sample verified reviews from customers in Lahore, Karachi, Islamabad and Faisalabad.
            </p>
          </div>

          <button
            onClick={() => navigate('reviews')}
            className="text-xs font-bold text-cyan-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View All Reviews & Submit Yours</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map((review) => (
            <div
              key={review.id}
              className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{review.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{review.customerName}</h4>
                  <span className="text-[10px] text-slate-400">{review.city}</span>
                </div>
                {review.productName && (
                  <span className="text-[10px] font-semibold text-cyan-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900">
                    {review.productName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CALL TO ACTION SHOWROOM BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-black p-8 sm:p-12 text-center text-white border border-blue-500/40 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-3xl font-black font-heading">
              Ready to Experience the Ride?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Book a free test ride at our Lahore, Karachi, or Islamabad showrooms, or place an order via WhatsApp with free doorstep delivery and cash on delivery!
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <a
                href={getWhatsAppUrl('Hello VoltGlide! I want to book a free test ride at your showroom.')}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 px-8 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm shadow-xl flex items-center gap-2"
              >
                <WhatsAppIconSVG className="w-5 h-5 text-white" />
                Book Test Ride on WhatsApp
              </a>
              <button
                onClick={() => navigate('contact')}
                className="py-3.5 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700"
              >
                View Showrooms & Contact
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
