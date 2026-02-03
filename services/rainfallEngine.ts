
import { MonthlyParameters, RainfallDataRow } from '../types';

export class RainfallEngine {
  /**
   * Generates synthetic daily rainfall using a simple Markov state model (Dry/Wet)
   * with daily intensity drawn from a Gamma distribution (approximated here via Lognormal/Exponential logic).
   */
  static generate(params: MonthlyParameters[], years: number, seed: number): RainfallDataRow[] {
    const data: RainfallDataRow[] = [];
    let isWet = false;
    let dayCount = 0;

    // Fixed seed simulation for reproducibility
    let random = this.seedableRandom(seed);

    for (let year = 1; year <= years; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthParams = params.find(p => p.month === month)!;
        const daysInMonth = this.getDaysInMonth(month, year);

        for (let day = 1; day <= daysInMonth; day++) {
          dayCount++;
          
          // Determine state (Markov process)
          const pTransition = isWet ? monthParams.p11 : monthParams.p01;
          const roll = random();
          isWet = roll < pTransition;

          let rain = 0;
          if (isWet) {
            // Generate rain depth using Exponential distribution for simplicity
            // (Common in basic daily rainfall modeling)
            // Rain = -mean * ln(random)
            rain = -monthParams.meanRain * Math.log(random() || 0.001);
            // Apply a small threshold
            if (rain < 0.1) rain = 0;
          }

          data.push({
            synthetic_year: year,
            day_of_year: dayCount,
            month: month,
            rain_mm: parseFloat(rain.toFixed(2)),
            wet: isWet
          });
        }
      }
      dayCount = 0; // Reset for next year
    }

    return data;
  }

  private static seedableRandom(seed: number) {
    let m = 0x80000000;
    let a = 1103515245;
    let c = 12345;
    let state = seed;

    return function() {
      state = (a * state + c) % m;
      return state / (m - 1);
    };
  }

  private static getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
  }
}
