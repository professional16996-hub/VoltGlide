import React, { useMemo, useState } from 'react';
import { Product } from '../../types.ts';
import { calculateMonthlyOwnershipCost, isProductElectric } from '../../utils/specParser.ts';
import { formatPKR } from '../../utils/formatters.ts';
import { SlidersHorizontal, TrendingDown, Fuel, BatteryCharging, Leaf } from 'lucide-react';

interface CostRoiAnalysisProps {
  products: Product[];
  onSelectProduct: (productId: string) => void;
}

export const CostRoiAnalysis: React.FC<CostRoiAnalysisProps> = ({ products, onSelectProduct }) => {
  const electricModels = useMemo(() => products.filter((p) => isProductElectric(p)), [products]);
  const petrolModels = useMemo(() => products.filter((p) => !isProductElectric(p)), [products]);

  const [selectedEvId, setSelectedEvId] = useState<string>(() => electricModels[0]?.id || products[0]?.id || '');
  const [selectedPetrolId, setSelectedPetrolId] = useState<string>(() => petrolModels[0]?.id || products[1]?.id || products[0]?.id || '');
  const [dailyKm, setDailyKm] = useState<number>(35);
  const [petrolPrice, setPetrolPrice] = useState<number>(275);
  const [electricityRate, setElectricityRate] = useState<number>(45);
  const [hoverMonth, setHoverMonth] = useState<number | null>(null);

  const evProduct = useMemo(
    () => products.find((p) => p.id === selectedEvId) || electricModels[0] || products[0],
    [products, selectedEvId, electricModels]
  );
  const petrolProduct = useMemo(
    () => products.find((p) => p.id === selectedPetrolId) || petrolModels[0] || products[1] || products[0],
    [products, selectedPetrolId, petrolModels]
  );

  const analysis = useMemo(() => {
    if (!evProduct || !petrolProduct) return null;
    const evCost = calculateMonthlyOwnershipCost(evProduct, dailyKm, petrolPrice, electricityRate);
    const petrolCost = calculateMonthlyOwnershipCost(petrolProduct, dailyKm, petrolPrice, electricityRate);

    const monthlyRunningSavings = petrolCost.totalMonthlyCost - evCost.totalMonthlyCost;
    const annualRunningSavings = monthlyRunningSavings * 12;
    const threeYearEvTotal = evProduct.price + evCost.totalMonthlyCost * 36;
    const threeYearPetrolTotal = petrolProduct.price + petrolCost.totalMonthlyCost * 36;
    const threeYearNetAdvantage = threeYearPetrolTotal - threeYearEvTotal;

    // Break-even month: when cumulative EV total <= cumulative Petrol total
    let breakEvenMonth: number | null = null;
    const monthsData = Array.from({ length: 37 }, (_, m) => {
      const evCumulative = evProduct.price + evCost.totalMonthlyCost * m;
      const petrolCumulative = petrolProduct.price + petrolCost.totalMonthlyCost * m;
      if (breakEvenMonth === null && m > 0 && evCumulative <= petrolCumulative) {
        breakEvenMonth = m;
      }
      return {
        month: m,
        evCumulative,
        petrolCumulative,
        difference: petrolCumulative - evCumulative
      };
    });

    if (evProduct.price <= petrolProduct.price && monthlyRunningSavings > 0) {
      breakEvenMonth = 0; // Cheaper upfront and cheaper to run
    }

    // Approximate tailpipe CO2 saved: ~120g CO2/km on 100-125cc 4-stroke scooter vs ~45g/km grid equivalent
    const annualCo2SavedKg = Math.round(dailyKm * 365 * 0.075);

    return {
      evCost,
      petrolCost,
      monthlyRunningSavings,
      annualRunningSavings,
      threeYearEvTotal,
      threeYearPetrolTotal,
      threeYearNetAdvantage,
      breakEvenMonth,
      annualCo2SavedKg,
      monthsData
    };
  }, [evProduct, petrolProduct, dailyKm, petrolPrice, electricityRate]);

  if (!analysis || !evProduct || !petrolProduct) {
    return (
      <div className="surface-card rounded-2xl p-8 text-center text-sm text-slate-400">
        Add at least two scooties in inventory to run the EV vs. Petrol Cost & ROI Analysis.
      </div>
    );
  }

  // SVG Chart Geometry
  const chartW = 760;
  const chartH = 290;
  const padL = 72;
  const padR = 24;
  const padT = 24;
  const padB = 38;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxVal = Math.max(
    ...analysis.monthsData.map((d) => Math.max(d.evCumulative, d.petrolCumulative)),
    100000
  );
  const minVal = Math.min(evProduct.price, petrolProduct.price) * 0.85;
  const valSpan = Math.max(maxVal - minVal, 1);

  const getX = (month: number) => padL + (month / 36) * plotW;
  const getY = (val: number) => padT + plotH - ((val - minVal) / valSpan) * plotH;

  const evPath = analysis.monthsData
    .map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(d.month).toFixed(1)} ${getY(d.evCumulative).toFixed(1)}`)
    .join(' ');
  const petrolPath = analysis.monthsData
    .map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(d.month).toFixed(1)} ${getY(d.petrolCumulative).toFixed(1)}`)
    .join(' ');

  const activePoint = hoverMonth !== null ? analysis.monthsData[hoverMonth] : analysis.monthsData[36];

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(minVal + t * valSpan));
  const xTicks = [0, 6, 12, 18, 24, 30, 36];

  return (
    <section className="surface-card rounded-2xl p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <TrendingDown className="w-4 h-4" />
            <span>01. Total Cost of Ownership & ROI Analysis</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">
            Electric vs. Petrol 3-Year Expense Curve
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Compare purchase price, monthly energy or fuel expense, and routine maintenance across 36 months using live Pakistani fuel and electricity rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
            <span className="text-slate-200 font-medium">{evProduct.name}</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-0.5 bg-amber-400 inline-block"></span>
            <span className="text-slate-200 font-medium">{petrolProduct.name}</span>
          </span>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Electric Model</label>
          <select
            value={evProduct.id}
            onChange={(e) => setSelectedEvId(e.target.value)}
            className="w-full bg-[#080a11] border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatPKR(p.price)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Comparison Petrol Model</label>
          <select
            value={petrolProduct.id}
            onChange={(e) => setSelectedPetrolId(e.target.value)}
            className="w-full bg-[#080a11] border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatPKR(p.price)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="text-slate-400 font-medium flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              Daily Distance
            </label>
            <span className="font-mono tabular-nums font-bold text-white">{dailyKm} km/day</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={dailyKm}
            onChange={(e) => setDailyKm(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer mt-1.5"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
            <span>10 km</span>
            <span>{dailyKm * 30} km/mo</span>
            <span>100 km</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="text-slate-400 font-medium">Petrol Rate</label>
            <span className="font-mono tabular-nums font-bold text-amber-300">PKR {petrolPrice}/L</span>
          </div>
          <input
            type="range"
            min={220}
            max={360}
            step={5}
            value={petrolPrice}
            onChange={(e) => setPetrolPrice(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer mt-1.5"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
            <span>220</span>
            <span>290</span>
            <span>360</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="text-slate-400 font-medium">Electricity Unit</label>
            <span className="font-mono tabular-nums font-bold text-cyan-300">PKR {electricityRate}/kWh</span>
          </div>
          <input
            type="range"
            min={25}
            max={75}
            step={5}
            value={electricityRate}
            onChange={(e) => setElectricityRate(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer mt-1.5"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
            <span>25</span>
            <span>50</span>
            <span>75</span>
          </div>
        </div>
      </div>

      {/* 4 Key KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-white/[0.06] py-5">
        <div className="space-y-1">
          <span className="text-xs text-slate-400">Monthly Running Saving</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {analysis.monthlyRunningSavings >= 0 ? '+' : ''}
            {formatPKR(analysis.monthlyRunningSavings)}
          </p>
          <span className="text-xs text-slate-500 font-mono tabular-nums block">
            EV {formatPKR(analysis.evCost.totalMonthlyCost)} vs Petrol {formatPKR(analysis.petrolCost.totalMonthlyCost)}
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-slate-400">3-Year Net Advantage</span>
          <p className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${analysis.threeYearNetAdvantage >= 0 ? 'text-cyan-300' : 'text-amber-300'}`}>
            {analysis.threeYearNetAdvantage >= 0 ? '+' : ''}
            {formatPKR(analysis.threeYearNetAdvantage)}
          </p>
          <span className="text-xs text-slate-500 block">
            Includes purchase price + 36 mo cost
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-slate-400">Break-Even Point</span>
          <p className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
            {analysis.breakEvenMonth === 0
              ? 'Day 1'
              : analysis.breakEvenMonth !== null
              ? `Month ${analysis.breakEvenMonth}`
              : '> 36 Months'}
          </p>
          <span className="text-xs text-slate-500 block">
            Time for fuel savings to recover cost
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>Annual CO₂ Reduction</span>
          </span>
          <p className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
            {analysis.annualCo2SavedKg.toLocaleString()} kg/yr
          </p>
          <span className="text-xs text-slate-500 font-mono tabular-nums block">
            Based on {(dailyKm * 365).toLocaleString()} km/yr riding
          </span>
        </div>
      </div>

      {/* Main Chart & Breakdown Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Interactive SVG Cumulative Chart */}
        <div className="lg:col-span-2 bg-[#080a11] rounded-xl border border-white/[0.06] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-200">
              Cumulative Ownership Expenditure (Month 0 to Month 36)
            </span>
            <span className="font-mono tabular-nums text-slate-400">
              Inspecting Month {activePoint.month}:{' '}
              <strong className="text-cyan-300">{formatPKR(activePoint.evCumulative)}</strong> EV vs{' '}
              <strong className="text-amber-300">{formatPKR(activePoint.petrolCumulative)}</strong> Petrol
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-auto min-w-[520px] select-none"
              onMouseLeave={() => setHoverMonth(null)}
            >
              {/* Horizontal Grid Lines & Y-Axis Labels */}
              {yTicks.map((val, i) => {
                const y = getY(val);
                return (
                  <g key={i}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padL - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="10"
                      className="font-mono"
                    >
                      {(val / 1000).toFixed(0)}k
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Labels */}
              {xTicks.map((m) => (
                <text
                  key={m}
                  x={getX(m)}
                  y={chartH - 12}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  className="font-mono"
                >
                  M{m}
                </text>
              ))}

              {/* Break-even vertical guide */}
              {analysis.breakEvenMonth !== null && analysis.breakEvenMonth > 0 && (
                <g>
                  <line
                    x1={getX(analysis.breakEvenMonth)}
                    y1={padT}
                    x2={getX(analysis.breakEvenMonth)}
                    y2={chartH - padB}
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={getX(analysis.breakEvenMonth) + 4}
                    y={padT + 12}
                    fill="#34d399"
                    fontSize="10"
                    fontWeight="600"
                  >
                    Break-even M{analysis.breakEvenMonth}
                  </text>
                </g>
              )}

              {/* Petrol Curve */}
              <path d={petrolPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

              {/* EV Curve */}
              <path d={evPath} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />

              {/* Hover Vertical Indicator & Dots */}
              <line
                x1={getX(activePoint.month)}
                y1={padT}
                x2={getX(activePoint.month)}
                y2={chartH - padB}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />
              <circle
                cx={getX(activePoint.month)}
                cy={getY(activePoint.petrolCumulative)}
                r="4.5"
                fill="#f59e0b"
                stroke="#080a11"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(activePoint.month)}
                cy={getY(activePoint.evCumulative)}
                r="4.5"
                fill="#22d3ee"
                stroke="#080a11"
                strokeWidth="1.5"
              />

              {/* Invisible interactive columns for smooth hover */}
              {analysis.monthsData.map((d) => (
                <rect
                  key={d.month}
                  x={getX(d.month) - plotW / 72}
                  y={padT}
                  width={plotW / 36}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHoverMonth(d.month)}
                  onClick={() => setHoverMonth(d.month)}
                  className="cursor-crosshair"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Monthly Expense Breakdown Table */}
        <div className="bg-[#080a11] rounded-xl border border-white/[0.06] p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Monthly Cost Breakdown</h3>

          <div className="space-y-3 text-xs">
            <div className="pb-3 border-b border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-cyan-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <BatteryCharging className="w-4 h-4" />
                  {evProduct.name}
                </span>
                <button
                  onClick={() => onSelectProduct(evProduct.id)}
                  className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Specs
                </button>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Electricity / Charging</span>
                <span className="font-mono tabular-nums text-white">{formatPKR(analysis.evCost.monthlyEnergyCost)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Service & Wear</span>
                <span className="font-mono tabular-nums text-white">{formatPKR(analysis.evCost.monthlyMaintCost)}</span>
              </div>
              <div className="flex justify-between font-semibold text-white pt-1">
                <span>Total Monthly</span>
                <span className="font-mono tabular-nums text-cyan-300">{formatPKR(analysis.evCost.totalMonthlyCost)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-amber-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Fuel className="w-4 h-4" />
                  {petrolProduct.name}
                </span>
                <button
                  onClick={() => onSelectProduct(petrolProduct.id)}
                  className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Specs
                </button>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fuel Expense</span>
                <span className="font-mono tabular-nums text-white">{formatPKR(analysis.petrolCost.monthlyEnergyCost)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Oil, Filters & Tuning</span>
                <span className="font-mono tabular-nums text-white">{formatPKR(analysis.petrolCost.monthlyMaintCost)}</span>
              </div>
              <div className="flex justify-between font-semibold text-white pt-1">
                <span>Total Monthly</span>
                <span className="font-mono tabular-nums text-amber-300">{formatPKR(analysis.petrolCost.totalMonthlyCost)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-xs text-slate-400 flex items-center justify-between">
            <span>Per-km Energy Cost</span>
            <span className="font-mono tabular-nums text-slate-200">
              PKR {analysis.evCost.metrics.runningCostPerKmPkr.toFixed(2)} vs {analysis.petrolCost.metrics.runningCostPerKmPkr.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
