import { Product } from '../types.ts';

export interface ParsedProductMetrics {
  isElectric: boolean;
  topSpeedKmh: number;
  rangeKm: number; // Single charge km for EV, or estimated full-tank range km for Petrol
  mileageKmPerL: number | null; // For petrol models
  batteryKwh: number | null; // For EV models
  tankLiters: number | null; // For petrol models
  curbWeightKg: number;
  warrantyYears: number;
  runningCostPerKmPkr: number;
  monthlyMaintPkr: number;
}

function extractFirstNumber(str: string | undefined, fallback: number): number {
  if (!str) return fallback;
  const match = str.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : fallback;
}

function extractAverageRange(str: string | undefined, fallback: number): number {
  if (!str) return fallback;
  const rangeMatch = str.match(/(\d+(\.\d+)?)\s*[-–to]+\s*(\d+(\.\d+)?)/i);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[3]);
    return Math.round((low + high) / 2);
  }
  return extractFirstNumber(str, fallback);
}

export function isProductElectric(product: Product): boolean {
  const cat = product.category.toLowerCase();
  const motor = (product.specs?.engineMotor || '').toLowerCase();
  const fuel = (product.specs?.batteryFuel || '').toLowerCase();
  if (cat === 'electric' || cat === 'kids') return true;
  if (cat === 'petrol') return false;
  if (motor.includes('w') || motor.includes('brushless') || motor.includes('electric') || fuel.includes('lithium') || fuel.includes('ah')) {
    return true;
  }
  return false;
}

export function parseBatteryKwh(batteryStr: string | undefined): number | null {
  if (!batteryStr) return null;
  const vMatch = batteryStr.match(/(\d+(\.\d+)?)\s*v/i);
  const ahMatch = batteryStr.match(/(\d+(\.\d+)?)\s*ah/i);
  if (vMatch && ahMatch) {
    return Number(((parseFloat(vMatch[1]) * parseFloat(ahMatch[1])) / 1000).toFixed(2));
  }
  return 2.3; // typical 72V 32Ah default
}

export function parseProductMetrics(
  product: Product,
  petrolPricePerLiter = 275,
  electricityRatePerKwh = 45
): ParsedProductMetrics {
  const electric = isProductElectric(product);
  const topSpeedKmh = extractFirstNumber(product.specs?.maxSpeed, electric ? 65 : 85);
  const curbWeightKg = extractFirstNumber(product.specs?.curbWeight, electric ? 90 : 102);
  const warrantyYears = extractFirstNumber(product.specs?.warranty, 2);

  if (electric) {
    const rangeKm = extractAverageRange(product.specs?.rangeMileage, 85);
    const batteryKwh = parseBatteryKwh(product.specs?.batteryFuel) || 2.3;
    // Account for ~12% charger efficiency loss
    const costPerFullCharge = batteryKwh * 1.12 * electricityRatePerKwh;
    const runningCostPerKmPkr = rangeKm > 0 ? costPerFullCharge / rangeKm : 1.2;
    return {
      isElectric: true,
      topSpeedKmh,
      rangeKm,
      mileageKmPerL: null,
      batteryKwh,
      tankLiters: null,
      curbWeightKg,
      warrantyYears,
      runningCostPerKmPkr,
      monthlyMaintPkr: 450 // brake pads, tire checks, zero oil change
    };
  } else {
    const mileageKmPerL = extractAverageRange(product.specs?.rangeMileage, 52);
    const tankLiters = extractFirstNumber(product.specs?.batteryFuel, 5.2);
    const rangeKm = Math.round(mileageKmPerL * tankLiters);
    const runningCostPerKmPkr = mileageKmPerL > 0 ? petrolPricePerLiter / mileageKmPerL : 5.2;
    return {
      isElectric: false,
      topSpeedKmh,
      rangeKm,
      mileageKmPerL,
      batteryKwh: null,
      tankLiters,
      curbWeightKg,
      warrantyYears,
      runningCostPerKmPkr,
      monthlyMaintPkr: 2200 // engine oil, tuning, air filter, spark plug
    };
  }
}

export function calculateMonthlyOwnershipCost(
  product: Product,
  dailyKm: number,
  petrolPricePerLiter: number,
  electricityRatePerKwh: number
) {
  const metrics = parseProductMetrics(product, petrolPricePerLiter, electricityRatePerKwh);
  const monthlyKm = dailyKm * 30;
  const monthlyEnergyCost = Math.round(monthlyKm * metrics.runningCostPerKmPkr);
  const totalMonthlyCost = monthlyEnergyCost + metrics.monthlyMaintPkr;
  return {
    metrics,
    monthlyKm,
    monthlyEnergyCost,
    monthlyMaintCost: metrics.monthlyMaintPkr,
    totalMonthlyCost
  };
}
