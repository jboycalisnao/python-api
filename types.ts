
export interface MonthlyParameters {
  month: number;
  p01: number; // Transition prob: Dry to Wet
  p11: number; // Transition prob: Wet to Wet
  meanRain: number; // Mean rain depth on wet days (mm)
  stdDev: number; // Std dev for distribution
}

export interface RainfallDataRow {
  synthetic_year: number;
  day_of_year: number;
  month: number;
  rain_mm: number;
  wet: boolean;
}

export interface InflowConfig {
  roofAreaPerClassroom: number;
  numberOfClassrooms: number;
  runoffCoefficient: number;
  gutterEfficiency: number;
  firstFlushLoss: number; // mm
}

export interface WaterBalanceConfig {
  studentCount: number;
  dailyDemandPerStudent: number; // Liters
  tankCapacity: number; // Liters
}

export interface ReliabilityResult {
  tankSize: number;
  reliability: number; // Percentage
  droughtDays: number;
  totalInflow: number;
  totalDemand: number;
}

export interface MonthlySummary {
  month: number;
  avgRain: number;
  avgInflow: number;
  avgReliability: number;
}
