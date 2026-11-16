import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatPKR } from '../utils/formatters.ts';
import { getWhatsAppUrl } from '../utils/whatsapp.ts';
import { WhatsAppIconSVG } from './FloatingWhatsApp.tsx';
import { DEFAULT_PAYMENT_ACCOUNTS } from '../data/defaultData.ts';
import { PaymentAccount, OrderItem } from '../types.ts';
import { downloadOrderReceiptPng, formatReceiptDateTime } from '../utils/receiptGenerator.ts';
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
  Loader2,
  Copy,
  Check,
  Wallet,
  Landmark,
  Download,
  Printer,
  Receipt
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
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    id: string;
    createdAt: string;
    total: number;
    items: OrderItem[];
    customerName: string;
    customerPhone: string;
    alternatePhone?: string;
    customerEmail?: string;
    cnic?: string;
    shippingAddress: string;
    areaLandmark?: string;
    city: string;
    paymentMethod: string;
    paymentDetail?: string;
    notes?: string;
  } | null>(null);

  // Checkout form state (pre-filled from customer if logged in)
  const [customerName, setCustomerName] = useState(customer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || '');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState(customer?.email || '');
  const [cnic, setCnic] = useState('');
  const [shippingAddress, setShippingAddress] = useState(customer?.address || '');
  const [areaLandmark, setAreaLandmark] = useState('');
  const [city, setCity] = useState(customer?.city || 'Lahore');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Bank Transfer / Raast' | 'Online Card'>('Cash on Delivery');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
  const [selectedCardAccountId, setSelectedCardAccountId] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  const allPaymentAccounts: PaymentAccount[] =
    Array.isArray(settings?.paymentAccounts) && settings.paymentAccounts.length > 0
      ? settings.paymentAccounts
      : DEFAULT_PAYMENT_ACCOUNTS;

  const bankTransferAccounts = allPaymentAccounts.filter(
    (a) => a.group === 'bank_transfer' && a.active !== false
  );
  const debitCardAccounts = allPaymentAccounts.filter(
    (a) => a.group === 'debit_card' && a.active !== false
  );

  const activeBankAccount =
    bankTransferAccounts.find((a) => a.id === selectedBankAccountId) || bankTransferAccounts[0] || null;
  const activeCardAccount =
    debitCardAccounts.find((a) => a.id === selectedCardAccountId) || debitCardAccounts[0] || null;

  const handleCopyAccountText = async (key: string, value: string, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      showToast(`${label} copied: ${value}`, 'success');
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2200);
    } catch {
      showToast(`${label}: ${value}`, 'info');
    }
  };

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

    const selectedPaymentAccount =
      paymentMethod === 'Bank Transfer / Raast'
        ? activeBankAccount
        : paymentMethod === 'Online Card'
        ? activeCardAccount
        : null;

    const cleanRef = paymentRef.trim();
    const computedPaymentDetail = selectedPaymentAccount
      ? `${selectedPaymentAccount.provider} (${selectedPaymentAccount.accountNumber})${
          cleanRef ? ` · Ref: ${cleanRef}` : ''
        }`
      : '';

    const result = await placeOrder({
      customerId: customer?.id,
      accountType: customer ? 'Registered' : 'Guest',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      alternatePhone: alternatePhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      cnic: cnic.trim() || undefined,
      shippingAddress: shippingAddress.trim(),
      areaLandmark: areaLandmark.trim() || undefined,
      city,
      items: orderItems,
      totalAmount: cartTotal,
      paymentMethod,
      paymentDetail: computedPaymentDetail || undefined,
      notes: notes.trim()
    });

    setIsSubmitting(false);
    if (result.success && result.orderId) {
      setCompletedOrder({
        id: result.orderId,
        createdAt: new Date().toISOString(),
        total: cartTotal,
        items: orderItems,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        alternatePhone: alternatePhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        cnic: cnic.trim() || undefined,
        shippingAddress: shippingAddress.trim(),
        areaLandmark: areaLandmark.trim() || undefined,
        city,
        paymentMethod,
        paymentDetail: computedPaymentDetail || undefined,
        notes: notes.trim() || undefined
      });
      setIsCheckingOut(false);
      setFormErrors({});
      setPaymentRef('');
    }
  };

  const handleDownloadCartReceipt = async () => {
    if (!completedOrder || isDownloadingReceipt) return;
    setIsDownloadingReceipt(true);
    const res = await downloadOrderReceiptPng({
      id: completedOrder.id,
      createdAt: completedOrder.createdAt,
      status: 'Order Confirmed',
      customerName: completedOrder.customerName,
      customerPhone: completedOrder.customerPhone,
      alternatePhone: completedOrder.alternatePhone,
      customerEmail: completedOrder.customerEmail,
      cnic: completedOrder.cnic,
      shippingAddress: completedOrder.shippingAddress,
      areaLandmark: completedOrder.areaLandmark,
      city: completedOrder.city,
      items: completedOrder.items,
      totalAmount: completedOrder.total,
      paymentMethod: completedOrder.paymentMethod,
      paymentDetail: completedOrder.paymentDetail,
      notes: completedOrder.notes,
      showroomPhone: settings?.phone,
      showroomEmail: settings?.email
    });
    setIsDownloadingReceipt(false);
    if (res.ok) {
      showToast(`Receipt saved (${res.filename})`, 'success');
    } else {
      showToast('Could not generate image. Please try Print / PDF.', 'error');
    }
  };

  // WhatsApp helper for confirmed order
  const getOrderWhatsAppLink = () => {
    if (!completedOrder) return getWhatsAppUrl();
    const whatsappNum = settings?.whatsappNumber || '03210424424';
    const extraLines = [
      completedOrder.alternatePhone ? `*Alt Phone:* ${completedOrder.alternatePhone}` : '',
      completedOrder.customerEmail ? `*Email:* ${completedOrder.customerEmail}` : '',
      completedOrder.cnic ? `*CNIC:* ${completedOrder.cnic}` : '',
      completedOrder.areaLandmark ? `*Area / Landmark:* ${completedOrder.areaLandmark}` : '',
      completedOrder.paymentDetail ? `*Selected Account / Ref:* ${completedOrder.paymentDetail}` : '',
      completedOrder.notes ? `*Notes:* ${completedOrder.notes}` : ''
    ].filter(Boolean).join('\n');

    const msg = `Hello VoltGlide Motors!\n\nI have placed an order on your website:\n*Order ID:* ${completedOrder.id}\n*Customer:* ${completedOrder.customerName}\n*Phone:* ${completedOrder.customerPhone}\n*City:* ${completedOrder.city}\n*Address:* ${completedOrder.shippingAddress}\n${extraLines ? extraLines + '\n' : ''}*Total Amount:* PKR ${completedOrder.total.toLocaleString()}\n*Payment:* ${completedOrder.paymentMethod}\n\nPlease confirm dispatch and delivery timeframe. Thank you!`;
    return getWhatsAppUrl(msg, whatsappNum);
  };

  // Instant direct cart WhatsApp order (alternate 1-click order option)
  const handleDirectWhatsAppCartOrder = () => {
    if (cart.length === 0) return;
    const whatsappNum = settings?.whatsappNumber || '03210424424';
    const itemsList = cart.map((item, idx) => `${idx + 1}. ${item.product.name} (Qty: ${item.quantity}, Color: ${item.selectedColor || 'Standard'}) - PKR ${(item.product.price * item.quantity).toLocaleString()}`).join('\n');
    const msg = `Hello VoltGlide Motors!\n\nI want to place an order via WhatsApp:\n\n*Cart Items:*\n${itemsList}\n\n*Total Amount:* PKR ${cartTotal.toLocaleString()}\n*Delivery:* Doorstep Delivery\n*City:* ${city}\n\nPlease share delivery details and dispatch time!`;
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
                {completedOrder ? 'Order & Payment Receipt' : isCheckingOut ? 'Express Checkout' : `Shopping Cart (${cartCount})`}
              </h3>
              <p className="text-[11px] text-slate-400">
                {completedOrder
                  ? 'Official Digital Slip · Ready to Save or Share'
                  : isCheckingOut
                  ? 'Step 2 of 2: Delivery & Contact'
                  : 'Nationwide Doorstep Delivery'}
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

        {/* VIEW 1: SUCCESSFUL ORDER CONFIRMATION & DIGITAL E-RECEIPT */}
        {completedOrder ? (
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col items-center justify-start space-y-4">
            {/* Digital Payment-Style Official Receipt Card */}
            <div className="w-full rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
              {/* Branded Receipt Header */}
              <div className="bg-gradient-to-r from-[#042f2e] via-[#0f172a] to-[#083344] px-4 py-3.5 flex items-center justify-between text-white">
                <div>
                  <div className="text-base font-black tracking-tight leading-none">
                    VOLT<span className="text-cyan-400">GLIDE</span>
                  </div>
                  <p className="text-[9px] font-bold tracking-widest text-slate-300 uppercase mt-1">
                    Motors Pakistan · E-Receipt
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-bold uppercase">
                    <Receipt className="w-2.5 h-2.5" />
                    Verified Slip
                  </span>
                  <p className="font-mono text-[11px] text-cyan-300 font-bold mt-1">
                    #{completedOrder.id}
                  </p>
                </div>
              </div>

              {/* Hero Verification + Total Amount */}
              <div className="px-4 pt-5 pb-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                  Order Confirmed · Official Receipt Issued
                </p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight mt-1">
                  {formatPKR(completedOrder.total)}
                </p>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  {completedOrder.paymentMethod === 'Cash on Delivery'
                    ? 'Payable on Doorstep Delivery (Cash on Delivery)'
                    : `Payment Channel: ${completedOrder.paymentMethod}`}
                </p>
              </div>

              {/* Perforated Ticket Tear Line */}
              <div className="relative flex items-center py-2">
                <div className="w-4 h-4 rounded-full bg-[#090b14] -ml-2 shrink-0" />
                <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-1" />
                <div className="w-4 h-4 rounded-full bg-[#090b14] -mr-2 shrink-0" />
              </div>

              {/* Key-Value Receipt Details */}
              <div className="px-4 py-3 space-y-2 text-[11px]">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 font-medium">Receipt / Order #</span>
                  <span className="font-mono font-bold text-sky-700">#{completedOrder.id}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 font-medium">Date & Time</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {formatReceiptDateTime(completedOrder.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 font-medium">Payment Method</span>
                  <span className="font-bold text-emerald-700 text-right">{completedOrder.paymentMethod}</span>
                </div>
                {completedOrder.paymentDetail && (
                  <div className="flex justify-between gap-3 items-start">
                    <span className="text-slate-500 font-medium shrink-0">Account / TID Ref</span>
                    <span className="font-mono font-semibold text-slate-900 text-right break-all">
                      {completedOrder.paymentDetail}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 font-medium">Customer Name</span>
                  <span className="font-bold text-slate-900 text-right">{completedOrder.customerName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 font-medium">Mobile Number</span>
                  <span className="font-mono font-semibold text-slate-800 text-right">
                    {completedOrder.customerPhone}
                    {completedOrder.alternatePhone ? ` / ${completedOrder.alternatePhone}` : ''}
                  </span>
                </div>
                {completedOrder.cnic && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 font-medium">CNIC (Warranty)</span>
                    <span className="font-mono font-semibold text-slate-800">{completedOrder.cnic}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3 items-start">
                  <span className="text-slate-500 font-medium shrink-0">Delivery Address</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {completedOrder.shippingAddress}
                    {completedOrder.areaLandmark ? ` (${completedOrder.areaLandmark})` : ''}, {completedOrder.city}
                  </span>
                </div>
              </div>

              {/* Itemized Scooties Breakdown */}
              <div className="mx-4 my-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
                  Ordered Scooties ({completedOrder.items.reduce((s, it) => s + it.quantity, 0)})
                </p>
                {completedOrder.items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="flex items-start justify-between gap-2 text-[11px]">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 leading-snug">{item.productName}</p>
                      <p className="text-[10px] text-slate-500">
                        Qty: {item.quantity} × {formatPKR(item.price)}
                        {item.selectedColor ? ` · ${item.selectedColor}` : ''}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {formatPKR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {completedOrder.notes && (
                <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-900">
                  <span className="font-bold">Customer Note:</span> {completedOrder.notes}
                </div>
              )}

              {/* Bottom Helpline Footer */}
              <div className="mt-3 px-4 py-2.5 bg-slate-100 border-t border-slate-200 text-center space-y-0.5">
                <p className="text-[10px] font-bold text-slate-700">
                  Helpline: {settings?.phone || '0321-0424424'} · {settings?.email || 'sales@voltglide.com'}
                </p>
                <p className="text-[9px] text-slate-500">
                  Save this receipt for warranty & dispatch verification.
                </p>
              </div>
            </div>

            {/* Download PNG & Print PDF Buttons */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                onClick={handleDownloadCartReceipt}
                disabled={isDownloadingReceipt}
                className="py-3 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/40 cursor-pointer active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {isDownloadingReceipt ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Download Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-3 px-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.12] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Print / Save PDF</span>
              </button>
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
              📦 Track Order & View Receipt in Account
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
                  <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                    DOORSTEP DELIVERY
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

              {/* Alternate Phone & Area / Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold text-xs">
                    Alternate / Receiver Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="0321-7654321"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    className="w-full bg-[#0c101d] border border-white/[0.1] rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold text-xs">
                    Area / Sector / Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DHA Phase 5 / Near Mosque"
                    value={areaLandmark}
                    onChange={(e) => setAreaLandmark(e.target.value)}
                    className="w-full bg-[#0c101d] border border-white/[0.1] rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                  />
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
                  placeholder="House #, Street #, Mohalla / Plaza, Block"
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

              {/* Email & CNIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold text-xs">
                    CNIC (Optional · Warranty Card)
                  </label>
                  <input
                    type="text"
                    placeholder="35202-1234567-1"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    className="w-full bg-[#0c101d] border border-white/[0.1] rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-slate-200 font-semibold text-xs">
                  Payment Method (Raqam Ki Adaigi)
                </label>
                <div className="space-y-2.5">
                  {/* Option 1: Cash on Delivery */}
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
                    <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-white">Cash on Delivery (COD)</span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Scooty delivery k waqt pesay ada karein</p>
                    </div>
                  </label>

                  {/* Option 2: Bank Transfer / JazzCash / EasyPaisa / NayaPay / Banks */}
                  <div
                    className={`rounded-xl border transition-all overflow-hidden ${
                      paymentMethod === 'Bank Transfer / Raast'
                        ? 'bg-blue-600/15 border-cyan-400 shadow-md'
                        : 'bg-[#0c101d] border-white/[0.08]'
                    }`}
                  >
                    <label className="flex items-center gap-3 p-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Bank Transfer / Raast"
                        checked={paymentMethod === 'Bank Transfer / Raast'}
                        onChange={() => setPaymentMethod('Bank Transfer / Raast')}
                        className="text-cyan-400 focus:ring-0"
                      />
                      <Wallet className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs text-white block">
                          Bank Transfer / JazzCash / EasyPaisa / NayaPay
                        </span>
                        <p className="text-[11px] text-slate-400">
                          JazzCash, EasyPaisa, NayaPay, Meezan, HBL & UBL accounts available
                        </p>
                      </div>
                    </label>

                    {paymentMethod === 'Bank Transfer / Raast' && bankTransferAccounts.length > 0 && (
                      <div className="px-3 pb-3 pt-1 border-t border-cyan-500/20 space-y-2.5 bg-[#090d18]/90">
                        <p className="text-[11px] font-bold text-cyan-300 pt-1">
                          Transfer karne ke liye account select karein:
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {bankTransferAccounts.map((acc) => {
                            const isSelected = activeBankAccount?.id === acc.id;
                            return (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() => setSelectedBankAccountId(acc.id)}
                                className={`px-2.5 py-2 rounded-lg text-[11px] font-bold border text-left transition-all cursor-pointer truncate ${
                                  isSelected
                                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm'
                                    : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:border-cyan-500/40'
                                }`}
                              >
                                {acc.provider}
                              </button>
                            );
                          })}
                        </div>

                        {activeBankAccount && (
                          <div className="p-3 rounded-xl bg-[#0d1424] border border-cyan-500/30 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                                <Landmark className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                {activeBankAccount.provider}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                                Active Account
                              </span>
                            </div>

                            <div className="space-y-1.5 text-[11px]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400">Account Title:</span>
                                <span className="text-white font-semibold text-right">
                                  {activeBankAccount.accountTitle}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                <div className="min-w-0">
                                  <span className="text-[10px] text-slate-400 block">Account / Mobile #</span>
                                  <span className="font-mono font-bold text-cyan-300 text-xs break-all">
                                    {activeBankAccount.accountNumber}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyAccountText(
                                      `${activeBankAccount.id}_num`,
                                      activeBankAccount.accountNumber,
                                      `${activeBankAccount.provider} Account #`
                                    )
                                  }
                                  className="px-2 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  {copiedKey === `${activeBankAccount.id}_num` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {activeBankAccount.ibanOrRaast && (
                                <div className="flex items-center justify-between gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                  <div className="min-w-0">
                                    <span className="text-[10px] text-slate-400 block">IBAN / Raast ID</span>
                                    <span className="font-mono text-slate-200 text-[11px] break-all">
                                      {activeBankAccount.ibanOrRaast}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyAccountText(
                                        `${activeBankAccount.id}_iban`,
                                        activeBankAccount.ibanOrRaast || '',
                                        `${activeBankAccount.provider} IBAN / Raast`
                                      )
                                    }
                                    className="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                                  >
                                    {copiedKey === `${activeBankAccount.id}_iban` ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}

                              {activeBankAccount.instructions && (
                                <p className="text-[10px] text-amber-200/90 leading-relaxed pt-0.5">
                                  {activeBankAccount.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="block text-[11px] text-slate-300 font-semibold">
                            Transaction ID / Sender Account (Optional)
                          </label>
                          <input
                            type="text"
                            maxLength={80}
                            placeholder="e.g. TID 84920194 ya apna account naam likhein"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            className="w-full bg-[#0c101d] border border-white/[0.1] rounded-lg px-2.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-[11px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option 3: Debit / Credit Card Accounts */}
                  <div
                    className={`rounded-xl border transition-all overflow-hidden ${
                      paymentMethod === 'Online Card'
                        ? 'bg-blue-600/15 border-cyan-400 shadow-md'
                        : 'bg-[#0c101d] border-white/[0.08]'
                    }`}
                  >
                    <label className="flex items-center gap-3 p-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Online Card"
                        checked={paymentMethod === 'Online Card'}
                        onChange={() => setPaymentMethod('Online Card')}
                        className="text-cyan-400 focus:ring-0"
                      />
                      <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs text-white block">
                          Debit / Credit Card Accounts
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Meezan, HBL, NayaPay & Alfalah Visa / Mastercard / PayPak accounts
                        </p>
                      </div>
                    </label>

                    {paymentMethod === 'Online Card' && debitCardAccounts.length > 0 && (
                      <div className="px-3 pb-3 pt-1 border-t border-cyan-500/20 space-y-2.5 bg-[#090d18]/90">
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <p className="text-[11px] font-bold text-cyan-300">
                            Debit Card payment ke liye account chunein:
                          </p>
                          <span className="text-[9px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                            VISA · MC · PayPak
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {debitCardAccounts.map((acc) => {
                            const isSelected = activeCardAccount?.id === acc.id;
                            return (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() => setSelectedCardAccountId(acc.id)}
                                className={`px-2.5 py-2 rounded-lg text-[11px] font-bold border text-left transition-all cursor-pointer truncate ${
                                  isSelected
                                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm'
                                    : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:border-cyan-500/40'
                                }`}
                              >
                                {acc.provider}
                              </button>
                            );
                          })}
                        </div>

                        {activeCardAccount && (
                          <div className="p-3 rounded-xl bg-[#0d1424] border border-cyan-500/30 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                {activeCardAccount.provider}
                              </span>
                              <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded">
                                Debit Card Account
                              </span>
                            </div>

                            <div className="space-y-1.5 text-[11px]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400">Merchant / Account Title:</span>
                                <span className="text-white font-semibold text-right">
                                  {activeCardAccount.accountTitle}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                <div className="min-w-0">
                                  <span className="text-[10px] text-slate-400 block">Card Settlement / Account #</span>
                                  <span className="font-mono font-bold text-cyan-300 text-xs break-all">
                                    {activeCardAccount.accountNumber}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyAccountText(
                                      `${activeCardAccount.id}_num`,
                                      activeCardAccount.accountNumber,
                                      `${activeCardAccount.provider} Account #`
                                    )
                                  }
                                  className="px-2 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  {copiedKey === `${activeCardAccount.id}_num` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {activeCardAccount.ibanOrRaast && (
                                <div className="flex items-center justify-between gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                  <div className="min-w-0">
                                    <span className="text-[10px] text-slate-400 block">Card IBAN / Raast Link</span>
                                    <span className="font-mono text-slate-200 text-[11px] break-all">
                                      {activeCardAccount.ibanOrRaast}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyAccountText(
                                        `${activeCardAccount.id}_iban`,
                                        activeCardAccount.ibanOrRaast || '',
                                        `${activeCardAccount.provider} IBAN`
                                      )
                                    }
                                    className="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                                  >
                                    {copiedKey === `${activeCardAccount.id}_iban` ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}

                              {activeCardAccount.instructions && (
                                <p className="text-[10px] text-amber-200/90 leading-relaxed pt-0.5">
                                  {activeCardAccount.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="block text-[11px] text-slate-300 font-semibold">
                            Card Type / Last 4 Digits / Payment Ref (Optional)
                          </label>
                          <input
                            type="text"
                            maxLength={80}
                            placeholder="e.g. Visa **4521 ya Payment Ref #"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            className="w-full bg-[#0c101d] border border-white/[0.1] rounded-lg px-2.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-[11px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
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
                  <span className="text-cyan-300 font-bold block text-xs">Doorstep Delivery</span>
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
