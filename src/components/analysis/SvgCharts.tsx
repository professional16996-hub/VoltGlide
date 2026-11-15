import React, { useState } from 'react';

export interface ChartSlice {
  id: string;
  label: string;
  value: number;
  secondaryText?: string;
  color: string;
}

interface InteractiveDonutChartProps {
  slices: ChartSlice[];
  centerLabel: string;
  centerValue: string;
  valueFormatter?: (val: number) => string;
  emptyText?: string;
  defaultVariant?: 'donut' | 'pie';
}

export const InteractiveDonutChart: React.FC<InteractiveDonutChartProps> = ({
  slices,
  centerLabel,
  centerValue,
  valueFormatter = (v) => v.toLocaleString(),
  emptyText = 'No chart data recorded yet.',
  defaultVariant = 'donut'
}) => {
  const [variant, setVariant] = useState<'donut' | 'pie'>(defaultVariant);
  const [activeId, setActiveId] = useState<string | null>(null);

  const nonZero = slices.filter((s) => s.value > 0);
  const total = nonZero.reduce((sum, s) => sum + s.value, 0);
  const activeSlice = nonZero.find((s) => s.id === activeId) || null;

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 86;
  const innerR = variant === 'pie' ? 0 : 54;

  const polarToCartesian = (r: number, angleRad: number) => ({
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad)
  });

  const buildArcPath = (startAngle: number, endAngle: number, rOut: number, rIn: number) => {
    const startOut = polarToCartesian(rOut, startAngle);
    const endOut = polarToCartesian(rOut, endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    if (rIn <= 0) {
      return `M ${cx} ${cy} L ${startOut.x.toFixed(2)} ${startOut.y.toFixed(2)} A ${rOut} ${rOut} 0 ${largeArc} 1 ${endOut.x.toFixed(2)} ${endOut.y.toFixed(2)} Z`;
    }

    const endIn = polarToCartesian(rIn, endAngle);
    const startIn = polarToCartesian(rIn, startAngle);
    return [
      `M ${startOut.x.toFixed(2)} ${startOut.y.toFixed(2)}`,
      `A ${rOut} ${rOut} 0 ${largeArc} 1 ${endOut.x.toFixed(2)} ${endOut.y.toFixed(2)}`,
      `L ${endIn.x.toFixed(2)} ${endIn.y.toFixed(2)}`,
      `A ${rIn} ${rIn} 0 ${largeArc} 0 ${startIn.x.toFixed(2)} ${startIn.y.toFixed(2)}`,
      'Z'
    ].join(' ');
  };

  let runningAngle = -Math.PI / 2;
  const geometry = nonZero.map((slice) => {
    const frac = slice.value / Math.max(total, 1);
    const sweep = frac * Math.PI * 2;
    const startAngle = runningAngle;
    const endAngle = runningAngle + sweep;
    runningAngle = endAngle;
    return {
      ...slice,
      pct: Math.round(frac * 100),
      startAngle,
      endAngle
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <div className="inline-flex items-center gap-1 p-0.5 bg-[#080a11] border border-slate-800 rounded-lg text-[11px]">
          <button
            type="button"
            onClick={() => setVariant('donut')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              variant === 'donut' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Donut Circle
          </button>
          <button
            type="button"
            onClick={() => setVariant('pie')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              variant === 'pie' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Solid Pie
          </button>
        </div>
      </div>

      {total <= 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-40 h-40">
            <circle
              cx={cx}
              cy={cy}
              r={70}
              fill="none"
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="20"
              strokeDasharray="6 6"
            />
            <text x={cx} y={cy + 4} textAnchor="middle" fill="#64748b" fontSize="11">
              No Data
            </text>
          </svg>
          <p className="text-xs text-slate-400 text-center">{emptyText}</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* SVG Circle / Donut */}
          <div className="relative shrink-0">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-48 h-48 sm:w-52 sm:h-52 select-none"
              onMouseLeave={() => setActiveId(null)}
            >
              {geometry.length === 1 ? (
                <g
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveId(geometry[0].id)}
                  onClick={() =>
                    setActiveId((prev) => (prev === geometry[0].id ? null : geometry[0].id))
                  }
                >
                  {variant === 'pie' ? (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={activeId === geometry[0].id ? outerR + 4 : outerR}
                      fill={geometry[0].color}
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                  ) : (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={(outerR + innerR) / 2}
                      fill="none"
                      stroke={geometry[0].color}
                      strokeWidth={outerR - innerR + (activeId === geometry[0].id ? 4 : 0)}
                    />
                  )}
                </g>
              ) : (
                geometry.map((seg) => {
                  const isActive = activeId === seg.id;
                  const rOut = isActive ? outerR + 5 : outerR;
                  return (
                    <path
                      key={seg.id}
                      d={buildArcPath(seg.startAngle, seg.endAngle, rOut, innerR)}
                      fill={seg.color}
                      stroke="#0f172a"
                      strokeWidth="2"
                      opacity={activeId && !isActive ? 0.45 : 1}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setActiveId(seg.id)}
                      onClick={() => setActiveId((prev) => (prev === seg.id ? null : seg.id))}
                    />
                  );
                })
              )}

              {/* Center Readout for Donut */}
              {variant === 'donut' && (
                <g className="pointer-events-none">
                  <text
                    x={cx}
                    y={cy - 7}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10.5"
                    fontWeight="500"
                  >
                    {activeSlice ? activeSlice.label.slice(0, 16) : centerLabel}
                  </text>
                  <text
                    x={cx}
                    y={cy + 14}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="15"
                    fontWeight="700"
                    className="font-mono"
                  >
                    {activeSlice ? `${Math.round((activeSlice.value / total) * 100)}%` : centerValue}
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Interactive Legend */}
          <div className="flex-1 w-full space-y-2">
            {geometry.map((seg) => {
              const isActive = activeId === seg.id;
              return (
                <button
                  key={seg.id}
                  type="button"
                  onMouseEnter={() => setActiveId(seg.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onClick={() => setActiveId((prev) => (prev === seg.id ? null : seg.id))}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left border ${
                    isActive
                      ? 'bg-slate-800/90 border-cyan-500/40'
                      : 'bg-slate-900/60 border-transparent hover:border-slate-700'
                  }`}
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-slate-200 font-medium truncate">{seg.label}</span>
                  </span>
                  <span className="font-mono tabular-nums text-white font-semibold shrink-0">
                    {valueFormatter(seg.value)}{' '}
                    <span className="text-slate-400 font-normal">({seg.pct}%)</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export interface TimelinePoint {
  label: string;
  value: number;
  subValue?: string;
}

interface InteractiveAreaLineChartProps {
  points: TimelinePoint[];
  valueFormatter?: (v: number) => string;
  accentColor?: string;
  emptyText?: string;
}

export const InteractiveAreaLineChart: React.FC<InteractiveAreaLineChartProps> = ({
  points,
  valueFormatter = (v) => v.toLocaleString(),
  accentColor = '#22d3ee',
  emptyText = 'No timeline data yet.'
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (points.length === 0) {
    return <div className="py-10 text-center text-xs text-slate-400">{emptyText}</div>;
  }

  const chartW = 540;
  const chartH = 220;
  const padL = 54;
  const padR = 20;
  const padT = 22;
  const padB = 34;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxVal = Math.max(...points.map((p) => p.value), 1);
  const yMax = maxVal * 1.15;

  const getX = (idx: number) =>
    points.length === 1 ? padL + plotW / 2 : padL + (idx / (points.length - 1)) * plotW;
  const getY = (val: number) => padT + plotH - (val / yMax) * plotH;

  const coords = points.map((p, i) => ({
    ...p,
    x: getX(i),
    y: getY(p.value)
  }));

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    coords.length === 1
      ? `M ${(coords[0].x - 36).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${(coords[0].x - 36).toFixed(1)} ${coords[0].y.toFixed(1)} L ${(coords[0].x + 36).toFixed(1)} ${coords[0].y.toFixed(1)} L ${(coords[0].x + 36).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`
      : `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  const activeIdx = hoverIdx !== null ? Math.min(hoverIdx, coords.length - 1) : coords.length - 1;
  const activePoint = coords[activeIdx];
  const gradientId = `areaGrad-${accentColor.replace('#', '')}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-900/70 px-3 py-2 rounded-lg border border-slate-800/80">
        <span className="text-slate-400">
          Period: <strong className="text-white">{activePoint.label}</strong>
        </span>
        <span className="font-mono tabular-nums text-cyan-300 font-semibold">
          {valueFormatter(activePoint.value)}
          {activePoint.subValue ? ` · ${activePoint.subValue}` : ''}
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full h-auto min-w-[360px] select-none"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 0.33, 0.66, 1].map((t, idx) => {
            const val = yMax * t;
            const y = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={padL}
                  y1={y}
                  x2={chartW - padR}
                  y2={y}
                  stroke="rgba(148,163,184,0.12)"
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
                  {val >= 1000 ? `${Math.round(val / 1000)}k` : Math.round(val)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill={`url(#${gradientId})`} />
          {coords.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke={accentColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Crosshair */}
          <line
            x1={activePoint.x}
            y1={padT}
            x2={activePoint.x}
            y2={padT + plotH}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="3 3"
          />

          {/* Nodes & X Labels */}
          {coords.map((c, idx) => {
            const isActive = idx === activeIdx;
            return (
              <g
                key={`${c.label}-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIdx(idx)}
                onClick={() => setHoverIdx(idx)}
              >
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isActive ? 6 : 4}
                  fill={accentColor}
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                <text
                  x={c.x}
                  y={chartH - 10}
                  textAnchor="middle"
                  fill={isActive ? '#e2e8f0' : '#64748b'}
                  fontSize="10"
                  fontWeight={isActive ? '600' : '400'}
                >
                  {c.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export interface ColumnBarItem {
  id: string;
  label: string;
  value: number;
  subLabel?: string;
  color: string;
}

interface InteractiveColumnChartProps {
  items: ColumnBarItem[];
  valueFormatter?: (v: number) => string;
  emptyText?: string;
}

export const InteractiveColumnChart: React.FC<InteractiveColumnChartProps> = ({
  items,
  valueFormatter = (v) => v.toLocaleString(),
  emptyText = 'No items available for column comparison.'
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);

  if (items.length === 0) {
    return <div className="py-10 text-center text-xs text-slate-400">{emptyText}</div>;
  }

  const safeIdx = Math.min(activeIdx, items.length - 1);
  const activeItem = items[safeIdx];

  const chartW = 540;
  const chartH = 230;
  const padL = 52;
  const padR = 16;
  const padT = 26;
  const padB = 46;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxVal = Math.max(...items.map((it) => it.value), 1);
  const yMax = maxVal * 1.15;
  const slotW = plotW / items.length;
  const barW = Math.min(44, Math.max(18, slotW * 0.56));

  const getY = (val: number) => padT + plotH - (val / yMax) * plotH;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-900/70 px-3 py-2 rounded-lg border border-slate-800/80">
        <span className="text-white font-semibold truncate">{activeItem.label}</span>
        <span className="font-mono tabular-nums text-cyan-300 font-semibold">
          {valueFormatter(activeItem.value)}
          {activeItem.subLabel ? ` · ${activeItem.subLabel}` : ''}
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto min-w-[380px] select-none">
          {[0, 0.33, 0.66, 1].map((t, idx) => {
            const val = yMax * t;
            const y = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={padL}
                  y1={y}
                  x2={chartW - padR}
                  y2={y}
                  stroke="rgba(148,163,184,0.12)"
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
                  {val >= 1000 ? `${Math.round(val / 1000)}k` : Math.round(val)}
                </text>
              </g>
            );
          })}

          {items.map((item, idx) => {
            const centerX = padL + idx * slotW + slotW / 2;
            const barH = item.value > 0 ? Math.max(6, (item.value / yMax) * plotH) : 4;
            const barX = centerX - barW / 2;
            const barY = padT + plotH - barH;
            const isActive = idx === safeIdx;
            const shortName = item.label.length > 11 ? `${item.label.slice(0, 10)}…` : item.label;

            return (
              <g
                key={item.id}
                className="cursor-pointer"
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => setActiveIdx(idx)}
              >
                <rect
                  x={barX}
                  y={barY}
                  width={barW}
                  height={barH}
                  rx="5"
                  fill={item.value > 0 ? item.color : '#334155'}
                  opacity={isActive ? 1 : 0.72}
                  stroke={isActive ? '#ffffff' : 'none'}
                  strokeWidth={isActive ? '1.2' : '0'}
                />
                {isActive && (
                  <text
                    x={centerX}
                    y={barY - 6}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="700"
                    className="font-mono"
                  >
                    {item.value >= 1000 ? `${Math.round(item.value / 1000)}k` : item.value}
                  </text>
                )}
                <text
                  x={centerX}
                  y={chartH - 18}
                  textAnchor="middle"
                  fill={isActive ? '#ffffff' : '#94a3b8'}
                  fontSize="9.5"
                  fontWeight={isActive ? '600' : '400'}
                >
                  {shortName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export interface RadarSeries {
  id: string;
  label: string;
  color: string;
  values: number[]; // Normalized 0-100 matching axes order
  rawValues?: string[];
}

interface InteractiveRadarChartProps {
  axes: string[];
  series: RadarSeries[];
  emptyText?: string;
}

export const InteractiveRadarChart: React.FC<InteractiveRadarChartProps> = ({
  axes,
  series,
  emptyText = 'Add at least two series to draw radar comparison.'
}) => {
  const [focusedSeriesId, setFocusedSeriesId] = useState<string | null>(null);

  if (axes.length < 3 || series.length === 0) {
    return <div className="py-10 text-center text-xs text-slate-400">{emptyText}</div>;
  }

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 86;
  const levels = [0.25, 0.5, 0.75, 1];
  const N = axes.length;

  const pointAt = (axisIndex: number, scale: number) => {
    const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / N;
    return {
      x: cx + radius * scale * Math.cos(angle),
      y: cy + radius * scale * Math.sin(angle),
      cos: Math.cos(angle)
    };
  };

  const activeSeries = series.find((s) => s.id === focusedSeriesId) || series[0];

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-64 h-64 sm:w-72 sm:h-72 select-none">
          {/* Concentric Web Rings */}
          {levels.map((lvl) => {
            const pts = axes
              .map((_, i) => {
                const p = pointAt(i, lvl);
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              })
              .join(' ');
            return (
              <polygon
                key={lvl}
                points={pts}
                fill="none"
                stroke="rgba(148,163,184,0.16)"
                strokeWidth="1"
              />
            );
          })}

          {/* Axis Spokes & Labels */}
          {axes.map((axis, i) => {
            const end = pointAt(i, 1);
            const labelPos = pointAt(i, 1.24);
            const anchor =
              Math.abs(labelPos.cos) < 0.2 ? 'middle' : labelPos.cos > 0 ? 'start' : 'end';
            return (
              <g key={axis}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={end.x}
                  y2={end.y}
                  stroke="rgba(148,163,184,0.18)"
                  strokeWidth="1"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y + 3}
                  textAnchor={anchor}
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="600"
                >
                  {axis}
                </text>
              </g>
            );
          })}

          {/* Series Polygons */}
          {series.map((s) => {
            const isDimmed = focusedSeriesId !== null && focusedSeriesId !== s.id;
            const polyPoints = axes
              .map((_, i) => {
                const v = Math.min(100, Math.max(10, s.values[i] ?? 10));
                const p = pointAt(i, v / 100);
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              })
              .join(' ');

            return (
              <g
                key={s.id}
                className="cursor-pointer"
                onMouseEnter={() => setFocusedSeriesId(s.id)}
                onMouseLeave={() => setFocusedSeriesId(null)}
                onClick={() => setFocusedSeriesId((prev) => (prev === s.id ? null : s.id))}
              >
                <polygon
                  points={polyPoints}
                  fill={s.color}
                  fillOpacity={isDimmed ? 0.05 : 0.2}
                  stroke={s.color}
                  strokeWidth={isDimmed ? '1.2' : '2.2'}
                  strokeOpacity={isDimmed ? 0.35 : 1}
                />
                {!isDimmed &&
                  axes.map((_, i) => {
                    const v = Math.min(100, Math.max(10, s.values[i] ?? 10));
                    const p = pointAt(i, v / 100);
                    return (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="3.2"
                        fill={s.color}
                        stroke="#0f172a"
                        strokeWidth="1.2"
                      />
                    );
                  })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Series Selector + Metric Breakdown */}
      <div className="flex-1 w-full space-y-3">
        <div className="flex flex-wrap gap-2">
          {series.map((s) => {
            const isSelected = activeSeries?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onMouseEnter={() => setFocusedSeriesId(s.id)}
                onClick={() => setFocusedSeriesId(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-2 border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="truncate max-w-[140px]">{s.label}</span>
              </button>
            );
          })}
        </div>

        {activeSeries && (
          <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-3.5 space-y-2">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: activeSeries.color }}
              />
              <span>{activeSeries.label} — Spider Breakdown</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {axes.map((axis, i) => (
                <div key={axis} className="flex items-center justify-between gap-2 bg-slate-950/60 px-2.5 py-1.5 rounded-lg">
                  <span className="text-slate-400 truncate">{axis}</span>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    {activeSeries.rawValues?.[i] ?? `${Math.round(activeSeries.values[i] ?? 0)}/100`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface RadialGaugeRingProps {
  percentage: number;
  label: string;
  sublabel?: string;
  color?: string;
  size?: number;
}

export const RadialGaugeRing: React.FC<RadialGaugeRingProps> = ({
  percentage,
  label,
  sublabel,
  color = '#22d3ee',
  size = 86
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const strokeWidth = 8;
  const r = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center text-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(148,163,184,0.16)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono tabular-nums text-sm font-bold text-white">{clamped}%</span>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-200">{label}</div>
        {sublabel && <div className="text-[11px] text-slate-400 font-mono tabular-nums">{sublabel}</div>}
      </div>
    </div>
  );
};
