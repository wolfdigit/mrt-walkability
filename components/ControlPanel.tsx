import React, { useState, useMemo } from 'react';
import { MRTStation } from '../types';
import { STATIONS } from '../constants';

interface ControlPanelProps {
  timeThresholds: number[];
  onTimeChange: (index: number, val: number) => void;
  selectedStations: MRTStation[];
  onToggleStation: (s: MRTStation) => void;
  onFindNearest: () => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  isLocating: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  timeThresholds,
  onTimeChange,
  selectedStations,
  onToggleStation,
  onFindNearest,
  onSelectAll,
  onClearAll,
  isLocating
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStations = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return STATIONS.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.line.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const isSelected = (id: string) => selectedStations.some(s => s.id === id);
  const isAllSelected = selectedStations.length === STATIONS.length;

  // Colors matching the map layers for UI indicators
  // We display them in the order of the inputs, but map logic sorts by value.
  // To keep it intuitive, we can just show generic colors or try to match the logic.
  // Simple approach: Input 1 = Dark, Input 2 = Medium, Input 3 = Light intent
  const layerColors = ['#312e81', '#4f46e5', '#818cf8'];
  const layerLabels = ['核心圈 (深)', '舒適圈 (中)', '極限圈 (淺)'];

  return (
    <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-6 w-full md:w-96 flex flex-col gap-5 border border-slate-100 max-h-[80vh] pointer-events-auto flex-shrink-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          北捷步行圈
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          自訂三個步行時間，探索不同範圍的生活圈
        </p>
      </div>

      {/* Time Sliders */}
      <div className="space-y-4">
        {timeThresholds.map((time, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: layerColors[index] }}
                ></span>
                {layerLabels[index]}
              </label>
              <span className="text-sm font-bold text-slate-700">{time} <span className="text-xs font-normal text-slate-400">分</span></span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={time}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) onTimeChange(index, val);
              }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 transition-all"
            />
          </div>
        ))}
      </div>

      {/* Station Selection */}
      <div className="flex-1 min-h-[200px] flex flex-col gap-3 overflow-hidden">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-slate-700">
            選擇站點 <span className="text-xs text-slate-400 font-normal">(可複選)</span>
          </label>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={isAllSelected ? onClearAll : onSelectAll}
              className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              {isAllSelected ? '取消全選' : '全選'}
            </button>
            <div className="h-3 w-px bg-slate-300"></div>
            <button 
              onClick={onFindNearest}
              disabled={isLocating}
              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 transition-colors"
            >
              {isLocating ? (
                <span className="animate-pulse">定位中...</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                  </svg>
                  最近站點
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="搜尋站名或編號 (例: Y12)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 absolute left-3 top-2.5">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        </div>

        <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50 p-2 space-y-1 custom-scrollbar">
          {filteredStations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              沒有找到符合的站點
            </div>
          ) : (
            filteredStations.map((station) => {
              const active = isSelected(station.id);
              return (
                <button
                  key={station.id}
                  onClick={() => onToggleStation(station)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 group
                    ${active 
                      ? 'bg-white shadow-md ring-1 ring-slate-200' 
                      : 'hover:bg-slate-200/50 text-slate-600'
                    }
                  `}
                >
                  <div className="relative">
                    <span 
                      className={`w-3 h-3 rounded-full flex-shrink-0 block transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} 
                      style={{ backgroundColor: station.color }}
                    />
                    {active && (
                       <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></span>
                    )}
                  </div>
                  
                  <div className={`flex-1 flex flex-col overflow-hidden ${active ? 'font-semibold text-slate-800' : ''}`}>
                    <div className="flex items-baseline gap-2 truncate">
                      <span className="text-xs font-mono text-slate-400">{station.id}</span>
                      <span className="truncate">{station.name}</span>
                    </div>
                  </div>
                  
                  {active && (
                    <span className="text-blue-500 text-xs animate-fade-in flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;