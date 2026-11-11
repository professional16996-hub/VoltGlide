import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { CategoryType, AvailabilityType } from '../types.ts';
import { formatPKR } from '../utils/formatters.ts';
import {
  Search,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  X
} from 'lucide-react';

export const ScootiesPage: React.FC = () => {
  const { products, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, restoreDemoProducts } = useApp();

  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(750000);
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Available brands in the product list
  const brands = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.brand)));
    return ['All', ...list];
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Brand filter
      if (selectedBrand !== 'All' && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }
      // Availability filter
      if (selectedAvailability !== 'All' && p.availability.toLowerCase() !== selectedAvailability.toLowerCase()) {
        return false;
      }
      // Price filter
      if (p.price > maxPrice) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesDesc = p.shortDescription.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesDesc) return false;
      }
      return true;
    });

    // Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return result;
  }, [products, selectedCategory, selectedBrand, selectedAvailability, maxPrice, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedBrand('All');
    setSelectedAvailability('All');
    setMaxPrice(750000);
    setSearchQuery('');
    setSortBy('featured');
    if (products.length === 0) {
      restoreDemoProducts();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full max-w-full overflow-x-hidden">
      
      {/* Page Title */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            SHOWROOM INVENTORY
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading mt-1">
            Explore All Scooties ({filteredProducts.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Choose from high-efficiency electric models, premium Hondas, Vespas, and lightweight city commuters with door-to-door delivery.
          </p>
        </div>

        {/* Mobile filter toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex-1 py-2 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4 text-cyan-400" />
            Filters & Price
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* FILTERS SIDEBAR (Desktop + Mobile slide) */}
        <aside
          className={`lg:block space-y-6 ${
            showMobileFilters
              ? 'fixed inset-0 z-50 bg-[#090e1a] p-6 overflow-y-auto'
              : 'hidden lg:block'
          }`}
        >
          {showMobileFilters && (
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">Filter Scooties</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Reset Filters */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              Filter By
            </span>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>

          {/* Category Filter */}
          <div className="surface-card rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Category</h4>
            <div className="space-y-1">
              {(['All', 'Electric', 'Petrol', 'Sports', 'Kids', 'City'] as CategoryType[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{cat === 'All' ? 'All Scooties' : cat}</span>
                  {selectedCategory.toLowerCase() === cat.toLowerCase() && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="surface-card rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Brand</h4>
            <div className="space-y-1">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                    selectedBrand.toLowerCase() === b.toLowerCase()
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{b === 'All' ? 'All Brands' : b}</span>
                  {selectedBrand.toLowerCase() === b.toLowerCase() && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="surface-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Max Budget</h4>
              <span className="text-xs font-bold text-white font-mono tabular-nums">
                {formatPKR(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={90000}
              max={750000}
              step={10000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600 bg-white/[0.1] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>PKR 90k</span>
              <span>PKR 750k</span>
            </div>
          </div>

          {/* Availability Filter */}
          <div className="surface-card rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Availability</h4>
            <div className="space-y-1">
              {['All', 'In Stock', 'Limited Stock', 'Pre-Order'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedAvailability(status)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                    selectedAvailability.toLowerCase() === status.toLowerCase()
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{status}</span>
                  {selectedAvailability.toLowerCase() === status.toLowerCase() && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-300"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {showMobileFilters && (
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              Apply Filters & View Results
            </button>
          )}
        </aside>

        {/* MAIN PRODUCT LISTING */}
        <main className="lg:col-span-3 space-y-6">
          
          {/* Controls Bar: Search & Sort */}
          <div className="surface-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Search within page */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by model or feature..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.04] text-xs text-white placeholder-slate-400 pl-9 pr-3 py-2 rounded-xl border border-white/[0.08] focus:outline-none focus:border-cyan-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
              <span className="text-slate-400 whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/[0.04] text-slate-200 border border-white/[0.08] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="featured" className="bg-[#0e121d]">Featured First</option>
                <option value="price-low" className="bg-[#0e121d]">Price: Low to High</option>
                <option value="price-high" className="bg-[#0e121d]">Price: High to Low</option>
                <option value="rating" className="bg-[#0e121d]">Highest Customer Rating</option>
              </select>
            </div>

          </div>

          {/* Active Filter Chips */}
          {(selectedCategory !== 'All' || selectedBrand !== 'All' || selectedAvailability !== 'All' || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 text-[11px]">Active Filters:</span>
              {selectedCategory !== 'All' && (
                <span className="bg-blue-900/60 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1.5">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('All')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedBrand !== 'All' && (
                <span className="bg-blue-900/60 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1.5">
                  Brand: {selectedBrand}
                  <button onClick={() => setSelectedBrand('All')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedAvailability !== 'All' && (
                <span className="bg-blue-900/60 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1.5">
                  Status: {selectedAvailability}
                  <button onClick={() => setSelectedAvailability('All')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="bg-blue-900/60 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1.5">
                  Query: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-rose-400 hover:underline ml-2 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-[#0f172a] rounded-3xl p-12 text-center border border-slate-800 space-y-3">
              <p className="text-base font-bold text-white">No Scooties Found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No scooty models matched your current filter criteria. Try adjusting your price budget or clearing search filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-3 py-2 px-6 rounded-xl bg-blue-600 text-white text-xs font-bold shadow"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </main>
      </div>

    </div>
  );
};
