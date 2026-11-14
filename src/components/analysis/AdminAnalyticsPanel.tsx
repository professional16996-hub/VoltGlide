import React, { useMemo, useState } from 'react';
import { Order, Product, Review, ContactInquiry } from '../../types.ts';
import { formatPKR } from '../../utils/formatters.ts';
import { BarChart3, TrendingUp, MapPin, PieChart, Layers } from 'lucide-react';

interface AdminAnalyticsPanelProps {
  orders: Order[];
  products: Product[];
  reviews: Review[];
  inquiries: ContactInquiry[];
  customersCount: number;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Pending', color: '#f59e0b' },
  Confirmed: { label: 'Confirmed', color: '#10b981' },
  Shipped: { label: 'Shipped', color: '#22d3ee' },
  Delivered: { label: 'Delivered', color: '#3b82f6' },
  Cancelled: { label: 'Cancelled', color: '#ef4444' }
};

export const AdminAnalyticsPanel: React.FC<AdminAnalyticsPanelProps> = ({
  orders,
  products,
  reviews,
  inquiries,
  customersCount
}) => {
  const [excludeCancelled, setExcludeCancelled] = useState<boolean>(true);

  const validOrders = useMemo(
    () => (excludeCancelled ? orders.filter((o) => o.status !== 'Cancelled') : orders),
    [orders, excludeCancelled]
  );

  // 1. Revenue & Order Metrics + Daily/Monthly Trend
  const revenueTrend = useMemo(() => {
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const avgOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    // Group orders by month (YYYY-MM) or date if fewer than 2 distinct months
    const monthBuckets = new Map<string, { label: string; revenue: number; count: number }>();
    validOrders.forEach((o) => {
      const d = new Date(o.createdAt || Date.now());
      const key = isNaN(d.getTime())
        ? 'Recent'
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = isNaN(d.getTime())
        ? 'Recent'
        : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const prev = monthBuckets.get(key) || { label, revenue: 0, count: 0 };
      prev.revenue += Number(o.totalAmount) || 0;
      prev.count += 1;
      monthBuckets.set(key, prev);
    });

    const timeline = Array.from(monthBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, val]) => val);

    return { totalRevenue, avgOrderValue, timeline };
  }, [validOrders]);

  // 2. Category & Top Model Demand Analysis
  const demandAnalysis = useMemo(() => {
    const productMap = new Map<string, { name: string; category: string; units: number; revenue: number; stockPrice: number }>();
    products.forEach((p) => {
      productMap.set(p.id, {
        name: p.name,
        category: p.category,
        units: 0,
        revenue: 0,
        stockPrice: p.price
      });
    });

    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.units += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          productMap.set(item.productId || item.productName, {
            name: item.productName,
            category: 'Other',
            units: item.quantity,
            revenue: item.price * item.quantity,
            stockPrice: item.price
          });
        }
      });
    });

    const topModels = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue || b.units - a.units || b.stockPrice - a.stockPrice)
      .slice(0, 6);

    const catStats = new Map<string, { category: string; modelsCount: number; unitsSold: number; revenue: number }>();
    products.forEach((p) => {
      const c = catStats.get(p.category) || { category: p.category, modelsCount: 0, unitsSold: 0, revenue: 0 };
      c.modelsCount += 1;
      catStats.set(p.category, c);
    });
    Array.from(productMap.values()).forEach((m) => {
      const c = catStats.get(m.category) || { category: m.category, modelsCount: 0, unitsSold: 0, revenue: 0 };
      c.unitsSold += m.units;
      c.revenue += m.revenue;
      catStats.set(m.category, c);
    });

    return {
      topModels,
      categories: Array.from(catStats.values()).sort((a, b) => b.revenue - a.revenue || b.modelsCount - a.modelsCount)
    };
  }, [validOrders, products]);

  // 3. City Geographic Analysis
  const cityAnalysis = useMemo(() => {
    const cityMap = new Map<string, { city: string; orders: number; revenue: number }>();
    validOrders.forEach((o) => {
      const rawCity = (o.city || 'Other').split('(')[0].trim();
      const prev = cityMap.get(rawCity) || { city: rawCity, orders: 0, revenue: 0 };
      prev.orders += 1;
      prev.revenue += Number(o.totalAmount) || 0;
      cityMap.set(rawCity, prev);
    });
    return Array.from(cityMap.values()).sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);
  }, [validOrders]);

  // 4. Status Funnel & Payment Method Mix
  const operationsMix = useMemo(() => {
    const statuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((status) => {
      const count = orders.filter((o) => o.status === status).length;
      const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
      return { status, count, pct, color: STATUS_META[status]?.color || '#64748b' };
    });

    const paymentMethods = ['Cash on Delivery', 'Bank Transfer / Raast', 'Online Card'].map((method) => {
      const matching = validOrders.filter((o) => o.paymentMethod === method);
      const revenue = matching.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      const pct = validOrders.length > 0 ? Math.round((matching.length / validOrders.length) * 100) : 0;
      return { method, count: matching.length, revenue, pct };
    });

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
        : '5.00';

    return { statuses, paymentMethods, avgRating };
  }, [orders, validOrders, reviews]);

  const maxModelRev = Math.max(...demandAnalysis.topModels.map((m) => m.revenue), 1);
  const maxCityRev = Math.max(...cityAnalysis.map((c) => c.revenue), 1);
  const maxTimelineRev = Math.max(...revenueTrend.timeline.map((t) => t.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Top Filter & Summary Header */}
      <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-heading">
            Business Intelligence & 4-Way Store Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Live metrics computed from {orders.length} orders · {products.length} scooties · {customersCount} registered customers · {inquiries.length} leads
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={excludeCancelled}
            onChange={(e) => setExcludeCancelled(e.target.checked)}
            className="w-4 h-4 accent-cyan-400 rounded"
          />
          <span>Exclude cancelled orders from revenue</span>
        </label>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Net Order Volume</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {formatPKR(revenueTrend.totalRevenue)}
          </p>
          <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
            Across {validOrders.length} active orders
          </span>
        </div>

        <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Average Order Value</span>
          <p className="text-xl sm:text-2xl font-bold text-cyan-300 font-mono tabular-nums">
            {formatPKR(revenueTrend.avgOrderValue)}
          </p>
          <span className="text-[11px] text-slate-500 block">Per customer checkout</span>
        </div>

        <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Catalog Avg Rating</span>
          <p className="text-xl sm:text-2xl font-bold text-amber-300 font-mono tabular-nums">
            {operationsMix.avgRating} / 5.0
          </p>
          <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
            {reviews.length} customer reviews
          </span>
        </div>

        <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Lead-to-Order Ratio</span>
          <p className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
            {inquiries.length > 0
              ? `${Math.min(100, Math.round((validOrders.length / inquiries.length) * 100))}%`
              : `${validOrders.length} Direct`}
          </p>
          <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
            {inquiries.length} inquiries logged
          </span>
        </div>
      </div>

      {/* 2x2 Grid of 4 Admin Analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Analysis 1: Revenue & Order Trend */}
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">1. Revenue & Booking Timeline</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">
              {revenueTrend.timeline.length} period(s)
            </span>
          </div>

          {revenueTrend.timeline.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No active orders recorded yet. New online and WhatsApp checkouts will plot here automatically.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {revenueTrend.timeline.map((row) => {
                const pct = Math.max(8, Math.round((row.revenue / maxTimelineRev) * 100));
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-200">{row.label}</span>
                      <span className="font-mono tabular-nums text-cyan-300 font-semibold">
                        {formatPKR(row.revenue)} · {row.count} order{row.count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin Analysis 2: Model & Category Demand */}
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">2. Top Demanded Models & Categories</h3>
            </div>
            <span className="text-[11px] text-slate-400">By booked revenue</span>
          </div>

          <div className="space-y-3">
            {demandAnalysis.topModels.map((m) => {
              const barPct = m.revenue > 0 ? Math.max(10, Math.round((m.revenue / maxModelRev) * 100)) : 4;
              return (
                <div key={m.name} className="space-y-1">
                  <div className="flex justify-between text-xs gap-2">
                    <span className="text-slate-200 font-medium truncate">
                      {m.name} <span className="text-slate-500">· {m.category}</span>
                    </span>
                    <span className="font-mono tabular-nums text-white shrink-0">
                      {m.units > 0 ? `${m.units} sold · ${formatPKR(m.revenue)}` : '0 booked'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.revenue > 0 ? 'bg-cyan-400' : 'bg-slate-700'}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Admin Analysis 3: City-Wise Geographic Distribution */}
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">3. City-Wise Geographic Demand</h3>
            </div>
            <span className="text-[11px] text-slate-400">{cityAnalysis.length} cities</span>
          </div>

          {cityAnalysis.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No city order breakdown available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {cityAnalysis.map((c) => {
                const pct = Math.max(10, Math.round((c.revenue / maxCityRev) * 100));
                return (
                  <div key={c.city} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-white">{c.city}</span>
                      <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                        {c.orders} order{c.orders === 1 ? '' : 's'} · {formatPKR(c.revenue)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin Analysis 4: Fulfillment Status Funnel & Payment Mix */}
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">4. Order Status Funnel & Payment Mix</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums">{orders.length} total</span>
          </div>

          {/* Stacked Fulfillment Bar */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Order Status Distribution</span>
            </div>
            <div className="h-3.5 w-full rounded-full overflow-hidden bg-slate-900 flex">
              {operationsMix.statuses.map(
                (s) =>
                  s.count > 0 && (
                    <div
                      key={s.status}
                      style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                      title={`${s.status}: ${s.count} (${s.pct}%)`}
                    />
                  )
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
              {operationsMix.statuses.map((s) => (
                <div key={s.status} className="flex items-center justify-between bg-slate-900/70 px-2.5 py-1.5 rounded-lg">
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                    <span>{s.status}</span>
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-white">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Split */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-xs font-medium text-slate-300">Payment Method Preference</div>
            <div className="space-y-2">
              {operationsMix.paymentMethods.map((pm) => (
                <div key={pm.method} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{pm.method}</span>
                  <span className="font-mono tabular-nums text-slate-200">
                    {pm.count} ({pm.pct}%) · <strong className="text-cyan-300">{formatPKR(pm.revenue)}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
