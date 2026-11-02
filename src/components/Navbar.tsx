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
  LayoutDashboard
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    cartCount,
    setIsCartOpen,
    currentRoute,
    navigate,
    isAdmin,
    adminLogout,
    searchQuery,
    setSearchQuery,
    setSelectedCategory
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
    <header className="sticky top-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800/80 shadow-2xl">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Brand */}
          <div
            onClick={() => navigate('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/30 group-hover:shadow-cyan-400/50 transition-all duration-300">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
                <Zap className="w-6 h-6 text-cyan-400 fill-cyan-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-white font-heading">
                  VOLT<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">GLIDE</span>
                </span>
                <span className="bg-blue-500/20 text-cyan-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-500/40 uppercase tracking-wider">
                  EV & Gas
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Scooty Hub Pakistan
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
            <button
              onClick={() => navigate('home')}
              className={`transition-colors py-1 cursor-pointer ${
                currentRoute === 'home'
                  ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-300 hover:text-white'
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
                  ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All Scooties
            </button>
            <button
              onClick={() => {
                setSelectedCategory('Electric');
                navigate('scooties');
              }}
              className="text-slate-300 hover:text-cyan-400 transition-colors py-1 flex items-center gap-1 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Electric EV
            </button>
            <button
              onClick={() => {
                setSelectedCategory('Petrol');
                navigate('scooties');
              }}
              className="text-slate-300 hover:text-cyan-400 transition-colors py-1 cursor-pointer"
            >
              Petrol / Gas
            </button>
            <button
              onClick={() => navigate('about')}
              className={`transition-colors py-1 cursor-pointer ${
                currentRoute === 'about'
                  ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              About Us
            </button>
            <button
              onClick={() => navigate('reviews')}
              className={`transition-colors py-1 cursor-pointer ${
                currentRoute === 'reviews'
                  ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => navigate('contact')}
              className={`transition-colors py-1 cursor-pointer ${
                currentRoute === 'contact'
                  ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Contact Us
            </button>
          </nav>

          {/* Right Action Icons & Three Dots Menu */}
          <div className="flex items-center gap-3">
            
            {/* Search Input / Trigger */}
            <div className="relative hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search scooty (Honda, Vespa, EV)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900/90 text-sm text-slate-200 placeholder-slate-400 pl-9 pr-4 py-1.5 rounded-full border border-slate-700/80 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 w-52 lg:w-64 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </form>
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-cyan-400 rounded-lg hover:bg-slate-800/60"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-300 hover:text-cyan-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              aria-label="Shopping Cart"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-cyan-400 text-black text-[11px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {cartCount}
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
                    : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-500'
                }`}
                title="Options Menu"
                aria-label="Options Menu"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Dropdown Menu */}
              {isThreeDotsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0e1424] border border-blue-500/30 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
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
