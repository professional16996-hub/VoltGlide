import React, { useMemo, useState } from 'react';
import { Product } from '../../types.ts';
import { parseProductMetrics } from '../../utils/specParser.ts';
import { formatPKR } from '../../utils/formatters.ts';
import { GitCompare, Trophy, ArrowUpRight } from 'lucide-react';

interface ModelComparisonAnalysisProps {
  products: Product[];
  onSelectProduct: (productId: string) => void;
}

const SERIES_COLORS = ['#22d3ee', '#3b82f6', '#f59e0b'];

export const ModelComparisonAnalysis: React.FC<ModelComparisonAnalysisProps> = ({ products, onSelectProduct }) => {
  const [modelAId, setModelAId] = useState<string>(() => products[0]?.id || '');
  const [modelBId, setModelBId] = useState<string>(() => products[1]?.id || products[0]?.id || '');
  const [modelCId, setModelCId] = useState<string>(() => products[4]?.id || '');

  const selectedModels = useMemo(() => {
    const list: Product[] = [];
    const a = products.find((p) => p.id === modelAId) || products[0];
    const b = products.find((p) => p.id === modelBId) || products[1];
    const c = modelCId ? products.find((p) => p.id === modelCId) : undefined;
    if (a) list.push(a);
    if (b && b.id !== a?.id) list.push(b);
    if (c && c.id !== a?.id && c.id !== b?.id) list.push(c);
    return list;
  }, [products, modelAId, modelBId, modelCId]);

  const enriched = useMemo(() => {
    return selectedModels.map((p, index) => {
      const m = parseProductMetrics(p);
      return {
        product: p,
        metrics: m,
        color: SERIES_COLORS[index % SERIES_COLORS.length]
      };
    });
  }, [selectedModels]);

  const applyPreset = (type: 'ev-vs-petrol' | 'sport-vs-classic' | 'budget') => {
    if (products.length < 2) return;
    if (type === 'ev-vs-petrol') {
      const ev = products.find((p) => p.category === 'Electric');
      const pet = products.find((p) => p.category === 'Petrol');
      const sport = products.find((p) => p.category === 'Sports');
      if (ev) setModelAId(ev.id);
      if (pet) setModelBId(pet.id);
      setModelCId(sport?.id || '');
    } else if (type === 'sport-vs-classic') {
      const sport = products.find((p) => p.category === 'Sports') || products[0];
      const vespa = products.find((p) => p.brand.toLowerCase().includes('vespa')) || products[1];
      const yamaha = products.find((p) => p.brand.toLowerCase().includes('yamaha')) || products[2];
      setModelAId(sport.id);
      setModelBId(vespa.id);
      setModelCId(yamaha?.id || '');
    } else {
      const sorted = [...products].sort((a, b) => a.price - b.price);
      setModelAId(sorted[0].id);
      setModelBId(sorted[1]?.id || sorted[0].id);
      setModelCId(sorted[2]?.id || '');
    }
  };

  if (products.length < 2) {
    return (
      <div className="surface-card rounded-2xl p-8 text-center text-sm text-slate-400">
        At least two models are required for head-to-head comparison analysis.
      </div>
    );
  }

  // Normalized dimensions for Grouped Bar Chart (0-100 scale relative to catalog maximums)
  const allMetrics = products.map((p) => ({ p, m: parseProductMetrics(p) }));
  const maxSpeedAll = Math.max(...allMetrics.map((x) => x.m.topSpeedKmh), 100);
  const maxRangeAll = Math.max(...allMetrics.map((x) => x.m.rangeKm), 150);
  const maxPriceAll = Math.max(...products.map((p) => p.price), 500000);
  const maxWarrantyAll = Math.max(...allMetrics.map((x) => x.m.warrantyYears), 4);

  const dimensions = [
    {
      label: 'Top Speed',
      getValue: (item: typeof enriched[number]) => Math.round((item.metrics.topSpeedKmh / maxSpeedAll) * 100),
      getRaw: (item: typeof enriched[number]) => `${item.metrics.topSpeedKmh} km/h`
    },
    {
      label: 'Range / Tank',
      getValue: (item: typeof enriched[number]) => Math.round((item.metrics.rangeKm / maxRangeAll) * 100),
      getRaw: (item: typeof enriched[number]) => `${item.metrics.rangeKm} km`
    },
    {
      label: 'Price Value',
      getValue: (item: typeof enriched[number]) => Math.max(12, Math.round((1 - item.product.price / (maxPriceAll * 1.15)) * 100)),
      getRaw: (item: typeof enriched[number]) => formatPKR(item.product.price)
    },
    {
      label: 'Warranty',
      getValue: (item: typeof enriched[number]) => Math.round((item.metrics.warrantyYears / maxWarrantyAll) * 100),
      getRaw: (item: typeof enriched[number]) => `${item.metrics.warrantyYears} yr`
    },
    {
      label: 'User Rating',
      getValue: (item: typeof enriched[number]) => Math.round((item.product.rating / 5) * 100),
      getRaw: (item: typeof enriched[number]) => `${item.product.rating.toFixed(1)} / 5`
    }
  ];

  // Find metric leaders for matrix callouts
  const bestPriceId = [...enriched].sort((a, b) => a.product.price - b.product.price)[0]?.product.id;
  const bestSpeedId = [...enriched].sort((a, b) => b.metrics.topSpeedKmh - a.metrics.topSpeedKmh)[0]?.product.id;
  const bestRunningCostId = [...enriched].sort((a, b) => a.metrics.runningCostPerKmPkr - b.metrics.runningCostPerKmPkr)[0]?.product.id;
  const bestRatingId = [...enriched].sort((a, b) => b.product.rating - a.product.rating)[0]?.product.id;

  return (
    <section className="surface-card rounded-2xl p-6 sm:p-8 space-y-8">
      {/* Header & Presets */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <GitCompare className="w-4 h-4" />
            <span>02. Multi-Model Performance Comparison</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
            Head-to-Head Spec & Capability Benchmark
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Compare up to three scooties side-by-side across top speed, range, warranty coverage, running cost per kilometer, and customer rating.
          </p>
        </div>

        {/* Interactive Preset Segmented Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#080a11] rounded-xl border border-white/[0.08]">
          <button
            onClick={() => applyPreset('ev-vs-petrol')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            EV vs. Petrol
          </button>
          <button
            onClick={() => applyPreset('sport-vs-classic')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sports vs. Classic
          </button>
          <button
            onClick={() => applyPreset('budget')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Budget Models
          </button>
        </div>
      </div>

      {/* Model Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-cyan-300 mb-1.5">Model A (Primary)</label>
          <select
            value={modelAId}
            onChange={(e) => setModelAId(e.target.value)}
            className="w-full bg-[#080a11] border border-cyan-500/40 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {formatPKR(p.price)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-blue-400 mb-1.5">Model B (Challenger)</label>
          <select
            value={modelBId}
            onChange={(e) => setModelBId(e.target.value)}
            className="w-full bg-[#080a11] border border-blue-500/40 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-400"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {formatPKR(p.price)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-amber-300 mb-1.5">Model C (Optional 3rd)</label>
          <select
            value={modelCId}
            onChange={(e) => setModelCId(e.target.value)}
            className="w-full bg-[#080a11] border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">None (Compare 2 Models)</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {formatPKR(p.price)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Horizontal Normalized Benchmark Chart */}
      <div className="bg-[#080a11] rounded-xl border border-white/[0.06] p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white">Normalized Capability Index (0–100 Catalog Benchmark)</h3>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {enriched.map((item) => (
              <span key={item.product.id} className="inline-flex items-center gap-2 text-slate-200 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: item.color }}></span>
                <span>{item.product.name}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {dimensions.map((dim) => (
            <div key={dim.label} className="space-y-1.5">
              <div className="text-xs font-medium text-slate-300">{dim.label}</div>
              <div className="space-y-1.5">
                {enriched.map((item) => {
                  const pct = Math.min(100, Math.max(8, dim.getValue(item)));
                  return (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <div className="w-32 sm:w-44 text-[11px] text-slate-400 truncate">
                        {item.product.name}
                      </div>
                      <div className="flex-1 h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                      <div className="w-24 text-right text-xs font-mono tabular-nums text-white font-semibold">
                        {dim.getRaw(item)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Specification Comparison Table */}
      <div className="overflow-x-auto bg-[#080a11] rounded-xl border border-white/[0.06]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/[0.08] text-slate-400">
            <tr>
              <th className="p-4 font-semibold w-44">Specification</th>
              {enriched.map((item) => (
                <th key={item.product.id} className="p-4 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-bold text-white block">{item.product.name}</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {item.product.brand} · {item.product.category}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectProduct(item.product.id)}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-cyan-400 cursor-pointer"
                      title="Open Product Details"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-slate-300">
            <tr>
              <td className="p-4 font-medium text-slate-400">Price (PKR)</td>
              {enriched.map((item) => (
                <td key={item.product.id} className="p-4 font-mono tabular-nums font-bold text-white">
                  <span>{formatPKR(item.product.price)}</span>
                  {item.product.id === bestPriceId && (
                    <span className="ml-2 text-[11px] font-sans font-semibold text-emerald-400 inline-flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Lowest
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-400">Running Cost / km</td>
              {enriched.map((item) => (
                <td key={item.product.id} className="p-4 font-mono tabular-nums">
                  <span className="text-white font-semibold">PKR {item.metrics.runningCostPerKmPkr.toFixed(2)}/km</span>
                  {item.product.id === bestRunningCostId && (
                    <span className="ml-2 text-[11px] font-sans font-semibold text-emerald-400 inline-flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Most Economical
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-400">Top Speed</td>
              {enriched.map((item) => (
                <td key={item.product.id} className="p-4 font-mono tabular-nums">
                  <span className="text-white">{item.metrics.topSpeedKmh} km/h</span>
                  {item.product.id === bestSpeedId && (
                    <span className="ml-2 text-[11px] font-sans font-semibold text-cyan-400 inline-flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Fastest
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-400">Motor / Engine</td>
              {enriched.map((item) => (
                <td key={item.product.id} className="p-4 text-slate-300">
                  {item.product.specs.engineMotor}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-400">Range / Mileage</td>
              {enriched.map((item) => (
                <td key={item.product.id} className="p-4 text-slate-300">
                  {item.product.specs.rangeMileage}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-400">Braking System</td>
              {enriched.map((item) => (
                <td key={item.product.id} className="p-4 text-slate-300">
                  {item.product.specs.brakingSystem}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-400">Curb Weight</td>
              {enriched.map((item) => (
                <td key={item.product.id} className="p-4 font-mono tabular-nums text-slate-300">
                  {item.product.specs.curbWeight}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-400">Customer Rating</td>
              {enriched.map((item) => (
                <td key={item.product.id} className="p-4 font-mono tabular-nums">
                  <span className="text-amber-300 font-semibold">{item.product.rating.toFixed(1)} / 5.0</span>
                  <span className="text-slate-500 ml-1">({item.product.reviewCount})</span>
                  {item.product.id === bestRatingId && (
                    <span className="ml-2 text-[11px] font-sans font-semibold text-amber-300">Top Rated</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};
