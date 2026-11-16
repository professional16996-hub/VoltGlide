import React, { useState, useEffect } from 'react';
import { BellRing, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { safeGetStorage, safeSetStorage } from '../utils/safeStorage.ts';

const PROMPT_DISMISSED_KEY = 'voltglide_push_prompt_dismissed_at';

export const PushOptInBanner: React.FC = () => {
  const { pushState, isPushLoading, enablePermanentPush } = useApp();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Never show banner if already subscribed or unsupported/blocked
    if (!pushState.supported || pushState.status === 'active' || pushState.status === 'blocked') {
      setDismissed(true);
      return;
    }

    // Always prompt if an existing subscription expired so user can re-subscribe in 1 tap
    if (pushState.status === 'expired' || pushState.isExpired) {
      setDismissed(false);
      return;
    }

    const lastDismissed = Number(safeGetStorage(PROMPT_DISMISSED_KEY) || '0');
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    if (!lastDismissed || Date.now() - lastDismissed > threeDaysMs) {
      const timer = setTimeout(() => setDismissed(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [pushState.supported, pushState.status, pushState.isExpired]);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    safeSetStorage(PROMPT_DISMISSED_KEY, String(Date.now()));
  };

  const isExpired = pushState.status === 'expired' || pushState.isExpired;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-sm z-40 bg-[#0d1424]/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isExpired
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
          }`}
        >
          {isExpired ? <AlertTriangle className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs font-bold text-white">
              {isExpired ? 'Push Subscription Expired' : 'Enable Permanent Alerts'}
            </h4>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              aria-label="Dismiss alert prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
            {isExpired
              ? 'Your device notification subscription expired. Re-subscribe once to keep receiving order & offer alerts.'
              : pushState.iosNeedsHomeScreen
              ? 'Add VoltGlide to your iOS Home Screen via Share to enable background push alerts.'
              : 'Receive order status & new scooty alerts even when the browser is closed or phone restarts.'}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={async () => {
                const ok = await enablePermanentPush();
                if (ok) setDismissed(true);
              }}
              disabled={isPushLoading}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isExpired
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isPushLoading ? 'animate-spin' : ''}`} />
              <span>
                {isPushLoading
                  ? 'Activating...'
                  : isExpired
                  ? 'Re-subscribe Now'
                  : 'Allow Notifications'}
              </span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1.5 rounded-xl text-[11px] text-slate-400 hover:text-white cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
