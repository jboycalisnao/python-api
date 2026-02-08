
import React, { useMemo } from 'react';
import { Truck, Waves, Info, School, Droplets } from 'lucide-react';
import { RainfallDataRow, InflowConfig } from '../../types';

interface Props {
  rainfallData: RainfallDataRow[];
  inflowConfig: InflowConfig;
  dailyDemand: number;
}

const HarvestingAnalogies: React.FC<Props> = ({ rainfallData, inflowConfig, dailyDemand }) => {
  const analytics = useMemo(() => {
    if (rainfallData.length === 0) return null;

    const totalYears = rainfallData[rainfallData.length - 1].synthetic_year;
    // Aggregated roof area from all buildings
    const totalRoofArea = inflowConfig.buildings.reduce(
      (sum, b) => sum + (b.numberOfClassrooms * b.roofAreaPerClassroom), 
      0
    );
    
    // Total Volume = Sum(Rain * Area * Coeff * Gutter)
    const totalHarvestL = rainfallData.reduce((acc, day) => {
      const effectiveRain = Math.max(0, day.rain_mm - inflowConfig.firstFlushLoss);
      return acc + (effectiveRain * totalRoofArea * inflowConfig.runoffCoefficient * inflowConfig.gutterEfficiency);
    }, 0);

    const avgAnnualL = totalHarvestL / totalYears;
    
    // Analogies
    const olympicPoolL = 2500000;
    const waterTruckL = 10000;
    
    const poolsCount = totalHarvestL / olympicPoolL;
    const annualTrucks = avgAnnualL / waterTruckL;
    const annualSupplyDays = dailyDemand > 0 ? avgAnnualL / dailyDemand : 0;

    return {
      totalHarvestL,
      avgAnnualL,
      poolsCount,
      annualTrucks,
      annualSupplyDays,
      totalYears
    };
  }, [rainfallData, inflowConfig, dailyDemand]);

  if (!analytics) return null;

  const formatNumber = (val: number, decimals: number = 0) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const pluralize = (count: number, singular: string, plural: string) => {
    return count === 1 ? singular : plural;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-2 mb-6">
        <Waves size={18} className="text-blue-600" />
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Harvesting Scale & Context</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Analogies: Volumetric */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Waves size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total Loop Volume</div>
              <div className="text-lg font-black text-slate-800">
                {formatNumber(analytics.poolsCount, 1)} {pluralize(analytics.poolsCount, 'Pool', 'Pools')}
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">
                Equivalent to {formatNumber(analytics.poolsCount, 1)} Olympic-sized swimming pools collected over {formatNumber(analytics.totalYears)} {pluralize(analytics.totalYears, 'year', 'years')}.
              </p>
            </div>
          </div>
        </div>

        {/* Analogies: Logistics */}
        <div className="space-y-4 border-l border-slate-100 pl-0 md:pl-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Truck size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Annual Logistics</div>
              <div className="text-lg font-black text-slate-800">
                {formatNumber(analytics.annualTrucks, 1)} {pluralize(analytics.annualTrucks, 'Truck', 'Trucks')}
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">
                The average annual harvest is equal to filling {formatNumber(analytics.annualTrucks, 1)} standard 10kL water tankers.
              </p>
            </div>
          </div>
        </div>

        {/* Demand Coverage */}
        <div className="space-y-4 border-l border-slate-100 pl-0 md:pl-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <School size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Demand Coverage</div>
              <div className="text-lg font-black text-slate-800">
                {formatNumber(analytics.annualSupplyDays, 0)} {pluralize(Math.floor(analytics.annualSupplyDays), 'Day', 'Days')}
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">
                Annually, the aggregate roof area collects enough water to cover {formatNumber(analytics.annualSupplyDays, 0)} {pluralize(Math.floor(analytics.annualSupplyDays), 'day', 'days')} of your school's current demand.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-slate-50 border border-slate-100 p-3 rounded-lg flex items-center gap-3">
        <div className="shrink-0 text-primary opacity-40">
           <Droplets size={24} />
        </div>
        <div className="text-[10px] text-slate-600 leading-relaxed">
          <span className="font-bold text-primary">Interpretation:</span> This visualization compares the <span className="italic">Potential Inflow</span> against recognizable physical volumes. If your annual supply days are less than 365, your roof area might be too small to achieve 100% year-round reliability regardless of tank size.
        </div>
      </div>
    </div>
  );
};

export default HarvestingAnalogies;
