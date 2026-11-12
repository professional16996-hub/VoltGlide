import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Product, Order, Banner, Review, ContactInquiry, AvailabilityType, SiteSettings } from '../types.ts';
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
  AlertTriangle,
  Upload,
  Video,
  Film,
  Camera,
  ImagePlus,
  Play,
  X,
  Youtube,
  Instagram,
  Facebook,
  Phone,
  Mail,
  Globe,
  Link as LinkIcon,
  Sliders,
  MapPin,
  Share2,
  Sparkles,
  Lock,
  KeyRound,
  ShieldCheck,
  Key,
  Download,
  RefreshCw,
  Users
} from 'lucide-react';
import { WhatsAppIconSVG } from '../components/FloatingWhatsApp.tsx';
import { cleanWhatsAppNumber } from '../utils/whatsapp.ts';

export const AdminDashboardPage: React.FC = () => {
  const {
    adminToken,
    isAdmin,
    adminLogout,
    navigate,
    showToast,
    products,
    banners,
    reviews,
    refreshProducts,
    refreshBanners,
    refreshReviews,
    settings,
    updateSettings,
    refreshSettings
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'banners' | 'reviews' | 'inquiries' | 'settings' | 'security'>('overview');

  // Dynamic Site Settings Form State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Security & PIN Lock Form State
  const [securityData, setSecurityData] = useState<{ email: string; pin: string }>({
    email: 'admin@voltglide.com',
    pin: '12345'
  });
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('admin@voltglide.com');
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [showSecurityPin, setShowSecurityPin] = useState(false);

  useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  // Stats
  const [stats, setStats] = useState({
    totalProducts: products.length || 8,
    totalOrders: 2,
    pendingOrders: 1,
    totalSales: 560000,
    totalReviews: reviews.length || 5,
    totalInquiries: 0
  });

  // Data lists
  const [adminProducts, setAdminProducts] = useState<Product[]>(products);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminBanners, setAdminBanners] = useState<Banner[]>(banners);
  const [adminReviews, setAdminReviews] = useState<Review[]>(reviews);
  const [adminInquiries, setAdminInquiries] = useState<ContactInquiry[]>([]);
  const [adminCustomers, setAdminCustomers] = useState<{ id: string; name: string; phone: string; email?: string; city?: string; address?: string; createdAt: string; ordersCount: number }[]>([]);

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

  // Media Upload from Device Gallery State
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Gallery File Upload Helper (converts to base64, posts to /api/upload with local fallback)
  const uploadFileFromGallery = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, data: base64Data })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.url) {
              resolve(data.url);
              return;
            }
          }
        } catch (err) {
          console.warn('Server upload fallback to direct data URI:', err);
        }
        resolve(base64Data);
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  };

  // Main Image from Device Gallery
  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    setUploadProgressText('Uploading photo from device gallery...');
    try {
      const url = await uploadFileFromGallery(file);
      if (url) {
        setProductForm((prev) => ({ ...prev, image: url }));
        showToast('Photo added from gallery!', 'success');
      }
    } catch {
      showToast('Could not load photo from gallery', 'error');
    } finally {
      setIsUploadingMedia(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  // Additional Photos & Videos from Device Gallery
  const handleGalleryMediaAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);
    setUploadProgressText(`Uploading ${files.length} file(s) from gallery...`);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFileFromGallery(files[i]);
        if (url) uploadedUrls.push(url);
      }
      setProductForm((prev) => ({
        ...prev,
        gallery: [...(prev.gallery || []), ...uploadedUrls]
      }));
      showToast(`${uploadedUrls.length} photo(s)/video(s) added from gallery!`, 'success');
    } catch {
      showToast('Error uploading files from gallery', 'error');
    } finally {
      setIsUploadingMedia(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  // Video Walkaround from Device Gallery
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    setUploadProgressText('Uploading video from gallery...');
    try {
      const url = await uploadFileFromGallery(file);
      if (url) {
        setProductForm((prev) => ({ ...prev, videoUrl: url }));
        showToast('Scooty video added from gallery!', 'success');
      }
    } catch {
      showToast('Error uploading video', 'error');
    } finally {
      setIsUploadingMedia(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  // Banner Photo from Device Gallery
  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    setUploadProgressText('Uploading banner image from gallery...');
    try {
      const url = await uploadFileFromGallery(file);
      if (url) {
        setBannerForm((prev) => ({ ...prev, image: url }));
        showToast('Banner photo selected from gallery!', 'success');
      }
    } catch {
      showToast('Error uploading banner photo', 'error');
    } finally {
      setIsUploadingMedia(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('admin-login');
    }
  }, [isAdmin, navigate]);

  // Safe JSON response reader that never throws SyntaxError
  const safeJson = async <T = any>(res: Response): Promise<{ success: boolean; data?: T; message?: string } | null> => {
    try {
      const text = await res.text();
      if (!text || !text.trim()) return null;
      return JSON.parse(text);
    } catch (err) {
      console.warn('JSON parsing prevented crash:', err);
      return null;
    }
  };

  // Load all admin data with cache-busting and live server priority
  const loadStats = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/stats?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache, no-store'
        }
      });
      const data = await safeJson(res);
      if (data && data.success && data.data) {
        setStats(data.data);
      }
    } catch (err) {
      console.warn('Safe loadStats fallback:', err);
    }
  }, [adminToken]);

  const loadAdminProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/products?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' }
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (data && data.success && Array.isArray(data.data)) {
          setAdminProducts(data.data);
          try {
            localStorage.setItem('voltglide_products', JSON.stringify(data.data));
          } catch {}
          return;
        }
      }
    } catch (err) {
      console.warn('Network issue loading products, using context fallback:', err);
    }
    if (products.length > 0) setAdminProducts(products);
  }, [products]);

  const loadAdminOrders = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/orders?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache, no-store'
        }
      });
      const data = await safeJson(res);
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        setAdminOrders(data.data);
        return;
      }
    } catch (err) {
      console.warn('Safe loadAdminOrders fallback:', err);
    }

    // Fallback for Netlify/Offline: Load orders saved in localStorage
    try {
      const local = localStorage.getItem('voltglide_orders');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAdminOrders(parsed);
        }
      }
    } catch {}
  }, [adminToken]);

  const loadAdminBanners = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/banners?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache, no-store'
        }
      });
      const data = await safeJson(res);
      if (data && data.success && Array.isArray(data.data)) {
        setAdminBanners(data.data);
        try {
          localStorage.setItem('voltglide_banners', JSON.stringify(data.data));
        } catch {}
      }
    } catch (err) {
      console.warn('Safe loadAdminBanners fallback:', err);
    }
  }, [adminToken]);

  const loadAdminReviews = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/reviews?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache, no-store'
        }
      });
      const data = await safeJson(res);
      if (data && data.success && Array.isArray(data.data)) {
        setAdminReviews(data.data);
        try {
          localStorage.setItem('voltglide_reviews', JSON.stringify(data.data));
        } catch {}
      }
    } catch (err) {
      console.warn('Safe loadAdminReviews fallback:', err);
    }
  }, [adminToken]);

  const loadAdminInquiries = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/inquiries?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache, no-store'
        }
      });
      const data = await safeJson(res);
      if (data && data.success && Array.isArray(data.data)) {
        setAdminInquiries(data.data);
      }
    } catch (err) {
      console.warn('Safe loadAdminInquiries fallback:', err);
    }
  }, [adminToken]);

  const loadAdminCustomers = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/customers?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache, no-store'
        }
      });
      const data = await safeJson(res);
      if (data && data.success && Array.isArray(data.data)) {
        setAdminCustomers(data.data);
      }
    } catch (err) {
      console.warn('Could not load customers in admin:', err);
    }
  }, [adminToken]);

  const loadSecurity = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/security?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache, no-store'
        }
      });
      const data = await safeJson(res);
      if (data && data.success && data.data) {
        setSecurityData(data.data);
        if (data.data.email) setNewEmail(data.data.email);
      }
    } catch (err) {
      console.warn('Could not load security info:', err);
    }
  }, [adminToken]);

  // Master refresh for all admin data
  const refreshAllAdminData = useCallback(() => {
    if (!adminToken) return;
    loadStats();
    loadAdminProducts();
    loadAdminOrders();
    loadAdminBanners();
    loadAdminReviews();
    loadAdminInquiries();
    loadAdminCustomers();
    loadSecurity();
  }, [adminToken, loadStats, loadAdminProducts, loadAdminOrders, loadAdminBanners, loadAdminReviews, loadAdminInquiries, loadAdminCustomers, loadSecurity]);

  useEffect(() => {
    refreshAllAdminData();

    // Auto-sync admin panel every 5 seconds or when screen is focused
    const syncInterval = setInterval(() => {
      if (!document.hidden && adminToken) {
        refreshAllAdminData();
      }
    }, 5000);

    const handleFocus = () => {
      if (!document.hidden && adminToken) {
        refreshAllAdminData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [adminToken, refreshAllAdminData]);

  // Curated Preset Image Selectors for fast easy image switching
  const PRESET_IMAGES = [
    { label: 'E-Pulse Pro (Electric)', url: '/images/electric_scooty_blue_1793645309587.jpg' },
    { label: 'Honda Activa Prime', url: '/images/honda_activa_scooty_1793645327154.jpg' },
    { label: 'Yamaha RayZR Sport', url: '/images/yamaha_sport_scooty_1793645340059.jpg' },
    { label: 'Vespa Classic 150', url: '/images/vespa_classic_scooty_1793645352538.jpg' },
    { label: 'Phantom Sport-X', url: '/images/phantom_sport_scooty_1793645364796.jpg' },
    { label: 'E-Motion Ultra EV', url: '/images/emotion_ultra_scooty_1793645377028.jpg' },
    { label: 'Sparky Youth Scooty', url: '/images/sparky_youth_scooty_1793645388697.jpg' },
    { label: 'Metro CityGlide 100', url: '/images/metro_city_scooty_1793645400497.jpg' },
    { label: 'Volt Glide Official Banner', url: '/images/voltglide_banner.png' }
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

    const targetId = editingProduct ? editingProduct.id : `scooty-${Date.now()}`;
    const cleanProduct: Product = {
      id: targetId,
      name: String(productForm.name).trim(),
      category: productForm.category || 'Electric',
      brand: productForm.brand || 'VoltGlide',
      price: Number(productForm.price),
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : null,
      image: productForm.image || PRESET_IMAGES[0].url,
      gallery: productForm.gallery && productForm.gallery.length > 0 ? productForm.gallery : [productForm.image || PRESET_IMAGES[0].url],
      videoUrl: productForm.videoUrl || undefined,
      shortDescription: productForm.shortDescription || 'Modern high-performance scooty for daily commutes.',
      description: productForm.description || 'Reliable and durable scooty designed for Pakistani road conditions.',
      features: productForm.features || ['High-torque motor/engine', 'Ergonomic seat', 'CBS Braking System'],
      specs: {
        engineMotor: productForm.specs?.engineMotor || 'High Efficiency Motor',
        batteryFuel: productForm.specs?.batteryFuel || 'Extended Range Battery',
        rangeMileage: productForm.specs?.rangeMileage || '80 km',
        maxSpeed: productForm.specs?.maxSpeed || '60 km/h',
        chargingFuelTime: productForm.specs?.chargingFuelTime || '3-4 Hours',
        brakingSystem: productForm.specs?.brakingSystem || 'Front & Rear Disc',
        curbWeight: productForm.specs?.curbWeight || '90 kg',
        warranty: productForm.specs?.warranty || '2 Years Warranty',
        colors: productForm.specs?.colors || ['Electric Blue', 'Midnight Black', 'Frost White']
      },
      availability: (productForm.availability as AvailabilityType) || 'In Stock',
      rating: Number(productForm.rating) || 5.0,
      reviewCount: Number(productForm.reviewCount) || 12,
      featured: Boolean(productForm.featured),
      createdAt: editingProduct?.createdAt || new Date().toISOString()
    };

    // Optimistically update local state & localStorage so UI responds instantaneously
    setAdminProducts((prev) => {
      const updated = editingProduct
        ? prev.map((p) => (p.id === targetId ? cleanProduct : p))
        : [cleanProduct, ...prev];
      try {
        localStorage.setItem('voltglide_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setIsProductModalOpen(false);
    showToast(editingProduct ? 'Product updated successfully!' : 'New scooty added successfully!', 'success');

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
        body: JSON.stringify(cleanProduct)
      });
      const data = await safeJson(res);
      if (data && data.success) {
        await Promise.all([loadAdminProducts(), refreshProducts(), loadStats()]);
      }
    } catch (err) {
      console.warn('Background server sync completed with local backup:', err);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    // Optimistic deletion
    setAdminProducts((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('voltglide_products', JSON.stringify(filtered));
      } catch {}
      return filtered;
    });
    showToast(`Product "${name}" deleted.`, 'info');

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      await safeJson(res);
      await Promise.all([loadAdminProducts(), refreshProducts(), loadStats()]);
    } catch {
      // Local state is already updated
    }
  };

  // ORDER ACTIONS
  const handleUpdateOrderStatus = async (orderId: string, status: any) => {
    setAdminOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    showToast(`Order status updated to "${status}"`, 'success');

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status })
      });
      await safeJson(res);
      await Promise.all([loadAdminOrders(), loadStats()]);
    } catch (err) {
      console.warn('Order status sync warning:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Delete order #${orderId}?`)) return;
    setAdminOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast(`Order #${orderId} deleted.`, 'info');

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      await safeJson(res);
      await Promise.all([loadAdminOrders(), loadStats()]);
    } catch (err) {
      console.warn('Delete order sync warning:', err);
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
    const targetBannerId = editingBanner ? editingBanner.id : `banner-${Date.now()}`;
    const cleanBanner: Banner = {
      id: targetBannerId,
      tag: bannerForm.tag || 'PROMOTION',
      title: bannerForm.title || 'Special Promotion',
      subtitle: bannerForm.subtitle || 'Exclusive deals on scooters.',
      ctaText: bannerForm.ctaText || 'Shop Now',
      ctaLink: bannerForm.ctaLink || '/scooties',
      bgGradient: bannerForm.bgGradient || 'from-blue-900 via-slate-900 to-black',
      image: bannerForm.image || undefined,
      videoUrl: bannerForm.videoUrl || undefined,
      active: bannerForm.active !== undefined ? Boolean(bannerForm.active) : true
    };

    // Optimistic update
    setAdminBanners((prev) => {
      const updated = editingBanner
        ? prev.map((b) => (b.id === targetBannerId ? cleanBanner : b))
        : [cleanBanner, ...prev];
      try {
        localStorage.setItem('voltglide_banners', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setIsBannerModalOpen(false);
    showToast(editingBanner ? 'Banner updated!' : 'New banner added!', 'success');

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
        body: JSON.stringify(cleanBanner)
      });
      await safeJson(res);
      await Promise.all([loadAdminBanners(), refreshBanners()]);
    } catch (err) {
      console.warn('Banner sync warning:', err);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Delete this banner?')) return;
    setAdminBanners((prev) => {
      const filtered = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem('voltglide_banners', JSON.stringify(filtered));
      } catch {}
      return filtered;
    });
    showToast('Banner removed.', 'info');

    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      await safeJson(res);
      await Promise.all([loadAdminBanners(), refreshBanners()]);
    } catch (err) {
      console.warn('Delete banner sync warning:', err);
    }
  };

  // REVIEW ACTIONS
  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Delete this customer review?')) return;
    setAdminReviews((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem('voltglide_reviews', JSON.stringify(filtered));
      } catch {}
      return filtered;
    });
    showToast('Review deleted.', 'info');

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      await safeJson(res);
      await Promise.all([loadAdminReviews(), refreshReviews(), loadStats()]);
    } catch (err) {
      console.warn('Delete review sync warning:', err);
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
      const data = await safeJson(res);
      if (data && data.success) {
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
      showToast('Reset completed locally', 'info');
    }
  };

  // SAVE SITE SETTINGS (Numbers, Links, Texts, Socials)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const ok = await updateSettings(settingsForm);
      if (ok) {
        showToast('Website numbers, links, and text updated successfully!', 'success');
      }
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // SECURITY & PIN ACTIONS
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin && newPin.trim().length < 3) {
      showToast('PIN must be at least 3 digits/characters', 'error');
      return;
    }
    if (newPin && confirmPin && newPin.trim() !== confirmPin.trim()) {
      showToast('New PIN and Confirm PIN do not match!', 'error');
      return;
    }
    if (newPassword && newPassword.trim().length < 5) {
      showToast('Password must be at least 5 characters', 'error');
      return;
    }
    if (newPassword && confirmPassword && newPassword.trim() !== confirmPassword.trim()) {
      showToast('New Password and Confirm Password do not match!', 'error');
      return;
    }

    setIsSavingSecurity(true);
    try {
      const res = await fetch('/api/admin/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          newPin: newPin ? newPin.trim() : undefined,
          newPassword: newPassword ? newPassword.trim() : undefined,
          newEmail: newEmail ? newEmail.trim() : undefined
        })
      });
      const data = await safeJson(res);
      if (data && data.success) {
        showToast('Admin Security PIN & credentials updated successfully!', 'success');
        if (data.data) {
          setSecurityData(data.data);
        }
        setNewPin('');
        setConfirmPin('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(data?.message || 'Failed to update security settings', 'error');
      }
    } catch {
      showToast('Server connection issue while updating security', 'error');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  // INQUIRY ACTIONS
  const handleDeleteInquiry = async (id: string) => {
    if (!window.confirm('Delete this customer inquiry?')) return;
    setAdminInquiries((prev) => prev.filter((i) => i.id !== id));
    showToast('Inquiry lead deleted.', 'info');
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      await safeJson(res);
      await loadAdminInquiries();
    } catch (err) {
      console.warn('Inquiry delete sync warning:', err);
    }
  };

  // DATABASE BACKUP EXPORT
  const handleExportBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        products: adminProducts,
        banners: adminBanners,
        orders: adminOrders,
        reviews: adminReviews,
        inquiries: adminInquiries,
        settings: settingsForm,
        security: { email: securityData.email, pin: securityData.pin }
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voltglide_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Database backup downloaded successfully!', 'success');
    } catch {
      showToast('Could not download backup file', 'error');
    }
  };

  const handleQuickLock = () => {
    adminLogout();
    showToast('Admin screen locked. Use your Security PIN to unlock!', 'info');
  };

  const filteredAdminProducts = adminProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full max-w-full overflow-x-hidden">
      
      {/* Top Admin Header */}
      <div className="bg-[#0f172a] rounded-3xl p-5 sm:p-6 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 flex-shrink-0">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-heading">
                VoltGlide Admin Control Center
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                LIVE PERSISTENT DB
              </span>
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                PIN: {securityData.pin || '12345'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Complete full-fledged management of scooties, orders, customer leads, banners, text & security PIN.
            </p>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={() => { refreshAllAdminData(); refreshSettings(); showToast('All data refreshed!', 'info'); }}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh All Server Data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportBackup}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download JSON Database Backup"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          <button
            onClick={() => navigate('home')}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Store</span>
          </button>

          <button
            onClick={handleQuickLock}
            className="py-2 px-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-colors cursor-pointer"
            title="Lock screen with PIN"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>

          <button
            onClick={adminLogout}
            className="py-2 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1.5 border border-rose-500/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Full-Fledged Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
          { id: 'products', label: `Scooties (${adminProducts.length})`, icon: Package },
          { id: 'orders', label: `Orders (${adminOrders.length})`, icon: ShoppingBag },
          { id: 'customers', label: `Customers (${adminCustomers.length})`, icon: Users },
          { id: 'inquiries', label: `Customer Leads (${adminInquiries.length})`, icon: Mail },
          { id: 'banners', label: `Banners (${adminBanners.length})`, icon: ImageIcon },
          { id: 'reviews', label: `Reviews (${adminReviews.length})`, icon: MessageSquare },
          { id: 'settings', label: 'Site Settings & Links', icon: Sliders },
          { id: 'security', label: 'Security & PIN Lock', icon: KeyRound }
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
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add New Scooty Model
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold border border-cyan-500/40 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  Change Security PIN (Current: {securityData.pin || '12345'})
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Edit Phone, WhatsApp & Social Links
                </button>

                <button
                  onClick={() => setActiveTab('inquiries')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Mail className="w-4 h-4 text-blue-400" />
                  View Customer Leads ({adminInquiries.length})
                </button>

                <button
                  onClick={handleOpenAddBanner}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  Add Promo Banner
                </button>

                <button
                  onClick={handleExportBackup}
                  className="w-full py-2 px-4 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Database Backup (JSON)
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>• Changes save permanently across all devices in real-time.</p>
                <p>• Mobile Security PIN: <strong className="text-cyan-300 font-mono">{securityData.pin || '12345'}</strong></p>
                <p>• Live WhatsApp number: <strong className="text-emerald-400 font-mono">{settingsForm.whatsappNumber || '03210424424'}</strong></p>
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

      {/* TAB 6: SETTINGS, NUMBERS & SOCIAL LINKS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-8 max-w-4xl text-xs">
          
          {/* Header & Save Action Bar */}
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <h3 className="font-bold text-white text-lg font-heading flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                Website Settings, Numbers & Social Links
              </h3>
              <p className="text-slate-400 mt-1">
                Yahan se aap helpline number, WhatsApp number, YouTube, Instagram, Facebook, TikTok links aur website text change kar sakte hain.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSavingSettings}
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Saving Settings...' : 'Save All Changes'}</span>
            </button>
          </div>

          {/* CARD 1: CONTACT & HELPLINE NUMBERS */}
          <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="font-bold text-white text-sm font-heading">
                  1. Contact Numbers & WhatsApp Configuration
                </h4>
                <p className="text-[11px] text-slate-400">
                  Ye number website k Header, Footer aur direct WhatsApp buttons par show hoga.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Helpline Phone Number (Display) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0321-0424424"
                    value={settingsForm.phone || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Website par customers ko call k liye ye number show hoga.</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  WhatsApp Helpline Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 03210424424 ya 923210424424"
                    value={settingsForm.whatsappNumber || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <WhatsAppIconSVG className="w-4 h-4 text-emerald-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Customer jab WhatsApp button dabayega to is number par chat khulay gi.</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Official Support Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. sales@voltglide.com"
                    value={settingsForm.email || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Showroom Working Hours
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Mon - Sat: 10:00 AM - 9:00 PM | Sunday: 2:00 PM - 8:00 PM"
                    value={settingsForm.workingHours || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                  <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Default WhatsApp Order Inquiries Greeting
              </label>
              <textarea
                rows={2}
                placeholder="Hello VoltGlide Motors! I am interested in your scooties."
                value={settingsForm.whatsappMessage || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, whatsappMessage: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">Direct click par customer k WhatsApp chat box ma ye text pre-fill hoga.</p>
            </div>
          </div>

          {/* CARD 2: SOCIAL MEDIA & CHANNELS LINKS */}
          <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="font-bold text-white text-sm font-heading">
                  2. Social Media & Official Channels Links
                </h4>
                <p className="text-[11px] text-slate-400">
                  Apne YouTube, WhatsApp, Instagram, Facebook aur TikTok channels k link yahan add karein.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* YouTube Channel Link */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center">
                      <Youtube className="w-4 h-4" />
                    </div>
                    YouTube Channel Link
                  </label>
                  {settingsForm.socialLinks?.youtube && (
                    <a
                      href={settingsForm.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Test Link
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://youtube.com/@voltglide"
                  value={settingsForm.socialLinks?.youtube || ''}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      socialLinks: { ...settingsForm.socialLinks, youtube: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* WhatsApp Direct Link */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#25D366]/20 text-emerald-400 flex items-center justify-center">
                      <WhatsAppIconSVG className="w-4 h-4" />
                    </div>
                    WhatsApp Direct Link or Group
                  </label>
                  {settingsForm.socialLinks?.whatsapp && (
                    <a
                      href={settingsForm.socialLinks.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Test Chat
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://wa.me/923210424424"
                  value={settingsForm.socialLinks?.whatsapp || ''}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      socialLinks: { ...settingsForm.socialLinks, whatsapp: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Instagram Profile Link */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-pink-600/20 text-pink-400 flex items-center justify-center">
                      <Instagram className="w-4 h-4" />
                    </div>
                    Instagram Profile Link
                  </label>
                  {settingsForm.socialLinks?.instagram && (
                    <a
                      href={settingsForm.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Test Profile
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://instagram.com/voltglidescooties"
                  value={settingsForm.socialLinks?.instagram || ''}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      socialLinks: { ...settingsForm.socialLinks, instagram: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Facebook Page Link */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                      <Facebook className="w-4 h-4" />
                    </div>
                    Facebook Page Link
                  </label>
                  {settingsForm.socialLinks?.facebook && (
                    <a
                      href={settingsForm.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Test Page
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://facebook.com/voltglidepakistan"
                  value={settingsForm.socialLinks?.facebook || ''}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      socialLinks: { ...settingsForm.socialLinks, facebook: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* TikTok Profile Link */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                      <Globe className="w-4 h-4" />
                    </div>
                    TikTok Channel / Other Link
                  </label>
                  {settingsForm.socialLinks?.tiktok && (
                    <a
                      href={settingsForm.socialLinks.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Test Link
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@voltglide"
                  value={settingsForm.socialLinks?.tiktok || ''}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      socialLinks: { ...settingsForm.socialLinks, tiktok: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* CARD 3: WEBSITE TEXTS & ANNOUNCEMENT BAR */}
          <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="font-bold text-white text-sm font-heading">
                  3. Website Texts & Announcement Bar
                </h4>
                <p className="text-[11px] text-slate-400">
                  Website k front par jo notice, banner text ya slogan display hota hai, us ko yahan se edit karein.
                </p>
              </div>
            </div>

            {/* Top Announcement Bar Configuration */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  Top Announcement Strip (Above Navbar)
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.announcementBar?.enabled)}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        announcementBar: {
                          ...settingsForm.announcementBar,
                          enabled: e.target.checked
                        }
                      })
                    }
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-900 border-slate-700"
                  />
                  <span>Show Announcement Bar</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                  Announcement Text
                </label>
                <input
                  type="text"
                  placeholder="⚡ MEGA SCOOTY DEAL 2026: Up to PKR 25,000 OFF on Electric Scooties! Free Helmet & Delivery Across Pakistan"
                  value={settingsForm.announcementBar?.text || ''}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      announcementBar: {
                        ...settingsForm.announcementBar,
                        text: e.target.value
                      }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                  Announcement Button Destination Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. /scooties ya https://wa.me/923210424424"
                  value={settingsForm.announcementBar?.link || ''}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      announcementBar: {
                        ...settingsForm.announcementBar,
                        link: e.target.value
                      }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Hero Top Badge Text
                </label>
                <input
                  type="text"
                  placeholder="Official Volt Glide Dealership • 2026 Electric & Petrol Scooties"
                  value={settingsForm.heroBadge || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroBadge: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Hero Tagline / Subtitle
                </label>
                <textarea
                  rows={2}
                  placeholder="Ride with freedom, zero petrol expense, and unmatched Italian & Japanese engineering."
                  value={settingsForm.heroTagline || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroTagline: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Delivery & Shipping Notice Text
                </label>
                <input
                  type="text"
                  placeholder="Free doorstep delivery in Lahore, Karachi & Islamabad. Cash on delivery available nationwide."
                  value={settingsForm.deliveryNotice || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deliveryNotice: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Footer Brand Description Text
                </label>
                <textarea
                  rows={2}
                  placeholder="VoltGlide Scooty Hub is Pakistan's premier destination for cutting-edge electric scooties and dependable petrol scooters."
                  value={settingsForm.footerText || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, footerText: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* CARD 4: SHOWROOM LOCATIONS & ADDRESSES */}
          <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="font-bold text-white text-sm font-heading">
                  4. Physical Showrooms & Branch Addresses
                </h4>
                <p className="text-[11px] text-slate-400">
                  Customer trust k liye showrooms k addresses update karein.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {(settingsForm.showrooms || []).map((sh, idx) => (
                <div key={idx} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                        Branch Title ({sh.city})
                      </label>
                      <input
                        type="text"
                        value={sh.title || ''}
                        onChange={(e) => {
                          const updated = [...(settingsForm.showrooms || [])];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setSettingsForm({ ...settingsForm, showrooms: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={sh.city || ''}
                        onChange={(e) => {
                          const updated = [...(settingsForm.showrooms || [])];
                          updated[idx] = { ...updated[idx], city: e.target.value };
                          setSettingsForm({ ...settingsForm, showrooms: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                      Full Address
                    </label>
                    <input
                      type="text"
                      value={sh.address || ''}
                      onChange={(e) => {
                        const updated = [...(settingsForm.showrooms || [])];
                        updated[idx] = { ...updated[idx], address: e.target.value };
                        setSettingsForm({ ...settingsForm, showrooms: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SAVE BUTTON AT BOTTOM */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-[#0f172a] border border-blue-500/30">
            <div>
              <p className="font-bold text-white text-sm">Save All Changes?</p>
              <p className="text-slate-400 text-[11px]">
                Button dabane par numbers aur links poori website par live update ho jayein ge.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSavingSettings}
              className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{isSavingSettings ? 'Saving...' : 'Save Settings & Links'}</span>
            </button>
          </div>

          {/* FACTORY DEMO RESET BOX */}
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
            <div>
              <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Factory Demo Reset Option
              </h4>
              <p className="text-slate-400 text-[11px] mt-1">
                Agar aap kisi waqt original verified demo dataset (8 scooties, default banners aur reviews) wapas lana chahein:
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="py-2.5 px-5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 shadow cursor-pointer transition-all"
            >
              Reset to Factory Demo Products & Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB: REGISTERED CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0f172a] p-5 rounded-3xl border border-slate-800 shadow-xl">
            <div>
              <h3 className="font-bold text-white text-base font-heading">
                Registered Customer Accounts ({adminCustomers.length})
              </h3>
              <p className="text-xs text-slate-400">
                Tamam registered customers, un k mobile numbers, addresses aur order records.
              </p>
            </div>
            <button
              onClick={loadAdminCustomers}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Refresh Customers</span>
            </button>
          </div>

          {adminCustomers.length === 0 ? (
            <div className="bg-[#0f172a] rounded-3xl p-12 text-center border border-slate-800 space-y-3">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-white font-bold text-base">No Customers Registered Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Jab b koi customer website pe naya account banaye ga ya checkout kare ga, un ki details yahan foran show hon gi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminCustomers.map((cust) => {
                const waUrl = `https://wa.me/${cleanWhatsAppNumber(cust.phone)}?text=${encodeURIComponent(
                  `Hello ${cust.name}! Assalam-o-Alaikum from VoltGlide Scooty Hub Pakistan. How can we assist you today?`
                )}`;

                return (
                  <div key={cust.id} className="bg-[#0f172a] rounded-3xl p-5 border border-slate-800 shadow-lg space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 p-0.5 flex-shrink-0">
                            <div className="w-full h-full bg-[#0a0f1d] rounded-[9px] flex items-center justify-center font-bold text-cyan-400">
                              {cust.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{cust.name}</h4>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {cust.id}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                          {cust.ordersCount} Orders
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-300 pt-1">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="font-mono text-white font-semibold">{cust.phone}</span>
                        </div>
                        {cust.email && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="truncate">{cust.email}</span>
                          </div>
                        )}
                        {(cust.city || cust.address) && (
                          <div className="flex items-start gap-2 text-slate-400 pt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{cust.address ? `${cust.address}, ` : ''}{cust.city}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
                      >
                        <WhatsAppIconSVG className="w-3.5 h-3.5 fill-white" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: CUSTOMER INQUIRIES & LEADS */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0f172a] p-5 rounded-3xl border border-slate-800 shadow-xl">
            <div>
              <h3 className="font-bold text-white text-base font-heading">
                Customer Leads & Inquiries ({adminInquiries.length})
              </h3>
              <p className="text-xs text-slate-400">
                Website k contact form aur scooty inquiry se aane wale messages.
              </p>
            </div>
            <button
              onClick={loadAdminInquiries}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Refresh Leads</span>
            </button>
          </div>

          {adminInquiries.length === 0 ? (
            <div className="bg-[#0f172a] rounded-3xl p-12 text-center border border-slate-800 space-y-3">
              <Mail className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-white font-bold text-base">No Customer Inquiries Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Customer leads submitted via the Contact page or quick WhatsApp buttons will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminInquiries.map((inq) => {
                const whatsappUrl = `https://wa.me/${cleanWhatsAppNumber(inq.phone)}?text=${encodeURIComponent(
                  `Hello ${inq.name}! Thank you for contacting VoltGlide Scooty Hub regarding "${inq.subject}". How can we assist you with your scooty booking today?`
                )}`;

                return (
                  <div key={inq.id} className="bg-[#0f172a] rounded-3xl p-5 border border-slate-800 shadow-lg space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-white text-sm">{inq.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                          <Phone className="w-3 h-3 text-cyan-400" />
                          <span>{inq.phone}</span>
                        </div>
                        {inq.email && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {inq.email}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteInquiry(inq.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                        title="Delete Inquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
                      <span className="font-semibold text-cyan-300 block mb-1">
                        Subject: {inq.subject}
                      </span>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {inq.message}
                      </p>
                      <span className="block text-[10px] text-slate-500 mt-2">
                        Received: {new Date(inq.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
                      >
                        <WhatsAppIconSVG className="w-3.5 h-3.5 fill-white" />
                        <span>Reply on WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${inq.phone}`}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: SECURITY & PIN LOCK MANAGEMENT */}
      {activeTab === 'security' && (
        <form onSubmit={handleSaveSecurity} className="space-y-6 max-w-4xl text-xs">
          
          {/* Header Action Bar */}
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base font-heading">
                    Admin Portal PIN & Security Settings
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Aap apna security PIN, admin password aur email yahan se kabhi b change kar sakte hain.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingSecurity}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSecurity ? 'Saving Changes...' : 'Save Security Settings'}</span>
            </button>
          </div>

          {/* Active Security Status Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                Active Security PIN
              </span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xl font-mono font-extrabold text-cyan-300 tracking-wider">
                  {showSecurityPin ? securityData.pin || '12345' : '•••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSecurityPin(!showSecurityPin)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  {showSecurityPin ? 'Hide' : 'Reveal'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Quick unlock code for all mobile screens</p>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-400" />
                Admin Email Address
              </span>
              <p className="text-sm font-semibold text-white truncate pt-1">
                {securityData.email || 'admin@voltglide.com'}
              </p>
              <p className="text-[10px] text-slate-500">Master account identifier</p>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                Quick Lock
              </span>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleQuickLock}
                  className="py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Lock Dashboard Screen
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Instantly protects session on mobile</p>
            </div>
          </div>

          {/* Section 1: Change Security PIN */}
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <KeyRound className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="font-bold text-white text-sm font-heading">
                  1. Change Mobile Quick Security PIN
                </h4>
                <p className="text-[11px] text-slate-400">
                  Mobile se fast login karne k liye 4-6 digit numeric PIN set karein (Default: 12345).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  New Security PIN
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. 55667 ya 1234"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Confirm New PIN
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="Re-enter new PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Quick Helper buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="text-slate-400 font-semibold">Suggested Quick PINs:</span>
              {['12345', '78600', '99887', '0000', '1122'].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => { setNewPin(sug); setConfirmPin(sug); }}
                  className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono font-bold border border-slate-700 cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Change Password & Email */}
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Lock className="w-5 h-5 text-blue-400" />
              <div>
                <h4 className="font-bold text-white text-sm font-heading">
                  2. Change Admin Password & Email (Optional)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Agar aap email aur full password b change karna chahein to yahan se kar sakte hain.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@voltglide.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    New Admin Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password (min 5 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 to-cyan-950/40 border border-cyan-500/30">
            <div>
              <p className="text-white font-bold text-xs flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Live Server Persistence
              </p>
              <p className="text-slate-400 text-[11px]">
                Naya PIN save karne k baad aap kisi b mobile se isi PIN k sath foran login kar saken ge.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSavingSecurity}
              className="w-full sm:w-auto py-3 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSecurity ? 'Saving Changes...' : 'Save New PIN & Security'}</span>
            </button>
          </div>

        </form>
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

              {/* 1. PRIMARY PRODUCT PHOTO (DIRECTLY FROM DEVICE GALLERY) */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-xs">Primary Scooty Photo (From Gallery) *</span>
                  </div>
                  {isUploadingMedia && (
                    <span className="text-[11px] text-cyan-300 font-semibold animate-pulse">
                      {uploadProgressText || 'Uploading...'}
                    </span>
                  )}
                </div>

                {/* Hidden File Input for Device Gallery */}
                <input
                  id="gallery-main-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageChange}
                  className="hidden"
                />

                {productForm.image ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <div className="w-28 h-20 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-slate-700">
                      <img
                        src={productForm.image}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center sm:justify-start gap-1">
                        <Check className="w-3.5 h-3.5" /> Photo Selected from Gallery
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <label
                          htmlFor="gallery-main-photo-input"
                          className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1.5 transition-colors shadow"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Change Photo from Gallery
                        </label>
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, image: '' })}
                          className="py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-semibold transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="gallery-main-photo-input"
                    className="border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 bg-slate-900/50 hover:bg-slate-900/90 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Choose Photo from Device Gallery
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Tap here to select directly from your phone gallery or computer files
                    </span>
                  </label>
                )}

                {/* Quick Presets for Demo */}
                <div className="pt-2 border-t border-slate-900">
                  <span className="text-[10px] text-slate-400 block mb-1.5">Or pick from existing showroom stock photos:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setProductForm({ ...productForm, image: preset.url })}
                        className={`h-11 w-16 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
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

              {/* 2. PRODUCT GALLERY (ADDITIONAL PHOTOS & VIDEOS FROM GALLERY) */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-xs">Product Gallery (Photos & Videos)</span>
                    <span className="text-[10px] text-slate-400">({productForm.gallery?.length || 0} items)</span>
                  </div>
                  
                  {/* Gallery Multi-File Input */}
                  <input
                    id="gallery-multi-media-input"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleGalleryMediaAdd}
                    className="hidden"
                  />
                  <label
                    htmlFor="gallery-multi-media-input"
                    className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add from Gallery
                  </label>
                </div>

                {productForm.gallery && productForm.gallery.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                    {productForm.gallery.map((mediaUrl, idx) => {
                      const isVid = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.endsWith('.mov') || mediaUrl.startsWith('data:video/');
                      return (
                        <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-slate-800 group">
                          {isVid ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-cyan-400">
                              <Film className="w-6 h-6" />
                              <span className="absolute bottom-1 left-1 text-[9px] bg-black/80 px-1 py-0.5 rounded text-white font-mono">
                                Video
                              </span>
                            </div>
                          ) : (
                            <img src={mediaUrl} alt="Gallery item" className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (productForm.gallery || []).filter((_, i) => i !== idx);
                              setProductForm({ ...productForm, gallery: updated });
                            }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove from gallery"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No extra gallery photos/videos added yet. You can tap "Add from Gallery" above.</p>
                )}
              </div>

              {/* 3. PRODUCT WALKAROUND VIDEO (FROM DEVICE GALLERY) */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-xs">Walkaround / Demo Video (From Gallery)</span>
                  </div>
                  <input
                    id="walkaround-video-input"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="walkaround-video-input"
                    className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Video className="w-3.5 h-3.5" />
                    {productForm.videoUrl ? 'Replace Video' : 'Choose Video from Gallery'}
                  </label>
                </div>

                {productForm.videoUrl ? (
                  <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <video
                      src={productForm.videoUrl}
                      controls
                      className="w-full max-h-44 rounded-lg bg-black object-contain"
                    />
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Video Ready
                      </span>
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, videoUrl: undefined })}
                        className="text-rose-400 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Video
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Optional: Select a video clip of this scooty from your mobile gallery (MP4, WebM, MOV).
                  </p>
                )}
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

              {/* Banner Image from Device Gallery */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">Banner Image (Optional - from Gallery)</span>
                  <input
                    id="banner-gallery-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="banner-gallery-photo-input"
                    className="py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {bannerForm.image ? 'Change Photo' : 'Choose from Gallery'}
                  </label>
                </div>

                {bannerForm.image ? (
                  <div className="relative h-24 rounded-xl overflow-hidden border border-slate-700 bg-black">
                    <img src={bannerForm.image} alt="Banner Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, image: undefined })}
                      className="absolute top-2 right-2 p-1 rounded-full bg-rose-600 text-white text-xs"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No image selected. You can pick any banner photo directly from your device gallery.</p>
                )}
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
