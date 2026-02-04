
import { RainfallDataRow, InflowConfig, WaterBalanceConfig, ReliabilityResult } from '../types';

export class WaterBalanceEngine {
  static calculateInflow(rainData: RainfallDataRow[], config: InflowConfig): (RainfallDataRow & { inflow_liters: number })[] {
    const totalRoofArea = config.roofAreaPerClassroom * config.numberOfClassrooms;
    
    return rainData.map(day => {
      // First flush loss (applied per rainy day)
      let effectiveRain = Math.max(0, day.rain_mm - config.firstFlushLoss);
      
      // Inflow (L) = Rain (mm) * Area (m2) * Coeff * Gutter Eff
      const inflow = effectiveRain * totalRoofArea * config.runoffCoefficient * config.gutterEfficiency;
      
      return {
        ...day,
        inflow_liters: parseFloat(inflow.toFixed(2))
      };
    });
  }

  static runSimulation(
    inflowData: (RainfallDataRow & { inflow_liters: number })[],
    wbConfig: WaterBalanceConfig
  ): ReliabilityResult {
    let storage = wbConfig.tankCapacity * 0.5; // Start half full
    let daysMet = 0;
    let totalInflow = 0;
    let totalDemandValue = 0;
    let droughtDays = 0;

    const dailyDemand = wbConfig.totalDailyDemand;

    inflowData.forEach(day => {
      totalInflow += day.inflow_liters;
      totalDemandValue += dailyDemand;

      // Update storage
      storage = Math.min(wbConfig.tankCapacity, storage + day.inflow_liters);
      
      if (storage >= dailyDemand) {
        storage -= dailyDemand;
        daysMet++;
      } else {
        // Demand not fully met
        droughtDays++;
        storage = 0;
      }
    });

    return {
      tankSize: wbConfig.tankCapacity,
      reliability: (daysMet / inflowData.length) * 100,
      droughtDays,
      totalInflow,
      totalDemand: totalDemandValue
    };
  }

  static scanTankSizes(
    inflowData: (RainfallDataRow & { inflow_liters: number })[],
    wbConfig: Omit<WaterBalanceConfig, 'tankCapacity'>,
    minSize: number = 1000,
    maxSize: number = 50000,
    steps: number = 20
  ): ReliabilityResult[] {
    const results: ReliabilityResult[] = [];
    const stepSize = (maxSize - minSize) / steps;

    for (let i = 0; i <= steps; i++) {
      const capacity = minSize + (i * stepSize);
      results.push(this.runSimulation(inflowData, { ...wbConfig, tankCapacity: capacity }));
    }

    return results;
  }
}
