
import React, { useState, useMemo } from 'react';
import { 
  CloudRain, 
  Droplets, 
  BarChart3, 
  Settings2, 
  Download, 
  Play, 
  Info,
  ChevronRight,
  Calculator
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend 
} from 'recharts';

import { RainfallEngine } from './services/rainfallEngine';
import { WaterBalanceEngine } from './services/waterBalanceEngine';
import { DEFAULT_MONTHLY_PARAMS, COLORS, MONTH_NAMES } from './constants';
import { RainfallDataRow, InflowConfig, WaterBalanceConfig, ReliabilityResult } from './types';
import ModuleCard from './components/ModuleCard';

const App: React.FC = () => {
  // State: Rainfall Generation
  const [genYears, setGenYears] = useState(10);
  const [genSeed, setGenSeed] = useState(42);
  const [rainfallData, setRainfallData] = useState<RainfallDataRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // State: Harvesting Config
  const [inflowConfig, setInflowConfig] = useState<InflowConfig>({
    roofAreaPerClassroom: 60,
    numberOfClassrooms: 10,
    runoffCoefficient: 0.85,
    gutterEfficiency: 0.9,
    firstFlushLoss: 0.5
  });

  // State: Water Balance
  const [wbConfig, setWbConfig] = useState<Omit<WaterBalanceConfig, 'tankCapacity'>>({
    studentCount: 500,
    dailyDemandPerStudent: 2 // Liters for drinking/handwashing
  });

  const [simulationResults, setSimulationResults] = useState<ReliabilityResult[]>([]);
  const [selectedTankSize, setSelectedTankSize] = useState(10000);

  // Derived Data: Monthly Summary for Chart
  const monthlyInflowData = useMemo(() => {
    if (rainfallData.length === 0) return [];
    
    const inflowData = WaterBalanceEngine.calculateInflow(rainfallData, inflowConfig);
    const summary = Array.from({ length: 12 }, (_, i) => ({
      month: MONTH_NAMES[i],
      rainfall: 0,
      inflow: 0,
      count: 0
    }));

    inflowData.forEach(d => {
      const idx = d.month - 1;
      summary[idx].rainfall += d.rain_mm;
      summary[idx].inflow += d.inflow_liters;
      summary[idx].count++;
    });

    return summary.map(s => ({
      ...s,
      avgRain: parseFloat((s.rainfall / (rainfallData.length / 365)).toFixed(2)),
      avgInflow: parseFloat((s.inflow / (rainfallData.length / 365)).toFixed(2))
    }));
  }, [rainfallData, inflowConfig]);

  const handleGenerateRainfall = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const data = RainfallEngine.generate(DEFAULT_MONTHLY_PARAMS, genYears, genSeed);
      setRainfallData(data);
      setIsGenerating(false);
    }, 600);
  };

  const handleRunAnalysis = () => {
    if (rainfallData.length === 0) return;
    const inflowData = WaterBalanceEngine.calculateInflow(rainfallData, inflowConfig);
    const scan = WaterBalanceEngine.scanTankSizes(inflowData, wbConfig, 1000, 50000, 25);
    setSimulationResults(scan);
  };

  const currentReliability = useMemo(() => {
    if (simulationResults.length === 0) return null;
    // Find closest result to selectedTankSize
    return simulationResults.reduce((prev, curr) => 
      Math.abs(curr.tankSize - selectedTankSize) < Math.abs(prev.tankSize - selectedTankSize) ? curr : prev
    );
  }, [simulationResults, selectedTankSize]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-[#010e5b] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-8 h-8 text-white" />
            <h1 className="text-xl font-bold tracking-tight">MCS <span className="font-light opacity-80">| Rainwater Harvesting Dashboard</span></h1>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#" className="hover:text-red-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-red-400 transition-colors">Methodology</a>
            <button className="bg-[#ca080b] px-4 py-2 rounded-md hover:bg-red-700 transition-colors shadow-sm font-semibold">
              Export Report
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Configuration */}
        <div className="lg:col-span-4 space-y-6">
          
          <ModuleCard title="Rainfall Generation" icon={<CloudRain size={20}/>} step={1}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Synthetic Duration (Years)</label>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[#010e5b] outline-none" 
                  value={genYears} 
                  onChange={(e) => setGenYears(parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Random Seed</label>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[#010e5b] outline-none" 
                  value={genSeed} 
                  onChange={(e) => setGenSeed(parseInt(e.target.value))}
                />
              </div>
              <button 
                onClick={handleGenerateRainfall}
                disabled={isGenerating}
                className="w-full bg-[#010e5b] text-white py-2 rounded-md hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 font-medium disabled:bg-slate-300"
              >
                {isGenerating ? "Generating..." : <><Play size={16} /> Generate Time Series</>}
              </button>
              {rainfallData.length > 0 && (
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-2">
                  <Info size={12} /> Successfully generated {rainfallData.length} records.
                </div>
              )}
            </div>
          </ModuleCard>

          <ModuleCard title="Inflow Configuration" icon={<Droplets size={20}/>} step={2}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Classrooms</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" 
                    value={inflowConfig.numberOfClassrooms} 
                    onChange={(e) => setInflowConfig({...inflowConfig, numberOfClassrooms: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Roof/Class (m²)</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" 
                    value={inflowConfig.roofAreaPerClassroom} 
                    onChange={(e) => setInflowConfig({...inflowConfig, roofAreaPerClassroom: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Runoff Coeff (0-1)</label>
                <input 
                  type="range" min="0" max="1" step="0.05"
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#010e5b]" 
                  value={inflowConfig.runoffCoefficient} 
                  onChange={(e) => setInflowConfig({...inflowConfig, runoffCoefficient: parseFloat(e.target.value)})}
                />
                <div className="text-right text-xs text-slate-500">{inflowConfig.runoffCoefficient}</div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">First Flush (mm)</label>
                <input 
                  type="number" step="0.1"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" 
                  value={inflowConfig.firstFlushLoss} 
                  onChange={(e) => setInflowConfig({...inflowConfig, firstFlushLoss: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </ModuleCard>

          <ModuleCard title="Water Demand" icon={<Settings2 size={20}/>} step={3}>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Total Students</label>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" 
                  value={wbConfig.studentCount} 
                  onChange={(e) => setWbConfig({...wbConfig, studentCount: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Liters / Student / Day</label>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" 
                  value={wbConfig.dailyDemandPerStudent} 
                  onChange={(e) => setWbConfig({...wbConfig, dailyDemandPerStudent: parseInt(e.target.value)})}
                />
              </div>
              <button 
                onClick={handleRunAnalysis}
                disabled={rainfallData.length === 0}
                className="w-full bg-[#ca080b] text-white py-2 rounded-md hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 font-medium disabled:bg-slate-300"
              >
                <BarChart3 size={16} /> Scan Tank Capacities
              </button>
            </div>
          </ModuleCard>

        </div>

        {/* Results Area */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Visualizer */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">System Performance Analysis</h3>
                <p className="text-sm text-slate-500">Long-term synthetic trends and harvestable inflow potential.</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 border border-slate-200 rounded-md hover:bg-slate-50"><Download size={16} /></button>
              </div>
            </div>

            {rainfallData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                <CloudRain size={48} className="mb-2 opacity-20" />
                <p>Generate rainfall data to view trends</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Monthly Rainfall/Inflow Chart */}
                <div className="h-72">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Monthly Hydrological Regime</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyInflowData}>
                      <defs>
                        <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#010e5b" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#010e5b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle"/>
                      <Area type="monotone" dataKey="avgInflow" name="Average Inflow (L)" stroke="#010e5b" fillOpacity={1} fill="url(#colorInflow)" strokeWidth={2} />
                      <Line type="monotone" dataKey="avgRain" name="Rainfall (mm)" stroke="#ca080b" dot={false} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Reliability Curve */}
                {simulationResults.length > 0 && (
                  <div className="h-72 pt-8 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Reliability vs. Tank Capacity</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={simulationResults}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="tankSize" fontSize={10} axisLine={false} tickLine={false} label={{ value: 'Capacity (Liters)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} label={{ value: 'Reliability (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="reliability" name="Reliability (%)" stroke="#ca080b" strokeWidth={3} dot={{ fill: '#ca080b', r: 3 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase mb-2">Annual Mean Inflow</div>
              <div className="text-2xl font-bold text-primary">
                {monthlyInflowData.length > 0 ? (monthlyInflowData.reduce((acc, v) => acc + v.avgInflow, 0) / 1000).toFixed(1) : 0} m³
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Based on roof area and generation parameters</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase mb-2">Target Reliability</div>
              <div className="text-2xl font-bold text-secondary">
                {currentReliability ? currentReliability.reliability.toFixed(1) : 0}%
              </div>
              <div className="flex items-center gap-1 mt-2">
                 <input 
                  type="range" min="1000" max="50000" step="1000"
                  className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-secondary" 
                  value={selectedTankSize} 
                  onChange={(e) => setSelectedTankSize(parseInt(e.target.value))}
                />
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{selectedTankSize/1000}kL</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase mb-2">Drought Indicator</div>
              <div className="text-2xl font-bold text-slate-700">
                {currentReliability ? Math.round(currentReliability.droughtDays / genYears) : 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Avg. dry days per year with tank empty</div>
            </div>
          </div>

          {/* Summary Table */}
          {rainfallData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Monthly Water Balance Summary</h3>
                <button className="text-xs text-[#010e5b] font-semibold flex items-center gap-1">
                  View Full CSV <ChevronRight size={14} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-3">Month</th>
                      <th className="px-6 py-3">Rainfall (mm)</th>
                      <th className="px-6 py-3">Inflow (L)</th>
                      <th className="px-6 py-3">Demand (L)</th>
                      <th className="px-6 py-3">Deficit Probability</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100">
                    {monthlyInflowData.map((m, i) => {
                      const demand = wbConfig.studentCount * wbConfig.dailyDemandPerStudent * 30.4;
                      const deficit = Math.max(0, demand - m.avgInflow);
                      const prob = (deficit / demand * 100).toFixed(0);
                      
                      return (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-medium">{m.month}</td>
                          <td className="px-6 py-3 text-slate-600">{m.avgRain.toLocaleString()}</td>
                          <td className="px-6 py-3 text-slate-600">{m.avgInflow.toLocaleString()}</td>
                          <td className="px-6 py-3 text-slate-600">{demand.toLocaleString()}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#ca080b]" 
                                  style={{ width: `${Math.min(100, parseInt(prob))}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">{prob}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
          <p>© 2024 MCS Research Program. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-600 underline">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 underline">Terms of Use</a>
            <a href="#" className="hover:text-slate-600 underline">Contact Engineering Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
