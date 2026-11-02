import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { wishlist, products, navigate } = useApp();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <button
            onClick={() => navigate('scooties')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Browsing
          </button>
          <h1 className="text-3xl font-extrabold text-white font-heading flex items-center gap-3">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
            My Wishlist ({wishlistedProducts.length})
          </h1>
        </div>
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="bg-[#0f172a] rounded-3xl p-16 text-center border border-slate-800 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white font-heading">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-400">
            Save your favorite electric or petrol scooty models to compare and order anytime.
          </p>
          <button
            onClick={() => navigate('scooties')}
            className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            Explore Scooties
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
};
