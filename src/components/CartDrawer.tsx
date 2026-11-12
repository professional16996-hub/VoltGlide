import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatPKR } from '../utils/formatters.ts';
import { getWhatsAppUrl } from '../utils/whatsapp.ts';
import { WhatsAppIconSVG } from './FloatingWhatsApp.tsx';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Phone,
  User,
  MapPin,
  CreditCard,
  Banknote,
  Building2,
  Loader2
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    cartTotal,
    cartCount,
    placeOrder,
    navigate,
    customer,
    showToast,
    settings
  } = useApp();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ id: string; total: number } | null>(null);

  // Checkout form state (pre-filled from customer if logged in)
  const [customerName, setCustomerName] = useState(customer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(customer?.email || '');
  const [shippingAddress, setShippingAddress] = useState(customer?.address || '');
  const [city, setCity] = useState(customer?.city || 'Lahore');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Bank Transfer / Raast' | 'Online Card'>('Cash on Delivery');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  // Sync if customer logs in or changes
  useEffect(() => {
    if (customer) {
      if (customer.name) setCustomerName(customer.name);
      if (customer.phone) setCustomerPhone(customer.phone);
      if (customer.email) setCustomerEmail(customer.email);
      if (customer.address) setShippingAddress(customer.address);
      if (customer.city) setCity(customer.city);
    }
  }, [customer]);

  if (!isCartOpen) return null;

  const validateForm = () => {
    const errors: { name?: string; phone?: string; address?: string } = {};
    if (!customerName.trim()) {
      errors.name = 'Pura naam likhein (Full name is required)';
    }
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = 'Sahi WhatsApp mobile number likhein (e.g. 0300-1234567)';
    }
    if (!shippingAddress.trim() || shippingAddress.trim().length < 5) {
      errors.address = 'Mukammal delivery address likhein (Street, Area, House #)';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckoutSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      showToast('Zaruri maloomat darj karein (Please fill required fields)', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('Aap ka cart khali hai!', 'error');
      return;
    }

    setIsSubmitting(true);
    const orderItems = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image,
      selectedColor: item.selectedColor
    }));

    const result = await placeOrder({
      customerId: customer?.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      shippingAddress: shippingAddress.trim(),
      city,
      items: orderItems,
      totalAmount: cartTotal,
      paymentMethod,
      notes: notes.trim()
    });

    setIsSubmitting(false);
    if (result.success && result.orderId) {
      setCompletedOrder({ id: result.orderId, total: cartTotal });
      setIsCheckingOut(false);
      setFormErrors({});
    }
  };

  // WhatsApp helper for confirmed order
  const getOrderWhatsAppLink = () => {
    if (!completedOrder) return getWhatsAppUrl();
    const whatsappNum = settings?.whatsappNumber || '03210424424';
    const msg = `Hello VoltGlide Motors!\n\nI have placed an order on your website:\n*Order ID:* ${completedOrder.id}\n*Customer:* ${customerName}\n*Phone:* ${customerPhone}\n*City:* ${city}\n*Address:* ${shippingAddress}\n*Total Amount:* PKR ${completedOrder.total.toLocaleString()}\n*Payment:* ${paymentMethod}\n\nPlease confirm dispatch and delivery timeframe. Thank you!`;
    return getWhatsAppUrl(msg, whatsappNum);
  };

  // Instant direct cart WhatsApp order (alternate 1-click order option)
  const handleDirectWhatsAppCartOrder = () => {
    if (cart.length === 0) return;
    const whatsappNum = settings?.whatsappNumber || '03210424424';
    const itemsList = cart.map((item, idx) => `${idx + 1}. ${item.product.name} (Qty: ${item.quantity}, Color: ${item.selectedColor || 'Standard'}) - PKR ${(item.product.price * item.quantity).toLocaleString()}`).join('\n');
    const msg = `Hello VoltGlide Motors!\n\nI want to place an order via WhatsApp:\n\n*Cart Items:*\n${itemsList}\n\n*Total Amount:* PKR ${cartTotal.toLocaleString()}\n*Delivery:* Free Doorstep Delivery\n*City:* ${city}\n\nPlease share delivery details and dispatch time!`;
    window.open(getWhatsAppUrl(msg, whatsappNum), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dim Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          setIsCartOpen(false);
          setIsCheckingOut(false);
        }}
      />

      {/* Drawer Container: Full screen on mobile (w-full), max-w-lg on desktop */}
      <div className="fixed inset-y-0 right-0 w-full sm:max-w-lg flex flex-col bg-[#090b14] border-l border-white/[0.08] shadow-2xl text-slate-100 z-10">
        
        {/* Fixed Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#0b0e1a]/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            {isCheckingOut && !completedOrder ? (
              <button
                onClick={() => setIsCheckingOut(false)}
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Back to Cart Items"
              >
                <ArrowLeft className="w-5 h-5 text-cyan-400" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-base text-white font-heading">
                {completedOrder ? 'Order Confirmed' : isCheckingOut ? 'Express Checkout' : `Shopping Cart (${cartCount})`}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isCheckingOut ? 'Step 2 of 2: Delivery & Contact' : 'Free Doorstep Delivery Across Pakistan'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsCartOpen(false);
              setIsCheckingOut(false);
              setCompletedOrder(null);
            }}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIEW 1: SUCCESSFUL ORDER CONFIRMATION */}
        {completedOrder ? (
          <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl sm:text-2xl font-black text-white font-heading">
                Order Placed Successfully!
              </h4>
              <p className="text-xs text-slate-400">
                Aap ka scooty order showroom database me save ho chuka hai.
              </p>
            </div>

            <div className="surface-card p-4 rounded-2xl text-xs text-slate-300 w-full text-left space-y-2 border border-white/[0.08]">
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono font-black text-cyan-400 text-sm">#{completedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-white">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mobile Phone:</span>
                <span className="font-mono text-white">{customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="text-white text-right max-w-[200px] truncate">{shippingAddress}, {city}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                <span className="text-slate-400">Total Amount:</span>
                <span className="font-black text-white text-sm font-mono">{formatPKR(completedOrder.total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Payment:</span>
                <span className="text-emerald-400 font-semibold">{paymentMethod}</span>
              </div>
            </div>

            {/* Instant WhatsApp Confirmation */}
            <a
              href={getOrderWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-[0.99] transition-all"
            >
              <WhatsAppIconSVG className="w-5 h-5 text-white" />
              <span>Confirm on WhatsApp for Fast Dispatch</span>
            </a>

            <button
              onClick={() => {
                setCompletedOrder(null);
                setIsCartOpen(false);
                navigate('customer-account');
              }}
              className="w-full py-3 px-4 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-colors cursor-pointer"
            >
              📦 Track Order in Customer Account
            </button>

            <button
              onClick={() => {
                setCompletedOrder(null);
                setIsCartOpen(false);
                navigate('home');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Continue Browsing Showroom
            </button>
          </div>
        ) : isCheckingOut ? (

          /* VIEW 2: EXPRESS CHECKOUT FORM (Scrollable Body + Fixed Sticky Footer) */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            
            {/* Scrollable Form Body */}
            <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              
              {/* Order Summary Strip */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total to Pay:</span>
                  <span className="text-base font-black text-cyan-300 font-mono">{formatPKR(cartTotal)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    FREE DOORSTEP DELIVERY
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{cart.length} scooty item in order</p>
                </div>
              </div>

              {/* Logged in indicator */}
              {customer ? (
                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-200 flex items-center justify-between">
                  <span>Logged in as <strong>{customer.name}</strong></span>
                  <span className="text-[10px] text-cyan-400 font-semibold">Auto-Linked to Account</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Account bana hua hai?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('customer-account');
                    }}
                    className="text-cyan-300 font-bold hover:underline cursor-pointer"
                  >
                    Sign In to Auto-Fill
                  </button>
                </div>
              )}

              {/* Full Name Input */}
              <div className="space-y-1">
                <label className="block text-slate-200 font-semibold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    Full Name (Pura Naam) *
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hamza Khan / Ali Raza"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  className={`w-full bg-[#0c101d] border rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none text-xs transition-colors ${
                    formErrors.name ? 'border-rose-500 focus:border-rose-400 bg-rose-950/20' : 'border-white/[0.1] focus:border-cyan-400'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{formErrors.name}</span>
                  </p>
                )}
              </div>

              {/* WhatsApp Phone & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    WhatsApp Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0300-1234567"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: undefined }));
                    }}
                    className={`w-full bg-[#0c101d] border rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none text-xs font-mono transition-colors ${
                      formErrors.phone ? 'border-rose-500 focus:border-rose-400 bg-rose-950/20' : 'border-white/[0.1] focus:border-cyan-400'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{formErrors.phone}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Delivery City *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#0c101d] border border-white/[0.1] rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400 text-xs cursor-pointer"
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Gujranwala">Gujranwala</option>
                    <option value="Sialkot">Sialkot</option>
                    <option value="Quetta">Quetta</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Sargodha">Sargodha</option>
                    <option value="Bahawalpur">Bahawalpur</option>
                    <option value="Other">Other City</option>
                  </select>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <label className="block text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  Full Delivery Address (Ghar / Dukan Ka Pata) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="House #, Street, Mohalla / Sector, Near Famous Landmark"
                  value={shippingAddress}
                  onChange={(e) => {
                    setShippingAddress(e.target.value);
                    if (formErrors.address) setFormErrors(prev => ({ ...prev, address: undefined }));
                  }}
                  className={`w-full bg-[#0c101d] border rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none text-xs transition-colors ${
                    formErrors.address ? 'border-rose-500 focus:border-rose-400 bg-rose-950/20' : 'border-white/[0.1] focus:border-cyan-400'
                  }`}
                />
                {formErrors.address && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{formErrors.address}</span>
                  </p>
                )}
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold text-xs">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-[#0c101d] border border-white/[0.1] rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-1">
                <label className="block text-slate-200 font-semibold text-xs">
                  Payment Method (Raqam Ki Adaigi)
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'Cash on Delivery'
                        ? 'bg-blue-600/20 border-cyan-400 text-white shadow-md'
                        : 'bg-[#0c101d] border-white/[0.08] text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Cash on Delivery"
                      checked={paymentMethod === 'Cash on Delivery'}
                      onChange={() => setPaymentMethod('Cash on Delivery')}
                      className="text-cyan-400 focus:ring-0"
                    />
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">Cash on Delivery (COD)</span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Scooty delivery k waqt pesay ada karein</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'Bank Transfer / Raast'
                        ? 'bg-blue-600/20 border-cyan-400 text-white shadow-md'
                        : 'bg-[#0c101d] border-white/[0.08] text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Bank Transfer / Raast"
                      checked={paymentMethod === 'Bank Transfer / Raast'}
                      onChange={() => setPaymentMethod('Bank Transfer / Raast')}
                      className="text-cyan-400 focus:ring-0"
                    />
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <div className="flex-1">
                      <span className="font-bold text-xs text-white block">Bank Transfer / Raast ID</span>
                      <p className="text-[11px] text-slate-400">Order k baad official bank details WhatsApp par milein gi</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'Online Card'
                        ? 'bg-blue-600/20 border-cyan-400 text-white shadow-md'
                        : 'bg-[#0c101d] border-white/[0.08] text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Online Card"
                      checked={paymentMethod === 'Online Card'}
                      onChange={() => setPaymentMethod('Online Card')}
                      className="text-cyan-400 focus:ring-0"
                    />
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <div className="flex-1">
                      <span className="font-bold text-xs text-white block">Debit / Credit Card</span>
                      <p className="text-[11px] text-slate-400">Visa / Mastercard accepted</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Notes */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold text-xs">
                  Order Notes / Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Color preference, call before delivery, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0c101d] border border-white/[0.1] rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              {/* Extra spacing at the bottom of the scroll area to prevent any overlap */}
              <div className="h-8"></div>
            </form>

            {/* FIXED STICKY BOTTOM CHECKOUT FOOTER (Always 100% visible, elevated above any mobile overlays) */}
            <div className="sticky bottom-0 bg-[#090b14]/98 backdrop-blur-xl border-t border-white/[0.1] p-4 sm:p-5 pb-8 sm:pb-5 shadow-[0_-12px_30px_rgba(0,0,0,0.7)] z-20 shrink-0 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total to Pay:</span>
                  <span className="text-base sm:text-lg font-black text-cyan-300 font-mono">
                    {formatPKR(cartTotal)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold block text-xs">Free Delivery</span>
                  <span className="text-[10px] text-slate-400">{paymentMethod}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="w-1/3 h-12 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 font-semibold text-xs sm:text-sm border border-white/[0.1] flex items-center justify-center cursor-pointer transition-colors"
                >
                  Back to Cart
                </button>

                {/* Crystal Clear High-Contrast PLACE ORDER Button */}
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="w-2/3 h-12 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-black text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Booking Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Confirm & Place Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        ) : (

          /* VIEW 3: CART ITEMS LIST VIEW */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            
            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] text-slate-500 flex items-center justify-center border border-white/[0.06]">
                    <ShoppingBag className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-white font-heading">Your Cart is Empty</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Explore our electric and petrol scooty collection and add your favorite model!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('scooties');
                    }}
                    className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                  >
                    Browse All Scooties
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedColor}`}
                    className="surface-card rounded-2xl p-3.5 flex gap-3.5 items-center border border-white/[0.08]"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-xl object-cover bg-[#0c101d] flex-shrink-0 border border-white/[0.06]"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate font-heading">
                        {item.product.name}
                      </h4>
                      {item.selectedColor && (
                        <span className="text-[10px] text-cyan-400 block">
                          Color: {item.selectedColor}
                        </span>
                      )}
                      <span className="text-xs font-extrabold text-white block mt-0.5 font-mono">
                        {formatPKR(item.product.price)}
                      </span>

                      <div className="flex items-center gap-2 mt-2">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-white/[0.1] rounded-lg overflow-hidden bg-white/[0.04]">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selectedColor)}
                            className="px-2 py-1 text-slate-300 hover:text-white hover:bg-white/[0.1] cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-white font-mono">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selectedColor)}
                            className="px-2 py-1 text-slate-300 hover:text-white hover:bg-white/[0.1] cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Remove item */}
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 ml-auto transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="sticky bottom-0 bg-[#090b14]/98 backdrop-blur-xl border-t border-white/[0.1] p-4 sm:p-5 pb-8 sm:pb-5 shadow-[0_-12px_30px_rgba(0,0,0,0.7)] z-20 space-y-3 shrink-0">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal ({cartCount} items)</span>
                    <span className="font-semibold text-white font-mono">{formatPKR(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-400" />
                      Nationwide Delivery
                    </span>
                    <span className="text-emerald-400 font-bold uppercase text-[11px]">FREE</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Free Helmet & Warranty
                    </span>
                    <span className="text-cyan-400 font-semibold text-[11px]">INCLUDED</span>
                  </div>
                  <div className="pt-2 border-t border-white/[0.08] flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white">Grand Total</span>
                    <span className="text-lg font-black text-cyan-300 font-heading font-mono">
                      {formatPKR(cartTotal)}
                    </span>
                  </div>
                </div>

                {/* Primary Button: Proceed to Checkout */}
                <button
                  onClick={() => setIsCheckingOut(true)}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-black text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Proceed to Express Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Instant WhatsApp Order Option */}
                <button
                  onClick={handleDirectWhatsAppCartOrder}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <WhatsAppIconSVG className="w-4 h-4 text-emerald-400" />
                  <span>Order Directly on WhatsApp</span>
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
