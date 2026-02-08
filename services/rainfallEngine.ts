
import { MonthlyParameters, RainfallDataRow } from '../types';

export class RainfallEngine {
  /**
   * Generates synthetic daily rainfall using a Generalized Semi-Markov model.
   * Unlike standard alternating models, this version allows for probabilistic 
   * state persistence (e.g., Dry -> Dry or Wet -> Wet transitions) after a spell ends.
   */
  static generate(params: MonthlyParameters[], years: number, seed: number): RainfallDataRow[] {
    const data: RainfallDataRow[] = [];
    const random = this.seedableRandom(seed);
    
    // Initial state based on long-term stationary distribution of the Markov chain
    // P(Wet) = p01 / (1 - p11 + p01)
    const jan = params.find(p => p.month === 1)!;
    let isWet = random() < (jan.p01 / (1 - jan.p11 + jan.p01));
    
    let currentYear = 1;
    let currentDayOfYear = 1;

    while (currentYear <= years) {
      // Get parameters for the month where the spell begins
      const monthIdx = this.getMonthFromDay(currentDayOfYear, currentYear);
      const mParams = params.find(p => p.month === monthIdx)!;

      // 1. Semi-Markov Sojourn Sampling
      // Determine length L based on current state parameters
      let spellLength = 1;
      const mean = isWet 
        ? (mParams.meanWetSpell || (1 / (1 - mParams.p11))) 
        : (mParams.meanDrySpell || (1 / mParams.p01));
      const variance = isWet ? mParams.varWetSpell : mParams.varDrySpell;

      if (variance && variance > mean) {
        // Overdispersed: Use Negative Binomial (Gamma-Poisson mixture) for heavy tails
        spellLength = this.sampleNegativeBinomial(mean, variance, random);
      } else {
        // Fallback: Geometric distribution (Standard memoryless Semi-Markov)
        const p = 1 / Math.max(1, mean);
        spellLength = this.sampleGeometric(p, random);
      }
      
      // Safety clamp to prevent infinite or year-spanning spells
      spellLength = Math.max(1, Math.min(365, spellLength));

      // 2. Daily Intensity Generation within the spell
      for (let i = 0; i < spellLength; i++) {
        if (currentYear > years) break;

        // Intensity params are nonstationary: we lookup params for the ACTUAL current day
        const dayMonth = this.getMonthFromDay(currentDayOfYear, currentYear);
        const dayParams = params.find(p => p.month === dayMonth)!;

        let rain = 0;
        if (isWet) {
          if (dayParams.gamma_k && dayParams.gamma_theta) {
            rain = this.sampleGamma(dayParams.gamma_k, dayParams.gamma_theta, random);
          } else {
            // Fallback to Exponential intensity
            rain = -dayParams.meanRain * Math.log(random() || 0.0001);
          }
          // Thresholding trace rainfall
          if (rain < 0.1) rain = 0;
        }

        data.push({
          synthetic_year: currentYear,
          day_of_year: currentDayOfYear,
          month: dayMonth,
          rain_mm: parseFloat(rain.toFixed(2)),
          wet: rain >= 0.1
        });

        currentDayOfYear++;
        if (currentDayOfYear > this.getDaysInYear(currentYear)) {
          currentDayOfYear = 1;
          currentYear++;
        }
      }

      // 3. State Transition Mechanism (Generalized)
      // Instead of isWet = !isWet, we sample the next state from the transition matrix.
      // Monthly nonstationarity is applied to the transition probability.
      const transitionMonthIdx = this.getMonthFromDay(currentDayOfYear, currentYear);
      const tParams = params.find(p => p.month === transitionMonthIdx) || mParams;
      
      const transitionProb = isWet ? tParams.p11 : tParams.p01;
      
      // If current is Wet, next is Wet with p11.
      // If current is Dry, next is Wet with p01.
      isWet = random() < transitionProb;
    }

    return data;
  }

  /**
   * Samples a Negative Binomial duration via Gamma-Poisson mixture.
   * r = mu^2 / (sigma^2 - mu), p = mu / sigma^2
   */
  private static sampleNegativeBinomial(mean: number, variance: number, rand: () => number): number {
    const mu = Math.max(0.1, mean - 1); 
    const sigmaSq = Math.max(mu + 0.1, variance);
    
    const beta = (sigmaSq - mu) / mu;
    const alpha = mu / beta;
    
    const lambda = this.sampleGamma(alpha, beta, rand);
    const count = this.samplePoisson(lambda, rand);
    
    return count + 1;
  }

  private static samplePoisson(lambda: number, rand: () => number): number {
    if (lambda < 30) {
      let L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= rand();
      } while (p > L);
      return k - 1;
    } else {
      const standardNormal = this.boxMuller(rand);
      return Math.max(0, Math.floor(lambda + Math.sqrt(lambda) * standardNormal + 0.5));
    }
  }

  private static sampleGeometric(p: number, rand: () => number): number {
    const safeP = Math.max(0.0001, Math.min(0.9999, p));
    return Math.max(1, Math.ceil(Math.log(rand()) / Math.log(1 - safeP)));
  }

  private static sampleGamma(k: number, theta: number, rand: () => number): number {
    if (k < 1) {
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
      if (u < 1 - 0.0331 * x * x * x * x) return d * v * theta;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * theta;
    }
  }

  private static boxMuller(rand: () => number): number {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

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
