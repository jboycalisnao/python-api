
export interface MonthlyParameters {
  month: number;
  p01: number; // Transition prob: Dry to Wet
  p11: number; // Transition prob: Wet to Wet
  meanRain: number; // Mean rain depth on wet days (mm)
  stdDev: number; // Std dev for distribution
  gamma_k?: number; // Shape parameter
  gamma_theta?: number; // Scale parameter
  meanDrySpell?: number; // Mean duration of dry spells (days)
  varDrySpell?: number; // Variance of dry spells (days)
  meanWetSpell?: number; // Mean duration of wet spells (days)
  varWetSpell?: number; // Variance of wet spells (days)
  avgDrySpell?: number; // Legacy/Alias for meanDrySpell
  avgWetSpell?: number; // Legacy/Alias for meanWetSpell
}

export interface HistoricalRecord {
  date: string;
  rain_mm: number;
}

export interface RainfallDataRow {
  synthetic_year: number;
  day_of_year: number;
  month: number;
  rain_mm: number;
  wet: boolean;
}

export interface Building {
  id: string;
  name: string;
  numberOfClassrooms: number;
  roofAreaPerClassroom: number;
}

export interface InflowConfig {
  buildings: Building[];
  runoffCoefficient: number;
  gutterEfficiency: number;
  firstFlushLoss: number; // mm
}

export interface WaterBalanceConfig {
  handWashingAreas: number;
  faucetsPerArea: number;
  litersPerFaucetDay: number;
  totalDailyDemand: number; // This is the derived total used by the engine
  tankCapacity: number; // Liters
}

export interface ReliabilityResult {
  tankSize: number;
  reliability: number; // Percentage
  droughtDays?: number;
  totalInflow?: number;
  totalDemand?: number;
}

export interface SimulationReportJSON {
  metadata: {
    roof_area_per_class_m2: number;
    number_of_classrooms: number;
    total_daily_demand_L: number;
    simulation_years: number;
    hand_washing_areas?: number;
    faucets_per_area?: number;
  };
  harvest_summary: {
    annual_L: number;
    monthly_L: Record<string, number>;
    weekly_L: Record<string, number>;
  };
  reliability_table: {
    tank_L: Record<string, number>;
    reliability_pct: Record<string, number>;
  };
  generated_at: string;
}

export interface MonthlySummary {
  month: string;
  avgRain?: number;
  avgInflow: number;
  count?: number;
}
