import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatPKR, calculateDiscountPercent } from '../utils/formatters.ts';
import {
  getProductOrderWhatsAppUrl,
  getInstallmentInquiryWhatsAppUrl,
  getTestRideWhatsAppUrl
} from '../utils/whatsapp.ts';
import { WhatsAppIconSVG } from '../components/FloatingWhatsApp.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import {
  Star,
  Zap,
  Fuel,
  ShieldCheck,
  Truck,
  Check,
  ShoppingCart,
  ArrowLeft,
  Calendar,
  Layers,
  Gauge,
  BatteryCharging,
  Coins,
  Send,
  MessageSquare
} from 'lucide-react';

export const ProductDetailsPage: React.FC = () => {
  const {
    products,
    selectedProductId,
    navigate,
    addToCart,
    reviews,
    addReview
  } = useApp();

  // Find product
  const product = products.find((p) => p.id === selectedProductId) || products[0];

  const [activeImage, setActiveImage] = useState<string>(product?.image || '');
  const [selectedColor, setSelectedColor] = useState<string>(product?.specs.colors[0] || 'Default');
  const [quantity, setQuantity] = useState<number>(1);

  // Installment calculator state
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);

  // Review submission inside product page
  const [reviewName, setReviewName] = useState('');
  const [reviewCity, setReviewCity] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-white text-lg">Product not found.</p>
        <button
          onClick={() => navigate('scooties')}
          className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold"
        >
          Back to All Scooties
        </button>
      </div>
    );
  }

  // Update active image if product changes
  React.useEffect(() => {
    setActiveImage(product.image);
    if (product.specs.colors.length > 0) {
      setSelectedColor(product.specs.colors[0]);
    }
  }, [product]);

  const discount = calculateDiscountPercent(product.originalPrice, product.price);

  // Calculate estimated monthly installment
  const downPaymentAmount = Math.round((product.price * downPaymentPercent) / 100);
  const financedAmount = product.price - downPaymentAmount;
  // 0% markup promotional interest rate or minimal processing
  const monthlyInstallment = Math.round(financedAmount / tenureMonths);

  // Filter reviews for this product
  const productReviews = reviews.filter(
    (r) => r.productId === product.id || r.productName === product.name
  );

  // Related products
  const related = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
    .slice(0, 4);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;
    setIsSubmittingReview(true);
    await addReview({
      customerName: reviewName,
      city: reviewCity || 'Pakistan',
      rating: reviewRating,
      comment: reviewComment,
      productId: product.id,
      productName: product.name
    });
    setReviewName('');
    setReviewCity('');
    setReviewComment('');
    setIsSubmittingReview(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('scooties')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scooties
        </button>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left: Gallery & Images */}
        <div className="space-y-4">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 relative group shadow-2xl">
            <img
              src={activeImage || product.image}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            {discount && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-extrabold px-3 py-1 rounded-lg shadow-lg">
                SAVE {discount}% OFF
              </span>
            )}
            <span className="absolute top-4 right-4 bg-slate-900/90 text-cyan-400 text-xs font-bold px-3 py-1 rounded-lg border border-slate-700 backdrop-blur-md">
              {product.availability}
            </span>
          </div>

          {/* Thumbnails */}
          {product.gallery && product.gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                    activeImage === img ? 'border-cyan-400 scale-105 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} view`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Value Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
              <Truck className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <p className="font-bold text-white text-[11px]">Free Home Delivery</p>
              <p className="text-[10px] text-slate-400">Doorstep across Pakistan</p>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="font-bold text-white text-[11px]">Official Warranty</p>
              <p className="text-[10px] text-slate-400">{product.specs.warranty}</p>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
              <Coins className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <p className="font-bold text-white text-[11px]">Easy Installments</p>
              <p className="text-[10px] text-slate-400">0% Markup plans</p>
            </div>
          </div>
        </div>

        {/* Right: Info, Price, Actions, Installment Calculator */}
        <div className="space-y-6">
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-600/20 text-cyan-300 text-xs font-bold px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-wider">
                {product.brand}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-semibold">{product.category} Scooty</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              {product.name}
            </h1>

            {/* Ratings */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-white">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({product.reviewCount} customer reviews)</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-cyan-300 font-heading">
                {formatPKR(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-slate-500 line-through">
                  {formatPKR(product.originalPrice)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              * Inclusive of all taxes, invoice, and free standard helmet. Cash on delivery available.
            </p>
          </div>

          {/* Color Selector */}
          {product.specs.colors && product.specs.colors.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Color: <span className="text-cyan-400">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.specs.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedColor === color
                        ? 'bg-blue-600/30 text-cyan-300 border-cyan-400 shadow-md shadow-blue-500/20'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions: Add to Cart, Buy, WhatsApp Order */}
          <div className="space-y-3 pt-2">
            
            {/* Add to Cart */}
            <button
              onClick={() => addToCart(product, quantity, selectedColor)}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>

            {/* MANDATORY WHATSAPP ORDER BUTTON */}
            <a
              href={getProductOrderWhatsAppUrl(product.name, product.price, selectedColor)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/50 transition-all hover:scale-[1.01]"
            >
              <WhatsAppIconSVG className="w-5 h-5 text-white" />
              Order on WhatsApp (0321-0424424)
            </a>

            {/* Showroom Test Ride button */}
            <a
              href={getTestRideWhatsAppUrl(product.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 flex items-center justify-center gap-2"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Book Free Showroom Test Ride in Lahore / Karachi / Islamabad
            </a>
          </div>

          {/* INTERACTIVE INSTALLMENT PLAN CALCULATOR */}
          <div className="bg-[#0f172a] rounded-2xl p-5 border border-blue-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Easy Monthly Installment Estimator
                </h4>
              </div>
              <span className="text-[10px] text-cyan-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800 font-bold">
                0% Markup
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Tenure:</label>
                <div className="flex gap-1.5">
                  {[6, 12, 18, 24].map((m) => (
                    <button
                      key={m}
                      onClick={() => setTenureMonths(m)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${
                        tenureMonths === m
                          ? 'bg-blue-600 text-white border-cyan-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {m}M
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Down-Payment: {downPaymentPercent}%</label>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Estimated Monthly:</span>
                <span className="text-base font-black text-cyan-300 font-heading">
                  {formatPKR(monthlyInstallment)} / month
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[11px] block">Advance:</span>
                <span className="text-xs font-bold text-white">{formatPKR(downPaymentAmount)}</span>
              </div>
            </div>

            <a
              href={getInstallmentInquiryWhatsAppUrl(product.name, product.price)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Apply for Installment Plan on WhatsApp →
            </a>
          </div>

        </div>

      </div>

      {/* Description & Features */}
      <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <h3 className="text-xl font-bold text-white font-heading">
          Product Overview & Highlights
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {product.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {product.features.map((feat, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
              <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Specifications Table */}
      <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <h3 className="text-xl font-bold text-white font-heading">
          Full Technical Specifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Engine / Motor</span>
            <span className="font-semibold text-white">{product.specs.engineMotor}</span>
          </div>

          <div className="flex justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Battery / Fuel Capacity</span>
            <span className="font-semibold text-white">{product.specs.batteryFuel}</span>
          </div>

          <div className="flex justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Range / Fuel Economy</span>
            <span className="font-semibold text-emerald-400 font-bold">{product.specs.rangeMileage}</span>
          </div>

          <div className="flex justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Top Speed</span>
            <span className="font-semibold text-cyan-400 font-bold">{product.specs.maxSpeed}</span>
          </div>

          <div className="flex justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Charging / Refuel Time</span>
            <span className="font-semibold text-white">{product.specs.chargingFuelTime}</span>
          </div>

          <div className="flex justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Braking System</span>
            <span className="font-semibold text-white">{product.specs.brakingSystem}</span>
          </div>

          <div className="flex justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Curb Weight</span>
            <span className="font-semibold text-white">{product.specs.curbWeight}</span>
          </div>

          <div className="flex justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-400">Warranty Coverage</span>
            <span className="font-semibold text-cyan-300">{product.specs.warranty}</span>
          </div>
        </div>
      </div>

      {/* Customer Reviews for this Model */}
      <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white font-heading">
              Customer Reviews ({productReviews.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified feedback from owners of {product.name}
            </p>
          </div>
        </div>

        {/* Existing Reviews */}
        <div className="space-y-4">
          {productReviews.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Be the first to leave a review for this model!
            </p>
          ) : (
            productReviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-white text-xs">{rev.customerName}</h5>
                    <span className="text-[10px] text-slate-400">{rev.city} • {rev.date}</span>
                  </div>
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>
            ))
          )}
        </div>

        {/* Submit Review Form */}
        <form onSubmit={handleReviewSubmit} className="pt-6 border-t border-slate-800 space-y-4 text-xs">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            Write a Customer Review for {product.name}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Your Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Asad Rehman"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Your City</label>
              <input
                type="text"
                placeholder="e.g. Lahore / Karachi"
                value={reviewCity}
                onChange={(e) => setReviewCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Rating *</label>
            <div className="flex gap-2">
              {[5, 4, 3, 2, 1].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setReviewRating(r)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer ${
                    reviewRating === r
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {r} Stars
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Your Experience / Review *</label>
            <textarea
              required
              rows={3}
              placeholder="How was the scooty acceleration, battery mileage, and delivery service?"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingReview}
            className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmittingReview ? 'Submitting...' : 'Post Verified Review'}
          </button>
        </form>
      </div>

      {/* Related Scooties */}
      {related.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white font-heading">
            You Might Also Like
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
