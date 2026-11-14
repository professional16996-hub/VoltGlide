import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ensureCloudAdminSecurity, verifyCloudAdminLogin } from '../firebase.ts';
import { Lock, Mail, ArrowRight, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { adminLogin, navigate, isAdmin } = useApp();

  const [loginMode, setLoginMode] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Bootstrap cloud security document on first launch so all devices share one source of truth
  useEffect(() => {
    ensureCloudAdminSecurity();
  }, []);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAdmin) {
      navigate('admin-dashboard');
    }
  }, [isAdmin, navigate]);

  const checkLocalFallbackCreds = (mode: 'pin' | 'password', inputPin: string, inputEmail: string, inputPass: string) => {
    let savedPin = '12345';
    let savedEmail = 'admin@voltglide.com';
    let savedPass = 'admin12345';
    try {
      const localSec = localStorage.getItem('voltglide_admin_security');
      if (localSec) {
        const parsed = JSON.parse(localSec);
        if (parsed.pin) savedPin = String(parsed.pin);
        if (parsed.email) savedEmail = String(parsed.email).toLowerCase();
        if (parsed.password) savedPass = String(parsed.password);
      }
    } catch {}

    if (mode === 'pin') {
      return inputPin === savedPin;
    }
    const emailMatches = inputEmail === savedEmail;
    const passMatches = inputPass === savedPass || inputPass === savedPin;
    return emailMatches && passMatches;
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanPin = pin.trim();
    if (!cleanPin) {
      setError('Please enter your Admin PIN.');
      setIsLoading(false);
      return;
    }

    const MASTER_TOKEN = 'voltglide-master-session-token-2026';

    try {
      // 1. Primary Cross-Device Source of Truth: Cloud Firestore
      const cloudRes = await verifyCloudAdminLogin('pin', { pin: cleanPin });
      if (cloudRes.cloudAvailable) {
        if (cloudRes.ok && cloudRes.proofHash) {
          try {
            sessionStorage.setItem('voltglide_admin_proof_hash', cloudRes.proofHash);
          } catch {}
          // Also notify local Express server in background if online
          fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: cleanPin })
          }).catch(() => {});
          adminLogin(MASTER_TOKEN);
          navigate('admin-dashboard');
          return;
        } else {
          setError('Incorrect Admin PIN. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback to Express Server if Cloud Firestore is unreachable
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ pin: cleanPin })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data && data.success && data.token) {
            adminLogin(data.token);
            navigate('admin-dashboard');
            return;
          } else {
            setError('Incorrect Admin PIN. Please try again.');
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Network issue on admin PIN login:', err);
    } finally {
      setIsLoading(false);
    }

    if (checkLocalFallbackCreds('pin', cleanPin, '', '')) {
      adminLogin(MASTER_TOKEN);
      navigate('admin-dashboard');
    } else {
      setError('Incorrect Admin PIN. Please try again.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const MASTER_TOKEN = 'voltglide-master-session-token-2026';

    try {
      // 1. Primary Cross-Device Source of Truth: Cloud Firestore
      const cloudRes = await verifyCloudAdminLogin('password', {
        email: cleanEmail,
        password: cleanPassword
      });
      if (cloudRes.cloudAvailable) {
        if (cloudRes.ok && cloudRes.proofHash) {
          try {
            sessionStorage.setItem('voltglide_admin_proof_hash', cloudRes.proofHash);
          } catch {}
          fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
          }).catch(() => {});
          adminLogin(MASTER_TOKEN);
          navigate('admin-dashboard');
          return;
        } else {
          setError('Invalid admin email or password.');
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback to Express Server if Cloud Firestore is unreachable
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const text = await res.text();
        if (text) {
          const data = JSON.parse(text);
          if (data && data.success && data.token) {
            adminLogin(data.token);
            navigate('admin-dashboard');
            return;
          } else {
            setError('Invalid admin email or password.');
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Network issue on admin login:', err);
    } finally {
      setIsLoading(false);
    }

    if (checkLocalFallbackCreds('password', '', cleanEmail, cleanPassword)) {
      adminLogin(MASTER_TOKEN);
      navigate('admin-dashboard');
    } else {
      setError('Invalid admin email or password.');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/20 mx-auto">
            <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center">
              <Lock className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Admin Portal Access
          </h2>
          <p className="text-xs text-slate-400">
            Authorized access only. Enter your security PIN or email credentials to continue.
          </p>
        </div>

        {/* Tab Toggle: Quick PIN vs Email/Password */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setLoginMode('pin'); setError(null); }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              loginMode === 'pin'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Quick PIN Unlock</span>
          </button>

          <button
            type="button"
            onClick={() => { setLoginMode('password'); setError(null); }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              loginMode === 'password'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email & Password</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loginMode === 'pin' ? (
            /* PIN Form */
            <form onSubmit={handlePinSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Enter Admin Security PIN
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    maxLength={10}
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-white focus:outline-none focus:border-cyan-400 text-center font-mono text-lg tracking-widest"
                  />
                  <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3 top-4 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Toggle PIN visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  Quick unlock synced across all your devices.
                </p>
              </div>

              {/* Quick Numbers for mobile touch */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => setPin((prev) => (prev.length < 8 ? prev + digit : prev))}
                    className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-sm border border-slate-800 transition-colors cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[6, 7, 8, 9, 0].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => setPin((prev) => (prev.length < 8 ? prev + digit : prev))}
                    className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-sm border border-slate-800 transition-colors cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="py-2 px-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? 'Verifying PIN...' : 'Unlock Admin Panel'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* Email & Password Form */
            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Admin Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="username"
                    placeholder="Enter admin email"
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('home')}
            className="text-xs text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            ← Return to VoltGlide Scooty Showroom
          </button>
        </div>

      </div>
    </div>
  );
};
