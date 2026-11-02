import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Product, Order, Banner, Review, ContactInquiry, AvailabilityType } from '../types.ts';
import { formatPKR } from '../utils/formatters.ts';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  RotateCcw,
  Search,
  Eye,
  LogOut,
  Save,
  Check,
  AlertTriangle
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const {
    adminToken,
    isAdmin,
    adminLogout,
    navigate,
    showToast,
    refreshProducts,
    refreshBanners,
    refreshReviews
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'banners' | 'reviews' | 'inquiries' | 'settings'>('overview');

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalSales: 0,
    totalReviews: 0,
    totalInquiries: 0
  });

  // Data lists
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminBanners, setAdminBanners] = useState<Banner[]>([]);
  const [adminReviews, setAdminReviews] = useState<Review[]>([]);
  const [adminInquiries, setAdminInquiries] = useState<ContactInquiry[]>([]);

  // Search in products
  const [productSearch, setProductSearch] = useState('');

  // Product Add / Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    category: 'Electric',
    brand: 'VoltGlide',
    price: 200000,
    originalPrice: null,
    image: '/images/electric_scooty_blue_1793645309587.jpg',
    shortDescription: '',
    description: '',
    availability: 'In Stock',
    featured: true,
    specs: {
      engineMotor: '2000W Brushless Motor',
      batteryFuel: '72V 32Ah Lithium Battery',
      rangeMileage: '85 km per charge',
      maxSpeed: '65 km/h',
      chargingFuelTime: '4 Hours',
      brakingSystem: 'Front & Rear Disc Brakes',
      curbWeight: '90 kg',
      warranty: '2 Years Comprehensive',
      colors: ['Electric Blue', 'Midnight Black', 'Frost White']
    }
  });

  // Banner Add / Edit Modal
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState<Partial<Banner>>({
    tag: 'NEW LAUNCH 2026',
    title: 'Special Discount on Scooties',
    subtitle: 'Limited time mega offer on electric and petrol models.',
    ctaText: 'Explore Models',
    ctaLink: '/scooties',
    bgGradient: 'from-blue-900 via-slate-900 to-black',
    active: true
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('admin-login');
    }
  }, [isAdmin, navigate]);

  // Load all admin data
  const loadStats = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [adminToken]);

  const loadAdminProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) setAdminProducts(data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadAdminOrders = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success) setAdminOrders(data.data);
    } catch (err) {
      console.error(err);
    }
  }, [adminToken]);

  const loadAdminBanners = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/banners', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success) setAdminBanners(data.data);
    } catch (err) {
      console.error(err);
    }
  }, [adminToken]);

  const loadAdminReviews = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/reviews', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success) setAdminReviews(data.data);
    } catch (err) {
      console.error(err);
    }
  }, [adminToken]);

  const loadAdminInquiries = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/inquiries', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success) setAdminInquiries(data.data);
    } catch (err) {
      console.error(err);
    }
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) {
      loadStats();
      loadAdminProducts();
      loadAdminOrders();
      loadAdminBanners();
      loadAdminReviews();
      loadAdminInquiries();
    }
  }, [adminToken, loadStats, loadAdminProducts, loadAdminOrders, loadAdminBanners, loadAdminReviews, loadAdminInquiries]);

  // Curated Preset Image Selectors for fast easy image switching
  const PRESET_IMAGES = [
    { label: 'E-Pulse Pro (Electric)', url: '/images/electric_scooty_blue_1793645309587.jpg' },
    { label: 'Honda Activa Prime', url: '/images/honda_activa_scooty_1793645327154.jpg' },
    { label: 'Yamaha RayZR Sport', url: '/images/yamaha_sport_scooty_1793645340059.jpg' },
    { label: 'Vespa Classic 150', url: '/images/vespa_classic_scooty_1793645352538.jpg' },
    { label: 'Phantom Sport-X', url: '/images/phantom_sport_scooty_1793645364796.jpg' },
    { label: 'E-Motion Ultra EV', url: '/images/emotion_ultra_scooty_1793645377028.jpg' },
    { label: 'Sparky Youth Scooty', url: '/images/sparky_youth_scooty_1793645388697.jpg' },
    { label: 'Metro CityGlide 100', url: '/images/metro_city_scooty_1793645400497.jpg' }
  ];

  // PRODUCT ACTIONS
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Electric',
      brand: 'VoltGlide',
      price: 215000,
      originalPrice: 235000,
      image: PRESET_IMAGES[0].url,
      shortDescription: 'High-torque electric scooty with removable battery and digital dashboard.',
      description: 'Engineered for smooth daily commuting in Pakistan with high fuel savings and low maintenance.',
      availability: 'In Stock',
      featured: true,
      specs: {
        engineMotor: '2000W Brushless DC Motor',
        batteryFuel: '72V 32Ah Lithium-Ion Battery',
        rangeMileage: '85 - 95 km per charge',
        maxSpeed: '65 km/h',
        chargingFuelTime: '4 Hours (Home Socket)',
        brakingSystem: 'Front & Rear Disc Brakes',
        curbWeight: '88 kg',
        warranty: '2 Years Motor & Battery Warranty',
        colors: ['Electric Blue', 'Midnight Black', 'Frost White']
      }
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({ ...prod });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      showToast('Name and price are required', 'error');
      return;
    }

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(productForm)
      });
      const data = await res.json();

      if (data.success) {
        showToast(editingProduct ? 'Product updated successfully!' : 'Product added successfully!', 'success');
        setIsProductModalOpen(false);
        await Promise.all([loadAdminProducts(), refreshProducts(), loadStats()]);
      } else {
        showToast(data.message || 'Operation failed', 'error');
      }
    } catch {
      showToast('Network error while saving product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Product "${name}" deleted.`, 'info');
        await Promise.all([loadAdminProducts(), refreshProducts(), loadStats()]);
      }
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  // ORDER ACTIONS
  const handleUpdateOrderStatus = async (orderId: string, status: any) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order status updated to "${status}"`, 'success');
        await Promise.all([loadAdminOrders(), loadStats()]);
      }
    } catch {
      showToast('Failed to update order status', 'error');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Delete order #${orderId}?`)) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order #${orderId} deleted.`, 'info');
        await Promise.all([loadAdminOrders(), loadStats()]);
      }
    } catch {
      showToast('Failed to delete order', 'error');
    }
  };

  // BANNER ACTIONS
  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      tag: 'HOT PROMOTION',
      title: 'Summer Ride Deal in Pakistan',
      subtitle: 'Free helmet & delivery on all models this week.',
      ctaText: 'Shop Scooties',
      ctaLink: '/scooties',
      bgGradient: 'from-blue-900 via-slate-900 to-black',
      active: true
    });
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: Banner) => {
    setEditingBanner(b);
    setBannerForm({ ...b });
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(bannerForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingBanner ? 'Banner updated!' : 'Banner added!', 'success');
        setIsBannerModalOpen(false);
        await Promise.all([loadAdminBanners(), refreshBanners()]);
      }
    } catch {
      showToast('Failed to save banner', 'error');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Banner removed.', 'info');
        await Promise.all([loadAdminBanners(), refreshBanners()]);
      }
    } catch {
      showToast('Failed to delete banner', 'error');
    }
  };

  // REVIEW ACTIONS
  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Delete this customer review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Review deleted.', 'info');
        await Promise.all([loadAdminReviews(), refreshReviews(), loadStats()]);
      }
    } catch {
      showToast('Failed to delete review', 'error');
    }
  };

  // RESET DATABASE TO DEFAULT DEMO DATA
  const handleResetDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all products, banners, and sample reviews to original demo dataset?')) return;
    try {
      const res = await fetch('/api/admin/reset-defaults', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Database reset to default demo dataset!', 'success');
        await Promise.all([
          loadStats(),
          loadAdminProducts(),
          loadAdminOrders(),
          loadAdminBanners(),
          loadAdminReviews(),
          loadAdminInquiries(),
          refreshProducts(),
          refreshBanners(),
          refreshReviews()
        ]);
      }
    } catch {
      showToast('Failed to reset database', 'error');
    }
  };

  const filteredAdminProducts = adminProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Admin Header */}
      <div className="bg-[#0f172a] rounded-3xl p-6 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-heading">
                VoltGlide Admin Control Center
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                LIVE PERSISTENT DB
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage inventory, prices, customer orders, promotional banners, and reviews in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('home')}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            View Public Store
          </button>
          <button
            onClick={adminLogout}
            className="py-2 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1.5 border border-rose-500/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
          { id: 'products', label: `Products (${adminProducts.length})`, icon: Package },
          { id: 'orders', label: `Orders (${adminOrders.length})`, icon: ShoppingBag },
          { id: 'banners', label: `Banners (${adminBanners.length})`, icon: ImageIcon },
          { id: 'reviews', label: `Reviews (${adminReviews.length})`, icon: MessageSquare },
          { id: 'settings', label: 'Database & Reset', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-cyan-400'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Total Scooty Models</span>
              <p className="text-3xl font-black text-cyan-300 font-heading">{stats.totalProducts}</p>
              <span className="text-[11px] text-slate-500 block">Electric, Petrol, Sports</span>
            </div>

            <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Total Customer Orders</span>
              <p className="text-3xl font-black text-white font-heading">{stats.totalOrders}</p>
              <span className="text-[11px] text-amber-400 block font-semibold">
                ● {stats.pendingOrders} Pending Processing
              </span>
            </div>

            <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Confirmed Order Sales</span>
              <p className="text-2xl font-black text-emerald-400 font-heading">
                {formatPKR(stats.totalSales)}
              </p>
              <span className="text-[11px] text-slate-500 block">From online bookings</span>
            </div>

            <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Customer Reviews</span>
              <p className="text-3xl font-black text-cyan-400 font-heading">{stats.totalReviews}</p>
              <span className="text-[11px] text-slate-500 block">Verified ratings</span>
            </div>
          </div>

          {/* Quick Actions & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 bg-[#0f172a] rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base font-heading">Recent Customer Orders</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              {adminOrders.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">No customer orders placed yet.</p>
              ) : (
                <div className="space-y-3">
                  {adminOrders.slice(0, 4).map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-300">{order.id}</span>
                          <span className="font-bold text-white">{order.customerName}</span>
                          <span className="text-slate-500">({order.city})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Items: {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-white block">{formatPKR(order.totalAmount)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                          order.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                          order.status === 'Shipped' ? 'bg-blue-500/20 text-cyan-400' :
                          order.status === 'Delivered' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Admin Helpers */}
            <div className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 space-y-4">
              <h3 className="font-bold text-white text-base font-heading">Quick Actions</h3>
              
              <div className="space-y-2.5">
                <button
                  onClick={handleOpenAddProduct}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" />
                  Add New Scooty Model
                </button>

                <button
                  onClick={handleOpenAddBanner}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  Add Promo Banner
                </button>

                <button
                  onClick={handleResetDefaults}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  Restore Demo Products
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>• Changes made here save permanently to the database file.</p>
                <p>• WhatsApp number configured: <strong className="text-emerald-400 font-mono">0321-0424424</strong></p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-slate-900 text-xs text-white placeholder-slate-500 pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>

            <button
              onClick={handleOpenAddProduct}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Scooty
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-[#0f172a] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Scooty</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price (PKR)</th>
                    <th className="p-4">Stock Status</th>
                    <th className="p-4">Battery / Engine</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredAdminProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-950 flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white text-xs">{p.name}</p>
                          <span className="text-[10px] text-slate-500">{p.brand}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-900/50 text-cyan-300 px-2 py-0.5 rounded font-semibold text-[10px] border border-cyan-500/30">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-extrabold text-cyan-300 font-heading">
                          {formatPKR(p.price)}
                        </span>
                        {p.originalPrice && (
                          <span className="text-[10px] text-slate-500 line-through block">
                            {formatPKR(p.originalPrice)}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          p.availability === 'In Stock'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {p.availability}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 max-w-xs truncate">
                        {p.specs.engineMotor} • {p.specs.rangeMileage}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                          title="Edit Scooty"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Delete Scooty"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base font-heading">
              Customer Orders & WhatsApp Bookings ({adminOrders.length})
            </h3>
          </div>

          <div className="space-y-4">
            {adminOrders.length === 0 ? (
              <div className="bg-[#0f172a] rounded-3xl p-12 text-center border border-slate-800 text-slate-400 text-xs">
                No orders registered yet. Orders placed through cart will appear here automatically.
              </div>
            ) : (
              adminOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 space-y-4 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-cyan-400 text-sm">{ord.id}</span>
                        <span className="text-white font-bold">{ord.customerName}</span>
                        <span className="text-slate-400 font-mono">({ord.customerPhone})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {ord.city} • {ord.shippingAddress} • Placed {new Date(ord.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[11px]">Status:</span>
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                          ord.status === 'Confirmed' ? 'bg-emerald-950 text-emerald-300 border-emerald-500' :
                          ord.status === 'Shipped' ? 'bg-blue-950 text-cyan-300 border-cyan-500' :
                          ord.status === 'Delivered' ? 'bg-purple-950 text-purple-300 border-purple-500' :
                          ord.status === 'Cancelled' ? 'bg-rose-950 text-rose-300 border-rose-500' :
                          'bg-amber-950 text-amber-300 border-amber-500'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <button
                        onClick={() => handleDeleteOrder(ord.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ord.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        <img src={item.image} alt={item.productName} className="w-10 h-10 rounded-lg object-cover bg-slate-950" />
                        <div>
                          <p className="font-bold text-white">{item.productName}</p>
                          <p className="text-[11px] text-slate-400">
                            Qty: {item.quantity} • {formatPKR(item.price)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div>
                      <span>Payment Method: <strong className="text-white">{ord.paymentMethod}</strong></span>
                      {ord.notes && <span className="ml-4">Note: "{ord.notes}"</span>}
                    </div>
                    <div className="text-sm font-extrabold text-cyan-300 font-heading">
                      Total: {formatPKR(ord.totalAmount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BANNERS MANAGEMENT */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base font-heading">
              Homepage Promotional Banners ({adminBanners.length})
            </h3>
            <button
              onClick={handleOpenAddBanner}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              Add Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adminBanners.map((banner) => (
              <div
                key={banner.id}
                className={`p-6 rounded-2xl bg-gradient-to-br ${banner.bgGradient} border border-slate-800 space-y-3 flex flex-col justify-between`}
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-cyan-500/30">
                    {banner.tag}
                  </span>
                  <h4 className="font-bold text-white text-sm">{banner.title}</h4>
                  <p className="text-xs text-slate-300">{banner.subtitle}</p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-cyan-300 font-semibold">{banner.ctaText}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditBanner(banner)}
                      className="p-1 text-slate-300 hover:text-white"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-1 text-slate-300 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REVIEWS MANAGEMENT */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base font-heading">
              Customer Reviews ({adminReviews.length})
            </h3>
          </div>

          <div className="space-y-3">
            {adminReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#0f172a] rounded-2xl p-4 border border-slate-800 flex items-start justify-between text-xs gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-white">{rev.customerName}</h5>
                    <span className="text-slate-500">({rev.city})</span>
                    <span className="text-amber-400 font-bold">★ {rev.rating}/5</span>
                    {rev.productName && (
                      <span className="bg-blue-950 text-cyan-400 px-2 py-0.5 rounded text-[10px]">
                        {rev.productName}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 italic leading-relaxed">"{rev.comment}"</p>
                </div>

                <button
                  onClick={() => handleDeleteReview(rev.id)}
                  className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors flex-shrink-0"
                  title="Delete Review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS & DATABASE RESET */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-[#0f172a] rounded-3xl p-8 border border-slate-800 space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-white text-base font-heading">
              Persistent Database & Showroom Settings
            </h3>
            <p className="text-slate-400 mt-1">
              Data is saved in <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">data/store.json</code> and stays saved across browser refreshes and server reboots.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              Reset Demo Dataset
            </div>
            <p>
              If products or reviews have been modified or deleted, you can restore all 8+ official demo scooty products, default promotional banners, and verified reviews with 1 click.
            </p>
            <button
              onClick={handleResetDefaults}
              className="mt-2 py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow cursor-pointer transition-all"
            >
              Reset to Factory Demo Products
            </button>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800 text-slate-300">
            <h4 className="font-bold text-white">System Environment:</h4>
            <p>• Admin Email: <span className="font-mono text-cyan-400">admin@voltglide.com</span></p>
            <p>• WhatsApp Integration Target: <span className="font-mono text-emerald-400">+92 321 0424424 (03210424424)</span></p>
            <p>• Currency Standard: <span className="font-mono text-white">PKR (Pakistani Rupee)</span></p>
          </div>
        </div>
      )}

      {/* PRODUCT ADD / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-blue-500/40 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-5 text-xs text-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base font-heading">
                {editingProduct ? 'Edit Scooty Model' : 'Add New Scooty Model'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VoltGlide Turbo X"
                    value={productForm.name || ''}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VoltGlide / Honda"
                    value={productForm.brand || ''}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Category *</label>
                  <select
                    value={productForm.category || 'Electric'}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Electric">Electric</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Sports">Sports</option>
                    <option value="Kids">Kids</option>
                    <option value="City">City</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price || 0}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Original Price (PKR) (Optional)</label>
                  <input
                    type="number"
                    placeholder="Strikethrough price"
                    value={productForm.originalPrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value ? Number(e.target.value) : null })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* IMAGE SELECTION & UPLOAD / URL */}
              <div className="space-y-2">
                <label className="block font-semibold">Product Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={productForm.image || ''}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />

                {/* Preset image picker for convenience */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Or choose a high-res preset scooty photo:</span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setProductForm({ ...productForm, image: preset.url })}
                        className={`h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          productForm.image === preset.url ? 'border-cyan-400 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Short Description *</label>
                <input
                  type="text"
                  required
                  placeholder="One sentence summary for product card"
                  value={productForm.shortDescription || ''}
                  onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Full Description</label>
                <textarea
                  rows={3}
                  value={productForm.description || ''}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Specs */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                  Technical Specifications
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Motor / Engine</label>
                    <input
                      type="text"
                      value={productForm.specs?.engineMotor || ''}
                      onChange={(e) => setProductForm({
                        ...productForm,
                        specs: { ...productForm.specs!, engineMotor: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Battery / Fuel Capacity</label>
                    <input
                      type="text"
                      value={productForm.specs?.batteryFuel || ''}
                      onChange={(e) => setProductForm({
                        ...productForm,
                        specs: { ...productForm.specs!, batteryFuel: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Range / Mileage</label>
                    <input
                      type="text"
                      value={productForm.specs?.rangeMileage || ''}
                      onChange={(e) => setProductForm({
                        ...productForm,
                        specs: { ...productForm.specs!, rangeMileage: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Top Speed</label>
                    <input
                      type="text"
                      value={productForm.specs?.maxSpeed || ''}
                      onChange={(e) => setProductForm({
                        ...productForm,
                        specs: { ...productForm.specs!, maxSpeed: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Availability & Featured */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Availability Status</label>
                  <select
                    value={productForm.availability || 'In Stock'}
                    onChange={(e) => setProductForm({ ...productForm, availability: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Limited Stock">Limited Stock</option>
                    <option value="Pre-Order">Pre-Order</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.featured || false}
                      onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-400 focus:ring-0"
                    />
                    <span className="font-semibold text-white">Feature on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="py-2.5 px-5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Scooty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANNER ADD / EDIT MODAL */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border border-blue-500/40 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-4 text-xs text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base font-heading">
                {editingBanner ? 'Edit Homepage Banner' : 'Create Homepage Banner'}
              </h3>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Badge Tag</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MEGA SAVINGS OFFER"
                  value={bannerForm.tag || ''}
                  onChange={(e) => setBannerForm({ ...bannerForm, tag: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Up to 15% OFF on Electric Models"
                  value={bannerForm.title || ''}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Subtitle / Details</label>
                <textarea
                  rows={2}
                  value={bannerForm.subtitle || ''}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Button Text</label>
                  <input
                    type="text"
                    value={bannerForm.ctaText || ''}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Button Link</label>
                  <input
                    type="text"
                    value={bannerForm.ctaLink || ''}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaLink: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
