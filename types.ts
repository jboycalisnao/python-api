
export interface MonthlyParameters {
  month: number;
  p01: number; // Transition prob: Dry to Wet
  p11: number; // Transition prob: Wet to Wet
  meanRain: number; // Mean rain depth on wet days (mm)
  stdDev: number; // Std dev for distribution
  gamma_k?: number; // Shape parameter
  gamma_theta?: number; // Scale parameter
  avgDrySpell?: number; // Mean duration of dry spells (days)
  avgWetSpell?: number; // Mean duration of wet spells (days)
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
  droughtDays?: number;
  totalInflow?: number;
  totalDemand?: number;
}

export interface SimulationReportJSON {
  metadata: {
    roof_area_per_class_m2: number;
    number_of_classrooms: number;
    students_per_class: number;
    demand_L_per_student_per_day: number;
    simulation_years: number;
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
