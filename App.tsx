import React, { useState, useCallback } from 'react';
import MapComponent from './components/MapComponent';
import ControlPanel from './components/ControlPanel';
import AnalysisPanel from './components/AnalysisPanel';
import { STATIONS } from './constants';
import { MRTStation } from './types';

function App() {
  // Store 3 distinct time thresholds (default: 5, 10, 15 minutes)
  const [timeThresholds, setTimeThresholds] = useState<number[]>([2, 5, 8]);
  const [selectedStations, setSelectedStations] = useState<MRTStation[]>([STATIONS[0]]);
  const [isLocating, setIsLocating] = useState(false);

  const handleTimeChange = useCallback((index: number, value: number) => {
    setTimeThresholds(prev => {
      const newThresholds = [...prev];
      newThresholds[index] = value;
      return newThresholds;
    });
  }, []);

  const toggleStation = useCallback((station: MRTStation) => {
    setSelectedStations(prev => {
      const exists = prev.some(s => s.id === station.id);
      if (exists) {
        return prev.filter(s => s.id !== station.id);
      } else {
        return [...prev, station];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedStations(STATIONS);
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedStations([]);
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      alert("您的瀏覽器不支援地理定位功能");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        let minDistance = Infinity;
        let nearestStation: MRTStation | null = null;

        STATIONS.forEach(station => {
          const dist = calculateDistance(
            latitude,
            longitude,
            station.coords.lat,
            station.coords.lng
          );
          if (dist < minDistance) {
            minDistance = dist;
            nearestStation = station;
          }
        });

        if (nearestStation) {
          setSelectedStations([nearestStation]);
        }
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("無法獲取您的位置，請確認是否允許存取位置資訊。");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapComponent 
          stations={STATIONS}
          selectedStations={selectedStations}
          onStationToggle={toggleStation}
          timeThresholds={timeThresholds}
        />
      </div>

      {/* Floating UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col md:flex-row p-4 md:p-6 gap-4">
        {/* Sidebar */}
        <div className="flex flex-col gap-4 max-h-full overflow-hidden w-full md:w-auto">
          <ControlPanel 
            timeThresholds={timeThresholds}
            onTimeChange={handleTimeChange}
            selectedStations={selectedStations}
            onToggleStation={toggleStation}
            onFindNearest={handleFindNearest}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
            isLocating={isLocating}
          />
          
          <AnalysisPanel 
            stations={selectedStations}
            timeThresholds={timeThresholds}
          />
        </div>
      </div>
    </div>
  );
}

export default App;