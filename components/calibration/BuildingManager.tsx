
import React from 'react';
import { Building2, Plus, Trash2, Layout, Maximize } from 'lucide-react';
import { Building, InflowConfig } from '../../types';

interface Props {
  config: InflowConfig;
  onChange: (newConfig: InflowConfig) => void;
}

const BuildingManager: React.FC<Props> = ({ config, onChange }) => {
  const handleAddBuilding = () => {
    const newId = (config.buildings.length + 1).toString();
    onChange({
      ...config,
      buildings: [
        ...config.buildings,
        { 
          id: newId, 
          name: `Building ${newId}`, 
          numberOfClassrooms: 1, 
          roofAreaPerClassroom: 63 
        }
      ]
    });
  };

  const handleUpdateBuilding = (id: string, updates: Partial<Building>) => {
    onChange({
      ...config,
      buildings: config.buildings.map(b => b.id === id ? { ...b, ...updates } : b)
    });
  };

  const handleRemoveBuilding = (id: string) => {
    if (config.buildings.length <= 1) return;
    onChange({
      ...config,
      buildings: config.buildings.filter(b => b.id !== id)
    });
  };

  const formatNumber = (val: number, decimals: number = 0) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-primary" />
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Catchment Infrastructure</h4>
        </div>
        <button 
          onClick={handleAddBuilding}
          className="flex items-center gap-1 text-[10px] font-black text-white bg-primary hover:bg-blue-900 px-3 py-1.5 rounded-md transition-all shadow-sm"
        >
          <Plus size={12} /> Add Building
        </button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {config.buildings.map((building) => (
          <div 
            key={building.id} 
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-primary/30 transition-colors relative group"
          >
            <button 
              onClick={() => handleRemoveBuilding(building.id)}
              className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
              title="Remove Building"
            >
              <Trash2 size={14} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Layout size={14} className="text-slate-400" />
              <input 
                type="text" 
                value={building.name} 
                onChange={(e) => handleUpdateBuilding(building.id, { name: e.target.value })}
                className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:ring-0 focus:outline-none"
                placeholder="Building Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase">Classrooms</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="1"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
                    value={building.numberOfClassrooms} 
                    onChange={(e) => handleUpdateBuilding(building.id, { numberOfClassrooms: parseInt(e.target.value) || 0 })} 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase">Area / Room (m²)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="1"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
                    value={building.roofAreaPerClassroom} 
                    onChange={(e) => handleUpdateBuilding(building.id, { roofAreaPerClassroom: parseInt(e.target.value) || 0 })} 
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Maximize size={10} />
                <span>Building Footprint</span>
              </div>
              <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded">
                {formatNumber(building.numberOfClassrooms * building.roofAreaPerClassroom)} m²
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuildingManager;
