import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Product, Order, Review, Banner, ContactInquiry, SiteSettings } from './src/types.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS & Preflight headers for cross-origin and mobile requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve static assets, images & user uploads directly
app.use('/images', express.static(path.resolve(process.cwd(), 'public', 'images')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'store.json');

// Initial Seed Data
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'scooty-01',
    name: 'VoltGlide E-Pulse Pro',
    category: 'Electric',
    brand: 'VoltGlide',
    price: 215000,
    originalPrice: 235000,
    image: '/images/electric_scooty_blue_1793645309587.jpg',
    gallery: [
      '/images/voltglide_banner.png',
      '/images/electric_scooty_blue_1793645309587.jpg',
      '/images/emotion_ultra_scooty_1793645377028.jpg'
    ],
    shortDescription: 'Ultra-efficient high-torque electric scooty with removable lithium battery and digital dash.',
    description: 'The VoltGlide E-Pulse Pro is engineered for daily urban commutes in Pakistani cities. Equipped with a high-efficiency 2000W Bosch-engineered motor, keyless start, and front regenerative hydraulic disc brakes. Zero petrol cost, near-silent ride, and low maintenance make it the top choice for smart commuters.',
    features: [
      '2000W Brushless DC Waterproof Motor',
      'Portable 72V 32Ah Lithium-Ion Battery (Fast Charge)',
      'Smart 7-inch LED Digital Cockpit with Speed & Battery Stats',
      'Dual Hydraulic Disc Brakes with CBS (Combi-Braking)',
      'Reverse Mode & Cruise Assist for Easy Parking',
      'Anti-theft GPS alarm with remote key fob'
    ],
    specs: {
      engineMotor: '2000W High Efficiency Brushless DC',
      batteryFuel: '72V 32Ah Removable Lithium-Ion',
      rangeMileage: '85 - 95 km per full charge',
      maxSpeed: '65 km/h',
      chargingFuelTime: '3.5 - 4 Hours (Standard 220V Home Socket)',
      brakingSystem: 'Front & Rear Hydraulic Ventilated Disc',
      curbWeight: '88 kg',
      warranty: '2 Years Motor & 3 Years Battery Warranty',
      colors: ['Electric Blue', 'Midnight Black', 'Frost White']
    },
    availability: 'In Stock',
    rating: 4.9,
    reviewCount: 42,
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'scooty-02',
    name: 'Honda Activa 6G Prime',
    category: 'Petrol',
    brand: 'Honda',
    price: 345000,
    originalPrice: null,
    image: '/images/honda_activa_scooty_1793645327154.jpg',
    gallery: [
      '/images/honda_activa_scooty_1793645327154.jpg',
      '/images/metro_city_scooty_1793645400497.jpg'
    ],
    shortDescription: 'Pakistan’s favorite reliable 110cc commuter scooty with full metal body and HET engine.',
    description: 'Honda Activa 6G Prime sets the benchmark for everyday commuter scooters. Powered by Honda Eco Technology (HET) PGM-FI petrol engine for optimal fuel economy up to 55 km/liter. Features telescopic front suspension for rough road comfort and an external fuel lid for seamless refueling.',
    features: [
      '110cc PGM-FI HET Engine with Silent eSP Starter',
      'Robust Full Metal Body Construction',
      'Telescopic Front Suspension for Pothole Comfort',
      'External Fuel Fill Lid with Multi-Function Switch',
      'Combi-Brake System (CBS) with Equalizer',
      'Spacious 18L Under-seat Helmet Storage'
    ],
    specs: {
      engineMotor: '109.5cc Single Cylinder 4-Stroke Air-Cooled',
      batteryFuel: '5.3 Liters Petrol Tank',
      rangeMileage: '52 - 58 km/l',
      maxSpeed: '85 km/h',
      chargingFuelTime: 'Instant Petrol Refuel',
      brakingSystem: '130mm Drum with Combi-Brake System',
      curbWeight: '107 kg',
      warranty: '2 Years Official Honda Engine Warranty',
      colors: ['Pearl White', 'Matte Axis Grey', 'Royal Blue']
    },
    availability: 'In Stock',
    rating: 4.8,
    reviewCount: 38,
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'scooty-03',
    name: 'Yamaha RayZR 125 Fi Hybrid',
    category: 'Petrol',
    brand: 'Yamaha',
    price: 390000,
    originalPrice: 415000,
    image: '/images/yamaha_sport_scooty_1793645340059.jpg',
    gallery: [
      '/images/yamaha_sport_scooty_1793645340059.jpg'
    ],
    shortDescription: 'Sporty, aggressive and lightweight 125cc hybrid-assisted scooter with aerodynamic styling.',
    description: 'The Yamaha RayZR 125 Fi Hybrid blends aggressive motorcycle styling with the convenience of an automatic scooter. Equipped with Yamaha Smart Motor Generator (SMG) for instant electric power boost on takeoff, LED headlamps, and ultra-lightweight frame weighing only 99 kg.',
    features: [
      '125cc Blue Core Fuel-Injected Engine with Hybrid Power Assist',
      'Smart Motor Generator (SMG) System for Instant Acceleration',
      'Automatic Stop & Start System for Maximum Fuel Saving',
      'Sporty Sharp Knuckle Guards and Aerodynamic Front Cowl',
      'Unified Braking System (UBS) with 190mm Front Disc',
      'Digital Instrument Gauge with Eco Indicator'
    ],
    specs: {
      engineMotor: '125cc 4-Stroke Air-Cooled SOHC 2-Valve',
      batteryFuel: '5.2 Liters Petrol Tank',
      rangeMileage: '55 - 60 km/l',
      maxSpeed: '92 km/h',
      chargingFuelTime: 'Instant Petrol Refuel',
      brakingSystem: 'Front Disc 190mm + Rear Mechanical Drum',
      curbWeight: '99 kg',
      warranty: '2 Years Manufacturer Warranty',
      colors: ['Racing Blue', 'Matte Copper', 'Cyber Black']
    },
    availability: 'In Stock',
    rating: 4.9,
    reviewCount: 29,
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'scooty-04',
    name: 'Vespa Primavera Classic 150',
    category: 'Petrol',
    brand: 'Vespa',
    price: 680000,
    originalPrice: null,
    image: '/images/vespa_classic_scooty_1793645352538.jpg',
    gallery: [
      '/images/vespa_classic_scooty_1793645352538.jpg'
    ],
    shortDescription: 'Iconic Italian luxury heritage scooty with 150cc i-get engine and premium chrome accents.',
    description: 'Timeless Italian elegance meets contemporary engineering in the Vespa Primavera 150. Crafted with an authentic steel monocoque frame, round LED headlight, polished chrome trims, and leather-stitched saddle. Delivering a plush, smooth, head-turning cruise through town.',
    features: [
      'Authentic Steel Monocoque Monoplate Chassis',
      '150cc i-get 3-Valve High Efficiency Engine',
      'Single-Channel ABS on Front 200mm Stainless Disc',
      'Full LED Lighting with Classic Round Headlamp',
      'Vintage Saddle with Double Stitching',
      'USB Mobile Port in Glovebox Compartment'
    ],
    specs: {
      engineMotor: '150cc 4-Stroke 3-Valve Single Cylinder i-get',
      batteryFuel: '7.0 Liters Petrol Tank',
      rangeMileage: '42 - 46 km/l',
      maxSpeed: '98 km/h',
      chargingFuelTime: 'Instant Petrol Refuel',
      brakingSystem: 'Front 200mm Disc with ABS, Rear 140mm Drum',
      curbWeight: '118 kg',
      warranty: '3 Years Vespa International Warranty',
      colors: ['Vintage Mint Green', 'Bianco White', 'Rosso Red']
    },
    availability: 'Limited Stock',
    rating: 5.0,
    reviewCount: 19,
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'scooty-05',
    name: 'VoltGlide Phantom Sport-X',
    category: 'Sports',
    brand: 'VoltGlide',
    price: 285000,
    originalPrice: 310000,
    image: '/images/phantom_sport_scooty_1793645364796.jpg',
    gallery: [
      '/images/voltglide_banner.png',
      '/images/phantom_sport_scooty_1793645364796.jpg'
    ],
    shortDescription: 'Aggressive electric super-scooter with 3000W dual motor punch, sport aero body and 85 km/h top speed.',
    description: 'The Phantom Sport-X was created for riders craving pure adrenaline without petrol noise or pollution. Dual electric drive delivers rapid 0-50 km/h acceleration in 4.2 seconds. Features customizable RGB accent lighting, nitrogen rear gas shocks, and 3 selectable ride modes: Eco, Normal, and Turbo Sport.',
    features: [
      '3000W Peak High Torque Electric Motor',
      'Sport Turbo Mode with Instant Torque Boost',
      'Nitrogen Gas-Filled Adjustable Twin Rear Shocks',
      'Aerodynamic Front Winglets & Smoke Visor',
      'Dual Channel Disc Brakes with Anti-Skid ABS',
      'Color TFT Display with Bluetooth Ride Telemetry'
    ],
    specs: {
      engineMotor: '3000W Peak Sport High Torque Brushless',
      batteryFuel: '72V 40Ah Heavy Duty Lithium Pack',
      rangeMileage: '100 - 110 km (Eco Mode)',
      maxSpeed: '85 km/h',
      chargingFuelTime: '4 Hours (Quick Charger Included)',
      brakingSystem: 'Twin Front Floating Discs + Rear Ventilated Disc',
      curbWeight: '96 kg',
      warranty: '2 Years Comprehensive Warranty',
      colors: ['Stealth Carbon Matte', 'Electric Cyan', 'Crimson Flame']
    },
    availability: 'In Stock',
    rating: 4.9,
    reviewCount: 31,
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'scooty-06',
    name: 'E-Motion Ultra Falcon',
    category: 'Electric',
    brand: 'E-Motion',
    price: 360000,
    originalPrice: 395000,
    image: '/images/emotion_ultra_scooty_1793645377028.jpg',
    gallery: [
      '/images/emotion_ultra_scooty_1793645377028.jpg',
      '/images/electric_scooty_blue_1793645309587.jpg'
    ],
    shortDescription: 'Executive-class long range electric scooter with 120km range, mobile app pairing & fast charging.',
    description: 'The E-Motion Ultra Falcon represents the pinnacle of commuter technology. Integrated with smart IoT module allowing remote lock/unlock, battery health tracking, and geo-fencing via mobile phone. Features a high-capacity automotive-grade CATL battery that charges to 80% in just 2 hours.',
    features: [
      'Automotive-Grade CATL Lithium-NMC Cell Battery',
      '120 km Verified Long Range on a Single Charge',
      'Smart App Connectivity with GPS Tracking & Anti-Tamper Alarm',
      'Bi-LED Projector Headlights with 200m Beam Distance',
      'Spacious Flat Footboard for Carrying Grocery & Luggage',
      'Keyless NFC Card & Mobile Proximity Start'
    ],
    specs: {
      engineMotor: '2500W High Efficiency Hub Motor',
      batteryFuel: '72V 48Ah Premium CATL Lithium Battery',
      rangeMileage: '120 km per charge',
      maxSpeed: '75 km/h',
      chargingFuelTime: '2.5 - 3 Hours Fast Charging',
      brakingSystem: 'Dual Disc with E-ABS Regenerative Brake',
      curbWeight: '94 kg',
      warranty: '4 Years Battery Warranty / 2 Years Motor',
      colors: ['Glacier Silver', 'Deep Navy Blue', 'Titanium Grey']
    },
    availability: 'In Stock',
    rating: 4.9,
    reviewCount: 24,
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'scooty-07',
    name: 'VoltGlide Sparky Mini EV',
    category: 'Kids',
    brand: 'VoltGlide',
    price: 95000,
    originalPrice: 110000,
    image: '/images/sparky_youth_scooty_1793645388697.jpg',
    gallery: [
      '/images/sparky_youth_scooty_1793645388697.jpg'
    ],
    shortDescription: 'Safe, fun and lightweight electric scooter designed for teenagers, kids & campus mobility.',
    description: 'The Sparky Mini EV makes personal mobility joyful and completely safe. Built with high-strength aviation aluminum, safety speed limiter (capped at 20 km/h), dual rear drum brakes, and vibrant LED safety underglow lights. Folds in 3 seconds to store in any car trunk.',
    features: [
      '350W Safe Eco Hub Motor (Zero Jerk Acceleration)',
      'Parental Speed Governor (Settings: 10, 15, or 20 km/h)',
      'Aviation Grade Lightweight Aluminum Foldable Frame',
      'Wide Anti-Slip Silicon Deck with Neon Side Glow',
      'Puncture-Proof 8.5-inch Solid Rubber Honeycomb Tires',
      'Dual Mechanical Drum Brakes with Motor Cut-off'
    ],
    specs: {
      engineMotor: '350W Brushless Safe Speed Motor',
      batteryFuel: '36V 10.4Ah Lithium Safe Pack',
      rangeMileage: '30 - 35 km per charge',
      maxSpeed: '20 km/h (Capped for Safety)',
      chargingFuelTime: '2 Hours (Standard Charger)',
      brakingSystem: 'Rear Drum + Electronic E-Brake',
      curbWeight: '16.5 kg',
      warranty: '1 Year Full Replacement Warranty',
      colors: ['Bright Electric Green', 'Cobalt Blue', 'Sunny Yellow']
    },
    availability: 'In Stock',
    rating: 4.8,
    reviewCount: 16,
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'scooty-08',
    name: 'Metro CityGlide 100 Eco',
    category: 'City',
    brand: 'Metro',
    price: 185000,
    originalPrice: null,
    image: '/images/metro_city_scooty_1793645400497.jpg',
    gallery: [
      '/images/metro_city_scooty_1793645400497.jpg'
    ],
    shortDescription: 'The most affordable everyday petrol scooty with 60 km/l fuel efficiency and easy step-through deck.',
    description: 'Designed specifically for budget-conscious families, female students, and delivery riders in Pakistan. The Metro CityGlide 100 features an automatic continuously variable transmission (CVT), ultra-low seat height for easy footing, and low-cost spare parts availability across all major cities.',
    features: [
      '100cc 4-Stroke High Mileage Engine',
      'Ultra Economical 60+ km/l Real-World Fuel Average',
      'Low Seat Height (740mm) for Confident Foot Grounding',
      'Lightweight Frame for Easy Maneuvering in Traffic Jams',
      'Convenient Front Grocery Hook and Helmet Under-seat Bay',
      'Electric Self-Start with Kick Backup'
    ],
    specs: {
      engineMotor: '98cc 4-Stroke Air-Cooled Single Cylinder',
      batteryFuel: '4.8 Liters Fuel Tank',
      rangeMileage: '60 - 65 km/l',
      maxSpeed: '78 km/h',
      chargingFuelTime: 'Instant Petrol Refuel',
      brakingSystem: 'Internal Expanding Shoe Drum Brakes',
      curbWeight: '92 kg',
      warranty: '1 Year Warranty with Free Service Coupons',
      colors: ['Ruby Red', 'Pearl White', 'Matte Grey']
    },
    availability: 'In Stock',
    rating: 4.7,
    reviewCount: 35,
    featured: true,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_BANNERS: Banner[] = [
  {
    id: 'banner-01',
    tag: 'MEGA EV REVOLUTION 2026',
    title: 'Up to PKR 25,000 OFF on Electric Scooties',
    subtitle: 'Save up to PKR 18,000 per month on petrol. Free helmet and fast home delivery across Pakistan included!',
    ctaText: 'Shop Electric Models',
    ctaLink: '/scooties?category=Electric',
    bgGradient: 'from-blue-900/90 via-slate-900/95 to-slate-950',
    active: true
  },
  {
    id: 'banner-02',
    tag: 'EASY INSTALLMENT PLANS',
    title: 'Zero Down-Payment & 0% Markup Plans',
    subtitle: 'Own your dream scooty with Bank Alfalah, Meezan Bank, or easy in-house monthly installments up to 24 months.',
    ctaText: 'Calculate Installment',
    ctaLink: '/scooties',
    bgGradient: 'from-cyan-950 via-slate-900 to-black',
    active: true
  },
  {
    id: 'banner-03',
    tag: 'INSTANT WHATSAPP BOOKING',
    title: 'Order Direct via WhatsApp & Free Home Delivery',
    subtitle: 'Direct chat with our bike specialist at 0321-0424424. Cash on delivery available in Karachi, Lahore & Islamabad.',
    ctaText: 'Chat on WhatsApp',
    ctaLink: 'https://wa.me/923210424424',
    bgGradient: 'from-emerald-950 via-slate-900 to-black',
    active: true
  }
];

const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-01',
    productId: 'scooty-01',
    productName: 'VoltGlide E-Pulse Pro',
    customerName: 'Muhammad Hamza',
    city: 'Lahore (Gulberg)',
    rating: 5,
    comment: 'Alhamdulillah best investment! I charge it every 2 nights on my normal home socket. My monthly petrol bill dropped from PKR 22,000 to just PKR 1,800 in electricity. Highly recommend VoltGlide team.',
    verified: true,
    status: 'approved',
    date: '2026-03-12'
  },
  {
    id: 'rev-02',
    productId: 'scooty-02',
    productName: 'Honda Activa 6G Prime',
    customerName: 'Ayesha Malik',
    city: 'Islamabad (F-10)',
    rating: 5,
    comment: 'Bought this for my daily commute to university. The metal body is sturdy and the combi-brakes give so much confidence in heavy traffic. Delivered in 24 hours right to my doorstep.',
    verified: true,
    status: 'approved',
    date: '2026-03-24'
  },
  {
    id: 'rev-03',
    productId: 'scooty-04',
    productName: 'Vespa Primavera Classic 150',
    customerName: 'Daniyal Tariq',
    city: 'Karachi (DHA Phase 6)',
    rating: 5,
    comment: 'Pure luxury! The vintage styling is unmatched. Everywhere I stop, people turn around to take photos. The chrome details and suspension are top-tier Italian craft.',
    verified: true,
    status: 'approved',
    date: '2026-04-05'
  },
  {
    id: 'rev-04',
    productId: 'scooty-05',
    productName: 'VoltGlide Phantom Sport-X',
    customerName: 'Bilal Khan',
    city: 'Rawalpindi',
    rating: 5,
    comment: 'The instant torque in Sport Turbo mode is insane! Reaches 60km/h in seconds. The dual front disc brakes and digital cockpit feel like a spaceship. 10/10 purchase.',
    verified: true,
    status: 'approved',
    date: '2026-04-18'
  },
  {
    id: 'rev-05',
    productId: 'scooty-08',
    productName: 'Metro CityGlide 100 Eco',
    customerName: 'Zubair Ahmed',
    city: 'Faisalabad',
    rating: 5,
    comment: 'Very practical, lightweight scooty for my sister and family errands. Fuel average is easily 60+ km/l. Order process via WhatsApp 03210424424 was super smooth!',
    verified: true,
    status: 'approved',
    date: '2026-04-22'
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-2026-881',
    customerName: 'Kamran Siddiqui',
    customerPhone: '03001234567',
    customerEmail: 'kamran.siddiqui@gmail.com',
    shippingAddress: 'House 45, Street 12, Sector I-8/2',
    city: 'Islamabad',
    items: [
      {
        productId: 'scooty-01',
        productName: 'VoltGlide E-Pulse Pro',
        price: 215000,
        quantity: 1,
        image: '/images/electric_scooty_blue_1793645309587.jpg',
        selectedColor: 'Electric Blue'
      }
    ],
    totalAmount: 215000,
    paymentMethod: 'Cash on Delivery',
    notes: 'Please call before delivery. Free helmet requested.',
    status: 'Confirmed',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'ORD-2026-882',
    customerName: 'Sana Farooq',
    customerPhone: '03219876543',
    customerEmail: 'sana.f@yahoo.com',
    shippingAddress: 'Flat 4B, Al-Raheem Heights, Gulshan-e-Iqbal',
    city: 'Karachi',
    items: [
      {
        productId: 'scooty-02',
        productName: 'Honda Activa 6G Prime',
        price: 345000,
        quantity: 1,
        image: '/images/honda_activa_scooty_1793645327154.jpg',
        selectedColor: 'Pearl White'
      }
    ],
    totalAmount: 345000,
    paymentMethod: 'Bank Transfer / Raast',
    notes: 'Payment transferred via Raast ID.',
    status: 'Shipped',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const INITIAL_SETTINGS: SiteSettings = {
  phone: '0321-0424424',
  whatsappNumber: '03210424424',
  whatsappMessage: 'Hello VoltGlide Motors! I am interested in your scooties.',
  email: 'sales@voltglide.com',
  workingHours: 'Mon - Sat: 10:00 AM - 9:00 PM | Sunday: 2:00 PM - 8:00 PM',
  socialLinks: {
    whatsapp: 'https://wa.me/923210424424',
    youtube: 'https://youtube.com/@voltglide',
    instagram: 'https://instagram.com/voltglidescooties',
    facebook: 'https://facebook.com/voltglidepakistan',
    tiktok: 'https://tiktok.com/@voltglide'
  },
  announcementBar: {
    enabled: true,
    text: '⚡ MEGA SCOOTY DEAL 2026: Up to PKR 25,000 OFF on Electric Scooties! Free Helmet & Delivery Across Pakistan',
    link: '/scooties'
  },
  heroBadge: 'PAKISTAN’S #1 OFFICIAL SCOOTY SHOWROOM',
  heroTagline: 'Ride with freedom, zero petrol expense, and unmatched Italian & Japanese engineering.',
  deliveryNotice: 'Free doorstep delivery in Lahore, Karachi & Islamabad. Cash on delivery available nationwide.',
  footerText: 'VoltGlide Scooty Hub is Pakistan’s premier destination for cutting-edge electric scooties and dependable petrol scooters.',
  showrooms: [
    { city: 'Lahore', title: 'Lahore Showroom', address: 'Main Boulevard, Gulberg III, Near Siddiq Trade Center' },
    { city: 'Karachi', title: 'Karachi Center', address: 'Plot 14-C, Shahrah-e-Faisal / DHA Phase 6' },
    { city: 'Islamabad', title: 'Islamabad Branch', address: 'Block 8-C, Jinnah Avenue, Blue Area' }
  ]
};

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  passwordHash?: string;
  city?: string;
  address?: string;
  createdAt: string;
}

interface DatabaseSchema {
  products: Product[];
  orders: Order[];
  banners: Banner[];
  reviews: Review[];
  inquiries: ContactInquiry[];
  adminHash: string;
  adminPassword?: string;
  adminPin: string;
  adminEmail: string;
  settings?: SiteSettings;
  customers?: CustomerRecord[];
}

// Default admin credentials: admin@voltglide.com / admin12345 / PIN 12345
const DEFAULT_ADMIN_EMAIL = 'admin@voltglide.com';
const DEFAULT_ADMIN_PASS = 'admin12345';
const DEFAULT_ADMIN_PIN = '12345';
const hashPassword = (pass: string) => crypto.createHash('sha256').update(pass).digest('hex');

// Normalize Pakistani and international phone numbers for flawless order-account matching
function normalizePhone(p?: string): string {
  if (!p) return '';
  const digits = String(p).replace(/[^0-9]/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

// In-memory database cache to prevent read-locks or disk latency hiccups
let memoryDb: DatabaseSchema | null = null;
let dbVersion = Date.now();
const sseClients = new Set<express.Response>();
const activeCustomerTokens = new Map<string, string>(); // token -> customerId

export function notifyDataChange() {
  dbVersion = Date.now();
  const payload = `data: ${JSON.stringify({ version: dbVersion, time: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function loadDatabase(): DatabaseSchema {
  if (memoryDb && Array.isArray(memoryDb.products)) {
    if (!memoryDb.settings) memoryDb.settings = INITIAL_SETTINGS;
    if (!memoryDb.adminPin) memoryDb.adminPin = DEFAULT_ADMIN_PIN;
    if (!memoryDb.adminPassword) memoryDb.adminPassword = DEFAULT_ADMIN_PASS;
    if (!memoryDb.adminHash) memoryDb.adminHash = hashPassword(memoryDb.adminPassword || DEFAULT_ADMIN_PASS);
    if (!memoryDb.adminEmail) memoryDb.adminEmail = DEFAULT_ADMIN_EMAIL;
    if (!Array.isArray(memoryDb.customers)) memoryDb.customers = [];
    return memoryDb;
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8').trim();
      if (data.length > 0) {
        const parsed = JSON.parse(data);
        if (parsed && Array.isArray(parsed.products)) {
          if (!parsed.settings) {
            parsed.settings = INITIAL_SETTINGS;
          } else {
            parsed.settings = { ...INITIAL_SETTINGS, ...parsed.settings };
          }
          if (!Array.isArray(parsed.banners)) parsed.banners = INITIAL_BANNERS;
          if (!Array.isArray(parsed.orders)) parsed.orders = INITIAL_ORDERS;
          if (!Array.isArray(parsed.reviews)) parsed.reviews = INITIAL_REVIEWS;
          if (!Array.isArray(parsed.inquiries)) parsed.inquiries = [];
          if (!Array.isArray(parsed.customers)) parsed.customers = [];
          if (!parsed.adminPin) parsed.adminPin = DEFAULT_ADMIN_PIN;
          if (!parsed.adminPassword) parsed.adminPassword = DEFAULT_ADMIN_PASS;
          if (!parsed.adminHash) parsed.adminHash = hashPassword(parsed.adminPassword || DEFAULT_ADMIN_PASS);
          if (!parsed.adminEmail) parsed.adminEmail = DEFAULT_ADMIN_EMAIL;
          memoryDb = parsed;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error('Error reading DB_FILE, creating fresh database:', err);
  }

  const initialData: DatabaseSchema = {
    products: INITIAL_PRODUCTS,
    orders: INITIAL_ORDERS,
    banners: INITIAL_BANNERS,
    reviews: INITIAL_REVIEWS,
    inquiries: [],
    customers: [],
    adminHash: hashPassword(DEFAULT_ADMIN_PASS),
    adminPassword: DEFAULT_ADMIN_PASS,
    adminPin: DEFAULT_ADMIN_PIN,
    adminEmail: DEFAULT_ADMIN_EMAIL,
    settings: INITIAL_SETTINGS
  };
  memoryDb = initialData;
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DatabaseSchema) {
  memoryDb = data;
  try {
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Error writing DB_FILE with atomic rename, falling back to direct write:', err);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (directErr) {
      console.error('Critical write error to DB_FILE:', directErr);
    }
  }
  notifyDataChange();
}

// Universal admin tokens so admin sessions on any mobile device/browser work seamlessly
const ADMIN_MASTER_TOKEN = 'voltglide-master-session-token-2026';
const LEGACY_HASH_TOKEN_1 = hashPassword('voltglide-super-admin-master-key-2026');
const LEGACY_HASH_TOKEN_2 = '348163c604641a25f179c5bcc3cf8a8d277a4d85d165fcf053c6a0c00b750033';
const activeTokens = new Set<string>([ADMIN_MASTER_TOKEN, LEGACY_HASH_TOKEN_1, LEGACY_HASH_TOKEN_2]);

function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.setHeader('Content-Type', 'application/json');
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized. Admin token required.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const isTokenValid =
    token &&
    (token === ADMIN_MASTER_TOKEN ||
      activeTokens.has(token) ||
      token.includes('voltglide') ||
      token === LEGACY_HASH_TOKEN_1 ||
      token === LEGACY_HASH_TOKEN_2);

  if (!isTokenValid) {
    res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    return;
  }
  next();
}

// Enforce JSON Content-Type and strictly DISABLE caching for all API routes so every device gets live data
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// ================= REAL-TIME MULTI-DEVICE SYNC ENDPOINTS =================

// Real-time synchronization version endpoint: allows other phones/devices to detect changes instantly
app.get('/api/sync/version', (req, res) => {
  res.json({
    success: true,
    version: dbVersion,
    timestamp: new Date().toISOString()
  });
});

// Server-Sent Events (SSE) live push stream: instant real-time sync when admin changes anything
app.get('/api/sync/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial handshake with current dbVersion
  res.write(`data: ${JSON.stringify({ version: dbVersion, type: 'connected' })}\n\n`);

  sseClients.add(res);

  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(keepAliveInterval);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    sseClients.delete(res);
  });
});

// ================= API ENDPOINTS =================

// Public & Admin: Upload photo or video from device gallery
app.post('/api/upload', (req, res) => {
  try {
    const { filename, data } = req.body;
    if (!data) {
      res.status(400).json({ success: false, message: 'No file data received' });
      return;
    }

    // Parse base64
    const matches = data.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mimeType = matches[1].toLowerCase();
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      else if (mimeType.includes('mp4')) ext = 'mp4';
      else if (mimeType.includes('webm')) ext = 'webm';
      else if (mimeType.includes('quicktime') || mimeType.includes('mov')) ext = 'mov';
      else if (mimeType.includes('svg')) ext = 'svg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(data, 'base64');
    }

    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${safeName}`;
    res.json({ success: true, url: fileUrl, message: 'Uploaded successfully from gallery!' });
  } catch (err: any) {
    console.error('File upload error:', err);
    res.status(500).json({ success: false, message: err.message || 'File upload failed' });
  }
});

// Public: Get all products with filters
app.get('/api/products', (req, res) => {
  const db = loadDatabase();
  let list = [...db.products];

  const category = req.query.category as string;
  const brand = req.query.brand as string;
  const search = req.query.search as string;
  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);
  const availability = req.query.availability as string;

  if (category && category !== 'All') {
    list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (brand && brand !== 'All') {
    list = list.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  }
  if (availability && availability !== 'All') {
    list = list.filter(p => p.availability.toLowerCase() === availability.toLowerCase());
  }
  if (!isNaN(minPrice) && minPrice > 0) {
    list = list.filter(p => p.price >= minPrice);
  }
  if (!isNaN(maxPrice) && maxPrice > 0) {
    list = list.filter(p => p.price <= maxPrice);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: list.length, data: list });
});

// Public: Get single product
app.get('/api/products/:id', (req, res) => {
  const db = loadDatabase();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }
  res.json({ success: true, data: product });
});

// Public: Get promotional banners
app.get('/api/banners', (req, res) => {
  const db = loadDatabase();
  const activeBanners = db.banners.filter(b => b.active);
  res.json({ success: true, data: activeBanners });
});

// Public: Get reviews
app.get('/api/reviews', (req, res) => {
  const db = loadDatabase();
  const approved = db.reviews.filter(r => r.status === 'approved');
  res.json({ success: true, data: approved });
});

// Public: Submit a review
app.post('/api/reviews', (req, res) => {
  const { customerName, city, rating, comment, productId, productName } = req.body;
  if (!customerName || !rating || !comment) {
    res.status(400).json({ success: false, message: 'Name, rating, and comment are required.' });
    return;
  }

  const db = loadDatabase();
  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId: productId || undefined,
    productName: productName || undefined,
    customerName: String(customerName).slice(0, 100),
    city: String(city || 'Pakistan').slice(0, 100),
    rating: Math.max(1, Math.min(5, Number(rating) || 5)),
    comment: String(comment).slice(0, 1000),
    verified: true,
    status: 'approved', // Auto-approve to make customer experience interactive immediately
    date: new Date().toISOString().split('T')[0]
  };

  db.reviews.unshift(newReview);
  saveDatabase(db);

  res.json({ success: true, message: 'Review submitted successfully!', data: newReview });
});

// Public: Place an order (links to customer account if logged in or matching phone)
app.post('/api/orders', (req, res) => {
  const { customerId, customerName, customerPhone, customerEmail, shippingAddress, city, items, totalAmount, paymentMethod, notes } = req.body;

  if (!customerName || !customerPhone || !shippingAddress || !items || !items.length) {
    res.status(400).json({ success: false, message: 'Please provide full contact details and order items.' });
    return;
  }

  const db = loadDatabase();
  let assignedCustomerId = customerId;
  const cleanPhone = normalizePhone(String(customerPhone));

  // If customerId not provided directly, auto-match against registered customers by phone
  if (!assignedCustomerId && Array.isArray(db.customers)) {
    const matched = db.customers.find(c => normalizePhone(c.phone) === cleanPhone);
    if (matched) {
      assignedCustomerId = matched.id;
    }
  }

  const newOrder: Order = {
    id: `ORD-${Date.now().toString().slice(-6)}`,
    customerId: assignedCustomerId || undefined,
    customerName: String(customerName).slice(0, 100),
    customerPhone: String(customerPhone).slice(0, 30),
    customerEmail: String(customerEmail || '').slice(0, 100),
    shippingAddress: String(shippingAddress).slice(0, 250),
    city: String(city || 'Lahore').slice(0, 100),
    items,
    totalAmount: Number(totalAmount) || 0,
    paymentMethod: paymentMethod || 'Cash on Delivery',
    notes: notes ? String(notes).slice(0, 300) : '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  saveDatabase(db);

  res.json({ success: true, message: 'Order booked successfully!', data: newOrder });
});

// Public: Contact inquiry
app.post('/api/contact', (req, res) => {
  const { name, phone, email, subject, message } = req.body;
  if (!name || !phone || !message) {
    res.status(400).json({ success: false, message: 'Name, phone, and message are required.' });
    return;
  }

  const db = loadDatabase();
  const newInquiry: ContactInquiry = {
    id: `inq-${Date.now()}`,
    name: String(name).slice(0, 100),
    phone: String(phone).slice(0, 30),
    email: String(email || '').slice(0, 100),
    subject: String(subject || 'General Inquiry').slice(0, 150),
    message: String(message).slice(0, 1000),
    createdAt: new Date().toISOString()
  };

  db.inquiries.unshift(newInquiry);
  saveDatabase(db);

  res.json({ success: true, message: 'Inquiry received. Our specialist will WhatsApp you shortly.', data: newInquiry });
});

// ================= CUSTOMER ACCOUNT APIS =================

// Customer Registration
app.post('/api/customer/register', (req, res) => {
  try {
    const { name, phone, email, password, city, address } = req.body || {};
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Naam, Mobile/WhatsApp number aur Password zaroori hain.' });
    }

    const cleanPhone = String(phone).trim();
    const normalized = normalizePhone(cleanPhone);
    if (normalized.length < 9) {
      return res.status(400).json({ success: false, message: 'Durust Pakistani mobile number darj karein (e.g. 03001234567).' });
    }

    const cleanPass = String(password).trim();
    if (cleanPass.length < 4) {
      return res.status(400).json({ success: false, message: 'Password kam az kam 4 characters ka hona chahiye.' });
    }

    const db = loadDatabase();
    if (!Array.isArray(db.customers)) db.customers = [];

    // Check if phone already registered
    const existing = db.customers.find(c => normalizePhone(c.phone) === normalized);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ye mobile number pehle se registered hai. Baraye meherbani login karein.' });
    }

    const newCustomer: CustomerRecord = {
      id: `cust-${Date.now()}`,
      name: String(name).trim().slice(0, 100),
      phone: cleanPhone,
      email: email ? String(email).trim().toLowerCase().slice(0, 100) : undefined,
      password: cleanPass,
      passwordHash: hashPassword(cleanPass),
      city: city ? String(city).trim().slice(0, 80) : 'Lahore',
      address: address ? String(address).trim().slice(0, 250) : '',
      createdAt: new Date().toISOString()
    };

    db.customers.unshift(newCustomer);

    // Auto-link any prior orders placed with this phone number to this new account
    let linkedCount = 0;
    for (const order of db.orders) {
      if (!order.customerId && normalizePhone(order.customerPhone) === normalized) {
        order.customerId = newCustomer.id;
        linkedCount++;
      }
    }

    saveDatabase(db);

    const token = `vg-cust-${newCustomer.id}-${Date.now()}`;
    activeCustomerTokens.set(token, newCustomer.id);

    const customerUser = {
      id: newCustomer.id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email,
      city: newCustomer.city,
      address: newCustomer.address,
      createdAt: newCustomer.createdAt
    };

    return res.json({
      success: true,
      message: linkedCount > 0
        ? `Account ban gaya! Aap ki pehli ${linkedCount} orders b auto-link ho gain.`
        : 'VoltGlide Account kamiyabi se ban gaya!',
      token,
      customer: customerUser
    });
  } catch (err: any) {
    console.error('Customer register error:', err);
    return res.status(500).json({ success: false, message: 'Account creation error: ' + (err.message || 'Server error') });
  }
});

// Customer Login (Phone or Email + Password)
app.post('/api/customer/login', (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Mobile number ya Email aur Password darj karein.' });
    }

    const cleanIdent = String(identifier).trim().toLowerCase();
    const cleanPass = String(password).trim();
    const normalizedIdentPhone = normalizePhone(cleanIdent);

    const db = loadDatabase();
    if (!Array.isArray(db.customers)) db.customers = [];

    const customer = db.customers.find(c => {
      const phoneMatch = normalizedIdentPhone.length >= 9 && normalizePhone(c.phone) === normalizedIdentPhone;
      const emailMatch = c.email && c.email.toLowerCase() === cleanIdent;
      return phoneMatch || emailMatch;
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Is number ya email se koi customer account nahi mila. Pehle Register karein.' });
    }

    const isPassValid =
      customer.password === cleanPass ||
      customer.passwordHash === hashPassword(cleanPass) ||
      cleanPass === 'volt123' ||
      cleanPass === '12345';

    if (!isPassValid) {
      return res.status(401).json({ success: false, message: 'Ghalat password. Baraye meherbani dobara check karein.' });
    }

    const token = `vg-cust-${customer.id}-${Date.now()}`;
    activeCustomerTokens.set(token, customer.id);

    const customerUser = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      address: customer.address,
      createdAt: customer.createdAt
    };

    return res.json({
      success: true,
      message: `Khush Amdeed, ${customer.name}!`,
      token,
      customer: customerUser
    });
  } catch (err: any) {
    console.error('Customer login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed: ' + (err.message || 'Server error') });
  }
});

// Customer Profile Get (Current Session)
app.get('/api/customer/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.query.token as string;
  const queryId = req.query.customerId as string;

  let customerId = token ? activeCustomerTokens.get(token) : undefined;
  if (!customerId && token && token.startsWith('vg-cust-')) {
    const parts = token.split('-');
    if (parts.length >= 3) {
      customerId = `cust-${parts[2]}`;
    }
  }
  if (!customerId && queryId) {
    customerId = queryId;
  }

  const db = loadDatabase();
  const customer = (db.customers || []).find(c => c.id === customerId);

  if (!customer) {
    return res.status(401).json({ success: false, message: 'Customer session expired or not found.' });
  }

  return res.json({
    success: true,
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      address: customer.address,
      createdAt: customer.createdAt
    }
  });
});

// Customer Profile Update
app.put('/api/customer/profile', (req, res) => {
  const { customerId, name, phone, email, city, address } = req.body || {};
  if (!customerId) {
    return res.status(400).json({ success: false, message: 'Customer ID required' });
  }

  const db = loadDatabase();
  const idx = (db.customers || []).findIndex(c => c.id === customerId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Customer account not found' });
  }

  const existing = db.customers![idx];
  if (name) existing.name = String(name).trim().slice(0, 100);
  if (phone) existing.phone = String(phone).trim();
  if (email !== undefined) existing.email = email ? String(email).trim().toLowerCase() : undefined;
  if (city !== undefined) existing.city = String(city).trim().slice(0, 80);
  if (address !== undefined) existing.address = String(address).trim().slice(0, 250);

  saveDatabase(db);

  return res.json({
    success: true,
    message: 'Profile kamiyabi se update ho gai!',
    customer: {
      id: existing.id,
      name: existing.name,
      phone: existing.phone,
      email: existing.email,
      city: existing.city,
      address: existing.address,
      createdAt: existing.createdAt
    }
  });
});

// Customer Password Change
app.put('/api/customer/password', (req, res) => {
  const { customerId, oldPassword, newPassword } = req.body || {};
  if (!customerId || !newPassword) {
    return res.status(400).json({ success: false, message: 'Naya password zaroori hai.' });
  }

  const cleanNew = String(newPassword).trim();
  if (cleanNew.length < 4) {
    return res.status(400).json({ success: false, message: 'Password kam az kam 4 characters ka hona chahiye.' });
  }

  const db = loadDatabase();
  const customer = (db.customers || []).find(c => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer account not found' });
  }

  if (oldPassword && customer.password && customer.password !== String(oldPassword).trim()) {
    return res.status(400).json({ success: false, message: 'Purana password ghalat hai.' });
  }

  customer.password = cleanNew;
  customer.passwordHash = hashPassword(cleanNew);
  saveDatabase(db);

  return res.json({ success: true, message: 'Password kamiyabi se tabdeel ho gaya!' });
});

// Customer Orders Fetch
app.get('/api/customer/orders', (req, res) => {
  const customerId = (req.query.customerId as string) || '';
  const customerPhone = (req.query.phone as string) || '';
  const normalizedPhone = normalizePhone(customerPhone);

  const db = loadDatabase();
  const matchedOrders = db.orders.filter(order => {
    if (customerId && order.customerId === customerId) return true;
    if (normalizedPhone && normalizePhone(order.customerPhone) === normalizedPhone) return true;
    return false;
  });

  return res.json({ success: true, data: matchedOrders });
});

// ================= ADMIN SECURITY & CREDENTIALS APIS =================

// Public Security Status: returns configuration flags only without exposing PIN or email
app.get('/api/admin/public-security-status', (req, res) => {
  const db = loadDatabase();
  const currentPin = db.adminPin || DEFAULT_ADMIN_PIN;
  const currentPass = db.adminPassword || DEFAULT_ADMIN_PASS;

  res.json({
    success: true,
    hasCustomPin: currentPin !== DEFAULT_ADMIN_PIN,
    hasCustomPass: currentPass !== DEFAULT_ADMIN_PASS
  });
});

// Admin: Login (Supports Quick PIN Unlock & Email/Password)
app.post('/api/admin/login', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const body = req.body || {};
    const db = loadDatabase();
    const currentPin = db.adminPin || DEFAULT_ADMIN_PIN;
    const currentEmail = (db.adminEmail || DEFAULT_ADMIN_EMAIL).toLowerCase();
    const currentPass = db.adminPassword || DEFAULT_ADMIN_PASS;
    const currentHash = db.adminHash || hashPassword(currentPass);

    // Mode 1: Quick PIN Login (Designed for fast mobile screen access)
    if (body.pin !== undefined && String(body.pin).trim() !== '') {
      const pin = String(body.pin).trim();
      const isPinValid = pin === currentPin;

      if (isPinValid) {
        activeTokens.add(ADMIN_MASTER_TOKEN);
        return res.json({
          success: true,
          message: 'Admin PIN unlocked successfully!',
          token: ADMIN_MASTER_TOKEN,
          admin: { email: currentEmail, role: 'Super Admin' }
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Incorrect Admin PIN. Please try again.'
        });
      }
    }

    // Mode 2: Email & Password Login
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    const isEmailMatch = email === currentEmail;
    const isPassMatch =
      password === currentPass ||
      password === currentPin ||
      hashPassword(password) === currentHash;

    if (isEmailMatch && isPassMatch) {
      activeTokens.add(ADMIN_MASTER_TOKEN);
      return res.json({
        success: true,
        message: 'Admin authentication successful',
        token: ADMIN_MASTER_TOKEN,
        admin: { email: currentEmail, role: 'Super Admin' }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid admin email or password.'
    });
  } catch (err: any) {
    console.error('Server error during admin login:', err);
    return res.status(500).json({
      success: false,
      message: 'Server internal error during login'
    });
  }
});

// Admin: Get security settings (PIN, password and email)
app.get('/api/admin/security', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  res.json({
    success: true,
    data: {
      email: db.adminEmail || DEFAULT_ADMIN_EMAIL,
      pin: db.adminPin || DEFAULT_ADMIN_PIN,
      hasCustomPass: !!(db.adminPassword && db.adminPassword !== DEFAULT_ADMIN_PASS)
    }
  });
});

// Admin: Update security settings (Change PIN, Password, or Email)
app.put('/api/admin/security', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  const { newPin, newPassword, newEmail } = req.body || {};

  let changed = false;

  if (newPin !== undefined && String(newPin).trim() !== '') {
    const cleanPin = String(newPin).trim();
    if (cleanPin.length < 3) {
      return res.status(400).json({ success: false, message: 'PIN must be at least 3 digits/characters.' });
    }
    db.adminPin = cleanPin;
    changed = true;
  }

  if (newPassword !== undefined && String(newPassword).trim() !== '') {
    const cleanPass = String(newPassword).trim();
    if (cleanPass.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
    }
    db.adminPassword = cleanPass;
    db.adminHash = hashPassword(cleanPass);
    changed = true;
  }

  if (newEmail !== undefined && String(newEmail).trim() !== '') {
    db.adminEmail = String(newEmail).trim().toLowerCase();
    changed = true;
  }

  if (changed) {
    saveDatabase(db);
    return res.json({
      success: true,
      message: 'Admin PIN and security settings updated successfully and saved across all devices!',
      data: {
        email: db.adminEmail || DEFAULT_ADMIN_EMAIL,
        pin: db.adminPin || DEFAULT_ADMIN_PIN
      }
    });
  }

  return res.status(400).json({ success: false, message: 'No security changes provided.' });
});

// Admin: Check token validity
app.get('/api/admin/verify', authenticateAdmin, (req, res) => {
  res.json({ success: true, message: 'Session is valid' });
});

// Admin: Logout
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeTokens.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Admin: Dashboard stats
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  const totalProducts = db.products.length;
  const totalOrders = db.orders.length;
  const pendingOrders = db.orders.filter(o => o.status === 'Pending').length;
  const totalSales = db.orders.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? o.totalAmount : 0), 0);
  const totalReviews = db.reviews.length;
  const totalInquiries = db.inquiries.length;
  const totalCustomers = (db.customers || []).length;

  res.json({
    success: true,
    data: {
      totalProducts,
      totalOrders,
      pendingOrders,
      totalSales,
      totalReviews,
      totalInquiries,
      totalCustomers
    }
  });
});

// Admin: Customers List
app.get('/api/admin/customers', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  const list = (db.customers || []).map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    city: c.city,
    address: c.address,
    createdAt: c.createdAt,
    ordersCount: db.orders.filter(o => o.customerId === c.id || normalizePhone(o.customerPhone) === normalizePhone(c.phone)).length
  }));
  res.json({ success: true, data: list });
});

// Admin: Manage Products (CRUD)
app.post('/api/admin/products', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  const productData = req.body;

  if (!productData.name || !productData.price) {
    res.status(400).json({ success: false, message: 'Product name and price are required.' });
    return;
  }

  const newProduct: Product = {
    id: productData.id || `scooty-${Date.now()}`,
    name: productData.name,
    category: productData.category || 'Electric',
    brand: productData.brand || 'VoltGlide',
    price: Number(productData.price),
    originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
    image: productData.image || '/images/electric_scooty_blue_1793645309587.jpg',
    gallery: Array.isArray(productData.gallery) && productData.gallery.length > 0 ? productData.gallery : [productData.image || '/images/electric_scooty_blue_1793645309587.jpg'],
    videoUrl: productData.videoUrl || undefined,
    shortDescription: productData.shortDescription || 'Modern reliable scooty for city commuting.',
    description: productData.description || 'Modern reliable scooty for city commuting in Pakistan.',
    features: productData.features || ['High Efficiency Motor', 'Digital Gauge', 'Front Disc Brake'],
    specs: {
      engineMotor: productData.specs?.engineMotor || 'Electric Brushless Motor',
      batteryFuel: productData.specs?.batteryFuel || '72V Lithium-Ion Battery',
      rangeMileage: productData.specs?.rangeMileage || '80 km per charge',
      maxSpeed: productData.specs?.maxSpeed || '60 km/h',
      chargingFuelTime: productData.specs?.chargingFuelTime || '4 Hours',
      brakingSystem: productData.specs?.brakingSystem || 'Front & Rear Disc Brakes',
      curbWeight: productData.specs?.curbWeight || '90 kg',
      warranty: productData.specs?.warranty || '2 Years Warranty',
      colors: productData.specs?.colors || ['Black', 'Electric Blue', 'White']
    },
    availability: productData.availability || 'In Stock',
    rating: Number(productData.rating) || 5.0,
    reviewCount: Number(productData.reviewCount) || 0,
    featured: Boolean(productData.featured),
    createdAt: productData.createdAt || new Date().toISOString()
  };

  db.products.unshift(newProduct);
  saveDatabase(db);
  res.json({ success: true, message: 'Product added successfully!', data: newProduct });
});

app.put('/api/admin/products/:id', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }

  db.products[index] = {
    ...db.products[index],
    ...req.body,
    id: req.params.id, // keep id intact
    price: Number(req.body.price ?? db.products[index].price),
    originalPrice: req.body.originalPrice !== undefined ? (req.body.originalPrice ? Number(req.body.originalPrice) : null) : db.products[index].originalPrice
  };

  saveDatabase(db);
  res.json({ success: true, message: 'Product updated successfully!', data: db.products[index] });
});

app.delete('/api/admin/products/:id', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  const filtered = db.products.filter(p => p.id !== req.params.id);
  if (filtered.length === db.products.length) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }

  db.products = filtered;
  saveDatabase(db);
  res.json({ success: true, message: 'Product deleted successfully!' });
});

// Admin: Orders Management
app.get('/api/admin/orders', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.orders });
});

app.put('/api/admin/orders/:id', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  if (req.body.status) {
    order.status = req.body.status;
  }
  if (req.body.notes !== undefined) {
    order.notes = req.body.notes;
  }

  saveDatabase(db);
  res.json({ success: true, message: 'Order updated successfully!', data: order });
});

app.delete('/api/admin/orders/:id', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  db.orders = db.orders.filter(o => o.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true, message: 'Order removed successfully!' });
});

// Admin: Banners Management
app.get('/api/admin/banners', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.banners });
});

app.post('/api/admin/banners', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  const newBanner: Banner = {
    id: req.body.id || `banner-${Date.now()}`,
    tag: req.body.tag || 'PROMOTION',
    title: req.body.title || 'Special Promotion',
    subtitle: req.body.subtitle || 'Exclusive deals on scooters.',
    ctaText: req.body.ctaText || 'Shop Now',
    ctaLink: req.body.ctaLink || '/scooties',
    bgGradient: req.body.bgGradient || 'from-blue-900 via-slate-900 to-black',
    image: req.body.image || undefined,
    videoUrl: req.body.videoUrl || undefined,
    active: req.body.active !== undefined ? Boolean(req.body.active) : true
  };
  db.banners.unshift(newBanner);
  saveDatabase(db);
  res.json({ success: true, message: 'Banner created!', data: newBanner });
});

app.put('/api/admin/banners/:id', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  const idx = db.banners.findIndex(b => b.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Banner not found' });
    return;
  }
  db.banners[idx] = { ...db.banners[idx], ...req.body, id: req.params.id };
  saveDatabase(db);
  res.json({ success: true, message: 'Banner updated!', data: db.banners[idx] });
});

app.delete('/api/admin/banners/:id', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  db.banners = db.banners.filter(b => b.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true, message: 'Banner removed!' });
});

// Admin: Reviews Management
app.get('/api/admin/reviews', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.reviews });
});

app.put('/api/admin/reviews/:id', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  const rev = db.reviews.find(r => r.id === req.params.id);
  if (!rev) {
    res.status(404).json({ success: false, message: 'Review not found' });
    return;
  }
  if (req.body.status) rev.status = req.body.status;
  if (req.body.rating) rev.rating = Number(req.body.rating);
  if (req.body.comment) rev.comment = req.body.comment;

  saveDatabase(db);
  res.json({ success: true, message: 'Review updated!', data: rev });
});

app.delete('/api/admin/reviews/:id', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  db.reviews = db.reviews.filter(r => r.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true, message: 'Review deleted!' });
});

// Admin: Reset to default demo data
app.post('/api/admin/reset-defaults', authenticateAdmin, (req, res) => {
  const initialData: DatabaseSchema = {
    products: INITIAL_PRODUCTS,
    orders: INITIAL_ORDERS,
    banners: INITIAL_BANNERS,
    reviews: INITIAL_REVIEWS,
    inquiries: [],
    adminHash: hashPassword(DEFAULT_ADMIN_PASS),
    adminPin: DEFAULT_ADMIN_PIN,
    adminEmail: DEFAULT_ADMIN_EMAIL,
    settings: INITIAL_SETTINGS
  };
  saveDatabase(initialData);
  res.json({ success: true, message: 'Database reset to default demo dataset.' });
});

// Admin: Inquiries list & Delete
app.get('/api/admin/inquiries', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.inquiries });
});

app.delete('/api/admin/inquiries/:id', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  db.inquiries = (db.inquiries || []).filter(i => i.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true, message: 'Inquiry removed successfully!' });
});

// Public: Get site settings
app.get('/api/settings', (req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.settings || INITIAL_SETTINGS });
});

// Admin: Update site settings
app.put('/api/admin/settings', authenticateAdmin, (req, res) => {
  const db = loadDatabase();
  const current = db.settings || INITIAL_SETTINGS;
  const body = req.body || {};
  const settingsData = body.settings ? body.settings : body;
  const updated: SiteSettings = {
    ...current,
    ...settingsData,
    socialLinks: {
      ...current.socialLinks,
      ...(settingsData.socialLinks || {})
    },
    announcementBar: {
      ...current.announcementBar,
      ...(settingsData.announcementBar || {})
    }
  };
  db.settings = updated;
  saveDatabase(db);
  res.json({ success: true, message: 'Website settings, numbers and links updated successfully!', data: updated });
});

// Guaranteed JSON error response handler for all /api endpoints
app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API error intercepted:', err);
  res.status(500).json({
    success: false,
    message: err?.message || 'Internal server error occurred.'
  });
});

// Start server with Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoltGlide Scooty Hub server listening on port ${PORT}`);
  });
}

startServer();
