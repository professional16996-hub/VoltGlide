import React, { useMemo, useState } from 'react';
import { Order, Product, Review, ContactInquiry } from '../../types.ts';
import { formatPKR } from '../../utils/formatters.ts';
import { parseProductMetrics } from '../../utils/specParser.ts';
import {
  InteractiveDonutChart,
  InteractiveAreaLineChart,
  InteractiveColumnChart,
  InteractiveRadarChart,
  RadialGaugeRing,
  ChartSlice,
  RadarSeries
} from './SvgCharts.tsx';
import { BarChart3, TrendingUp, PieChart, Radar, Gauge } from 'lucide-react';

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

const PALETTE = ['#22d3ee', '#3b82f6', '#10b981', '#f59e0b', '#a78bfa', '#ec4899'];

export const AdminAnalyticsPanel: React.FC<AdminAnalyticsPanelProps> = ({
  orders,
  products,
  reviews,
  inquiries,
  customersCount
}) => {
  const [excludeCancelled, setExcludeCancelled] = useState<boolean>(true);
  const [timelineChartType, setTimelineChartType] = useState<'area' | 'column'>('area');
  const [timelineGranularity, setTimelineGranularity] = useState<'daily' | 'monthly'>('daily');
  const [circleDataset, setCircleDataset] = useState<'status' | 'category' | 'payment' | 'city'>('status');
  const [columnSubject, setColumnSubject] = useState<'models' | 'cities'>('models');

  const validOrders = useMemo(
    () => (excludeCancelled ? orders.filter((o) => o.status !== 'Cancelled') : orders),
    [orders, excludeCancelled]
  );

  // 1. Revenue & Order Timeline (supports daily & monthly)
  const revenueTrend = useMemo(() => {
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const avgOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    const buckets = new Map<string, { label: string; revenue: number; count: number }>();
    validOrders.forEach((o) => {
      const d = new Date(o.createdAt || Date.now());
      const validDate = !isNaN(d.getTime());
      const key = !validDate
        ? 'Recent'
        : timelineGranularity === 'daily'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = !validDate
        ? 'Recent'
        : timelineGranularity === 'daily'
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const prev = buckets.get(key) || { label, revenue: 0, count: 0 };
      prev.revenue += Number(o.totalAmount) || 0;
      prev.count += 1;
      buckets.set(key, prev);
    });

    const timeline = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, val]) => val);

    return { totalRevenue, avgOrderValue, timeline };
  }, [validOrders, timelineGranularity]);

  // 2. Category & Top Model Demand Analysis
  const demandAnalysis = useMemo(() => {
    const productMap = new Map<
      string,
      { id: string; name: string; category: string; units: number; revenue: number; stockPrice: number }
    >();
    products.forEach((p) => {
      productMap.set(p.id, {
        id: p.id,
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
          const fallbackId = item.productId || item.productName;
          const prevFallback = productMap.get(fallbackId);
          if (prevFallback) {
            prevFallback.units += item.quantity;
            prevFallback.revenue += item.price * item.quantity;
          } else {
            productMap.set(fallbackId, {
              id: fallbackId,
              name: item.productName,
              category: 'Other',
              units: item.quantity,
              revenue: item.price * item.quantity,
              stockPrice: item.price
            });
          }
        }
      });
    });

    const topModels = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue || b.units - a.units || b.stockPrice - a.stockPrice)
      .slice(0, 6);

    const catStats = new Map<
      string,
      { category: string; modelsCount: number; unitsSold: number; revenue: number }
    >();
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
      categories: Array.from(catStats.values()).sort(
        (a, b) => b.revenue - a.revenue || b.modelsCount - a.modelsCount
      )
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

  // 4. Status Funnel, Payment Mix & Radial Gauge Metrics
  const operationsMix = useMemo(() => {
    const statuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((status) => {
      const count = orders.filter((o) => o.status === status).length;
      const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
      return { status, count, pct, color: STATUS_META[status]?.color || '#64748b' };
    });

    const paymentMethods = ['Cash on Delivery', 'Bank Transfer / Raast', 'Online Card'].map((method, idx) => {
      const matching = validOrders.filter((o) => o.paymentMethod === method);
      const revenue = matching.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      const pct = validOrders.length > 0 ? Math.round((matching.length / validOrders.length) * 100) : 0;
      return {
        method,
        count: matching.length,
        revenue,
        pct,
        color: PALETTE[idx % PALETTE.length]
      };
    });

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
        : '5.00';

    const activeOrdersCount = orders.filter((o) => o.status !== 'Cancelled').length;
    const processedCount = orders.filter(
      (o) => o.status === 'Confirmed' || o.status === 'Shipped' || o.status === 'Delivered'
    ).length;
    const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;
    const codCount = validOrders.filter((o) => o.paymentMethod === 'Cash on Delivery').length;
    const digitalCount = Math.max(0, validOrders.length - codCount);
    const inStockCount = products.filter(
      (p) => p.availability === 'In Stock' || p.availability === 'Limited Stock'
    ).length;

    return {
      statuses,
      paymentMethods,
      avgRating,
      fulfillmentRate: activeOrdersCount > 0 ? Math.round((processedCount / activeOrdersCount) * 100) : 0,
      deliveryRate: activeOrdersCount > 0 ? Math.round((deliveredCount / activeOrdersCount) * 100) : 0,
      digitalShare: validOrders.length > 0 ? Math.round((digitalCount / validOrders.length) * 100) : 0,
      stockReadyRate: products.length > 0 ? Math.round((inStockCount / products.length) * 100) : 0,
      processedCount,
      activeOrdersCount,
      deliveredCount,
      digitalCount,
      inStockCount
    };
  }, [orders, validOrders, reviews, products]);

  // Circle / Donut slices by selected mode
  const circleChartConfig = useMemo((): {
    slices: ChartSlice[];
    centerLabel: string;
    centerValue: string;
    valueFormatter: (v: number) => string;
    emptyText: string;
  } => {
    if (circleDataset === 'status') {
      return {
        slices: operationsMix.statuses.map((s) => ({
          id: s.status,
          label: s.status,
          value: s.count,
          color: s.color
        })),
        centerLabel: 'Total Orders',
        centerValue: `${orders.length}`,
        valueFormatter: (v) => `${v} order${v === 1 ? '' : 's'}`,
        emptyText: 'No orders placed yet. Switch to Scooty Categories to inspect catalog share.'
      };
    }

    if (circleDataset === 'category') {
      const useRevenue = demandAnalysis.categories.some((c) => c.revenue > 0);
      return {
        slices: demandAnalysis.categories.map((c, idx) => ({
          id: c.category,
          label: c.category,
          value: useRevenue ? c.revenue : c.modelsCount,
          color: PALETTE[idx % PALETTE.length]
        })),
        centerLabel: useRevenue ? 'Category Sales' : 'Catalog Models',
        centerValue: useRevenue ? `${demandAnalysis.categories.length} seg` : `${products.length} units`,
        valueFormatter: (v) => (useRevenue ? formatPKR(v) : `${v} model${v === 1 ? '' : 's'}`),
        emptyText: 'No catalog categories found.'
      };
    }

    if (circleDataset === 'payment') {
      return {
        slices: operationsMix.paymentMethods.map((pm) => ({
          id: pm.method,
          label: pm.method,
          value: pm.count,
          color: pm.color
        })),
        centerLabel: 'Checkouts',
        centerValue: `${validOrders.length}`,
        valueFormatter: (v) => `${v} order${v === 1 ? '' : 's'}`,
        emptyText: 'No active orders for payment mix yet.'
      };
    }

    return {
      slices: cityAnalysis.map((c, idx) => ({
        id: c.city,
        label: c.city,
        value: c.revenue > 0 ? c.revenue : c.orders,
        color: PALETTE[idx % PALETTE.length]
      })),
      centerLabel: 'Cities Active',
      centerValue: `${cityAnalysis.length}`,
      valueFormatter: (v) => (v > 100 ? formatPKR(v) : `${v} orders`),
      emptyText: 'No city orders recorded yet.'
    };
  }, [circleDataset, operationsMix, orders.length, demandAnalysis.categories, products.length, validOrders.length, cityAnalysis]);

  // Category Radar Chart Data (Multi-axis comparison across top categories)
  const categoryRadarData = useMemo(() => {
    const axes = ['Catalog Depth', 'Avg Speed', 'Avg Range', 'Avg Rating', 'Booked Demand'];
    const grouped = new Map<string, Product[]>();
    products.forEach((p) => {
      const list = grouped.get(p.category) || [];
      list.push(p);
      grouped.set(p.category, list);
    });

    const maxModels = Math.max(...Array.from(grouped.values()).map((l) => l.length), 1);
    const maxSpeed = Math.max(...products.map((p) => parseProductMetrics(p).topSpeedKmh), 90);
    const maxRange = Math.max(...products.map((p) => parseProductMetrics(p).rangeKm), 120);
    const maxCatRev = Math.max(...demandAnalysis.categories.map((c) => c.revenue), 1);

    const series: RadarSeries[] = Array.from(grouped.entries())
      .slice(0, 4)
      .map(([cat, list], idx) => {
        const avgSpeed = Math.round(
          list.reduce((s, p) => s + parseProductMetrics(p).topSpeedKmh, 0) / Math.max(list.length, 1)
        );
        const avgRange = Math.round(
          list.reduce((s, p) => s + parseProductMetrics(p).rangeKm, 0) / Math.max(list.length, 1)
        );
        const avgRating =
          list.reduce((s, p) => s + p.rating, 0) / Math.max(list.length, 1);
        const catRev = demandAnalysis.categories.find((c) => c.category === cat)?.revenue || 0;

        return {
          id: cat,
          label: cat,
          color: PALETTE[idx % PALETTE.length],
          values: [
            Math.round((list.length / maxModels) * 100),
            Math.round((avgSpeed / maxSpeed) * 100),
            Math.round((avgRange / maxRange) * 100),
            Math.round((avgRating / 5) * 100),
            catRev > 0 ? Math.max(18, Math.round((catRev / maxCatRev) * 100)) : 20
          ],
          rawValues: [
            `${list.length} models`,
            `${avgSpeed} km/h`,
            `${avgRange} km`,
            `${avgRating.toFixed(1)} / 5`,
            catRev > 0 ? formatPKR(catRev) : '0 booked'
          ]
        };
      });

    return { axes, series };
  }, [products, demandAnalysis.categories]);

  // Column Chart Data (Models or Cities)
  const columnItems = useMemo(() => {
    if (columnSubject === 'cities') {
      return cityAnalysis.slice(0, 6).map((c, idx) => ({
        id: c.city,
        label: c.city,
        value: c.revenue,
        subLabel: `${c.orders} order${c.orders === 1 ? '' : 's'}`,
        color: PALETTE[(idx + 2) % PALETTE.length]
      }));
    }
    return demandAnalysis.topModels.map((m, idx) => ({
      id: m.id,
      label: m.name,
      value: m.revenue > 0 ? m.revenue : m.stockPrice,
      subLabel: m.units > 0 ? `${m.units} sold (${m.category})` : `Catalog price · ${m.category}`,
      color: m.revenue > 0 ? PALETTE[idx % PALETTE.length] : '#475569'
    }));
  }, [columnSubject, cityAnalysis, demandAnalysis.topModels]);

  return (
    <div className="space-y-6">
      {/* Top Filter & Summary Header */}
      <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-heading">
            Multi-Chart Business Intelligence Suite
          </h2>
          <p className="text-xs text-slate-400">
            Live visualizations across {orders.length} orders · {products.length} scooties · {customersCount} customers · {inquiries.length} inquiries
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

      {/* 2x2 Primary Multi-Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART TYPE 1: Interactive Circle / Donut / Solid Pie Chart */}
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">1. Circle & Donut Breakdown</h3>
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-[#080a11] rounded-lg border border-slate-800 text-[11px]">
              {[
                { id: 'status', label: 'Status' },
                { id: 'category', label: 'Category' },
                { id: 'payment', label: 'Payment' },
                { id: 'city', label: 'City' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCircleDataset(tab.id as 'status' | 'category' | 'payment' | 'city')}
                  className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    circleDataset === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <InteractiveDonutChart
            slices={circleChartConfig.slices}
            centerLabel={circleChartConfig.centerLabel}
            centerValue={circleChartConfig.centerValue}
            valueFormatter={circleChartConfig.valueFormatter}
            emptyText={circleChartConfig.emptyText}
          />
        </div>

        {/* CHART TYPE 2: Smooth Area + Line Trend Chart (with Vertical Column switch) */}
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">2. Revenue Area & Line Curve</h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-0.5 bg-[#080a11] rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTimelineGranularity('daily')}
                  className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                    timelineGranularity === 'daily' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineGranularity('monthly')}
                  className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                    timelineGranularity === 'monthly' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
              </div>

              <div className="flex items-center gap-1 p-0.5 bg-[#080a11] rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTimelineChartType('area')}
                  className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                    timelineChartType === 'area' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Area Line
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineChartType('column')}
                  className={`px-2 py-1 rounded-md font-medium cursor-pointer ${
                    timelineChartType === 'column' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Columns
                </button>
              </div>
            </div>
          </div>

          {timelineChartType === 'area' ? (
            <InteractiveAreaLineChart
              points={revenueTrend.timeline.map((t) => ({
                label: t.label,
                value: t.revenue,
                subValue: `${t.count} order${t.count === 1 ? '' : 's'}`
              }))}
              valueFormatter={(v) => formatPKR(v)}
              emptyText="No active orders recorded yet. Online & WhatsApp orders will plot here."
            />
          ) : (
            <InteractiveColumnChart
              items={revenueTrend.timeline.map((t, idx) => ({
                id: `${t.label}-${idx}`,
                label: t.label,
                value: t.revenue,
                subLabel: `${t.count} order${t.count === 1 ? '' : 's'}`,
                color: PALETTE[idx % PALETTE.length]
              }))}
              valueFormatter={(v) => formatPKR(v)}
              emptyText="No active orders recorded yet."
            />
          )}
        </div>

        {/* CHART TYPE 3: Vertical Column Demand Chart (Models vs Cities) */}
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">3. Vertical Column Demand</h3>
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-[#080a11] rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setColumnSubject('models')}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                  columnSubject === 'models' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Top Scooties
              </button>
              <button
                type="button"
                onClick={() => setColumnSubject('cities')}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                  columnSubject === 'cities' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                By City
              </button>
            </div>
          </div>

          <InteractiveColumnChart
            items={columnItems}
            valueFormatter={(v) => formatPKR(v)}
            emptyText={
              columnSubject === 'cities'
                ? 'No city order data recorded yet.'
                : 'No model inventory available.'
            }
          />
        </div>

        {/* CHART TYPE 4: Spider / Radar Category Comparison Chart */}
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Radar className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">4. Segment Spider / Radar Web</h3>
            </div>
            <span className="text-[11px] text-slate-400">5-axis category comparison</span>
          </div>

          <InteractiveRadarChart
            axes={categoryRadarData.axes}
            series={categoryRadarData.series}
          />
        </div>
      </div>

      {/* CHART TYPE 5: Circular Radial Gauge Rings Strip */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">5. Circular Operations & Conversion Gauges</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono tabular-nums">
            Live Store Ratios
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-2">
          <RadialGaugeRing
            percentage={operationsMix.fulfillmentRate}
            label="Order Confirmed+"
            sublabel={`${operationsMix.processedCount}/${operationsMix.activeOrdersCount} active`}
            color="#10b981"
          />
          <RadialGaugeRing
            percentage={operationsMix.deliveryRate}
            label="Delivered Rate"
            sublabel={`${operationsMix.deliveredCount}/${operationsMix.activeOrdersCount} completed`}
            color="#3b82f6"
          />
          <RadialGaugeRing
            percentage={operationsMix.digitalShare}
            label="Digital / Bank Mix"
            sublabel={`${operationsMix.digitalCount} online · ${validOrders.length - operationsMix.digitalCount} COD`}
            color="#22d3ee"
          />
          <RadialGaugeRing
            percentage={operationsMix.stockReadyRate}
            label="Showroom Stock Ready"
            sublabel={`${operationsMix.inStockCount}/${products.length} in stock`}
            color="#f59e0b"
          />
        </div>
      </div>
    </div>
  );
};
