import React, { useMemo, useState } from 'react';
import { Product } from '../../types.ts';
import { parseProductMetrics } from '../../utils/specParser.ts';
import { formatPKR } from '../../utils/formatters.ts';
import { BarChart3, ArrowUpRight } from 'lucide-react';

interface MarketScatterAnalysisProps {
  products: Product[];
  onSelectProduct: (productId: string) => void;
}

const CATEGORY_COLOR: Record<string, string> = {
  Electric: '#22d3ee',
  Petrol: '#f59e0b',
  Sports: '#3b82f6',
  City: '#10b981',
  Kids: '#a78bfa'
};

export const MarketScatterAnalysis: React.FC<MarketScatterAnalysisProps> = ({ products, onSelectProduct }) => {
  const [yAxisMetric, setYAxisMetric] = useState<'speed' | 'range' | 'efficiency'>('speed');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const points = useMemo(() => {
    return products
      .filter((p) => categoryFilter === 'All' || p.category === categoryFilter)
      .map((p) => {
        const m = parseProductMetrics(p);
        const yVal =
          yAxisMetric === 'speed'
            ? m.topSpeedKmh
            : yAxisMetric === 'range'
            ? m.rangeKm
            : Number((100 / Math.max(m.runningCostPerKmPkr, 0.5)).toFixed(1)); // km per 100 PKR
        return {
          product: p,
          metrics: m,
          xVal: p.price,
          yVal,
          color: CATEGORY_COLOR[p.category] || '#38bdf8'
        };
      });
  }, [products, categoryFilter, yAxisMetric]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, Product[]>();
    products.forEach((p) => {
      const list = map.get(p.category) || [];
      list.push(p);
      map.set(p.category, list);
    });

    return Array.from(map.entries()).map(([category, list]) => {
      const prices = list.map((x) => x.price);
      const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / list.length);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgRating = Number((list.reduce((a, b) => a + b.rating, 0) / list.length).toFixed(2));
      const sharePct = Math.round((list.length / Math.max(products.length, 1)) * 100);
      return {
        category,
        count: list.length,
        avgPrice,
        minPrice,
        maxPrice,
        avgRating,
        sharePct,
        color: CATEGORY_COLOR[category] || '#38bdf8'
      };
    });
  }, [products]);

  const activePoint = points.find((pt) => pt.product.id === hoveredId) || points[0];

  if (products.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-8 text-center text-sm text-slate-400">
        No catalog products available to compute market distribution.
      </div>
    );
  }

  // SVG Scatter geometry
  const chartW = 720;
  const chartH = 300;
  const padL = 62;
  const padR = 26;
  const padT = 24;
  const padB = 42;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const allX = points.map((p) => p.xVal);
  const allY = points.map((p) => p.yVal);
  const minX = Math.max(0, Math.min(...allX, 50000) * 0.85);
  const maxX = Math.max(...allX, 300000) * 1.08;
  const minY = Math.max(0, Math.min(...allY, 10) * 0.8);
  const maxY = Math.max(...allY, 80) * 1.12;

  const getX = (val: number) => padL + ((val - minX) / Math.max(maxX - minX, 1)) * plotW;
  const getY = (val: number) => padT + plotH - ((val - minY) / Math.max(maxY - minY, 1)) * plotH;

  const avgX = allX.reduce((a, b) => a + b, 0) / Math.max(allX.length, 1);
  const avgY = allY.reduce((a, b) => a + b, 0) / Math.max(allY.length, 1);

  const yUnitLabel =
    yAxisMetric === 'speed' ? 'Top Speed (km/h)' : yAxisMetric === 'range' ? 'Range per Charge/Tank (km)' : 'Distance per PKR 100 (km)';

  return (
    <section className="surface-card rounded-2xl p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <BarChart3 className="w-4 h-4" />
            <span>03. Price vs. Performance Market Quadrant</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
            Catalog Value Positioning & Segment Breakdown
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Analyze how every model in our showroom balances purchase price against speed, single-charge/tank range, and fuel economy per PKR 100.
          </p>
        </div>

        {/* Y-Axis Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#080a11] rounded-xl border border-white/[0.08]">
          {[
            { id: 'speed', label: 'Top Speed' },
            { id: 'range', label: 'Range (km)' },
            { id: 'efficiency', label: 'km / PKR 100' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setYAxisMetric(opt.id as 'speed' | 'range' | 'efficiency')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                yAxisMetric === opt.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#080a11] rounded-xl border border-white/[0.08]">
          {['All', ...categoryBreakdown.map((c) => c.category)].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-white/[0.1] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {categoryBreakdown.map((c) => (
            <span key={c.category} className="inline-flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.color }}></span>
              <span>{c.category}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Scatter Plot + Active Model Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-[#080a11] rounded-xl border border-white/[0.06] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{yUnitLabel} vs. Price (PKR)</span>
            <span>Hover or click any point to inspect</span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto min-w-[500px] select-none">
              {/* Average Quadrant Reference Lines */}
              <line
                x1={getX(avgX)}
                y1={padT}
                x2={getX(avgX)}
                y2={chartH - padB}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 4"
              />
              <line
                x1={padL}
                y1={getY(avgY)}
                x2={chartW - padR}
                y2={getY(avgY)}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 4"
              />

              {/* Quadrant Labels */}
              <text x={padL + 8} y={padT + 14} fill="#34d399" fontSize="10" fontWeight="600" opacity="0.85">
                High Value Sweet Spot
              </text>
              <text x={chartW - padR - 8} y={padT + 14} textAnchor="end" fill="#38bdf8" fontSize="10" fontWeight="600" opacity="0.85">
                Premium Performance
              </text>

              {/* Y-Axis Ticks */}
              {[0, 0.33, 0.66, 1].map((t, idx) => {
                const val = Math.round(minY + t * (maxY - minY));
                const y = getY(val);
                return (
                  <g key={idx}>
                    <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(255,255,255,0.04)" />
                    <text x={padL - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10" className="font-mono">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Ticks */}
              {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
                const val = Math.round(minX + t * (maxX - minX));
                const x = getX(val);
                return (
                  <text key={idx} x={x} y={chartH - 14} textAnchor="middle" fill="#64748b" fontSize="10" className="font-mono">
                    {Math.round(val / 1000)}k
                  </text>
                );
              })}

              {/* Data Points */}
              {points.map((pt) => {
                const cx = getX(pt.xVal);
                const cy = getY(pt.yVal);
                const isActive = activePoint?.product.id === pt.product.id;
                return (
                  <g
                    key={pt.product.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredId(pt.product.id)}
                    onClick={() => onSelectProduct(pt.product.id)}
                  >
                    {isActive && (
                      <circle cx={cx} cy={cy} r="13" fill={pt.color} opacity="0.18" />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isActive ? 7.5 : 5.5}
                      fill={pt.color}
                      stroke="#080a11"
                      strokeWidth="1.8"
                    />
                    <text
                      x={cx}
                      y={cy - 11}
                      textAnchor="middle"
                      fill={isActive ? '#ffffff' : '#94a3b8'}
                      fontSize={isActive ? '10.5' : '9.5'}
                      fontWeight={isActive ? '700' : '500'}
                    >
                      {pt.product.name.split(' ').slice(0, 2).join(' ')}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Inspected Model Details */}
        {activePoint && (
          <div className="bg-[#080a11] rounded-xl border border-white/[0.06] p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-medium text-slate-400">
                  {activePoint.product.category} · {activePoint.product.brand}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{activePoint.product.name}</h3>
              </div>
              <span className="font-mono tabular-nums text-sm font-bold text-cyan-300">
                {formatPKR(activePoint.product.price)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06] text-xs">
              <div>
                <span className="text-slate-500 block">Top Speed</span>
                <span className="font-mono tabular-nums font-semibold text-white">
                  {activePoint.metrics.topSpeedKmh} km/h
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Single-Fill/Charge</span>
                <span className="font-mono tabular-nums font-semibold text-white">
                  {activePoint.metrics.rangeKm} km
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Running Cost</span>
                <span className="font-mono tabular-nums font-semibold text-emerald-400">
                  PKR {activePoint.metrics.runningCostPerKmPkr.toFixed(2)}/km
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Rating</span>
                <span className="font-mono tabular-nums font-semibold text-amber-300">
                  {activePoint.product.rating.toFixed(1)} / 5.0
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectProduct(activePoint.product.id)}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Inspect Full Specifications</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Category Distribution & Price Band Table */}
      <div className="overflow-x-auto bg-[#080a11] rounded-xl border border-white/[0.06]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/[0.08] text-slate-400">
            <tr>
              <th className="p-4 font-semibold">Category Segment</th>
              <th className="p-4 font-semibold text-right">Models</th>
              <th className="p-4 font-semibold text-right">Catalog Share</th>
              <th className="p-4 font-semibold text-right">Average Price</th>
              <th className="p-4 font-semibold text-right">Price Range</th>
              <th className="p-4 font-semibold text-right">Avg Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {categoryBreakdown.map((row) => (
              <tr key={row.category} className="hover:bg-white/[0.02]">
                <td className="p-4 font-semibold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: row.color }}></span>
                  <span>{row.category}</span>
                </td>
                <td className="p-4 text-right font-mono tabular-nums text-slate-200">{row.count}</td>
                <td className="p-4 text-right font-mono tabular-nums text-slate-300">{row.sharePct}%</td>
                <td className="p-4 text-right font-mono tabular-nums font-semibold text-cyan-300">
                  {formatPKR(row.avgPrice)}
                </td>
                <td className="p-4 text-right font-mono tabular-nums text-slate-400">
                  {formatPKR(row.minPrice)} – {formatPKR(row.maxPrice)}
                </td>
                <td className="p-4 text-right font-mono tabular-nums text-amber-300">
                  {row.avgRating.toFixed(2)} / 5
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
