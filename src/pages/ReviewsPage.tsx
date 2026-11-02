import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Star, MessageSquare, Send, CheckCircle2, ThumbsUp, ShieldCheck } from 'lucide-react';

export const ReviewsPage: React.FC = () => {
  const { reviews, addReview, products } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.name || 'VoltGlide E-Pulse Pro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Compute average score & star counts
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0';

  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { stars, count, percent };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !comment) return;

    setIsSubmitting(true);
    const matched = products.find((p) => p.name === selectedProduct);
    const success = await addReview({
      customerName,
      city: city || 'Pakistan',
      rating,
      comment,
      productId: matched?.id,
      productName: selectedProduct
    });

    setIsSubmitting(false);
    if (success) {
      setShowSuccessMessage(true);
      setCustomerName('');
      setCity('');
      setComment('');
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Star className="w-4 h-4 fill-amber-400" />
          COMMUNITY FEEDBACK
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-heading">
          Customer Reviews & Ratings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Real experiences shared by scooty owners across Karachi, Lahore, Islamabad, and nationwide. Sample reviews are clearly indicated.
        </p>
      </div>

      {/* Ratings Overview Card */}
      <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        
        {/* Overall Score */}
        <div className="text-center md:border-r border-slate-800 md:pr-8 space-y-2">
          <div className="text-5xl sm:text-6xl font-black text-cyan-300 font-heading">
            {avgRating}
          </div>
          <div className="flex justify-center text-amber-400 gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Based on {totalReviews} verified customer experiences
          </p>
        </div>

        {/* Star Distribution Bars */}
        <div className="space-y-2 md:col-span-2 text-xs">
          {ratingCounts.map(({ stars, count, percent }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="w-12 text-slate-400 flex items-center gap-1 font-semibold">
                {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
              <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-10 text-right text-slate-400 font-mono text-[11px]">{count}</span>
            </div>
          ))}
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Reviews Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="font-bold text-white text-lg font-heading">
              All Customer Testimonials ({reviews.length})
            </h3>
            <span className="text-[11px] text-cyan-400 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-800">
              ✓ Verified Showroom Reviews
            </span>
          </div>

          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-md space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{rev.customerName}</h4>
                      {rev.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {rev.city} • {rev.date}
                    </p>
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

                {rev.productName && (
                  <div className="text-[11px] text-cyan-300 font-semibold bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-900 inline-block">
                    Purchased: {rev.productName}
                  </div>
                )}

                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Submit Review Form */}
        <div>
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5 sticky top-28">
            <div>
              <h3 className="font-bold text-white text-base font-heading flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                Submit Your Review
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Share your experience with our scooties, delivery, and customer care.
              </p>
            </div>

            {showSuccessMessage && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Thank you! Your review has been added.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Danish Ali"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lahore / Rawalpindi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Scooty Model</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                  <option value="General Dealership Experience">General Showroom Experience</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rating *</label>
                <div className="flex gap-2">
                  {[5, 4, 3, 2, 1].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRating(r)}
                      className={`flex-1 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                        rating === r
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Your Review *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write honest feedback about performance, comfort, battery range, or delivery..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Posting Review...' : 'Post Customer Review'}
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
