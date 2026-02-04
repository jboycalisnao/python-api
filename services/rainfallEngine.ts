
import { MonthlyParameters, RainfallDataRow } from '../types';

export class RainfallEngine {
  /**
   * Generates synthetic daily rainfall using a Semi-Markov model.
   * Spells (Dry/Wet) are sampled as discrete units, and daily intensity 
   * is drawn from a non-stationary Gamma distribution.
   */
  static generate(params: MonthlyParameters[], years: number, seed: number): RainfallDataRow[] {
    const data: RainfallDataRow[] = [];
    let random = this.seedableRandom(seed);
    
    // Initial state based on January P01
    const jan = params.find(p => p.month === 1)!;
    let isWet = random() < (jan.p01 / (1 - jan.p11 + jan.p01));
    
    let currentYear = 1;
    let currentDayOfYear = 1;

    while (currentYear <= years) {
      const monthIdx = this.getMonthFromDay(currentDayOfYear, currentYear);
      const mParams = params.find(p => p.month === monthIdx)!;

      // 1. Semi-Markov Sojourn Sampling
      // In a Semi-Markov model, we sample the entire spell duration (sojourn time)
      // from a distribution specific to the current state. 
      // Using Geometric distribution as a discrete sojourn sampler.
      const pExit = isWet ? (1 - mParams.p11) : mParams.p01;
      const safeP = Math.max(0.0001, Math.min(0.9999, pExit));
      const spellLength = Math.max(1, Math.ceil(Math.log(random()) / Math.log(1 - safeP)));

      // 2. Daily Intensity Generation (Non-Stationary Gamma)
      for (let i = 0; i < spellLength; i++) {
        if (currentYear > years) break;

        const dayMonth = this.getMonthFromDay(currentDayOfYear, currentYear);
        const dayParams = params.find(p => p.month === dayMonth)!;

        let rain = 0;
        if (isWet) {
          /**
           * Professional standard: Wet-day depth follows a Gamma distribution.
           * k (shape) controls the skewed nature of tropical rainfall.
           * theta (scale) scales the magnitude.
           */
          if (dayParams.gamma_k && dayParams.gamma_theta) {
            rain = this.sampleGamma(dayParams.gamma_k, dayParams.gamma_theta, random);
          } else {
            // Fallback to Exponential (special case of Gamma where k=1)
            rain = -dayParams.meanRain * Math.log(random() || 0.0001);
          }
          
          // Apply minimum threshold for significant rain (typically 0.1mm)
          if (rain < 0.1) rain = 0;
        }

        data.push({
          synthetic_year: currentYear,
          day_of_year: currentDayOfYear,
          month: dayMonth,
          rain_mm: parseFloat(rain.toFixed(2)),
          wet: rain >= 0.1
        });

        // Advance simulation clock
        currentDayOfYear++;
        if (currentDayOfYear > this.getDaysInYear(currentYear)) {
          currentDayOfYear = 1;
          currentYear++;
        }
      }

      // 3. State transition (Alternating spell types)
      isWet = !isWet;
    }

    return data;
  }

  /**
   * Samples from a Gamma(k, theta) distribution using the Marsaglia and Tsang method.
   * This is a highly efficient and accurate sampler for all k > 0.
   */
  private static sampleGamma(k: number, theta: number, rand: () => number): number {
    if (k < 1) {
      // Transformation for k < 1
      return this.sampleGamma(1 + k, theta, rand) * Math.pow(rand(), 1 / k);
    }
    
    const d = k - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      let x, v, u;
      do {
        x = this.boxMuller(rand);
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      u = rand();
      
      // Squeeze step
      if (u < 1 - 0.0331 * x * x * x * x) return d * v * theta;
      
      // Rejection step
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * theta;
    }
  }

  /**
   * Standard Box-Muller transform for generating N(0,1) random variables.
   */
  private static boxMuller(rand: () => number): number {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Linear Congruential Generator (LCG) for deterministic, seedable synthetic loops.
   */
  private static seedableRandom(seed: number) {
    let state = seed;
    return function() {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  }

  private static getMonthFromDay(doy: number, year: number): number {
    const date = new Date(year, 0);
    date.setDate(doy);
    return date.getMonth() + 1;
  }

  private static getDaysInYear(year: number): number {
    return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
  }
}
