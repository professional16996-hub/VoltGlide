import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, CartItem, Review, Banner, Order } from '../types.ts';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  products: Product[];
  banners: Banner[];
  reviews: Review[];
  cart: CartItem[];
  wishlist: string[];
  loading: boolean;
  adminToken: string | null;
  isAdmin: boolean;
  isCartOpen: boolean;
  toasts: ToastState[];
  currentRoute: string;
  selectedProductId: string | null;
  searchQuery: string;
  selectedCategory: string;
  
  // Navigation
  navigate: (route: string, productId?: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;
  
  // Cart Actions
  addToCart: (product: Product, quantity?: number, selectedColor?: string) => void;
  removeFromCart: (productId: string, selectedColor?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, selectedColor?: string) => void;
  clearCart: () => void;
  setIsCartOpen: (open: boolean) => void;
  cartTotal: number;
  cartCount: number;

  // Wishlist Actions
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Reviews
  addReview: (reviewData: { customerName: string; city: string; rating: number; comment: string; productId?: string; productName?: string }) => Promise<boolean>;

  // Orders
  placeOrder: (orderData: Partial<Order>) => Promise<{ success: boolean; orderId?: string; message: string }>;

  // Contact
  sendContactMessage: (contactData: { name: string; phone: string; email?: string; subject?: string; message: string }) => Promise<boolean>;

  // Data Refresh
  refreshProducts: () => Promise<void>;
  refreshBanners: () => Promise<void>;
  refreshReviews: () => Promise<void>;

  // Admin Auth
  adminLogin: (token: string) => void;
  adminLogout: () => void;

  // Toast
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  
  // Routing state
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Load cart and wishlist from localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('voltglide_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('voltglide_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('voltglide_admin_token');
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Save cart
  useEffect(() => {
    try {
      localStorage.setItem('voltglide_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Save wishlist
  useEffect(() => {
    try {
      localStorage.setItem('voltglide_wishlist', JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  // Handle URL hash changes for deep linking / routing
  const navigate = useCallback((route: string, prodId: string | null = null) => {
    setCurrentRoute(route);
    setSelectedProductId(prodId);
    if (prodId) {
      window.location.hash = `#/product/${prodId}`;
    } else {
      window.location.hash = `#/${route}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash.startsWith('product/')) {
        const id = hash.replace('product/', '');
        setCurrentRoute('product');
        setSelectedProductId(id);
      } else if (hash) {
        setCurrentRoute(hash);
        setSelectedProductId(null);
      } else {
        setCurrentRoute('home');
        setSelectedProductId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch initial data
  const refreshProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, []);

  const refreshBanners = useCallback(async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBanners(data.data);
      }
    } catch (err) {
      console.error('Failed to load banners:', err);
    }
  }, []);

  const refreshReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReviews(data.data);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([refreshProducts(), refreshBanners(), refreshReviews()]);
      setLoading(false);
    };
    loadAll();
  }, [refreshProducts, refreshBanners, refreshReviews]);

  // Cart operations
  const addToCart = (product: Product, quantity = 1, selectedColor?: string) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedColor === selectedColor
      );
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      }
      return [...prev, { product, quantity, selectedColor: selectedColor || product.specs.colors[0] }];
    });
    showToast(`Added "${product.name}" to cart!`, 'success');
  };

  const removeFromCart = (productId: string, selectedColor?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product.id === productId && (!selectedColor || item.selectedColor === selectedColor)))
    );
    showToast('Item removed from cart', 'info');
  };

  const updateCartQuantity = (productId: string, quantity: number, selectedColor?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedColor);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && (!selectedColor || item.selectedColor === selectedColor)) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  // Wishlist operations
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Removed from Wishlist', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Saved to Wishlist!', 'success');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Review submission
  const addReview = async (reviewData: {
    customerName: string;
    city: string;
    rating: number;
    comment: string;
    productId?: string;
    productName?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Thank you! Your review has been published.', 'success');
        await refreshReviews();
        return true;
      } else {
        showToast(data.message || 'Failed to submit review.', 'error');
        return false;
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending review. Please try again.', 'error');
      return false;
    }
  };

  // Order submission
  const placeOrder = async (orderData: Partial<Order>): Promise<{ success: boolean; orderId?: string; message: string }> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (data.success) {
        clearCart();
        showToast(`Order #${data.data.id} placed successfully!`, 'success');
        return { success: true, orderId: data.data.id, message: data.message };
      } else {
        showToast(data.message || 'Failed to place order.', 'error');
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error(err);
      showToast('Order submission failed.', 'error');
      return { success: false, message: 'Server connection error.' };
    }
  };

  // Contact form submission
  const sendContactMessage = async (contactData: {
    name: string;
    phone: string;
    email?: string;
    subject?: string;
    message: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Message sent! Our specialist will reach out shortly.', 'success');
        return true;
      }
      showToast(data.message || 'Failed to send message.', 'error');
      return false;
    } catch {
      showToast('Error sending message. Try contacting directly on WhatsApp.', 'error');
      return false;
    }
  };

  // Admin authentication
  const adminLogin = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('voltglide_admin_token', token);
    showToast('Admin logged in successfully', 'success');
  };

  const adminLogout = () => {
    if (adminToken) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    setAdminToken(null);
    localStorage.removeItem('voltglide_admin_token');
    showToast('Admin logged out', 'info');
    navigate('home');
  };

  return (
    <AppContext.Provider
      value={{
        products,
        banners,
        reviews,
        cart,
        wishlist,
        loading,
        adminToken,
        isAdmin: Boolean(adminToken),
        isCartOpen,
        toasts,
        currentRoute,
        selectedProductId,
        searchQuery,
        selectedCategory,
        navigate,
        setSearchQuery,
        setSelectedCategory,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        setIsCartOpen,
        cartTotal,
        cartCount,
        toggleWishlist,
        isInWishlist,
        addReview,
        placeOrder,
        sendContactMessage,
        refreshProducts,
        refreshBanners,
        refreshReviews,
        adminLogin,
        adminLogout,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
