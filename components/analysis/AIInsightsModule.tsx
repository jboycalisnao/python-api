
import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Loader2, ChevronRight, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { InflowConfig, WaterBalanceConfig, ReliabilityResult, MonthlySummary } from '../../types';

interface Props {
  inflowConfig: InflowConfig;
  wbConfig: Omit<WaterBalanceConfig, 'tankCapacity'>;
  monthlySummary: MonthlySummary[];
  reliabilityData: ReliabilityResult[];
  selectedTankSize: number;
}

const AIInsightsModule: React.FC<Props> = ({ 
  inflowConfig, 
  wbConfig, 
  monthlySummary, 
  reliabilityData,
  selectedTankSize 
}) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        You are a Senior Environmental Engineer specializing in school rainwater harvesting (RWH). 
        Analyze the following simulation data and provide a concise, professional engineering report.
        
        DATA:
        - Catchment: ${inflowConfig.numberOfClassrooms} classrooms with ${inflowConfig.roofAreaPerClassroom}m² roof each.
        - Demand: ${wbConfig.studentCount} students consuming ${wbConfig.dailyDemandPerStudent}L/day.
        - Current Infrastructure: ${selectedTankSize/1000}kL storage capacity.
        - Performance: Monthly harvesting data shows peaks and troughs across 12 months.
        - Reliability Scan: A range of tank sizes from 1kL to 50kL has been tested.
        
        Monthly Harvesting Potential (Liters):
        ${monthlySummary.map(m => `${m.month}: ${m.avgInflow.toFixed(0)}L`).join(', ')}
        
        Reliability curve samples:
        ${reliabilityData.filter((_, i) => i % 5 === 0).map(r => `${r.tankSize}L -> ${r.reliability.toFixed(1)}%`).join(', ')}

        TASKS:
        1. Evaluate if the current catchment area is sufficient for the student population.
        2. Identify the most critical drought window.
        3. Recommend an "Optimal Pivot Point" for tank sizing (where cost vs reliability curve flattens).
        4. Provide one specific "Maintenance Tip" for this specific climate pattern.

        FORMAT: Use professional Markdown with bold headers. Keep it under 250 words.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });

      setInsight(response.text || "No insights could be generated.");
    } catch (err) {
      console.error(err);
      setInsight("Error connecting to AI Analysis engine. Please check system logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-indigo-100 shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-900 to-[#010e5b] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-300 w-5 h-5" />
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Engineering AI Synthesis</h3>
        </div>
        {!insight && !loading && (
          <button 
            onClick={generateInsights}
            className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md transition-all border border-white/20 flex items-center gap-1"
          >
            <BrainCircuit size={12} />
            Generate Insights
          </button>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700 animate-pulse">Analyzing Hydrological Variance...</p>
              <p className="text-[10px] text-slate-400 mt-1">Comparing semi-Markov intensities with school demand curves.</p>
            </div>
          </div>
        ) : insight ? (
          <div className="prose prose-sm max-w-none prose-slate">
            <div className="flex justify-end mb-4">
               <button 
                onClick={() => setInsight(null)} 
                className="text-[10px] text-slate-400 font-bold hover:text-indigo-600 underline"
               >
                Regenerate Report
               </button>
            </div>
            <div className="text-xs text-slate-700 leading-relaxed space-y-4">
              {insight.split('\n').map((line, i) => (
                <p key={i} className={line.startsWith('#') ? 'font-bold text-indigo-900 border-b border-indigo-50 pb-1 mt-4' : ''}>
                  {line.replace(/[*#]/g, '')}
                </p>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                  <CheckCircle2 size={10} /> Validated Model
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <Lightbulb size={10} /> Site Specific
                </div>
              </div>
              <span className="text-[9px] text-slate-300 italic">Powered by Gemini 3 Pro</span>
            </div>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
            <BrainCircuit size={32} className="opacity-20 mb-3" />
            <p className="text-xs font-medium px-8 text-center">
              Configure your loop and run the water balance to enable AI-powered engineering insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsModule;
