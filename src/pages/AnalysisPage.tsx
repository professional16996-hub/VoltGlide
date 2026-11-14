import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { CostRoiAnalysis } from '../components/analysis/CostRoiAnalysis.tsx';
import { ModelComparisonAnalysis } from '../components/analysis/ModelComparisonAnalysis.tsx';
import { MarketScatterAnalysis } from '../components/analysis/MarketScatterAnalysis.tsx';
import { CityCommuteAnalysis } from '../components/analysis/CityCommuteAnalysis.tsx';
import { isProductElectric, parseProductMetrics } from '../utils/specParser.ts';
import { formatPKR } from '../utils/formatters.ts';
import { TrendingDown, GitCompare, BarChart3, Route, ArrowLeft } from 'lucide-react';

type AnalysisViewMode = 'all' | 'roi' | 'compare' | 'market' | 'commute';

export const AnalysisPage: React.FC = () => {
  const { products, navigate, addToCart } = useApp();
  const [viewMode, setViewMode] = useState<AnalysisViewMode>('all');

  const summary = useMemo(() => {
    const evCount = products.filter((p) => isProductElectric(p)).length;
    const petrolCount = products.length - evCount;
    const avgPrice =
      products.length > 0
        ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length)
        : 0;
    const maxRange =
      products.length > 0
        ? Math.max(...products.map((p) => parseProductMetrics(p).rangeKm))
        : 0;
    return { evCount, petrolCount, avgPrice, maxRange };
  }, [products]);

  const handleSelectProduct = (productId: string) => {
    navigate('product', productId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <button
            onClick={() => navigate('home')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Showroom</span>
          </button>

          <h1 className="text-2xl sm:text-4xl font-bold text-white font-heading tracking-tight">
            Scooty Analytics & Buying Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Four interactive decision tools powered by live showroom inventory: calculate 3-year EV vs. petrol ROI, benchmark models side-by-side, explore price-to-performance positioning, and match range to your daily city commute.
          </p>
        </div>

        {/* Interactive Analysis Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#0e121d] rounded-xl border border-white/[0.08] overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All 4 Analyses', icon: null },
            { id: 'roi', label: 'Cost & ROI', icon: TrendingDown },
            { id: 'compare', label: 'Compare Models', icon: GitCompare },
            { id: 'market', label: 'Market Quadrant', icon: BarChart3 },
            { id: 'commute', label: 'City & Range', icon: Route }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as AnalysisViewMode)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Inventory Snapshot Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400">Models Analyzed</span>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">{products.length}</p>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {summary.evCount} Electric · {summary.petrolCount} Petrol
          </span>
        </div>

        <div className="surface-card rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400">Catalog Avg Price</span>
          <p className="text-2xl font-bold text-cyan-300 font-mono tabular-nums">
            {formatPKR(summary.avgPrice)}
          </p>
          <span className="text-xs text-slate-500">Across all segments</span>
        </div>

        <div className="surface-card rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400">Peak Rated Range</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {summary.maxRange} km
          </p>
          <span className="text-xs text-slate-500">Single charge or tank</span>
        </div>

        <div className="surface-card rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400">Baseline Fuel Rate</span>
          <p className="text-2xl font-bold text-amber-300 font-mono tabular-nums">PKR 275/L</p>
          <span className="text-xs text-slate-500">Adjustable inside Cost & ROI</span>
        </div>
      </div>

      {/* Rendered Analysis Modules */}
      <div className="space-y-8">
        {(viewMode === 'all' || viewMode === 'roi') && (
          <CostRoiAnalysis products={products} onSelectProduct={handleSelectProduct} />
        )}

        {(viewMode === 'all' || viewMode === 'compare') && (
          <ModelComparisonAnalysis products={products} onSelectProduct={handleSelectProduct} />
        )}

        {(viewMode === 'all' || viewMode === 'market') && (
          <MarketScatterAnalysis products={products} onSelectProduct={handleSelectProduct} />
        )}

        {(viewMode === 'all' || viewMode === 'commute') && (
          <CityCommuteAnalysis
            products={products}
            onSelectProduct={handleSelectProduct}
            onAddToCart={(product) => addToCart(product, 1)}
          />
        )}
      </div>
    </div>
  );
};
