import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  CheckCheck,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  X,
  Send
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { PushNotificationRecord } from '../types.ts';

function formatNotifTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
}

const CATEGORY_STYLE: Record<string, { label: string; cls: string }> = {
  offer: { label: 'Special Offer', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  order: { label: 'Order Update', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  new_arrival: { label: 'New Scooty', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  announcement: { label: 'Announcement', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  general: { label: 'Alert', cls: 'bg-slate-700/60 text-slate-300 border-slate-600' }
};

export const NotificationCenter: React.FC = () => {
  const {
    pushState,
    isPushLoading,
    notifications,
    readNotificationIds,
    unreadNotificationCount,
    enablePermanentPush,
    disablePermanentPush,
    sendTestNotification,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteUserNotification,
    clearUserNotificationHistory,
    navigate
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleOpenToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      refreshNotifications();
    }
  };

  const handleNotificationClick = (notif: PushNotificationRecord) => {
    markNotificationRead(notif.id);
    if (notif.url) {
      if (notif.url.startsWith('http')) {
        const a = document.createElement('a');
        a.href = notif.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const route = notif.url.replace(/^\/+/, '') || 'home';
        navigate(route);
      }
    }
    setIsOpen(false);
  };

  const filteredNotifications =
    activeCategoryFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.category === activeCategoryFilter);

  const isSubscribed = pushState.status === 'active';
  const isExpired = pushState.status === 'expired' || pushState.isExpired;
  const isBlocked = pushState.status === 'blocked' || pushState.permission === 'denied';

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger */}
      <button
        onClick={handleOpenToggle}
        className={`relative p-2 rounded-xl transition-all border cursor-pointer ${
          isOpen
            ? 'bg-blue-600/30 text-cyan-300 border-cyan-500 shadow-md shadow-blue-500/20'
            : isExpired
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
            : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border-white/[0.08]'
        }`}
        aria-label="Notifications"
        title={
          isSubscribed
            ? 'Background Push Active · View Notifications'
            : isExpired
            ? 'Push Subscription Expired · Tap to Re-subscribe'
            : 'Enable Permanent Push Notifications'
        }
      >
        {isSubscribed ? (
          <BellRing className="w-4 h-4 text-cyan-400" />
        ) : isBlocked ? (
          <BellOff className="w-4 h-4 text-rose-400" />
        ) : (
          <Bell className="w-4 h-4" />
        )}

        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow">
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
        {unreadNotificationCount === 0 && isExpired && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-[#080a11]" />
        )}
      </button>

      {/* Dropdown / Drawer Panel */}
      {isOpen && (
        <div className="fixed sm:absolute right-3 left-3 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 sm:w-[390px] bg-[#0c1222] border border-blue-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-heading">
                Notifications ({notifications.length})
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={refreshNotifications}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer transition-colors"
                title="Refresh notifications"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Permanent Subscription Status Bar */}
          <div className="p-3.5 border-b border-slate-800/90 bg-slate-900/70">
            {isSubscribed ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Mobile & Background Alerts Active</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {pushState.browserLabel} · Shows in phone notification bar
                    </p>
                  </div>
                  <button
                    onClick={disablePermanentPush}
                    disabled={isPushLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Pause
                  </button>
                </div>
                <button
                  onClick={sendTestNotification}
                  className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Test Alert to Phone Notification Bar</span>
                </button>
              </div>
            ) : isExpired ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Push Subscription Expired</p>
                    <p className="text-[11px] text-amber-300/80">
                      Your browser rotated or expired its push token. Tap below to restore background alerts.
                    </p>
                  </div>
                </div>
                <button
                  onClick={enablePermanentPush}
                  disabled={isPushLoading}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPushLoading ? 'animate-spin' : ''}`} />
                  <span>{isPushLoading ? 'Re-subscribing...' : 'Re-subscribe Now'}</span>
                </button>
              </div>
            ) : isBlocked ? (
              <div className="flex items-start gap-2 text-xs text-rose-200">
                <BellOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Notifications Blocked in Browser</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Open browser site permissions (lock icon in address bar) and set Notifications to Allow, then reload.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-white">
                      Get Instant Order & Offer Alerts
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {pushState.iosNeedsHomeScreen
                        ? 'Tap Share → Add to Home Screen on iOS first to enable background push.'
                        : 'Works permanently even after closing website or restarting your phone.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={enablePermanentPush}
                  disabled={isPushLoading}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>{isPushLoading ? 'Subscribing...' : 'Enable Permanent Alerts'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Category Tabs for All Notification Types */}
          {notifications.length > 0 && (
            <div className="px-3 py-2 border-b border-slate-800/70 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-[#0a0f1d]">
              {[
                { key: 'all', label: 'All' },
                { key: 'order', label: 'Orders' },
                { key: 'offer', label: 'Offers' },
                { key: 'new_arrival', label: 'New Scooties' },
                { key: 'announcement', label: 'Alerts' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategoryFilter(tab.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    activeCategoryFilter === tab.key
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Notification History Actions */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-b border-slate-800/70 flex items-center justify-between text-[11px] bg-[#0a0f1d]">
              <button
                onClick={markAllNotificationsRead}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
              <button
                onClick={clearUserNotificationHistory}
                className="text-slate-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                title="Clears history only — your push subscription stays active"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear history</span>
              </button>
            </div>
          )}

          {/* Persistent Notification History List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/70">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">
                  {notifications.length === 0
                    ? 'No notifications in your history'
                    : 'No notifications in this category'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isSubscribed
                    ? 'You are subscribed — order updates, offers & admin alerts will appear here and in your phone notification bar.'
                    : 'Enable alerts above to receive notifications in your phone notification bar.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = !readNotificationIds.includes(notif.id);
                const cat = CATEGORY_STYLE[notif.category] || CATEGORY_STYLE.general;
                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors flex items-start gap-3 ${
                      isUnread ? 'bg-blue-950/35 hover:bg-blue-950/50' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <button
                      onClick={() => handleNotificationClick(notif)}
                      className="flex-1 text-left min-w-0 space-y-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cat.cls}`}>
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatNotifTime(notif.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isUnread && <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />}
                        <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                        {notif.body}
                      </p>
                      {notif.url && notif.url !== '/' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 font-semibold pt-0.5">
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>Open {notif.url}</span>
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => deleteUserNotification(notif.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 shrink-0 cursor-pointer transition-colors"
                      title="Delete notification from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
