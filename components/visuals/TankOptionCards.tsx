
import React from 'react';
import { ShieldCheck, Target, Wallet, Building2, Droplets } from 'lucide-react';
import { ReliabilityResult, Building } from '../../types';

interface Props {
  results: ReliabilityResult[];
  onSelect: (size: number) => void;
  currentSelected: number;
  buildings: Building[];
  hideBreakdown?: boolean;
}

const TankOptionCards: React.FC<Props> = ({ results, onSelect, currentSelected, buildings, hideBreakdown = false }) => {
  if (results.length === 0) return null;

  const formatNumber = (val: number, decimals: number = 0) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const totalArea = buildings.reduce((sum, b) => sum + (b.numberOfClassrooms * b.roofAreaPerClassroom), 0);

  // Find global optimal points
  const budget = results.find(r => r.reliability >= 75) || results[0];
  const optimal = results.find(r => r.reliability >= 90) || results[Math.floor(results.length / 2)];
  const resilient = results.find(r => r.reliability >= 98) || results[results.length - 1];

  const options = [
    {
      title: 'Budget Choice',
      desc: 'Minimum viable coverage for low-demand periods.',
      data: budget,
      icon: <Wallet className="text-slate-400" size={20} />,
      color: 'border-slate-200',
      tag: '75% Reliab.'
    },
    {
      title: 'Optimal Size',
      desc: 'Best balance between infrastructure cost and security.',
      data: optimal,
      icon: <Target className="text-primary" size={20} />,
      color: 'border-primary shadow-md',
      tag: '90%+ Target',
      recommended: true
    },
    {
      title: 'Drought Resilient',
      desc: 'High capacity for severe dry spell buffering.',
      data: resilient,
      icon: <ShieldCheck className="text-green-600" size={20} />,
      color: 'border-green-200',
      tag: 'Critical Reserve'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((opt, idx) => {
          const isSelected = currentSelected === opt.data.tankSize;
          return (
            <button
              key={idx}
              onClick={() => onSelect(opt.data.tankSize)}
              className={`text-left bg-white border-2 rounded-xl p-4 transition-all hover:scale-[1.02] ${opt.color} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${opt.recommended ? 'bg-primary/10' : 'bg-slate-100'}`}>
                  {opt.icon}
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${opt.recommended ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {opt.tag}
                </span>
              </div>
              
              <h4 className="font-bold text-slate-800 text-sm mb-1">{opt.title}</h4>
              <p className="text-[10px] text-slate-500 mb-4 h-8 overflow-hidden">{opt.desc}</p>
              
              <div className="mt-2 pt-3 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Capacity</div>
                  <div className="text-xl font-black text-slate-800">{formatNumber(opt.data.tankSize / 1000, 1)} <span className="text-xs font-normal text-slate-400">kL</span></div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Reliability</div>
                  <div className={`text-sm font-bold ${opt.recommended ? 'text-primary' : 'text-slate-600'}`}>
                    {formatNumber(opt.data.reliability, 1)}%
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!hideBreakdown && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-slate-400" />
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">School Building Breakdown</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {buildings.map((b) => {
              const area = b.numberOfClassrooms * b.roofAreaPerClassroom;
              const share = area / totalArea;
              const buildingShareL = optimal.tankSize * share;
              
              return (
                <div key={b.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-bold text-slate-800 text-[11px] truncate pr-2">{b.name}</div>
                    <div className="text-[9px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                      {formatNumber(share * 100, 1)}% Share
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Contribution</span>
                      <span className="font-bold text-slate-600">{formatNumber(area)} m²</span>
                    </div>
                    <div className="flex justify-between items-end border-t border-slate-50 pt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Recom. Tank</span>
                      <div className="text-right">
                        <span className="text-sm font-black text-primary">{formatNumber(buildingShareL / 1000, 1)} kL</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-start gap-2 text-[9px] text-slate-400 italic bg-white/50 p-2 rounded">
            <Droplets size={12} className="shrink-0 mt-0.5" />
            <span>Individual recommendations are proportional to roof catchment area. Switching the Filter above will re-simulate the reliability curve specifically for that building node.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TankOptionCards;
