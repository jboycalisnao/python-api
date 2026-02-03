
import { MonthlyParameters } from './types';

export const COLORS = {
  primary: '#010e5b',
  secondary: '#ca080b',
};

export const DEFAULT_MONTHLY_PARAMS: MonthlyParameters[] = [
  { month: 1, p01: 0.15, p11: 0.45, meanRain: 5.2, stdDev: 4.1 },
  { month: 2, p01: 0.12, p11: 0.40, meanRain: 4.8, stdDev: 3.8 },
  { month: 3, p01: 0.18, p11: 0.50, meanRain: 6.5, stdDev: 5.2 },
  { month: 4, p01: 0.25, p11: 0.55, meanRain: 8.9, stdDev: 7.1 },
  { month: 5, p01: 0.35, p11: 0.65, meanRain: 12.4, stdDev: 9.8 },
  { month: 6, p01: 0.45, p11: 0.75, meanRain: 18.2, stdDev: 14.5 },
  { month: 7, p01: 0.50, p11: 0.80, meanRain: 22.1, stdDev: 17.8 },
  { month: 8, p01: 0.48, p11: 0.78, meanRain: 20.5, stdDev: 16.2 },
  { month: 9, p01: 0.40, p11: 0.70, meanRain: 15.3, stdDev: 12.1 },
  { month: 10, p01: 0.30, p11: 0.60, meanRain: 10.2, stdDev: 8.4 },
  { month: 11, p01: 0.22, p11: 0.52, meanRain: 7.4, stdDev: 5.9 },
  { month: 12, p01: 0.18, p11: 0.48, meanRain: 5.8, stdDev: 4.6 },
];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
