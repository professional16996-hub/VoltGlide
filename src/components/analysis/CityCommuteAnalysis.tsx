import React, { useMemo, useState } from 'react';
import { Product } from '../../types.ts';
import { parseProductMetrics } from '../../utils/specParser.ts';
import { formatPKR } from '../../utils/formatters.ts';
import { MapPin, Route, ShoppingCart, ArrowUpRight } from 'lucide-react';

interface CityCommuteAnalysisProps {
  products: Product[];
  onSelectProduct: (productId: string) => void;
  onAddToCart: (product: Product) => void;
}

interface CityProfile {
  name: string;
  rangeFactor: number; // Real-world heat & stop-and-go impact
  minComfortSpeedKmh: number;
  terrainNote: string;
}

const PAKISTAN_CITIES: CityProfile[] = [
  { name: 'Lahore', rangeFactor: 0.88, minComfortSpeedKmh: 55, terrainNote: 'Flat roads · dense Canal & Ring Road commute' },
  { name: 'Karachi', rangeFactor: 0.84, minComfortSpeedKmh: 60, terrainNote: 'Coastal humidity & long Shahrah-e-Faisal stretches' },
  { name: 'Islamabad', rangeFactor: 0.86, minComfortSpeedKmh: 65, terrainNote: 'Wide sectors with Margalla incline gradients' },
  { name: 'Rawalpindi', rangeFactor: 0.85, minComfortSpeedKmh: 55, terrainNote: 'High-density bazaar traffic & steep flyovers' },
  { name: 'Faisalabad', rangeFactor: 0.90, minComfortSpeedKmh: 50, terrainNote: 'Flat radial city roads · short-to-mid hops' },
  { name: 'Multan', rangeFactor: 0.85, minComfortSpeedKmh: 55, terrainNote: 'High summer heat · wide boulevard rides' }
];

type UsageProfile = 'office' | 'errands' | 'highway' | 'campus';
type PriorityGoal = 'savings' | 'balanced' | 'performance';

export const CityCommuteAnalysis: React.FC<CityCommuteAnalysisProps> = ({
  products,
  onSelectProduct,
  onAddToCart
}) => {
  const [cityName, setCityName] = useState<string>('Lahore');
  const [usage, setUsage] = useState<UsageProfile>('office');
  const [priority, setPriority] = useState<PriorityGoal>('balanced');
  const [dailyRoundTripKm, setDailyRoundTripKm] = useState<number>(28);

  const selectedCity = PAKISTAN_CITIES.find((c) => c.name === cityName) || PAKISTAN_CITIES[0];

  const recommendations = useMemo(() => {
    const usageSpeedNeed =
      usage === 'highway' ? 75 : usage === 'office' ? selectedCity.minComfortSpeedKmh : usage === 'errands' ? 45 : 20;

    return products
      .map((product) => {
        const m = parseProductMetrics(product);
        const adjustedRangeKm = Math.round(m.rangeKm * selectedCity.rangeFactor);
        const rangeRatio = adjustedRangeKm / Math.max(dailyRoundTripKm, 1);
        const daysBetweenRefill = Math.max(0.5, Number((adjustedRangeKm / Math.max(dailyRoundTripKm, 1)).toFixed(1)));
        const monthlyCostPkr = Math.round(dailyRoundTripKm * 30 * m.runningCostPerKmPkr + m.monthlyMaintPkr);

        // Transparent engineering fit components (each 0-100)
        const rangeFit = rangeRatio >= 2.0 ? 100 : rangeRatio >= 1.2 ? 85 : rangeRatio >= 0.9 ? 65 : 30;
        const speedFit = m.topSpeedKmh >= usageSpeedNeed ? 100 : Math.max(25, Math.round((m.topSpeedKmh / usageSpeedNeed) * 100));
        const economyFit = Math.max(20, Math.min(100, Math.round(115 - m.runningCostPerKmPkr * 12)));

        let matchScore = 0;
        if (priority === 'savings') {
          matchScore = Math.round(rangeFit * 0.35 + speedFit * 0.15 + economyFit * 0.5);
        } else if (priority === 'performance') {
          matchScore = Math.round(rangeFit * 0.3 + speedFit * 0.55 + economyFit * 0.15);
        } else {
          matchScore = Math.round(rangeFit * 0.4 + speedFit * 0.3 + economyFit * 0.3);
        }

        let fitNote = '';
        if (rangeRatio < 1) {
          fitNote = `Needs mid-day top-up for ${dailyRoundTripKm} km round trip`;
        } else if (m.topSpeedKmh < usageSpeedNeed) {
          fitNote = `Best kept to inner-sector streets (${m.topSpeedKmh} km/h max)`;
        } else if (m.isElectric) {
          fitNote = `Covers ${daysBetweenRefill} days per home charge in ${selectedCity.name}`;
        } else {
          fitNote = `Handles ${daysBetweenRefill} days per tank with instant refuel`;
        }

        return {
          product,
          metrics: m,
          adjustedRangeKm,
          daysBetweenRefill,
          monthlyCostPkr,
          matchScore,
          fitNote
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [products, selectedCity, usage, priority, dailyRoundTripKm]);

  const topMatches = recommendations.slice(0, 4);

  return (
    <section className="surface-card rounded-2xl p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <Route className="w-4 h-4" />
            <span>04. City Route & Range Suitability Analysis</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
            Pakistan City Commute & Charging Frequency Analyzer
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Model real-world heat, stop-and-go traffic, and incline adjustments for your city to see how many days each scooty runs before charging or refueling.
          </p>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span>{selectedCity.terrainNote}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Your City</label>
          <select
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            className="w-full bg-[#080a11] border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            {PAKISTAN_CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} (Real-World Factor: {Math.round(c.rangeFactor * 100)}%)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Daily Commute Type</label>
          <select
            value={usage}
            onChange={(e) => setUsage(e.target.value as UsageProfile)}
            className="w-full bg-[#080a11] border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="office">Office / University Commute</option>
            <option value="errands">Dense Bazaar / Delivery Errands</option>
            <option value="highway">Ring Road / Highway & Slopes</option>
            <option value="campus">Campus / Housing Society</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Primary Priority</label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#080a11] border border-white/[0.1] rounded-xl">
            {[
              { id: 'savings', label: 'Savings' },
              { id: 'balanced', label: 'Balanced' },
              { id: 'performance', label: 'Power' }
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setPriority(g.id as PriorityGoal)}
                className={`py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  priority === g.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="text-slate-400 font-medium">Daily Round Trip</label>
            <span className="font-mono tabular-nums font-bold text-white">{dailyRoundTripKm} km/day</span>
          </div>
          <input
            type="range"
            min={5}
            max={80}
            step={1}
            value={dailyRoundTripKm}
            onChange={(e) => setDailyRoundTripKm(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer mt-1.5"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
            <span>5 km</span>
            <span>{Math.round(dailyRoundTripKm * 30)} km/mo</span>
            <span>80 km</span>
          </div>
        </div>
      </div>

      {/* Top 4 Recommended Models Analysis Cards */}
      {topMatches.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-400">
          No models available to analyze for this commute route.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topMatches.map((item, idx) => (
            <div
              key={item.product.id}
              className="bg-[#080a11] rounded-xl border border-white/[0.08] p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover bg-[#0e121d] border border-white/[0.08] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">
                      Rank #{idx + 1} · {item.product.category} · {item.product.brand}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {item.product.name}
                    </h3>
                    <span className="font-mono tabular-nums text-xs font-semibold text-cyan-300">
                      {formatPKR(item.product.price)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block">Route Fit</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-emerald-400">
                    {item.matchScore}%
                  </span>
                </div>
              </div>

              {/* Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.06] text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Adjusted Range</span>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    {item.adjustedRangeKm} km
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    {item.metrics.isElectric ? 'Charge Cycle' : 'Refuel Cycle'}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-cyan-300">
                    Every {item.daysBetweenRefill}d
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Est. Monthly Run</span>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    {formatPKR(item.monthlyCostPkr)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-300">{item.fitNote}</span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => onSelectProduct(item.product.id)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Specs</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onAddToCart(item.product)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
