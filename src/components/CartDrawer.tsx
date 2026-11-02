import React, { useState } from 'react';
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
  ArrowRight
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
    navigate
  } = useApp();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ id: string; total: number } | null>(null);

  // Checkout form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Bank Transfer / Raast' | 'Online Card'>('Cash on Delivery');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !shippingAddress) {
      alert('Please fill in your name, phone number, and address.');
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
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      city,
      items: orderItems,
      totalAmount: cartTotal,
      paymentMethod,
      notes
    });

    setIsSubmitting(false);
    if (result.success && result.orderId) {
      setCompletedOrder({ id: result.orderId, total: cartTotal });
      setIsCheckingOut(false);
    }
  };

  const getOrderWhatsAppLink = () => {
    if (!completedOrder) return getWhatsAppUrl();
    const msg = `Hello VoltGlide Motors!\n\nI have placed an order on your website:\n*Order ID:* ${completedOrder.id}\n*Customer:* ${customerName}\n*Phone:* ${customerPhone}\n*City:* ${city}\n*Total Amount:* PKR ${completedOrder.total.toLocaleString()}\n*Payment:* ${paymentMethod}\n\nPlease confirm dispatch and delivery timeframe. Thank you!`;
    return getWhatsAppUrl(msg);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0a0f1d] border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white font-heading">
                  {isCheckingOut ? 'Express Checkout' : `Shopping Cart (${cartCount})`}
                </h3>
                <p className="text-[11px] text-slate-400">Free Doorstep Delivery in Pakistan</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsCartOpen(false);
                setIsCheckingOut(false);
                setCompletedOrder(null);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Screen after order */}
          {completedOrder ? (
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-white font-heading">Order Placed Successfully!</h4>
              <p className="text-sm text-slate-300">
                Your order <span className="font-mono font-bold text-cyan-400">#{completedOrder.id}</span> has been saved in our showroom database.
              </p>
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 w-full text-left space-y-1.5">
                <p><span className="text-slate-500">Name:</span> {customerName}</p>
                <p><span className="text-slate-500">City:</span> {city}</p>
                <p><span className="text-slate-500">Amount:</span> <span className="font-bold text-cyan-300">{formatPKR(completedOrder.total)}</span></p>
                <p><span className="text-slate-500">Payment:</span> {paymentMethod}</p>
              </div>

              {/* WhatsApp Confirmation Button */}
              <a
                href={getOrderWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                <WhatsAppIconSVG className="w-5 h-5 text-white" />
                Confirm Order on WhatsApp
              </a>

              <button
                onClick={() => {
                  setCompletedOrder(null);
                  setIsCartOpen(false);
                  navigate('home');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Continue Browsing Scooties
              </button>
            </div>
          ) : isCheckingOut ? (
            /* Checkout Form */
            <form onSubmit={handleCheckoutSubmit} className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hamza Khan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0300-1234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Quetta">Quetta</option>
                    <option value="Sialkot">Sialkot</option>
                    <option value="Other">Other City</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="House / Street / Area / Landmark"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Option</label>
                <div className="space-y-2">
                  {(['Cash on Delivery', 'Bank Transfer / Raast', 'Online Card'] as const).map((method) => (
                    <label
                      key={method}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === method
                          ? 'bg-blue-600/20 border-cyan-400 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        className="text-cyan-400 focus:ring-0"
                      />
                      <span className="font-medium text-xs">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Order Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Color preference, delivery instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Booking...' : `Confirm Order (${formatPKR(cartTotal)})`}
                </button>
              </div>
            </form>
          ) : (
            /* Items List */
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <p className="text-base font-semibold text-slate-300">Your Cart is Empty</p>
                    <p className="text-xs text-slate-500">
                      Explore our featured electric and petrol scooty models and add your favorite!
                    </p>
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        navigate('scooties');
                      }}
                      className="mt-2 py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
                    >
                      Browse Scooties
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={`${item.product.id}-${item.selectedColor}`}
                      className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex gap-3 items-center"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover bg-slate-950 flex-shrink-0"
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
                        <span className="text-xs font-extrabold text-cyan-300 block mt-0.5">
                          {formatPKR(item.product.price)}
                        </span>

                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selectedColor)}
                              className="px-2 py-0.5 text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selectedColor)}
                              className="px-2 py-0.5 text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                            className="text-slate-500 hover:text-rose-400 p-1 ml-auto transition-colors"
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
                <div className="p-5 border-t border-slate-800 bg-[#070b14] space-y-3">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-semibold text-white">{formatPKR(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        Doorstep Delivery
                      </span>
                      <span className="text-emerald-400 font-bold uppercase text-[11px]">FREE</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        Official Warranty & Helmet
                      </span>
                      <span className="text-cyan-400 font-semibold text-[11px]">INCLUDED</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-white">Total</span>
                      <span className="text-lg font-extrabold text-cyan-300 font-heading">
                        {formatPKR(cartTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Primary Checkout Button */}
                  <button
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] cursor-pointer"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};
