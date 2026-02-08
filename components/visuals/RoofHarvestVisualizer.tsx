
import React, { useMemo } from 'react';
import { Building } from '../../types';

interface Props {
  rainIntensity: number; // mm
  buildings: Building[];
  analysisScope: string;
  efficiency: number; // coeff * gutter
  currentMonth: string;
  isSimulating: boolean;
}

const RoofHarvestVisualizer: React.FC<Props> = ({ 
  rainIntensity, 
  buildings, 
  analysisScope,
  efficiency, 
  currentMonth,
  isSimulating 
}) => {
  // Calculate harvested liters for the current visualization context
  const totalHarvestedLiters = useMemo(() => {
    const area = buildings.reduce((sum, b) => sum + (b.numberOfClassrooms * b.roofAreaPerClassroom), 0);
    return Math.max(0, rainIntensity * area * efficiency);
  }, [rainIntensity, buildings, efficiency]);

  const formatNumber = (val: number, decimals: number = 0) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // SVG Layout constants
  const width = 800;
  const height = 400;

  // Render buildings in an aerial layout
  const buildingLayouts = useMemo(() => {
    const maxArea = Math.max(...buildings.map(b => b.numberOfClassrooms * b.roofAreaPerClassroom), 1);
    
    // Simple clustering logic: arrange in rows of 3
    const spacingX = 220;
    const spacingY = 140;
    const startX = 60;
    const startY = 80;

    return buildings.map((b, i) => {
      const bArea = b.numberOfClassrooms * b.roofAreaPerClassroom;
      const scaleFactor = Math.sqrt(bArea / maxArea);
      const bWidth = 140 * scaleFactor;
      const bHeight = 90 * scaleFactor;
      
      const col = i % 3;
      const row = Math.floor(i / 3);

      return {
        ...b,
        x: startX + col * spacingX,
        y: startY + row * spacingY,
        width: bWidth,
        height: bHeight,
        area: bArea,
        isSelected: analysisScope === 'school' || analysisScope === b.id
      };
    });
  }, [buildings, analysisScope]);

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden h-[420px] border border-slate-700 shadow-2xl group">
      {/* Background Blueprint Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#3b82f6 0.5px, transparent 0.5px), linear-gradient(90deg, #3b82f6 0.5px, transparent 0.5px)', 
             backgroundSize: '40px 40px' 
           }} />
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#3b82f6 0.5px, transparent 0.5px), linear-gradient(90deg, #3b82f6 0.5px, transparent 0.5px)', 
             backgroundSize: '8px 8px' 
           }} />

      {/* SVG Visualization */}
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full p-4 drop-shadow-2xl">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Central Collection Tank (Hub) */}
        <g transform={`translate(${width - 120}, ${height / 2 - 50})`}>
          <rect width="70" height="100" rx="10" fill="#0f172a" stroke="#1e293b" strokeWidth="3" />
          <text x="35" y="-12" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="900" className="uppercase tracking-[0.2em]">Main Reservoir</text>
          
          {/* Water Level inside tank */}
          <rect 
            x="3" 
            y={3 + (94 - Math.min(totalHarvestedLiters / 30, 94))} 
            width="64" 
            height={Math.min(totalHarvestedLiters / 30, 94)} 
            rx="6" 
            fill="#3b82f6" 
            className="transition-all duration-1000 ease-out"
            filter="url(#glow)"
          />
        </g>

        {/* Buildings and Collection Pipes */}
        {buildingLayouts.map((b) => {
          const pipeStartX = b.x + b.width;
          const pipeStartY = b.y + b.height / 2;
          const hubX = width - 120;
          const hubY = height / 2;

          return (
            <g key={b.id} className={`transition-opacity duration-500 ${b.isSelected ? 'opacity-100' : 'opacity-10'}`}>
              {/* Connection Pipe (Gutter to Hub) */}
              <path 
                d={`M ${pipeStartX} ${pipeStartY} L ${pipeStartX + 30} ${pipeStartY} L ${pipeStartX + 30} ${hubY} L ${hubX} ${hubY}`}
                fill="none"
                stroke="#1e293b"
                strokeWidth="4"
                strokeLinecap="round"
              />
              
              {/* Flow Animation when raining */}
              {rainIntensity > 0.1 && (
                <path 
                  d={`M ${pipeStartX} ${pipeStartY} L ${pipeStartX + 30} ${pipeStartY} L ${pipeStartX + 30} ${hubY} L ${hubX} ${hubY}`}
                  fill="none"
                  stroke="url(#pipeGradient)"
                  strokeWidth="3"
                  strokeDasharray="10, 25"
                  className="animate-flow"
                />
              )}

              {/* Building Shadow */}
              <rect 
                x={b.x + 4} y={b.y + 4} width={b.width} height={b.height} 
                fill="black" opacity="0.2" rx="2"
              />

              {/* Roof Top View - Main Rect */}
              <rect 
                x={b.x} y={b.y} width={b.width} height={b.height} 
                fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" rx="2"
                className="transition-all duration-300"
              />
              
              {/* Roof Ridges (Gives 3D pitched-roof look from top) */}
              <g opacity="0.4" stroke="#334155" strokeWidth="1">
                <line x1={b.x} y1={b.y} x2={b.x + b.width/2} y2={b.y + b.height/2} />
                <line x1={b.x + b.width} y1={b.y} x2={b.x + b.width/2} y2={b.y + b.height/2} />
                <line x1={b.x} y1={b.y + b.height} x2={b.x + b.width/2} y2={b.y + b.height/2} />
                <line x1={b.x + b.width} y1={b.y + b.height} x2={b.x + b.width/2} y2={b.y + b.height/2} />
              </g>

              {/* Rain Splashes on Roof surface */}
              {rainIntensity > 0.5 && Array.from({ length: 3 }).map((_, i) => (
                <circle 
                  key={i}
                  cx={b.x + 10 + Math.random() * (b.width - 20)}
                  cy={b.y + 10 + Math.random() * (b.height - 20)}
                  r="0"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="1"
                  opacity="0.8"
                >
                  <animate attributeName="r" from="0" to="12" dur={`${0.4 + Math.random() * 0.4}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur={`${0.4 + Math.random() * 0.4}s`} repeatCount="indefinite" />
                </circle>
              ))}

              <text x={b.x} y={b.y - 8} fill="#3b82f6" fontSize="8" fontWeight="bold" className="uppercase tracking-widest">{b.name}</text>
              <text x={b.x} y={b.y + b.height + 12} fill="#475569" fontSize="7" fontWeight="medium">{formatNumber(b.area)} m² catchment</text>
            </g>
          );
        })}
      </svg>

      {/* Falling Rain Particles Overlay */}
      {rainIntensity > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: Math.min(Math.ceil(rainIntensity * 6), 60) }).map((_, i) => (
            <div 
              key={i}
              className="absolute bg-blue-400/30 w-[1px] h-8 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                transform: 'rotate(10deg)',
                animation: `rain-fall-physics ${0.2 + Math.random() * 0.3}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Dashboard Overlays */}
      <div className="absolute top-6 left-6 flex flex-col gap-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-5 rounded-2xl shadow-2xl">
          <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Catchment Status</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white tabular-nums tracking-tighter">
              {formatNumber(totalHarvestedLiters, 1)}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase">Liters / Tick</span>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-white/5 pt-4">
            <div>
              <div className="text-[8px] text-slate-500 font-bold uppercase">Rain Intensity</div>
              <div className="text-xs text-white font-mono">{formatNumber(rainIntensity, 1)} mm</div>
            </div>
            <div>
              <div className="text-[8px] text-slate-500 font-bold uppercase">Node Area</div>
              <div className="text-xs text-white font-mono">{formatNumber(buildings.reduce((s,b)=>s+(b.numberOfClassrooms*b.roofAreaPerClassroom),0))} m²</div>
            </div>
            <div className="col-span-2 mt-1">
              <div className="text-[8px] text-slate-500 font-bold uppercase">System Month</div>
              <div className="text-[11px] text-blue-400 font-black uppercase tracking-widest">{currentMonth}</div>
            </div>
          </div>
        </div>

        {isSimulating && (
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl">
            <div className="flex gap-1">
              <span className="h-1 w-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
              <span className="h-1 w-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="h-1 w-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Hydraulic Analysis Active</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rain-fall-physics {
          0% { transform: translateY(-50px) rotate(10deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(500px) rotate(10deg); opacity: 0; }
        }
        .animate-flow {
          stroke-dasharray: 10, 30;
          animation: water-pulse 0.8s linear infinite;
        }
        @keyframes water-pulse {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default RoofHarvestVisualizer;
