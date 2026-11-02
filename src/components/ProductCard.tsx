import React from 'react';
import { Product } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';
import { formatPKR, calculateDiscountPercent } from '../utils/formatters.ts';
import { getProductOrderWhatsAppUrl } from '../utils/whatsapp.ts';
import { WhatsAppIconSVG } from './FloatingWhatsApp.tsx';
import {
  Heart,
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
  const { navigate, addToCart, toggleWishlist, isInWishlist } = useApp();

  const discount = calculateDiscountPercent(product.originalPrice, product.price);
  const isWishlisted = isInWishlist(product.id);

  // Status badge styling
  const getAvailabilityBadge = () => {
    switch (product.availability) {
      case 'In Stock':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'Limited Stock':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Pre-Order':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      default:
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    }
  };

  return (
    <div className="group bg-[#0f172a] rounded-2xl border border-slate-800 hover:border-blue-500/50 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col overflow-hidden">
      
      {/* Product Image & Badges */}
      <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden cursor-pointer" onClick={() => navigate('product', product.id)}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            // fallback image if broken
            (e.target as HTMLImageElement).src = '/images/electric_scooty_blue_1793645309587.jpg';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-black/40 opacity-70"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow uppercase tracking-wider flex items-center gap-1">
            {product.category === 'Electric' ? (
              <Zap className="w-3 h-3 text-cyan-300 fill-cyan-300" />
            ) : (
              <Fuel className="w-3 h-3 text-amber-300" />
            )}
            {product.category}
          </span>
          {discount && (
            <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Right Action: Wishlist */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
              isWishlisted
                ? 'bg-rose-500 text-white shadow-lg'
                : 'bg-black/40 text-slate-300 hover:text-white hover:bg-black/70'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-label="Wishlist toggle"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Availability Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${getAvailabilityBadge()}`}>
            ● {product.availability}
          </span>
        </div>

        {/* Brand label */}
        <div className="absolute bottom-3 right-3">
          <span className="text-[10px] uppercase font-bold text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-sm">
            {product.brand}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        
        <div>
          {/* Rating */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-300">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-slate-500">({product.reviewCount} reviews)</span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => navigate('product', product.id)}
            className="text-lg font-bold text-white hover:text-cyan-400 transition-colors line-clamp-1 cursor-pointer font-heading"
          >
            {product.name}
          </h3>

          {/* Short description */}
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Key Specs Pills */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <Gauge className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{product.specs.maxSpeed}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
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
        <div className="space-y-3 pt-2">
          
          {/* Price display */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xl font-extrabold text-cyan-300 tracking-tight font-heading">
                {formatPKR(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-slate-500 line-through ml-2">
                  {formatPKR(product.originalPrice)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">Cash / Installment</span>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            
            {/* View Details Button */}
            <button
              onClick={() => navigate('product', product.id)}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              View Details
            </button>

            {/* Quick Add to Cart */}
            <button
              onClick={() => addToCart(product, 1)}
              className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </button>
          </div>

          {/* WHATSAPP ORDER BUTTON - MANDATORY REQUIREMENT */}
          <a
            href={getProductOrderWhatsAppUrl(product.name, product.price)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <WhatsAppIconSVG className="w-4 h-4 text-white" />
            WhatsApp Order
          </a>
        </div>
      </div>
    </div>
  );
};
