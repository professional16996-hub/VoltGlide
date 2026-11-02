import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Lock, Mail, ShieldCheck, ArrowRight, Zap, AlertCircle } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { adminLogin, navigate, isAdmin } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (isAdmin) {
      navigate('admin-dashboard');
    }
  }, [isAdmin, navigate]);

  const handleFillDemo = () => {
    setEmail('admin@voltglide.com');
    setPassword('admin12345');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        adminLogin(data.token);
        navigate('admin-dashboard');
      } else {
        setError(data.message || 'Invalid admin credentials');
      }
    } catch {
      setError('Connection to admin server failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-0.5 shadow-xl shadow-blue-500/30 mx-auto">
            <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center">
              <Lock className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Admin Portal Login
          </h2>
          <p className="text-xs text-slate-400">
            Secure access to VoltGlide Scooty inventory, orders, banners, and customer reviews.
          </p>
        </div>

        {/* Demo Credentials Helper Box */}
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Default Admin Credentials:
            </span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Fill Credentials
            </button>
          </div>
          <div className="font-mono text-[11px] text-slate-300 space-y-0.5">
            <p>Email: <span className="text-white">admin@voltglide.com</span></p>
            <p>Password: <span className="text-white">admin12345</span></p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Admin Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@voltglide.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Admin Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? 'Verifying Credentials...' : 'Sign In to Admin Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('home')}
            className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
          >
            ← Return to VoltGlide Showroom
          </button>
        </div>

      </div>
    </div>
  );
};
