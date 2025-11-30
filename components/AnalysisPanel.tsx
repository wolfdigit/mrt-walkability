import React, { useState, useEffect } from 'react';
import { MRTStation } from '../types';
import { analyzeWalkableArea } from '../services/geminiService';

interface AnalysisPanelProps {
  stations: MRTStation[];
  timeThresholds: number[];
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ stations, timeThresholds }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ summary: string; places: string[] } | null>(null);

  useEffect(() => {
    setData(null);
  }, [stations.length, stations.map(s => s.id).join(',')]);

  const handleAnalyze = async () => {
    // Use the maximum configured time to give AI the broadest context
    const maxMinutes = Math.max(...timeThresholds);
    
    setLoading(true);
    const result = await analyzeWalkableArea(stations, maxMinutes);
    setData(result);
    setLoading(false);
  };

  if (stations.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-md shadow-lg rounded-2xl p-6 w-full md:w-96 border border-slate-100 pointer-events-auto mt-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <span className="text-xl">✨</span> AI 區域分析
        </h2>
        {!data && !loading && (
          <button
            onClick={handleAnalyze}
            className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            開始分析 ({stations.length})
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-xs text-indigo-500 font-medium animate-pulse">
            Gemini 正在探索周邊環境...
          </p>
        </div>
      )}

      {data && (
        <div className="space-y-4">
           <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
             <h3 className="text-xs font-bold text-indigo-800 mb-1">
               {stations.map(s => s.name).join('、')}
             </h3>
             <p className="text-sm text-slate-700 leading-relaxed text-justify">
               {data.summary}
             </p>
           </div>

           <div>
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">推薦探索</h3>
             <ul className="space-y-2">
               {data.places.map((place, index) => (
                 <li key={index} className="flex items-start gap-2 text-sm text-slate-600 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                   <span className="text-indigo-500 mt-0.5">📍</span>
                   <span>{place}</span>
                 </li>
               ))}
             </ul>
           </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;