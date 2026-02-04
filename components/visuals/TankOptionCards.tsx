
import React from 'react';
import { ShieldCheck, Target, Wallet, ArrowRight } from 'lucide-react';
import { ReliabilityResult } from '../../types';

interface Props {
  results: ReliabilityResult[];
  onSelect: (size: number) => void;
  currentSelected: number;
}

const TankOptionCards: React.FC<Props> = ({ results, onSelect, currentSelected }) => {
  if (results.length === 0) return null;

  const formatNumber = (val: number, decimals: number = 0) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Find optimal points
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
  );
};

export default TankOptionCards;
