/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { FloatingWhatsApp } from './components/FloatingWhatsApp.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { PushOptInBanner } from './components/PushOptInBanner.tsx';

// Pages
import { HomePage } from './pages/HomePage.tsx';
import { ScootiesPage } from './pages/ScootiesPage.tsx';
import { ProductDetailsPage } from './pages/ProductDetailsPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { ReviewsPage } from './pages/ReviewsPage.tsx';
import { AdminLoginPage } from './pages/AdminLoginPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { CustomerAccountPage } from './pages/CustomerAccountPage.tsx';
import { AnalysisPage } from './pages/AnalysisPage.tsx';

import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentRoute, toasts } = useApp();

  const renderPage = () => {
    switch (currentRoute) {
      case 'home':
        return <HomePage />;
      case 'scooties':
        return <ScootiesPage />;
      case 'product':
        return <ProductDetailsPage />;
      case 'analysis':
        return <AnalysisPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'reviews':
        return <ReviewsPage />;
      case 'wishlist':
        return <ScootiesPage />;
      case 'customer-account':
      case 'account':
        return <CustomerAccountPage />;
      case 'admin-login':
        return <AdminLoginPage />;
      case 'admin-dashboard':
        return <AdminDashboardPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-slate-100 font-sans w-full max-w-full overflow-x-clip relative selection:bg-blue-600 selection:text-white">
      
      {/* Navbar with brand, links, cart, and top-right three dots menu for Admin Login */}
      <Navbar />

      {/* Main Page Body */}
      <main className="flex-1 min-w-0 w-full max-w-full overflow-x-clip">
        {renderPage()}
      </main>

      {/* Global Slide-Over Cart Drawer & Checkout */}
      <CartDrawer />

      {/* Official WhatsApp Floating Widget (on every page) */}
      <FloatingWhatsApp />

      {/* Non-intrusive Opt-in / Expired Renewal Banner for Background Push */}
      <PushOptInBanner />

      {/* Comprehensive Showroom Footer */}
      <Footer />

      {/* Toast Notification Container */}
      <div className="fixed top-20 right-3 left-3 sm:left-auto sm:right-5 sm:max-w-sm z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-3.5 rounded-2xl shadow-2xl border text-xs font-medium flex items-center gap-2.5 backdrop-blur-xl animate-in slide-in-from-top-3 fade-in duration-200 pointer-events-auto ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
};

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || 'Unexpected render error' };
  }

  componentDidCatch(error: Error) {
    console.error('VoltGlide UI recovery caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080a11] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-[#0e121d] border border-white/10 p-6 text-center space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white">VoltGlide Scooty Hub</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Page load hone me temporary issue aya. Refresh karne ke liye neeche button dabain.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
            >
              Reload Website
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </AppErrorBoundary>
  );
}
