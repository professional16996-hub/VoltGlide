import React from 'react';
import { Product } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';
import { formatPKR, calculateDiscountPercent } from '../utils/formatters.ts';
import { getProductOrderWhatsAppUrl } from '../utils/whatsapp.ts';
import { WhatsAppIconSVG } from './FloatingWhatsApp.tsx';
import {
  Eye,
  ShoppingCart,
  Star,
  Gauge,
  Zap,
  BatteryCharging,
  Fuel
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigate, addToCart } = useApp();

  const discount = calculateDiscountPercent(product.originalPrice, product.price);

  return (
    <div className="group surface-card surface-card-hover rounded-2xl flex flex-col overflow-hidden">
      
      {/* Product Image & Badges */}
      <div 
        className="relative aspect-[4/3] bg-[#090c14] overflow-hidden cursor-pointer" 
        onClick={() => navigate('product', product.id)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 select-none"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/electric_scooty_blue_1793645309587.jpg';
          }}
        />

        {/* Subtle Scrim for Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e121d] via-transparent to-black/30 opacity-70 pointer-events-none"></div>

        {/* Top Unboxed Metadata */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <div className="bg-[#080a11]/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/[0.08] text-[10px] font-bold text-slate-200 tracking-wider uppercase flex items-center gap-1.5 shadow">
            {product.category === 'Electric' ? (
              <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
            ) : (
              <Fuel className="w-3 h-3 text-amber-400" />
            )}
            <span>{product.brand} · {product.category}</span>
          </div>

          {discount && (
            <span className="bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow backdrop-blur-sm">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Video Available Indicator */}
        {(Boolean(product.videoUrl) || product.gallery?.some((m) => m.endsWith('.mp4') || m.endsWith('.webm') || m.startsWith('data:video/'))) && (
          <div className="absolute top-3 right-3">
            <span className="bg-black/80 border border-white/[0.1] text-cyan-300 text-[10px] font-medium px-2 py-0.5 rounded-md shadow backdrop-blur-sm">
              Video Tour
            </span>
          </div>
        )}

        {/* Status Line */}
        <div className="absolute bottom-3 left-3">
          <span className="text-[11px] font-medium text-emerald-400 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>{product.availability}</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div>
          {/* Rating */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-300 font-mono">{product.rating.toFixed(1)}</span>
            <span className="text-[11px] text-slate-500">({product.reviewCount})</span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => navigate('product', product.id)}
            className="text-base sm:text-lg font-bold text-white hover:text-cyan-300 transition-colors line-clamp-1 cursor-pointer font-heading"
          >
            {product.name}
          </h3>

          {/* Short description */}
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Precision Spec Chips */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/[0.06] text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300 bg-white/[0.03] p-1.5 rounded-lg border border-white/[0.05]">
              <Gauge className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{product.specs.maxSpeed}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 bg-white/[0.03] p-1.5 rounded-lg border border-white/[0.05]">
              {product.category === 'Electric' ? (
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Fuel className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              )}
              <span className="truncate">{product.specs.rangeMileage}</span>
            </div>
          </div>
        </div>

        {/* Price & Action Buttons */}
        <div className="space-y-3 pt-1 border-t border-white/[0.06]">
          
          {/* Price display */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-lg sm:text-xl font-black text-white tracking-tight font-heading tabular-nums">
                {formatPKR(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-slate-500 line-through ml-2 font-mono">
                  {formatPKR(product.originalPrice)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Official Warranty</span>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-2">
            {/* View Details */}
            <button
              onClick={() => navigate('product', product.id)}
              className="py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/[0.08] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Details</span>
            </button>

            {/* Quick Add to Cart */}
            <button
              onClick={() => addToCart(product, 1)}
              className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/25 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          </div>

          {/* Direct WhatsApp Order */}
          <a
            href={getProductOrderWhatsAppUrl(product.name, product.price)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <WhatsAppIconSVG className="w-3.5 h-3.5 text-white" />
            <span>Order on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

