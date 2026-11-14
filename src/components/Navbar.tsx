import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  MoreVertical,
  ShoppingCart,
  Search,
  Zap,
  Home,
  Info,
  Mail,
  Lock,
  LogOut,
  LayoutDashboard,
  User,
  BarChart3
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    cartCount,
    setIsCartOpen,
    currentRoute,
    navigate,
    isAdmin,
    adminLogout,
    customer,
    isCustomerLoggedIn,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    settings
  } = useApp();

  const [isThreeDotsOpen, setIsThreeDotsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const threeDotsRef = useRef<HTMLDivElement>(null);

  // Close three dots menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (threeDotsRef.current && !threeDotsRef.current.contains(e.target as Node)) {
        setIsThreeDotsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('scooties');
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#080a11]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Dynamic Announcement Bar configured from Admin Panel */}
      {settings?.announcementBar?.enabled && settings.announcementBar.text && (
        <div className="bg-[#0e1424] border-b border-white/[0.06] text-slate-200 text-[11px] sm:text-xs py-2 px-4 text-center flex items-center justify-center gap-2 font-medium tracking-wide">
          <span className="text-slate-300">{settings.announcementBar.text}</span>
          {settings.announcementBar.link && (
            <button
              onClick={() => {
                const link = settings.announcementBar?.link || '';
                if (link.startsWith('http')) {
                  window.open(link, '_blank');
                } else {
                  const path = link.replace(/^\//, '');
                  navigate(path || 'scooties');
                }
              }}
              className="text-blue-400 hover:text-cyan-300 font-semibold ml-1 transition-colors cursor-pointer"
            >
              View Offer →
            </button>
          )}
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          
          {/* Logo & Brand */}
          <div
            onClick={() => navigate('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 group-hover:shadow-cyan-400/30 transition-all duration-300">
              <div className="w-full h-full bg-[#080a11] rounded-[9px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-black tracking-tight text-white font-heading">
                  VOLT<span className="text-cyan-400">GLIDE</span>
                </span>
              </div>
              <p className="text-[9px] text-slate-400 tracking-widest uppercase font-semibold">
                Motors Pakistan
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs font-semibold tracking-wide uppercase">
            <button
              onClick={() => navigate('home')}
              className={`transition-colors py-1 cursor-pointer ${
                currentRoute === 'home'
                  ? 'text-white border-b border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                setSelectedCategory('All');
                navigate('scooties');
              }}
              className={`transition-colors py-1 cursor-pointer ${
                currentRoute === 'scooties'
                  ? 'text-white border-b border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Scooties
            </button>
            <button
              onClick={() => {
                setSelectedCategory('Electric');
                navigate('scooties');
              }}
              className="text-slate-400 hover:text-cyan-400 transition-colors py-1 cursor-pointer"
            >
              Electric EV
            </button>
            <button
              onClick={() => {
                setSelectedCategory('Petrol');
                navigate('scooties');
              }}
              className="text-slate-400 hover:text-white transition-colors py-1 cursor-pointer"
            >
              Petrol / Gas
            </button>
            <button
              onClick={() => navigate('analysis')}
              className={`transition-colors py-1 whitespace-nowrap shrink-0 cursor-pointer ${
                currentRoute === 'analysis'
                  ? 'text-white border-b border-cyan-400'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => navigate('about')}
              className={`transition-colors py-1 whitespace-nowrap shrink-0 cursor-pointer ${
                currentRoute === 'about'
                  ? 'text-white border-b border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              About Us
            </button>
            <button
              onClick={() => navigate('reviews')}
              className={`transition-colors py-1 whitespace-nowrap shrink-0 cursor-pointer ${
                currentRoute === 'reviews'
                  ? 'text-white border-b border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => navigate('contact')}
              className={`transition-colors py-1 whitespace-nowrap shrink-0 cursor-pointer ${
                currentRoute === 'contact'
                  ? 'text-white border-b border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Contact Us
            </button>
          </nav>

          {/* Right Action Icons & Three Dots Menu */}
          <div className="flex items-center gap-2.5">
            
            {/* Search Input / Trigger */}
            <div className="relative hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search scooties (EV, Honda)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/[0.04] text-xs text-slate-100 placeholder-slate-400 pl-8 pr-4 py-2 rounded-full border border-white/[0.08] focus:outline-none focus:border-cyan-400/60 focus:bg-white/[0.07] w-48 lg:w-60 transition-all font-medium"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </form>
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-xl bg-white/[0.04] border border-white/[0.08]"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-300 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
              aria-label="Shopping Cart"
              title="View Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Customer Account Button */}
            <button
              onClick={() => navigate('customer-account')}
              className={`p-2 rounded-xl transition-all border cursor-pointer flex items-center gap-1.5 ${
                currentRoute === 'customer-account'
                  ? 'bg-blue-600/30 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border-white/[0.08]'
              }`}
              title={isCustomerLoggedIn ? `Customer Account: ${customer?.name}` : 'Customer Sign In / Register'}
              aria-label="Customer Account"
            >
              <User className="w-4 h-4 text-cyan-400" />
              {isCustomerLoggedIn && (
                <span className="hidden xl:inline-block text-xs font-semibold text-slate-200 max-w-[85px] truncate">
                  {customer?.name.split(' ')[0]}
                </span>
              )}
            </button>

            {/* THREE DOTS (⋮) MENU */}
            <div className="relative" ref={threeDotsRef}>
              <button
                onClick={() => setIsThreeDotsOpen(!isThreeDotsOpen)}
                className={`p-2 rounded-xl transition-all border cursor-pointer ${
                  isThreeDotsOpen
                    ? 'bg-blue-600/30 text-cyan-300 border-cyan-500 shadow-md shadow-blue-500/20'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border-white/[0.08]'
                }`}
                title="Options Menu"
                aria-label="Options Menu"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {isThreeDotsOpen && (
                <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-[#0e1424] border border-blue-500/30 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                      Menu & Navigation
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('home');
                        setIsThreeDotsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-blue-600/20 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <Home className="w-4 h-4 text-cyan-400" />
                      Home
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        navigate('scooties');
                        setIsThreeDotsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:text-white hover:bg-blue-600/20 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-cyan-400" />
                      All Scooties
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCategory('Electric');
                        navigate('scooties');
                        setIsThreeDotsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:text-white hover:bg-blue-600/20 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-cyan-400 ml-1 mr-1"></span>
                      Electric EV Scooties
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCategory('Petrol');
                        navigate('scooties');
                        setIsThreeDotsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:text-white hover:bg-blue-600/20 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400 ml-1 mr-1"></span>
                      Petrol Scooters
                    </button>

                    <button
                      onClick={() => {
                        navigate('analysis');
                        setIsThreeDotsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:text-white hover:bg-blue-600/20 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      4-Type Scooty Analysis
                    </button>

                    <button
                      onClick={() => {
                        navigate('about');
                        setIsThreeDotsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-blue-600/20 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <Info className="w-4 h-4 text-blue-400" />
                      About Us
                    </button>

                    <button
                      onClick={() => {
                        navigate('reviews');
                        setIsThreeDotsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:text-white hover:bg-blue-600/20 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <Info className="w-4 h-4 text-amber-400" />
                      Customer Reviews
                    </button>

                    <button
                      onClick={() => {
                        navigate('contact');
                        setIsThreeDotsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:text-white hover:bg-blue-600/20 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-cyan-400" />
                      Contact Us
                    </button>

                    <button
                      onClick={() => {
                        navigate('customer-account');
                        setIsThreeDotsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:text-white hover:bg-blue-600/20 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-cyan-400" />
                      {isCustomerLoggedIn ? `My Account (${customer?.name.split(' ')[0]})` : 'Customer Sign In / Register'}
                    </button>

                    <div className="my-1.5 border-t border-slate-800/80"></div>

                    {/* Admin Access inside 3-dots */}
                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => {
                            navigate('admin-dashboard');
                            setIsThreeDotsOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-blue-600/30 flex items-center gap-3 transition-colors cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                          Admin Dashboard
                        </button>
                        <button
                          onClick={() => {
                            adminLogout();
                            setIsThreeDotsOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-3 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Admin Logout
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          navigate('admin-login');
                          setIsThreeDotsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-blue-300 hover:text-white hover:bg-blue-600/30 flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <Lock className="w-4 h-4 text-cyan-400" />
                        Admin Login
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {isSearchOpen && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search scooties (Honda, EV, Vespa)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 text-sm text-slate-200 placeholder-slate-400 pl-9 pr-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400"
                autoFocus
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </form>
          </div>
        )}
      </div>
    </header>
  );
};
