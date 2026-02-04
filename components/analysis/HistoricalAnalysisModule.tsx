
import React, { useState } from 'react';
import { FileUp, Database, CheckCircle2, TrendingUp, Info, Wind } from 'lucide-react';
import { TransitionAnalyzer } from '../../services/analysis/TransitionAnalyzer';
import { IntensityAnalyzer } from '../../services/analysis/IntensityAnalyzer';
import { HistoricalRecord, MonthlyParameters } from '../../types';
import { MONTH_NAMES } from '../../constants';

interface Props {
  onParametersExtracted: (params: MonthlyParameters[]) => void;
}

const HistoricalAnalysisModule: React.FC<Props> = ({ onParametersExtracted }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedParams, setExtractedParams] = useState<MonthlyParameters[] | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        
        // Assume CSV: Date, Rain_mm
        const data: HistoricalRecord[] = lines.slice(1).map(line => {
          const [date, rain] = line.split(',');
          return { date: date.trim(), rain_mm: parseFloat(rain) || 0 };
        });

        const transitions = TransitionAnalyzer.analyze(data);
        const intensities = IntensityAnalyzer.analyze(data);

        // Merge results
        const merged: MonthlyParameters[] = transitions.map(t => {
          const intensity = intensities.find(i => i.month === t.month);
          return {
            ...t,
            ...intensity
          } as MonthlyParameters;
        });

        setExtractedParams(merged);
        onParametersExtracted(merged);
        setIsAnalyzing(false);
      } catch (err) {
        alert("Failed to analyze data. Ensure CSV is in 'Date,Rain' format.");
        setIsAnalyzing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <Database className="text-primary w-5 h-5" />
        <h3 className="font-bold text-slate-800 text-sm">Historical Pattern Extraction</h3>
      </div>

      {!extractedParams ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-300 rounded-lg bg-white">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isAnalyzing} />
            <FileUp className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <span className="text-xs font-medium text-slate-600">
              {isAnalyzing ? "Analyzing Weather DNA..." : "Upload Daily CSV (Date, Rain)"}
            </span>
          </label>
          <p className="text-[10px] text-slate-400 mt-2 px-4">Upload historical daily records to calibrate the Semi-Markov generator.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-green-600 bg-green-50 p-2 rounded border border-green-100">
            <div className="flex items-center gap-1 font-bold">
              <CheckCircle2 size={14} /> Pattern Calibrated
            </div>
            <button onClick={() => setExtractedParams(null)} className="text-[10px] underline">Reset</button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {extractedParams.map((p, idx) => (
              <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-[10px]">
                <div className="font-bold text-slate-700 border-b border-slate-100 mb-1 flex justify-between">
                  <span>{MONTH_NAMES[p.month-1]}</span>
                  <Wind size={10} className="text-slate-300" />
                </div>
                <div className="flex justify-between"><span>Dry Spell:</span> <span className="font-mono">{p.avgDrySpell}d</span></div>
                <div className="flex justify-between"><span>Wet Spell:</span> <span className="font-mono">{p.avgWetSpell}d</span></div>
                <div className="flex justify-between text-primary font-bold"><span>Intensity:</span> <span className="font-mono">{p.meanRain}mm</span></div>
                {p.gamma_k && <div className="text-[8px] text-slate-400">Gamma k={p.gamma_k}</div>}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-2 rounded text-[9px] text-blue-700 flex gap-2">
            <Info size={14} className="shrink-0" />
            <span>Calibrated using spell-length statistics for Semi-Markov synthesis.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalAnalysisModule;
