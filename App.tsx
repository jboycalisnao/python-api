
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  CloudRain, 
  Droplets, 
  BarChart3, 
  Settings2, 
  Download, 
  Play, 
  Info,
  ChevronRight,
  Calculator,
  Upload,
  FileJson,
  AlertCircle,
  TrendingUp,
  MapPin,
  RefreshCw,
  ArrowRightLeft,
  Pause,
  FastForward,
  Sparkles,
  HandMetal,
  Waves,
  Lightbulb
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend 
} from 'recharts';

import { RainfallEngine } from './services/rainfallEngine';
import { WaterBalanceEngine } from './services/waterBalanceEngine';
import { DEFAULT_MONTHLY_PARAMS, MONTH_NAMES } from './constants';
import { RainfallDataRow, InflowConfig, WaterBalanceConfig, ReliabilityResult, SimulationReportJSON, MonthlySummary, MonthlyParameters } from './types';
import ModuleCard from './components/ModuleCard';
import HistoricalAnalysisModule from './components/analysis/HistoricalAnalysisModule';
import ClimateComparisonModule from './components/analysis/ClimateComparisonModule';
import RoofHarvestVisualizer from './components/visuals/RoofHarvestVisualizer';
import AIInsightsModule from './components/analysis/AIInsightsModule';
import SynthesisSummary from './components/visuals/SynthesisSummary';
import TankOptionCards from './components/visuals/TankOptionCards';

const App: React.FC = () => {
  // State: Source Mode
  const [viewMode, setViewMode] = useState<'live' | 'report'>('live');
  const [sidebarTab, setSidebarTab] = useState<'calibrate' | 'compare'>('calibrate');
  const [reportData, setReportData] = useState<SimulationReportJSON | null>(null);

  // State: Parameters (Defaults vs Historical Extracted)
  const [activeParams, setActiveParams] = useState<MonthlyParameters[]>(DEFAULT_MONTHLY_PARAMS);

  // State: Rainfall Generation (Live)
  const [genYears, setGenYears] = useState(10);
  const [genSeed, setGenSeed] = useState(42);
  const [rainfallData, setRainfallData] = useState<RainfallDataRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // State: Harvesting Config (Live)
  const [inflowConfig, setInflowConfig] = useState<InflowConfig>({
    roofAreaPerClassroom: 60,
    numberOfClassrooms: 10,
    runoffCoefficient: 0.85,
    gutterEfficiency: 0.9,
    firstFlushLoss: 0.5
  });

  // State: Simulation Playback
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const simulationTimerRef = useRef<number | null>(null);

  // State: Water Balance / Demand Configuration
  const [demandConfig, setDemandConfig] = useState({
    handWashingAreas: 4,
    faucetsPerArea: 5,
    litersPerFaucetDay: 50 // Standard engineering estimate for school faucet usage
  });

  // Derived Total Daily Demand
  const totalDailyDemand = useMemo(() => {
    return demandConfig.handWashingAreas * demandConfig.faucetsPerArea * demandConfig.litersPerFaucetDay;
  }, [demandConfig]);

  const [simulationResults, setSimulationResults] = useState<ReliabilityResult[]>([]);
  const [selectedTankSize, setSelectedTankSize] = useState(10000);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HELPERS ---
  const formatNumber = (val: number, decimals: number = 0) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const pluralize = (count: number, singular: string, plural: string) => {
    return count === 1 ? singular : plural;
  };

  // --- ACTIONS ---

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as SimulationReportJSON;
        if (json.metadata && json.harvest_summary && json.reliability_table) {
          setReportData(json);
          setViewMode('report');
        } else {
          alert("Invalid JSON structure.");
        }
      } catch (err) {
        alert("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateRainfall = () => {
    setViewMode('live');
    setIsGenerating(true);
    setIsPlaying(false);
    setTimeout(() => {
      const data = RainfallEngine.generate(activeParams, genYears, genSeed);
      setRainfallData(data);
      setSimulationResults([]); // Clear results when rain changes
      setCurrentDayIndex(0);
      setIsGenerating(false);
    }, 600);
  };

  const togglePlayback = () => {
    if (rainfallData.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying && rainfallData.length > 0) {
      simulationTimerRef.current = window.setInterval(() => {
        setCurrentDayIndex(prev => (prev + 1) % rainfallData.length);
      }, 100);
    } else {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    }
    return () => { if (simulationTimerRef.current) clearInterval(simulationTimerRef.current); };
  }, [isPlaying, rainfallData]);

  const handleRunAnalysis = () => {
    if (rainfallData.length === 0) return;
    const inflowData = WaterBalanceEngine.calculateInflow(rainfallData, inflowConfig);
    const wbConfig: Omit<WaterBalanceConfig, 'tankCapacity'> = {
      ...demandConfig,
      totalDailyDemand
    };
    const scan = WaterBalanceEngine.scanTankSizes(inflowData, wbConfig, 1000, 50000, 25);
    setSimulationResults(scan);
  };

  // --- DATA PROCESSING ---

  const currentDayData = useMemo(() => {
    if (!rainfallData[currentDayIndex]) return null;
    return rainfallData[currentDayIndex];
  }, [rainfallData, currentDayIndex]);

  const processedReportData = useMemo(() => {
    if (!reportData) return null;
    const monthly: MonthlySummary[] = Object.entries(reportData.harvest_summary.monthly_L)
      .map(([key, val]) => ({ 
        month: MONTH_NAMES[parseInt(key) - 1], 
        avgInflow: val as number 
      }));
    const reliability: ReliabilityResult[] = Object.keys(reportData.reliability_table.tank_L)
      .map(idx => ({ 
        tankSize: reportData.reliability_table.tank_L[idx] as number, 
        reliability: reportData.reliability_table.reliability_pct[idx] as number 
      }))
      .sort((a, b) => a.tankSize - b.tankSize);
    const driestMonth = monthly.reduce((p, c) => p.avgInflow < c.avgInflow ? p : c);
    const recommendedTank = reliability.find(r => r.reliability >= 90);
    return { monthly, reliability, driestMonth, recommendedTank };
  }, [reportData]);

  const liveChartData = useMemo(() => {
    if (rainfallData.length === 0) return [];
    const inflowData = WaterBalanceEngine.calculateInflow(rainfallData, inflowConfig);
    const summary = Array.from({ length: 12 }, (_, i) => ({ month: MONTH_NAMES[i], rainfall: 0, inflow: 0 }));
    inflowData.forEach(d => {
      const idx = d.month - 1;
      summary[idx].rainfall += d.rain_mm;
      summary[idx].inflow += d.inflow_liters;
    });
    const years = rainfallData.length / 365;
    return summary.map(s => ({ month: s.month, avgRain: parseFloat((s.rainfall / years).toFixed(2)), avgInflow: parseFloat((s.inflow / years).toFixed(2)) }));
  }, [rainfallData, inflowConfig]);

  const currentReliability = useMemo(() => {
    const list = viewMode === 'report' ? processedReportData?.reliability : simulationResults;
    if (!list || list.length === 0) return null;
    return list.reduce((prev, curr) => Math.abs(curr.tankSize - selectedTankSize) < Math.abs(prev.tankSize - selectedTankSize) ? curr : prev);
  }, [simulationResults, selectedTankSize, viewMode, processedReportData]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-[#010e5b] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-8 h-8 text-white" />
            <h1 className="text-xl font-bold tracking-tight">MCS <span className="font-light opacity-80">| Rainwater Harvesting Dashboard</span></h1>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md transition-colors">
              <Upload size={16} /> Import JSON
            </button>
            <button className="bg-[#ca080b] px-4 py-2 rounded-md hover:bg-red-700 transition-colors shadow-sm font-semibold">
              Export Report
            </button>
          </nav>
        </div>
      </header>

      {viewMode === 'report' && reportData && (
        <div className="bg-white border-b border-slate-200 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-200 pr-6">
                <FileJson size={14} className="text-blue-600" />
                Report: {new Date(reportData.generated_at).toLocaleDateString()}
              </div>
              <div className="flex gap-6 text-sm text-slate-600">
                <span><MapPin size={14} className="inline opacity-40 mr-1" /> {formatNumber(reportData.metadata.number_of_classrooms)} {pluralize(reportData.metadata.number_of_classrooms, 'Classroom', 'Classrooms')}</span>
                <span><TrendingUp size={14} className="inline opacity-40 mr-1" /> {formatNumber(reportData.metadata.roof_area_per_class_m2)} m²</span>
                <span className="font-medium text-primary">Daily Demand: {formatNumber(reportData.metadata.total_daily_demand_L)} L</span>
              </div>
            </div>
            <button onClick={() => setViewMode('live')} className="text-xs font-bold text-secondary hover:underline">
              Back to Simulation
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Configuration */}
        <div className="lg:col-span-4 space-y-6">
          
          <ModuleCard title="Climate Calibration" icon={<RefreshCw size={20}/>} step={1}>
            <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
              <button 
                onClick={() => setSidebarTab('calibrate')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${sidebarTab === 'calibrate' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
              >
                <RefreshCw size={12} /> Calibration
              </button>
              <button 
                onClick={() => setSidebarTab('compare')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${sidebarTab === 'compare' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
              >
                <ArrowRightLeft size={12} /> Comparison
              </button>
            </div>
            
            {sidebarTab === 'calibrate' ? (
              <HistoricalAnalysisModule onParametersExtracted={setActiveParams} />
            ) : (
              <ClimateComparisonModule />
            )}
          </ModuleCard>

          <ModuleCard title="Rainfall Generation" icon={<CloudRain size={20}/>} step={2}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Duration ({pluralize(genYears, 'Year', 'Years')})</label>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" 
                  value={genYears} 
                  onChange={(e) => setGenYears(parseInt(e.target.value))}
                />
              </div>
              <button 
                onClick={handleGenerateRainfall}
                disabled={isGenerating}
                className={`w-full text-white py-2 rounded-md transition-all flex items-center justify-center gap-2 font-medium ${viewMode === 'live' ? 'bg-[#010e5b]' : 'bg-slate-400'}`}
              >
                {isGenerating ? "Generating..." : <><Play size={16} /> Run Synthetic Loop</>}
              </button>
            </div>
          </ModuleCard>

          <ModuleCard title="Infrastructure & Demand" icon={<Droplets size={20}/>} step={3}>
            <div className="space-y-6">
              {/* Catchment Parameters */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                  <TrendingUp size={14} className="text-primary opacity-50" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catchment Area</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{pluralize(inflowConfig.numberOfClassrooms, 'Class', 'Classes')}</label>
                    <input type="number" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" value={inflowConfig.numberOfClassrooms} onChange={(e) => setInflowConfig({...inflowConfig, numberOfClassrooms: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Roof/m²</label>
                    <input type="number" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" value={inflowConfig.roofAreaPerClassroom} onChange={(e) => setInflowConfig({...inflowConfig, roofAreaPerClassroom: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Runoff Coeff.</label>
                    <input type="number" step="0.01" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" value={inflowConfig.runoffCoefficient} onChange={(e) => setInflowConfig({...inflowConfig, runoffCoefficient: parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Gutter Eff.</label>
                    <input type="number" step="0.01" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" value={inflowConfig.gutterEfficiency} onChange={(e) => setInflowConfig({...inflowConfig, gutterEfficiency: parseFloat(e.target.value)})} />
                  </div>
                </div>
              </div>

              {/* Demand Parameters */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                  <HandMetal size={14} className="text-secondary opacity-50" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Water Demand</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Wash {pluralize(demandConfig.handWashingAreas, 'Area', 'Areas')}</label>
                    <input 
                      type="number" 
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-medium" 
                      value={demandConfig.handWashingAreas} 
                      onChange={(e) => setDemandConfig({...demandConfig, handWashingAreas: parseInt(e.target.value) || 0})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{pluralize(demandConfig.faucetsPerArea, 'Faucet', 'Faucets')} / Area</label>
                    <input 
                      type="number" 
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-medium" 
                      value={demandConfig.faucetsPerArea} 
                      onChange={(e) => setDemandConfig({...demandConfig, faucetsPerArea: parseInt(e.target.value) || 0})} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">L / {pluralize(1, 'Faucet', 'Faucet')} / Day</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" 
                    value={demandConfig.litersPerFaucetDay} 
                    onChange={(e) => setDemandConfig({...demandConfig, litersPerFaucetDay: parseInt(e.target.value) || 0})} 
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Calculated Total</span>
                  <span className="text-sm font-black text-secondary">{formatNumber(totalDailyDemand)} L / Day</span>
                </div>
              </div>

              <button 
                onClick={handleRunAnalysis} 
                disabled={viewMode === 'report' || rainfallData.length === 0} 
                className="w-full bg-[#010e5b] text-white py-2.5 rounded-lg font-bold shadow-md hover:bg-blue-900 transition-colors disabled:bg-slate-300 flex items-center justify-center gap-2"
              >
                <Waves size={18} /> Run Water Balance
              </button>
            </div>
          </ModuleCard>

          {/* AI Insights Module in Sidebar */}
          <AIInsightsModule 
            inflowConfig={inflowConfig}
            wbConfig={{ ...demandConfig, totalDailyDemand }}
            monthlySummary={viewMode === 'report' ? (processedReportData?.monthly || []) : liveChartData}
            reliabilityData={viewMode === 'report' ? (processedReportData?.reliability || []) : simulationResults}
            selectedTankSize={selectedTankSize}
          />
        </div>

        {/* Results Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Rainfall Summary Section */}
          {rainfallData.length > 0 && <SynthesisSummary data={rainfallData} />}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">System Dynamic Visualization</h3>
              <div className="flex gap-2">
                <button 
                  onClick={togglePlayback}
                  disabled={rainfallData.length === 0}
                  className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 disabled:opacity-50 text-slate-600 transition-colors"
                  title={isPlaying ? "Pause Simulation" : "Play Simulation"}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button 
                  onClick={() => setCurrentDayIndex(prev => (prev + 30) % Math.max(1, rainfallData.length))}
                  disabled={rainfallData.length === 0}
                  className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 disabled:opacity-50 text-slate-600 transition-colors"
                  title="Forward 30 Days"
                >
                  <FastForward size={18} />
                </button>
              </div>
            </div>
            
            <RoofHarvestVisualizer 
              rainIntensity={currentDayData?.rain_mm || 0}
              roofArea={inflowConfig.roofAreaPerClassroom}
              efficiency={inflowConfig.runoffCoefficient * inflowConfig.gutterEfficiency}
              currentMonth={currentDayData ? MONTH_NAMES[currentDayData.month-1] : 'No Loop Active'}
              isSimulating={isPlaying}
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Simulation Day: <span className="text-slate-700">{formatNumber(currentDayIndex + 1)} / {formatNumber(rainfallData.length)} {pluralize(rainfallData.length, 'Day', 'Days')}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Year: <span className="text-slate-700">{formatNumber(currentDayData?.synthetic_year || 0)} {pluralize(currentDayData?.synthetic_year || 0, 'Year', 'Years')}</span>
              </div>
            </div>
          </div>

          {/* Tank Advisable Options */}
          {(simulationResults.length > 0 || (viewMode === 'report' && processedReportData?.reliability.length)) && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
               <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={18} className="text-primary" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Infrastructure Recommendations</h3>
              </div>
              <TankOptionCards 
                results={viewMode === 'report' ? (processedReportData?.reliability || []) : simulationResults}
                currentSelected={selectedTankSize}
                onSelect={setSelectedTankSize}
              />
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{viewMode === 'report' ? 'Static Report View' : 'Live Hydrograph'}</h3>
                <p className="text-xs text-slate-500">Visualizing climate patterns and harvesting performance.</p>
              </div>
              {currentReliability && (
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase">Current Reliability</div>
                  <div className="text-2xl font-black text-secondary">{formatNumber(currentReliability.reliability, 1)}%</div>
                </div>
              )}
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={viewMode === 'report' ? processedReportData?.monthly : liveChartData}>
                  <defs>
                    <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#010e5b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#010e5b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="avgInflow" name="Harvested (L)" stroke="#010e5b" fillOpacity={1} fill="url(#colorInflow)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {(simulationResults.length > 0 || (viewMode === 'report' && processedReportData?.reliability.length)) && (
              <div className="h-64 mt-10 pt-10 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Reliability Scan (Liters vs %)</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={viewMode === 'report' ? processedReportData?.reliability : simulationResults}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="tankSize" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis fontSize={9} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="reliability" stroke="#ca080b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-primary"><Droplets size={20}/></div>
               <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Ann. Harvest</div>
                  <div className="text-lg font-bold">{formatNumber((viewMode === 'report' ? (processedReportData?.monthly.reduce((a,b) => a + b.avgInflow, 0) || 0)/1000 : (liveChartData.reduce((a,b) => a + b.avgInflow, 0)/1000)), 1)} m³</div>
               </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-secondary"><AlertCircle size={20}/></div>
               <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Driest Month</div>
                  <div className="text-lg font-bold">{processedReportData?.driestMonth.month || liveChartData.reduce((p, c) => p.avgInflow < c.avgInflow ? p : c, {month: '...', avgInflow: Infinity}).month}</div>
               </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
               <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Adjust Capacity</div>
               <input type="range" min="1000" max="50000" step="1000" className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-primary" value={selectedTankSize} onChange={(e) => setSelectedTankSize(parseInt(e.target.value))} />
               <div className="text-[10px] text-primary font-bold text-right mt-1">{formatNumber(selectedTankSize/1000, 1)} kL</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
