
import React, { useMemo } from 'react';
import { Droplets, School, Waves } from 'lucide-react';

interface Props {
  rainIntensity: number; // mm
  roofArea: number; // m2
  efficiency: number; // coeff * gutter
  currentMonth: string;
  isSimulating: boolean;
}

const RoofHarvestVisualizer: React.FC<Props> = ({ 
  rainIntensity, 
  roofArea, 
  efficiency, 
  currentMonth,
  isSimulating 
}) => {
  // Calculate harvested liters for this specific roof
  const harvestedLiters = useMemo(() => {
    return Math.max(0, rainIntensity * roofArea * efficiency);
  }, [rainIntensity, roofArea, efficiency]);

  const formatNumber = (val: number, decimals: number = 0) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Determine rain particle count based on intensity
  const particleCount = Math.min(Math.ceil(rainIntensity * 5), 50);
  const rainColor = rainIntensity > 15 ? '#60a5fa' : '#93c5fd';

  return (
    <div className="relative bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl overflow-hidden h-64 border border-slate-700 shadow-inner">
      {/* Dynamic Rain Overlay */}
      {rainIntensity > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: particleCount }).map((_, i) => (
            <div 
              key={i}
              className="absolute bg-blue-400/40 w-[1px] h-4 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animation: `rain-fall ${0.5 + Math.random() * 0.5}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Classroom Schematic */}
      <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full p-4">
        {/* Ground */}
        <rect x="0" y="170" width="400" height="30" fill="#1e293b" />
        
        {/* Building Body */}
        <rect x="100" y="100" width="180" height="70" fill="#334155" />
        <rect x="120" y="120" width="30" height="30" fill="#1e293b" /> {/* Window */}
        <rect x="175" y="120" width="30" height="30" fill="#1e293b" /> {/* Window */}
        <rect x="230" y="120" width="30" height="30" fill="#1e293b" /> {/* Window */}
        
        {/* Roof Structure */}
        <path d="M90 100 L190 60 L290 100 Z" fill="#475569" stroke="#1e293b" strokeWidth="2" />
        
        {/* Gutter System */}
        <path d="M285 100 L295 100 L295 105 L285 105 Z" fill="#94a3b8" />
        <rect x="290" y="105" width="4" height="60" fill="#94a3b8" /> {/* Downpipe */}

        {/* Tank */}
        <rect x="300" y="110" width="50" height="60" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        <rect 
          x="302" 
          y={112 + (60 - (Math.min(rainIntensity * 2, 56)))} 
          width="46" 
          height={Math.min(rainIntensity * 2, 56)} 
          rx="2" 
          fill="#3b82f6" 
          className="transition-all duration-500 ease-in-out"
        />

        {/* Water Flow Animation (active when raining) */}
        {rainIntensity > 0.1 && (
          <g>
            <rect x="291" y="105" width="2" height="60" fill="#3b82f6" className="animate-pulse" />
            <circle cx="292" cy="110" r="1.5" fill="white">
              <animate attributeName="cy" from="105" to="165" dur="0.4s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </svg>

      {/* UI Overlays */}
      <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-lg">
        <div className="flex items-center gap-2 text-white">
          <School size={16} className="text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Classroom Harvesting</span>
        </div>
        <div className="mt-1">
          <span className="text-xl font-black text-white tabular-nums">
            {formatNumber(harvestedLiters, 1)}
          </span>
          <span className="ml-1 text-[10px] text-blue-300 font-bold uppercase">Liters / Day</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-lg text-right">
        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Current Pattern</div>
        <div className="text-sm font-bold text-white uppercase italic">{currentMonth || 'Stationary'}</div>
        <div className="flex items-center justify-end gap-1 text-[9px] text-blue-400 mt-1">
          <Waves size={10} className="animate-bounce" />
          <span>Non-Stationary Feed</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <div className="flex gap-4">
          <div className="text-center">
             <div className="text-[8px] text-slate-400 uppercase font-bold">Rainfall</div>
             <div className="text-xs text-white font-mono">{formatNumber(rainIntensity, 1)} mm</div>
          </div>
          <div className="text-center border-l border-slate-700 pl-4">
             <div className="text-[8px] text-slate-400 uppercase font-bold">Roof Size</div>
             <div className="text-xs text-white font-mono">{formatNumber(roofArea)} m²</div>
          </div>
        </div>
        
        {isSimulating && (
          <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-2 py-1 rounded text-[10px] font-bold animate-pulse">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            LIVE SIMULATION
          </div>
        )}
      </div>

      <style>{`
        @keyframes rain-fall {
          0% { transform: translateY(-20px); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(220px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default RoofHarvestVisualizer;
