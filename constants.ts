
import { MonthlyParameters } from './types';

export const COLORS = {
  primary: '#010e5b',
  secondary: '#ca080b',
};

/**
 * Brand-specific tank capacities (in Liters)
 */
export const TANK_BRANDS = [
  {
    name: "Bestank",
    categories: {
      small: [240, 300, 480, 500],
      medium: [1000, 1500, 2000],
      large: [4000, 6000, 10000]
    }
  },
  {
    name: "Firstank",
    categories: {
      small: [240, 500, 625, 775],
      medium: [1000, 1500, 2000],
      large: [5000, 10000, 20000]
    }
  },
  {
    name: "Weida (Galaxy)",
    categories: {
      small: [315, 500, 1000],
      medium: [1500, 2700, 4500],
      large: [9000, 13500, 23000]
    }
  }
];

export const ALL_BRAND_CAPACITIES = Array.from(new Set(
  TANK_BRANDS.flatMap(brand => Object.values(brand.categories).flat())
)).sort((a, b) => a - b);

/**
 * Default Monthly Parameters calibrated for a representative tropical/sub-tropical climate.
 * Includes overdispersed dry-spell moments to model realistic droughts.
 */
export const DEFAULT_MONTHLY_PARAMS: MonthlyParameters[] = [
  { month: 1, p01: 0.15, p11: 0.45, meanRain: 5.2, stdDev: 4.1, gamma_k: 1.609, gamma_theta: 3.232, meanDrySpell: 6.7, varDrySpell: 15.2, meanWetSpell: 1.8, varWetSpell: 2.1 },
  { month: 2, p01: 0.12, p11: 0.40, meanRain: 4.8, stdDev: 3.8, gamma_k: 1.595, gamma_theta: 3.008, meanDrySpell: 8.3, varDrySpell: 24.5, meanWetSpell: 1.6, varWetSpell: 1.9 },
  { month: 3, p01: 0.18, p11: 0.50, meanRain: 6.5, stdDev: 5.2, gamma_k: 1.562, gamma_theta: 4.160, meanDrySpell: 5.5, varDrySpell: 12.1, meanWetSpell: 2.0, varWetSpell: 2.5 },
  { month: 4, p01: 0.25, p11: 0.55, meanRain: 8.9, stdDev: 7.1, gamma_k: 1.572, gamma_theta: 5.664, meanDrySpell: 4.0, varDrySpell: 8.5, meanWetSpell: 2.2, varWetSpell: 3.0 },
  { month: 5, p01: 0.35, p11: 0.65, meanRain: 12.4, stdDev: 9.8, gamma_k: 1.601, gamma_theta: 7.745, meanDrySpell: 2.8, varDrySpell: 4.2, meanWetSpell: 2.8, varWetSpell: 4.5 },
  { month: 6, p01: 0.45, p11: 0.75, meanRain: 18.2, stdDev: 14.5, gamma_k: 1.575, gamma_theta: 11.552, meanDrySpell: 2.2, varDrySpell: 3.1, meanWetSpell: 4.0, varWetSpell: 10.2 },
  { month: 7, p01: 0.50, p11: 0.80, meanRain: 22.1, stdDev: 17.8, gamma_k: 1.541, gamma_theta: 14.337, meanDrySpell: 2.0, varDrySpell: 2.5, meanWetSpell: 5.0, varWetSpell: 15.4 },
  { month: 8, p01: 0.48, p11: 0.78, meanRain: 20.5, stdDev: 16.2, gamma_k: 1.601, gamma_theta: 12.802, meanDrySpell: 2.1, varDrySpell: 2.8, meanWetSpell: 4.5, varWetSpell: 12.8 },
  { month: 9, p01: 0.40, p11: 0.70, meanRain: 15.3, stdDev: 12.1, gamma_k: 1.599, gamma_theta: 9.569, meanDrySpell: 2.5, varDrySpell: 3.8, meanWetSpell: 3.3, varWetSpell: 6.2 },
  { month: 10, p01: 0.30, p11: 0.60, meanRain: 10.2, stdDev: 8.4, gamma_k: 1.474, gamma_theta: 6.918, meanDrySpell: 3.3, varDrySpell: 6.5, meanWetSpell: 2.5, varWetSpell: 3.8 },
  { month: 11, p01: 0.22, p11: 0.52, meanRain: 7.4, stdDev: 5.9, gamma_k: 1.573, gamma_theta: 4.704, meanDrySpell: 4.5, varDrySpell: 10.2, meanWetSpell: 2.1, varWetSpell: 2.8 },
  { month: 12, p01: 0.18, p11: 0.48, meanRain: 5.8, stdDev: 4.6, gamma_k: 1.589, gamma_theta: 3.648, meanDrySpell: 5.5, varDrySpell: 12.8, meanWetSpell: 1.9, varWetSpell: 2.3 },
];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
