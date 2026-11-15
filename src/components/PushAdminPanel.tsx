import React, { useState, useEffect, useCallback } from 'react';
import {
  BellRing,
  Send,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Users,
  Clock,
  Globe,
  Ban
} from 'lucide-react';
import { PushNotificationCategory, PushNotificationRecord, PushSubscriptionRecord } from '../types.ts';
import {
  subscribeToCloudPushSubscriptions,
  subscribeToCloudNotifications,
  deleteCloudNotification,
  deleteCloudPushSubscription
} from '../firebase.ts';

interface PushAdminPanelProps {
  adminToken: string | null;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  customers: { id: string; name: string; phone: string }[];
}

export const PushAdminPanel: React.FC<PushAdminPanelProps> = ({
  adminToken,
  showToast,
  customers
}) => {
  const [subscriptions, setSubscriptions] = useState<PushSubscriptionRecord[]>([]);
  const [notifications, setNotifications] = useState<PushNotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Compose Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<PushNotificationCategory>('offer');
  const [url, setUrl] = useState('/scooties');
  const [imageUrl, setImageUrl] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'customer'>('all');
  const [selectedCustomerKey, setSelectedCustomerKey] = useState('');

  const loadOverview = useCallback(async () => {
    if (!adminToken) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/push/overview', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          setSubscriptions(json.data.subscriptions || []);
          setNotifications(json.data.notifications || []);
        }
      }
    } catch (err) {
      console.warn('Admin push overview fetch warning:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    loadOverview();
    const unsubSubs = subscribeToCloudPushSubscriptions((cloudSubs) => {
      if (cloudSubs.length > 0) {
        setSubscriptions((prev) => {
          const map = new Map<string, PushSubscriptionRecord>();
          for (const s of prev) map.set(s.id, s);
          for (const s of cloudSubs) map.set(s.id, s);
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.lastVerifiedAt || b.createdAt).getTime() - new Date(a.lastVerifiedAt || a.createdAt).getTime()
          );
        });
      }
    });
    const unsubNotifs = subscribeToCloudNotifications((cloudNotifs) => {
      if (cloudNotifs.length > 0) {
        setNotifications((prev) => {
          const map = new Map<string, PushNotificationRecord>();
          for (const n of prev) map.set(n.id, n);
          for (const n of cloudNotifs) map.set(n.id, n);
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      }
    });
    return () => {
      unsubSubs();
      unsubNotifs();
    };
  }, [loadOverview]);

  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const expiredSubs = subscriptions.filter((s) => s.status === 'expired');
  const totalDelivered = notifications.reduce((acc, n) => acc + (n.sentCount || 0), 0);

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast('Notification title and message body are required.', 'error');
      return;
    }

    let targetCustomerId: string | undefined;
    let targetPhone: string | undefined;
    if (targetType === 'customer') {
      if (!selectedCustomerKey) {
        showToast('Please select a customer or switch target to All Subscribers.', 'error');
        return;
      }
      const matchedCust = customers.find((c) => c.id === selectedCustomerKey || c.phone === selectedCustomerKey);
      targetCustomerId = matchedCust?.id;
      targetPhone = matchedCust?.phone || selectedCustomerKey;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          category,
          url: url.trim() || '/',
          imageUrl: imageUrl.trim() || undefined,
          targetType,
          targetCustomerId,
          targetPhone
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || 'Push notification sent!', 'success');
        setTitle('');
        setBody('');
        setImageUrl('');
        await loadOverview();
      } else {
        showToast(json.message || 'Failed to send notification.', 'error');
      }
    } catch {
      showToast('Network error while sending push notification.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await fetch(`/api/admin/push/notifications/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      await deleteCloudNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast('Notification deleted from permanent history.', 'info');
    } catch {
      showToast('Failed to delete notification.', 'error');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      await fetch(`/api/admin/push/subscriptions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      await deleteCloudPushSubscription(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      showToast('Device subscription removed.', 'info');
    } catch {
      showToast('Failed to remove subscription.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h3 className="font-bold text-white text-base font-heading flex items-center gap-2">
            <BellRing className="w-5 h-5 text-cyan-400" />
            <span>Permanent Background Push & FCM Broadcasts</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Subscribed mobile & desktop users receive push alerts even after closing the website or restarting their phone.
          </p>
        </div>
        <button
          onClick={loadOverview}
          disabled={isLoading}
          className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Subscribers</span>
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] rounded-2xl p-4 border border-emerald-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Active Subscribed Devices</span>
          <p className="text-2xl font-black text-emerald-300 font-heading">{activeSubs.length}</p>
        </div>
        <div className="bg-[#0f172a] rounded-2xl p-4 border border-amber-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Expired (Auto-Detected)</span>
          <p className="text-2xl font-black text-amber-300 font-heading">{expiredSubs.length}</p>
        </div>
        <div className="bg-[#0f172a] rounded-2xl p-4 border border-cyan-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Saved Broadcasts</span>
          <p className="text-2xl font-black text-cyan-300 font-heading">{notifications.length}</p>
        </div>
        <div className="bg-[#0f172a] rounded-2xl p-4 border border-blue-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Total Push Deliveries</span>
          <p className="text-2xl font-black text-blue-300 font-heading">{totalDelivered}</p>
        </div>
      </div>

      {/* Compose + Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSendPush}
          className="lg:col-span-2 bg-[#0f172a] rounded-3xl p-6 border border-slate-800 space-y-4 text-xs"
        >
          <h4 className="font-bold text-white text-sm font-heading">
            Send Real Background Push Notification
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Notification Title *</label>
              <input
                type="text"
                maxLength={140}
                placeholder="e.g., Flash Eid Offer: Rs. 15,000 Off VoltGlide Pro!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PushNotificationCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="offer">Special Offer / Discount</option>
                <option value="new_arrival">New Scooty Launch</option>
                <option value="order">Order Update</option>
                <option value="announcement">Showroom Announcement</option>
                <option value="general">General Alert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Message Body *</label>
            <textarea
              rows={3}
              maxLength={600}
              placeholder="Write the message users will see on their phone lock screen and notification tray..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Audience</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as 'all' | 'customer')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Subscribed Devices ({activeSubs.length})</option>
                <option value="customer">Specific Customer</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Click Destination</label>
              <select
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="/scooties">All Scooties Catalog</option>
                <option value="/customer-account">Customer Account / Orders</option>
                <option value="/analysis">Scooty Analysis</option>
                <option value="/contact">Contact & Showrooms</option>
                <option value="/">Home Page</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Image URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {targetType === 'customer' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Subscribed Customer</label>
              <select
                value={selectedCustomerKey}
                onChange={(e) => setSelectedCustomerKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              Push TTL: 24 Hours · Delivers automatically when offline phones reconnect.
            </span>
            <button
              type="submit"
              disabled={isSending}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sending Push...' : 'Send Push Notification'}</span>
            </button>
          </div>
        </form>

        {/* Live Mobile Notification Preview */}
        <div className="bg-[#0f172a] rounded-3xl p-5 border border-slate-800 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Mobile Lock-Screen Preview
          </p>
          <div className="rounded-2xl bg-slate-900/95 border border-slate-700/80 p-4 space-y-2 shadow-xl">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  V
                </span>
                <span className="font-semibold text-slate-300">VoltGlide Scooty Hub</span>
              </div>
              <span>now</span>
            </div>
            <p className="text-sm font-bold text-white leading-snug">
              {title.trim() || 'Notification Title Preview'}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {body.trim() || 'Your notification message will appear here on Android, iOS PWA, and Desktop.'}
            </p>
            {imageUrl.trim() && (
              <img
                src={imageUrl.trim()}
                alt="Notification preview"
                className="w-full h-24 object-cover rounded-xl border border-slate-700 mt-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Every sent broadcast is saved permanently in Firestore and backend history until deleted by Admin or user.
          </p>
        </div>
      </div>

      {/* Persistent Broadcast History */}
      <div className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white text-sm font-heading">
            Permanent Notification History ({notifications.length})
          </h4>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-slate-800/80 rounded-2xl">
            No push notifications sent yet. Send your first broadcast above.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase">
                      {n.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">
                      {n.sentBy} · {n.targetType === 'customer' ? `Customer (${n.targetPhone || n.targetCustomerId})` : 'All Devices'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">{n.title}</p>
                  <p className="text-xs text-slate-300">{n.body}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1 font-mono">
                    <span className="text-emerald-400">Delivered: {n.sentCount}</span>
                    <span className="text-amber-400">Expired: {n.expiredCount}</span>
                    <span className="text-rose-400">Failed: {n.failedCount}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteNotification(n.id)}
                  className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 self-start sm:self-center cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscribed Devices Registry */}
      <div className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-white text-sm font-heading flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Permanent Device Subscriptions ({subscriptions.length})</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Subscriptions stay permanently saved across logouts, browser closes, and history clears.
            </p>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-slate-800/80 rounded-2xl">
            No devices subscribed yet. Users can subscribe via the Bell icon or opt-in banner.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border ${
                        sub.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : sub.status === 'expired'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-slate-700/60 text-slate-300 border-slate-600'
                      }`}
                    >
                      {sub.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                      {sub.status === 'expired' && <AlertTriangle className="w-3 h-3" />}
                      {sub.status === 'unsubscribed' && <Ban className="w-3 h-3" />}
                      <span className="uppercase">{sub.status}</span>
                    </span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                      {sub.browserLabel}
                    </span>
                  </div>

                  {sub.customerName && (
                    <p className="text-xs text-cyan-300 font-semibold">
                      {sub.customerName} {sub.customerPhone ? `(${sub.customerPhone})` : ''}
                    </p>
                  )}

                  <p className="text-[10px] text-slate-400 font-mono truncate flex items-center gap-1">
                    <Globe className="w-3 h-3 shrink-0" />
                    <span>{sub.endpoint}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Subscribed: {new Date(sub.createdAt).toLocaleDateString()} · Verified:{' '}
                    {new Date(sub.lastVerifiedAt).toLocaleString()}
                  </p>
                  {sub.failureReason && (
                    <p className="text-[10px] text-amber-300">{sub.failureReason}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteSubscription(sub.id)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 cursor-pointer shrink-0"
                  title="Remove device record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
