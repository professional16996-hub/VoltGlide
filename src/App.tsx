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

// Pages
import { HomePage } from './pages/HomePage.tsx';
import { ScootiesPage } from './pages/ScootiesPage.tsx';
import { ProductDetailsPage } from './pages/ProductDetailsPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { ReviewsPage } from './pages/ReviewsPage.tsx';
import { AdminLoginPage } from './pages/AdminLoginPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';

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
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'reviews':
        return <ReviewsPage />;
      case 'wishlist':
        return <ScootiesPage />;
      case 'admin-login':
        return <AdminLoginPage />;
      case 'admin-dashboard':
        return <AdminDashboardPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 font-sans w-full max-w-full overflow-x-hidden relative">
      
      {/* Navbar with brand, links, cart, and top-right three dots menu for Admin Login */}
      <Navbar />

      {/* Main Page Body */}
      <main className="flex-1">
        {renderPage()}
      </main>

      {/* Global Slide-Over Cart Drawer & Checkout */}
      <CartDrawer />

      {/* Official WhatsApp Floating Widget (on every page) */}
      <FloatingWhatsApp />

      {/* Comprehensive Showroom Footer */}
      <Footer />

      {/* Toast Notification Container */}
      <div className="fixed top-24 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
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

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
