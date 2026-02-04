
import * as ss from 'simple-statistics';
import { HistoricalRecord, MonthlyParameters } from '../../types';

export class IntensityAnalyzer {
  /**
   * Calculates intensity parameters (mean, stdDev, Gamma) for wet days.
   */
  static analyze(data: HistoricalRecord[]): Partial<MonthlyParameters>[] {
    const monthData: Record<number, number[]> = {};

    data.forEach(d => {
      if (d.rain_mm > 0.1) {
        const month = new Date(d.date).getMonth() + 1;
        if (!monthData[month]) monthData[month] = [];
        monthData[month].push(d.rain_mm);
      }
    });

    return Object.entries(monthData).map(([month, amounts]) => {
      const mean = ss.mean(amounts);
      const variance = ss.variance(amounts);
      const stdDev = ss.standardDeviation(amounts);

      // Method of Moments for Gamma distribution
      // k (shape) = mean^2 / variance
      // theta (scale) = variance / mean
      const k = (mean * mean) / (variance || 1);
      const theta = variance / (mean || 1);

      return {
        month: parseInt(month),
        meanRain: parseFloat(mean.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
        gamma_k: parseFloat(k.toFixed(3)),
        gamma_theta: parseFloat(theta.toFixed(3))
      };
    });
  }
}
