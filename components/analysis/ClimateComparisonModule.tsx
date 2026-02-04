
import React, { useState } from 'react';
import { 
  Copy, 
  ArrowRightLeft, 
  FileUp, 
  CheckCircle2, 
  AlertCircle, 
  BarChart, 
  Zap 
} from 'lucide-react';
import { 
  BarChart as RechartsBar, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { TransitionAnalyzer } from '../../services/analysis/TransitionAnalyzer';
import { IntensityAnalyzer } from '../../services/analysis/IntensityAnalyzer';
import { HistoricalRecord, MonthlyParameters } from '../../types';
import { MONTH_NAMES } from '../../constants';

interface ComparisonResult {
  month: string;
  rainA: number;
  rainB: number;
  p01A: number;
  p01B: number;
}

const ClimateComparisonModule: React.FC = () => {
  const [dataA, setDataA] = useState<MonthlyParameters[] | null>(null);
  const [dataB, setDataB] = useState<MonthlyParameters[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<'A' | 'B' | null>(null);

  const processFile = async (file: File, target: 'A' | 'B') => {
    setIsAnalyzing(target);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        const records: HistoricalRecord[] = lines.slice(1).map(line => {
          const [date, rain] = line.split(',');
          return { date: date.trim(), rain_mm: parseFloat(rain) || 0 };
        });

        const transitions = TransitionAnalyzer.analyze(records);
        const intensities = IntensityAnalyzer.analyze(records);

        const merged: MonthlyParameters[] = transitions.map(t => {
          const intensity = intensities.find(i => i.month === t.month);
          return { ...t, ...intensity } as MonthlyParameters;
        });

        if (target === 'A') setDataA(merged);
        else setDataB(merged);
        setIsAnalyzing(null);
      } catch (err) {
        alert("Error parsing file. Ensure CSV format is 'Date, Rain'.");
        setIsAnalyzing(null);
      }
    };
    reader.readAsText(file);
  };

  const chartData: ComparisonResult[] = Array.from({ length: 12 }, (_, i) => {
    const monthIdx = i + 1;
    const mA = dataA?.find(d => d.month === monthIdx);
    const mB = dataB?.find(d => d.month === monthIdx);
    return {
      month: MONTH_NAMES[i].substring(0, 3),
      rainA: mA?.meanRain || 0,
      rainB: mB?.meanRain || 0,
      p01A: mA?.p01 || 0,
      p01B: mB?.p01 || 0,
    };
  });

  const annualA = dataA?.reduce((acc, m) => acc + (m.meanRain * 30), 0) || 0;
  const annualB = dataB?.reduce((acc, m) => acc + (m.meanRain * 30), 0) || 0;
  const delta = annualA > 0 ? ((annualB - annualA) / annualA) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Upload Slot A */}
        <div className={`p-4 rounded-xl border-2 border-dashed transition-all ${dataA ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Dataset A (Baseline)</span>
            {dataA && <CheckCircle2 size={14} className="text-blue-500" />}
          </div>
          <label className="cursor-pointer block">
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 'A')} />
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <FileUp size={16} />
              {isAnalyzing === 'A' ? "Processing..." : dataA ? "Change File" : "Upload CSV"}
            </div>
          </label>
        </div>

        {/* Upload Slot B */}
        <div className={`p-4 rounded-xl border-2 border-dashed transition-all ${dataB ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Dataset B (Target)</span>
            {dataB && <CheckCircle2 size={14} className="text-red-500" />}
          </div>
          <label className="cursor-pointer block">
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 'B')} />
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <FileUp size={16} />
              {isAnalyzing === 'B' ? "Processing..." : dataB ? "Change File" : "Upload CSV"}
            </div>
          </label>
        </div>
      </div>

      {dataA && dataB ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-primary" />
              <h4 className="text-sm font-bold text-slate-800">Direct DNA Comparison</h4>
            </div>
            <div className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${delta >= 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              <Zap size={10} />
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% Vol. Change
            </div>
          </div>

          <div className="h-48 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBar data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis fontSize={9} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{fontSize: '10px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                <Bar name="Mean Rain A" dataKey="rainA" fill="#010e5b" radius={[2, 2, 0, 0]} />
                <Bar name="Mean Rain B" dataKey="rainB" fill="#ca080b" radius={[2, 2, 0, 0]} />
              </RechartsBar>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-slate-50 p-2 rounded text-[10px]">
              <div className="text-slate-400 font-bold uppercase mb-1">P01 (Dry → Wet) Shift</div>
              <div className="flex justify-between items-center">
                <span className="text-primary font-bold">A: {(dataA.reduce((a,b)=>a+b.p01,0)/12).toFixed(3)}</span>
                <span className="text-slate-300">→</span>
                <span className="text-secondary font-bold">B: {(dataB.reduce((a,b)=>a+b.p01,0)/12).toFixed(3)}</span>
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded text-[10px]">
              <div className="text-slate-400 font-bold uppercase mb-1">Peak Month Change</div>
              <div className="flex justify-between items-center">
                <span className="text-primary font-bold">{chartData.reduce((p,c)=>c.rainA > p.rainA ? c : p).month}</span>
                <span className="text-slate-300">vs</span>
                <span className="text-secondary font-bold">{chartData.reduce((p,c)=>c.rainB > p.rainB ? c : p).month}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <ArrowRightLeft size={32} className="opacity-20 mb-2" />
          <p className="text-xs">Upload two datasets to compare climate regimes</p>
        </div>
      )}
    </div>
  );
};

export default ClimateComparisonModule;
