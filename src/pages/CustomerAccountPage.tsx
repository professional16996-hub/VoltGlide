import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  User,
  Package,
  MapPin,
  Lock,
  Phone,
  Mail,
  LogOut,
  ShoppingBag,
  ExternalLink,
  Printer,
  Heart,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText,
  X
} from 'lucide-react';
import { Order } from '../types.ts';

export const CustomerAccountPage: React.FC = () => {
  const {
    customer,
    isCustomerLoggedIn,
    customerOrders,
    customerLogin,
    customerRegister,
    customerLogout,
    updateCustomerProfile,
    changeCustomerPassword,
    refreshCustomerOrders,
    navigate,
    products,
    wishlist,
    addToCart,
    settings,
    showToast
  } = useApp();

  // Mode for unauthenticated user: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdent, setLoginIdent] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regCity, setRegCity] = useState('Lahore');
  const [regAddress, setRegAddress] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Authenticated tab: 'orders' | 'profile' | 'security' | 'wishlist'
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'security' | 'wishlist'>('orders');

  // Edit profile state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Invoice modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Sync profile form when customer changes
  useEffect(() => {
    if (customer) {
      setEditName(customer.name || '');
      setEditPhone(customer.phone || '');
      setEditEmail(customer.email || '');
      setEditCity(customer.city || 'Lahore');
      setEditAddress(customer.address || '');
    }
  }, [customer]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdent.trim() || !loginPass.trim()) {
      showToast('Baraye meherbani mobile number ya email aur password darj karein.', 'error');
      return;
    }
    setIsLoggingIn(true);
    await customerLogin(loginIdent.trim(), loginPass.trim());
    setIsLoggingIn(false);
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regPass.trim()) {
      showToast('Naam, Mobile number aur Password zaroori hain.', 'error');
      return;
    }
    setIsRegistering(true);
    await customerRegister({
      name: regName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim() || undefined,
      password: regPass.trim(),
      city: regCity.trim() || 'Lahore',
      address: regAddress.trim() || undefined
    });
    setIsRegistering(false);
  };

  // Handle Update Profile
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) {
      showToast('Naam aur phone number khali nahi ho sakte.', 'error');
      return;
    }
    setIsUpdatingProfile(true);
    await updateCustomerProfile({
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim() || undefined,
      city: editCity.trim(),
      address: editAddress.trim()
    });
    setIsUpdatingProfile(false);
  };

  // Handle Password Change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass.trim()) {
      showToast('Naya password darj karein.', 'error');
      return;
    }
    if (newPass.trim().length < 4) {
      showToast('Password kam az kam 4 characters ka hona chahiye.', 'error');
      return;
    }
    if (newPass.trim() !== confirmPass.trim()) {
      showToast('New Password aur Confirm Password match nahi kar rahe.', 'error');
      return;
    }
    setIsChangingPass(true);
    const res = await changeCustomerPassword(oldPass.trim(), newPass.trim());
    setIsChangingPass(false);
    if (res.success) {
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  // WhatsApp Order Tracker helper
  const getWhatsAppTrackLink = (order: Order) => {
    const rawNumber = settings.whatsappNumber || '03210424424';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const formatted = cleanNumber.startsWith('92')
      ? cleanNumber
      : cleanNumber.startsWith('0')
      ? '92' + cleanNumber.substring(1)
      : '92' + cleanNumber;

    const text = encodeURIComponent(
      `Hello VoltGlide Scooty Hub! I am tracking my Order #${order.id}.\nCustomer Name: ${order.customerName}\nStatus: ${order.status}\nTotal: PKR ${order.totalAmount.toLocaleString()}`
    );
    return `https://wa.me/${formatted}?text=${text}`;
  };

  // Wishlist products
  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  // If customer is NOT logged in, show Auth Portal
  if (!isCustomerLoggedIn || !customer) {
    return (
      <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center">
        <div className="w-full max-w-lg space-y-6">
          
          {/* Header branding */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/20 mx-auto">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center">
                <User className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              VoltGlide <span className="text-cyan-400">Customer Account</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Apni scooty orders track karein, address save karein aur exclusive deals payein.
            </p>
          </div>

          {/* Tab Switcher: Login vs Register */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Customer Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Naya Account Banayein
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-5">
            {authMode === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Mobile / WhatsApp Number ya Email
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="03001234567 ya email@domain.com"
                      value={loginIdent}
                      onChange={(e) => setLoginIdent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-3 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-semibold">
                      Account Password
                    </label>
                    <a
                      href={`https://wa.me/${(settings.whatsappNumber || '03210424424').replace(/[^0-9]/g, '')}?text=Assalam-o-Alaikum! Mujhe mera customer password recover karwana hai.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Password Bhool Gaye?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                    >
                      {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Helper for Demo Customer Login */}
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/20 text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Demo customer try karein:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginIdent('03001234567');
                      setLoginPass('12345');
                    }}
                    className="text-cyan-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" /> Auto-fill Demo
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Pura Naam (Full Name) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kamran Siddiqui"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Mobile / WhatsApp Number *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="03001234567"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="name@gmail.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Shehar (City) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Lahore, Karachi, etc."
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Choose Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPass ? 'text' : 'password'}
                        required
                        placeholder="Min 4 characters"
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowRegPass(!showRegPass)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showRegPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Ghar ka Pata (Delivery Address)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="House / Flat No., Street, Area..."
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Is number se pehle kiye gaye tamam orders foran link ho jayen ge!</span>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-cyan-500 to-blue-600 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isRegistering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Account Ban Raha Hai...</span>
                    </>
                  ) : (
                    <>
                      <span>Register Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Quick Support banner */}
          <div className="text-center text-xs text-slate-400">
            Kisi b madad ya inquiry k liye:{' '}
            <a
              href={`https://wa.me/${(settings.whatsappNumber || '03210424424').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 font-bold hover:underline"
            >
              WhatsApp Helpline: {settings.whatsappNumber || '0321-0424424'}
            </a>
          </div>

        </div>
      </div>
    );
  }

  // AUTHENTICATED CUSTOMER DASHBOARD
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* Top Welcome Profile Card */}
      <div className="relative overflow-hidden surface-card rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 p-0.5 shadow-xl shadow-cyan-500/20 flex-shrink-0">
              <div className="w-full h-full bg-[#080a11] rounded-[14px] flex items-center justify-center font-extrabold text-2xl text-cyan-400 font-heading">
                {customer.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.05] text-cyan-300 border border-white/[0.08] font-semibold tracking-wide uppercase">
                  Verified Customer
                </span>
                <span className="text-[11px] text-slate-400">
                  Joined: {new Date(customer.createdAt).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
                Khush Amdeed, <span className="text-cyan-400">{customer.name}</span>!
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="flex items-center gap-1 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <strong className="text-white font-mono">{customer.phone}</strong>
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>{customer.email}</span>
                  </span>
                )}
                {customer.city && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{customer.city}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                refreshCustomerOrders();
                showToast('Orders list refreshed!', 'info');
              }}
              className="py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 text-xs font-semibold border border-white/[0.08] transition-colors cursor-pointer flex items-center gap-1.5"
              title="Refresh Orders"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Refresh</span>
            </button>
            <button
              onClick={customerLogout}
              className="py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/[0.06]">
          <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.06]">
            <p className="text-[11px] text-slate-400 font-medium">Total Orders</p>
            <p className="text-xl font-extrabold text-white font-heading mt-0.5">{customerOrders.length}</p>
          </div>
          <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.06]">
            <p className="text-[11px] text-slate-400 font-medium">In Transit / Active</p>
            <p className="text-xl font-extrabold text-cyan-400 font-heading mt-0.5">
              {customerOrders.filter(o => o.status === 'Confirmed' || o.status === 'Shipped' || o.status === 'Pending').length}
            </p>
          </div>
          <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.06]">
            <p className="text-[11px] text-slate-400 font-medium">Delivered Scooties</p>
            <p className="text-xl font-extrabold text-emerald-400 font-heading mt-0.5">
              {customerOrders.filter(o => o.status === 'Delivered').length}
            </p>
          </div>
          <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.06]">
            <p className="text-[11px] text-slate-400 font-medium">Wishlist Items</p>
            <p className="text-xl font-extrabold text-pink-400 font-heading mt-0.5">{wishlist.length}</p>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Meri Orders ({customerOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Profile & Address</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Change Password</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'wishlist'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Heart className="w-4 h-4 text-pink-400" />
          <span>Pasandida Scooties ({wishlist.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* TAB 1: MY ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-heading">
              Aap ki Scooty Orders
            </h2>
            <button
              onClick={() => navigate('scooties')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Explore More Scooties</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {customerOrders.length === 0 ? (
            <div className="bg-[#0f172a] rounded-3xl p-10 text-center border border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Koi Order Nahi Mili</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Aap ne abhi tak koi scooty order place nahi ki ya aap ka phone number match nahi ho raha.
                </p>
              </div>
              <button
                onClick={() => navigate('scooties')}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Browse All Scooties Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((order) => {
                const isDelivered = order.status === 'Delivered';
                const isShipped = order.status === 'Shipped';
                const isConfirmed = order.status === 'Confirmed';
                const isPending = order.status === 'Pending';
                const isCancelled = order.status === 'Cancelled';

                return (
                  <div
                    key={order.id}
                    className="bg-[#0f172a] rounded-3xl p-5 sm:p-6 border border-slate-800 hover:border-slate-700 transition-all shadow-xl space-y-5"
                  >
                    {/* Order Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-white">
                            #{order.id}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Payment: <strong className="text-slate-200">{order.paymentMethod}</strong>
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                            isDelivered
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                              : isShipped
                              ? 'bg-purple-950 text-purple-300 border border-purple-500/50'
                              : isConfirmed
                              ? 'bg-blue-950 text-blue-300 border border-blue-500/50'
                              : isCancelled
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/50'
                          }`}
                        >
                          {isDelivered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {isShipped && <Truck className="w-3.5 h-3.5 text-purple-400" />}
                          {isConfirmed && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                          {isPending && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                          {isCancelled && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                          <span>{order.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Live Progress Bar Indicator */}
                    {!isCancelled && (
                      <div className="py-2">
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                          <div className={`p-2 rounded-xl border ${
                            isPending || isConfirmed || isShipped || isDelivered
                              ? 'bg-blue-950/80 border-cyan-500/50 text-cyan-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}>
                            1. Received
                          </div>
                          <div className={`p-2 rounded-xl border ${
                            isConfirmed || isShipped || isDelivered
                              ? 'bg-blue-950/80 border-cyan-500/50 text-cyan-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}>
                            2. Confirmed
                          </div>
                          <div className={`p-2 rounded-xl border ${
                            isShipped || isDelivered
                              ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}>
                            3. In Transit (Truck)
                          </div>
                          <div className={`p-2 rounded-xl border ${
                            isDelivered
                              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}>
                            4. Delivered
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Items List */}
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.productName}
                              className="w-14 h-14 rounded-xl object-cover bg-slate-800 border border-slate-700 flex-shrink-0"
                            />
                            <div>
                              <p className="font-bold text-white text-xs sm:text-sm">
                                {item.productName}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span>Qty: <strong className="text-white">{item.quantity}</strong></span>
                                {item.selectedColor && (
                                  <span>• Color: <strong className="text-cyan-300">{item.selectedColor}</strong></span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white text-xs sm:text-sm">
                              PKR {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Details & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60 text-slate-300">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Delivery Address:</span>
                        <p className="text-white">{order.shippingAddress}, {order.city}</p>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Total Amount:</span>
                        <p className="text-base font-extrabold text-cyan-400 font-mono">
                          PKR {order.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons: WhatsApp & Printable Invoice */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View / Print Receipt Slip</span>
                      </button>

                      <a
                        href={getWhatsAppTrackLink(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-4 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition-colors flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Track on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROFILE & ADDRESS */}
      {activeTab === 'profile' && (
        <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 max-w-2xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white font-heading">
              Customer Profile & Delivery Address
            </h2>
            <p className="text-xs text-slate-400">
              In details ko update karein ta k agle order pe aap ki delivery tezi se ho sakay.
            </p>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Pura Naam (Full Name)
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mobile / WhatsApp Number
                </label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Shehar (City)
              </label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="Lahore, Karachi, Rawalpindi, Islamabad..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Ghar ka Pata (Delivery Address)
              </label>
              <textarea
                rows={3}
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="House / Street / Mohallah / Area"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: CHANGE PASSWORD */}
      {activeTab === 'security' && (
        <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 max-w-xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white font-heading">
              Change Account Password
            </h2>
            <p className="text-xs text-slate-400">
              Apne account ki security k liye naya password set karein.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Purana Password (Agar yaad ho to darj karein)
              </label>
              <input
                type="password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                placeholder="Old Password (Optional)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Naya Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Min 4 characters"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Confirm Naya Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              {isChangingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: WISHLIST */}
      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white font-heading">
            Pasandida Scooties (Wishlist)
          </h2>

          {wishlistProducts.length === 0 ? (
            <div className="bg-[#0f172a] rounded-3xl p-10 text-center border border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-pink-400">
                <Heart className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Wishlist Khali Hai</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Aap ne koi scooty shortlist nahi ki. Kisi b scooty k card pe ❤️ daba kar shortlist karein.
                </p>
              </div>
              <button
                onClick={() => navigate('scooties')}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Explore Scooties
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {wishlistProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col group"
                >
                  <div className="relative aspect-video bg-slate-900 overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/90 text-cyan-300 border border-cyan-500/30">
                      {p.category}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-white text-sm line-clamp-1">{p.name}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{p.shortDescription}</p>
                      <p className="text-base font-extrabold text-cyan-400 font-mono mt-1">
                        PKR {p.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => navigate('product', p.id)}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer text-center"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => addToCart(p, 1)}
                        className="py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PRINTABLE INVOICE / RECEIPT SLIP MODAL */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1628] border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 text-slate-200 animate-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setSelectedInvoiceOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-5">
              <div>
                <span className="text-2xl font-extrabold tracking-tight text-white font-heading">
                  VOLT<span className="text-cyan-400">GLIDE</span>
                </span>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Official Scooty Invoice Slip
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-extrabold text-cyan-300 text-sm">
                  #{selectedInvoiceOrder.id}
                </p>
                <p className="text-[11px] text-slate-400">
                  {new Date(selectedInvoiceOrder.createdAt).toLocaleString('en-PK')}
                </p>
              </div>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Billed To:</p>
                <p className="font-bold text-white text-sm">{selectedInvoiceOrder.customerName}</p>
                <p className="text-slate-300 font-mono">{selectedInvoiceOrder.customerPhone}</p>
                {selectedInvoiceOrder.customerEmail && <p className="text-slate-400">{selectedInvoiceOrder.customerEmail}</p>}
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Destination:</p>
                <p className="text-white">{selectedInvoiceOrder.shippingAddress}</p>
                <p className="text-cyan-300 font-semibold">{selectedInvoiceOrder.city}, Pakistan</p>
                <p className="text-slate-400 text-[10px] mt-1">Payment: <strong>{selectedInvoiceOrder.paymentMethod}</strong></p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Scooty Item</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Qty</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Rate</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {selectedInvoiceOrder.items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{item.productName}</p>
                        {item.selectedColor && (
                          <span className="text-[11px] text-cyan-300">Color: {item.selectedColor}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono">PKR {item.price.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        PKR {(item.price * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-cyan-950/40 border border-cyan-500/30">
              <div className="text-xs">
                <p className="text-slate-400">Order Status: <strong className="text-cyan-300 uppercase">{selectedInvoiceOrder.status}</strong></p>
                <p className="text-[11px] text-slate-500">Official Warranty & Free Helpline Supported</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Grand Total:</span>
                <span className="text-xl font-extrabold text-white font-mono">
                  PKR {selectedInvoiceOrder.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Slip Print & Close Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
