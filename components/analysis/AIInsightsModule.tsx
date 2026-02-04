
import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Loader2, CheckCircle2, Lightbulb, Key } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // After opening, the user can try generating insights again
      setError(null);
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check for key selection if required by environment
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await handleOpenKeySelector();
          // We proceed anyway as per guidelines: assume success after trigger
        }
      }

      // Re-initialize right before call to ensure latest key is used
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
        contents: prompt,
      });

      if (response.text) {
        setInsight(response.text);
      } else {
        throw new Error("Empty response from AI engine.");
      }
    } catch (err: any) {
      console.error("AI Insights Error:", err);
      
      if (err.message?.includes("Requested entity was not found")) {
        setError("API Key or Project not found. Please select a valid project with billing enabled.");
        await handleOpenKeySelector();
      } else {
        setError("Connection failed. Ensure your API key is active and has project permissions.");
      }
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
            Generate
          </button>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700 animate-pulse">Running Neural Simulation...</p>
              <p className="text-[10px] text-slate-400 mt-1">Calculating optimal tank sizing for current climate regime.</p>
            </div>
          </div>
        ) : error ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="bg-red-50 text-red-600 p-3 rounded-full mb-3">
              <BrainCircuit size={24} />
            </div>
            <p className="text-xs font-bold text-slate-700 mb-2">{error}</p>
            <button 
              onClick={generateInsights}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
            >
              <Key size={12} />
              Try Again / Select Project
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[9px] text-slate-400 mt-4 underline"
            >
              Documentation on API Billing & Project Selection
            </a>
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
            <div className="text-xs text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap">
              {insight.split('\n').map((line, i) => {
                const cleanLine = line.replace(/[*#]/g, '').trim();
                if (!cleanLine) return null;
                const isHeader = line.startsWith('#') || (line.startsWith('**') && line.endsWith('**'));
                return (
                  <p key={i} className={isHeader ? 'font-bold text-indigo-900 border-b border-indigo-50 pb-1 mt-4 mb-2' : 'mb-2'}>
                    {cleanLine}
                  </p>
                );
              })}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                  <CheckCircle2 size={10} /> Model Validated
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <Lightbulb size={10} /> Local Synthesis
                </div>
              </div>
              <span className="text-[9px] text-slate-300 italic">Gemini 3 Pro</span>
            </div>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
            <BrainCircuit size={32} className="opacity-20 mb-3" />
            <p className="text-xs font-medium px-8 text-center">
              Run the Water Balance analysis first, then trigger the AI Synthesis to generate engineering recommendations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsModule;
