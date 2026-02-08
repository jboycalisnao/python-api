
import React from 'react';
import { Tag, CheckCircle2, ShoppingBag, ExternalLink } from 'lucide-react';
import { ReliabilityResult } from '../../types';
import { TANK_BRANDS } from '../../constants';

interface Props {
  reliabilityMap: Record<number, number>;
  onSelect: (size: number) => void;
  selectedSize: number;
}

const BrandMarketComparison: React.FC<Props> = ({ reliabilityMap, onSelect, selectedSize }) => {
  const formatNumber = (val: number, decimals: number = 0) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-primary" />
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Market Model Compatibility</h3>
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase">Performance vs Capacity</div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {TANK_BRANDS.map((brand) => (
          <div key={brand.name} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-tighter flex items-center gap-1">
                {brand.name}
              </h4>
              <Tag size={12} className="text-slate-300" />
            </div>

            <div className="space-y-4">
              {Object.entries(brand.categories).map(([category, sizes]) => (
                <div key={category} className="space-y-2">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    {category} Models
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {sizes.map((size) => {
                      const reliability = reliabilityMap[size];
                      const isSelected = selectedSize === size;
                      const hasData = reliability !== undefined;

                      return (
                        <button
                          key={size}
                          disabled={!hasData}
                          onClick={() => onSelect(size)}
                          className={`
                            flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all group
                            ${!hasData ? 'opacity-30 cursor-not-allowed bg-slate-50 border-slate-100' : ''}
                            ${isSelected 
                              ? 'bg-primary text-white border-primary shadow-md scale-[1.02]' 
                              : 'bg-white border-slate-200 hover:border-primary/50 text-slate-600'
                            }
                          `}
                        >
                          <div className="flex flex-col">
                            <span className={`text-[11px] font-black tabular-nums ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                              {formatNumber(size)} L
                            </span>
                            {isSelected && (
                              <span className="text-[8px] font-bold opacity-80 flex items-center gap-1">
                                <CheckCircle2 size={8} /> Selected Model
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            {hasData ? (
                              <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-200' : (reliability >= 90 ? 'text-green-600' : 'text-slate-400')}`}>
                                {reliability.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-300">N/A</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
        <div className="text-[9px] text-slate-400 italic">
          Reliability calculated across the full synthetic rainfall cycle.
        </div>
        <a 
          href="#" 
          onClick={(e) => e.preventDefault()} 
          className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1"
        >
          Check Local Supplier <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
};

export default BrandMarketComparison;
