export type CategoryType = 'All' | 'Electric' | 'Petrol' | 'Sports' | 'Kids' | 'City';
export type AvailabilityType = 'In Stock' | 'Limited Stock' | 'Pre-Order' | 'Out of Stock';

export interface ProductSpecs {
  engineMotor: string;
  batteryFuel: string;
  rangeMileage: string;
  maxSpeed: string;
  chargingFuelTime: string;
  brakingSystem: string;
  curbWeight: string;
  warranty: string;
  colors: string[];
}

export interface Product {
  id: string;
  name: string;
  category: 'Electric' | 'Petrol' | 'Sports' | 'Kids' | 'City';
  brand: string;
  price: number;
  originalPrice: number | null;
  image: string;
  gallery?: string[];
  videoUrl?: string;
  shortDescription: string;
  description: string;
  features: string[];
  specs: ProductSpecs;
  availability: AvailabilityType;
  rating: number;
  reviewCount: number;
  featured: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  selectedColor?: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  city: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'Cash on Delivery' | 'Bank Transfer / Raast' | 'Online Card';
  notes?: string;
  status: OrderStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  productId?: string;
  productName?: string;
  customerName: string;
  city: string;
  rating: number;
  comment: string;
  verified: boolean;
  status: 'approved' | 'pending';
  date: string;
}

export interface Banner {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgGradient: string;
  image?: string;
  videoUrl?: string;
  active: boolean;
}

export interface ContactInquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}
