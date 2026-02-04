
import React from 'react';
import { Cloud, CloudRain, Sun, Zap, Calendar } from 'lucide-react';
import { RainfallDataRow } from '../../types';

interface Props {
  data: RainfallDataRow[];
}

const SynthesisSummary: React.FC<Props> = ({ data }) => {
  if (data.length === 0) return null;

  const totalYears = data[data.length - 1].synthetic_year;
  const totalRain = data.reduce((acc, d) => acc + d.rain_mm, 0);
  const avgAnnualRain = totalRain / totalYears;
  const wetDays = data.filter(d => d.wet).length;
  const wetDayFreq = (wetDays / data.length) * 100;
  const maxIntensity = Math.max(...data.map(d => d.rain_mm));

  const formatNumber = (val: number, decimals: number = 0) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const pluralize = (count: number, singular: string, plural: string) => {
    return count === 1 ? singular : plural;
  };

  // Calculate spells for summary
  let drySpells: number[] = [];
  let currentDry = 0;
  data.forEach(d => {
    if (!d.wet) currentDry++;
    else if (currentDry > 0) {
      drySpells.push(currentDry);
      currentDry = 0;
    }
  });
  const avgDrySpell = drySpells.length > 0 ? drySpells.reduce((a, b) => a + b, 0) / drySpells.length : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-amber-500" />
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Synthetic Loop Statistics</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Calendar size={14} />
            <span className="text-[10px] font-bold uppercase">Total Loop</span>
          </div>
          <div className="text-lg font-black text-slate-700">{formatNumber(totalYears)} {pluralize(totalYears, 'Year', 'Years')}</div>
          <div className="text-[9px] text-slate-400">Sample Size</div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <CloudRain size={14} />
            <span className="text-[10px] font-bold uppercase">Avg. Annual</span>
          </div>
          <div className="text-lg font-black text-slate-700">{formatNumber(avgAnnualRain, 1)} mm</div>
          <div className="text-[9px] text-slate-400">Precipitation Volume</div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <Cloud size={14} />
            <span className="text-[10px] font-bold uppercase">Wet Frequency</span>
          </div>
          <div className="text-lg font-black text-slate-700">{formatNumber(wetDayFreq, 1)}%</div>
          <div className="text-[9px] text-slate-400">Of {formatNumber(data.length)} {pluralize(data.length, 'Day', 'Days')}</div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Sun size={14} />
            <span className="text-[10px] font-bold uppercase">Mean Dry Spell</span>
          </div>
          <div className="text-lg font-black text-slate-700">{formatNumber(avgDrySpell, 1)} {pluralize(avgDrySpell, 'd', 'd')}</div>
          <div className="text-[9px] text-slate-400">Average Dry Period</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
        <div className="text-[10px] text-slate-500 italic">
          Maximum intensity event recorded: <span className="font-bold text-slate-700">{formatNumber(maxIntensity, 1)} mm</span>
        </div>
        <div className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded uppercase">
          Semi-Markov Calibrated
        </div>
      </div>
    </div>
  );
};

export default SynthesisSummary;
