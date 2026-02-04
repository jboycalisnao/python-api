
import { GoogleGenAI } from "@google/genai";
import { BrainCircuit, CheckCircle2, Key, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { InflowConfig, MonthlySummary, ReliabilityResult, WaterBalanceConfig } from '../../types';

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
      setError(null);
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      // Re-initialize right before call to ensure latest key is used.
      // Using gemini-3-flash-preview for Tier 1 key compatibility.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        You are a Senior Environmental Engineer specializing in school rainwater harvesting (RWH). 
        Analyze the following simulation data and provide a concise, professional engineering report.
        
        CONTEXT:
        - Catchment: ${inflowConfig.numberOfClassrooms} classrooms, ${inflowConfig.roofAreaPerClassroom}m² roof each.
        - Students: ${wbConfig.studentCount} (Consumption: ${wbConfig.dailyDemandPerStudent}L/day).
        - Current Tank: ${selectedTankSize/1000}kL storage.
        
        DATA TRENDS:
        - Monthly Harvesting Potential (Liters):
        ${monthlySummary.map(m => `${m.month}: ${m.avgInflow.toFixed(0)}L`).join(', ')}
        
        - Reliability Samples (Tank Size -> Service Reliability %):
        ${reliabilityData.filter((_, i) => i % 5 === 0).map(r => `${r.tankSize}L -> ${r.reliability.toFixed(1)}%`).join(', ')}

        TASKS:
        1. Evaluate catchment sufficiency for the student population.
        2. Identify the most critical drought window based on the monthly data.
        3. Recommend an "Optimal Pivot Point" for tank sizing.
        4. Provide one maintenance tip specific to this climate pattern.

        FORMAT: Use professional Markdown with bold headers. Limit to 200-250 words.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
        setError("Model access error. Your API key might not have access to this specific model version.");
      } else if (err.message?.includes("API_KEY_INVALID")) {
        setError("Invalid API Key. Please ensure you are using a valid key from Google AI Studio.");
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
              <p className="text-[10px] text-slate-400 mt-1">Generating report using Tier 1 optimized model.</p>
            </div>
          </div>
        ) : error ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="bg-red-50 text-red-600 p-3 rounded-full mb-3">
              <BrainCircuit size={24} />
            </div>
            <p className="text-xs font-bold text-slate-700 mb-2">{error}</p>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={generateInsights}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
              >
                Retry
              </button>
              <button 
                onClick={handleOpenKeySelector}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline flex items-center gap-1"
              >
                <Key size={12} />
                Select Project
              </button>
            </div>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[9px] text-slate-400 mt-4 underline"
            >
              Learn about model availability
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
                const isHeader = line.startsWith('#') || (line.startsWith('**') && (line.endsWith('**') || line.includes(':')));
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
                  <CheckCircle2 size={10} /> Tier 1 Active
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <Lightbulb size={10} /> Fast Synthesis
                </div>
              </div>
              <span className="text-[9px] text-slate-300 italic">Gemini 3 Flash</span>
            </div>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
            <BrainCircuit size={32} className="opacity-20 mb-3" />
            <p className="text-xs font-medium px-8 text-center">
              Run the Water Balance analysis first, then trigger the AI Synthesis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsModule;
