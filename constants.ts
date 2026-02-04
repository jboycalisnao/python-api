
import { MonthlyParameters } from './types';

export const COLORS = {
  primary: '#010e5b',
  secondary: '#ca080b',
};

/**
 * Default Monthly Parameters calibrated for a representative tropical/sub-tropical climate.
 * Gamma parameters (k, theta) are calculated from Mean and StdDev using Method of Moments:
 * k (shape) = mean^2 / variance
 * theta (scale) = variance / mean
 */
export const DEFAULT_MONTHLY_PARAMS: MonthlyParameters[] = [
  { month: 1, p01: 0.15, p11: 0.45, meanRain: 5.2, stdDev: 4.1, gamma_k: 1.609, gamma_theta: 3.232 },
  { month: 2, p01: 0.12, p11: 0.40, meanRain: 4.8, stdDev: 3.8, gamma_k: 1.595, gamma_theta: 3.008 },
  { month: 3, p01: 0.18, p11: 0.50, meanRain: 6.5, stdDev: 5.2, gamma_k: 1.562, gamma_theta: 4.160 },
  { month: 4, p01: 0.25, p11: 0.55, meanRain: 8.9, stdDev: 7.1, gamma_k: 1.572, gamma_theta: 5.664 },
  { month: 5, p01: 0.35, p11: 0.65, meanRain: 12.4, stdDev: 9.8, gamma_k: 1.601, gamma_theta: 7.745 },
  { month: 6, p01: 0.45, p11: 0.75, meanRain: 18.2, stdDev: 14.5, gamma_k: 1.575, gamma_theta: 11.552 },
  { month: 7, p01: 0.50, p11: 0.80, meanRain: 22.1, stdDev: 17.8, gamma_k: 1.541, gamma_theta: 14.337 },
  { month: 8, p01: 0.48, p11: 0.78, meanRain: 20.5, stdDev: 16.2, gamma_k: 1.601, gamma_theta: 12.802 },
  { month: 9, p01: 0.40, p11: 0.70, meanRain: 15.3, stdDev: 12.1, gamma_k: 1.599, gamma_theta: 9.569 },
  { month: 10, p01: 0.30, p11: 0.60, meanRain: 10.2, stdDev: 8.4, gamma_k: 1.474, gamma_theta: 6.918 },
  { month: 11, p01: 0.22, p11: 0.52, meanRain: 7.4, stdDev: 5.9, gamma_k: 1.573, gamma_theta: 4.704 },
  { month: 12, p01: 0.18, p11: 0.48, meanRain: 5.8, stdDev: 4.6, gamma_k: 1.589, gamma_theta: 3.648 },
];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
