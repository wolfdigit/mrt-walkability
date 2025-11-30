import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import { MRTStation } from '../types';

interface MapComponentProps {
  stations: MRTStation[];
  selectedStations: MRTStation[];
  onStationToggle: (station: MRTStation) => void;
  timeThresholds: number[]; // Array of 3 minutes values
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  stations, 
  selectedStations, 
  onStationToggle, 
  timeThresholds 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.CircleMarker }>({});
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Helper to validate coordinates strictly
  const isValidCoordinate = (lat: any, lng: any): boolean => {
    return (
      typeof lat === 'number' && 
      !isNaN(lat) && 
      typeof lng === 'number' && 
      !isNaN(lng)
    );
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [25.0478, 121.5170], // Default center Taipei
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    layersGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    stations.forEach(station => {
      if (!station.coords || !isValidCoordinate(station.coords.lat, station.coords.lng)) {
        return;
      }

      if (!markersRef.current[station.id]) {
        try {
          const marker = L.circleMarker([station.coords.lat, station.coords.lng], {
            radius: 6,
            fillColor: station.color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(map);

          marker.bindTooltip(`
            <div class="font-bold text-sm">${station.name}</div>
          `, {
            permanent: false, 
            direction: 'top',
            offset: [0, -5]
          });

          marker.on('click', () => {
            onStationToggle(station);
          });

          markersRef.current[station.id] = marker;
        } catch (e) {
          console.warn(`Failed to create marker for station ${station.name}`, e);
        }
      }
    });
  }, [stations, onStationToggle]);

  // Handle Selection Visuals & Union Polygons
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;
    
    // 1. Update Marker Styles
    const selectedIds = new Set(selectedStations.map(s => s.id));
    Object.keys(markersRef.current).forEach((id) => {
      const marker = markersRef.current[id];
      if (selectedIds.has(id)) {
        marker.setRadius(9);
        marker.setStyle({ weight: 4, color: '#4f46e5' });
        marker.bringToFront();
      } else {
        marker.setRadius(6);
        marker.setStyle({ weight: 2, color: '#fff' });
        marker.closeTooltip();
      }
    });

    // 2. Calculate and Draw Concentric Union Polygons
    layersGroupRef.current.clearLayers();

    const validSelectedStations = selectedStations.filter(
      s => s.coords && isValidCoordinate(s.coords.lat, s.coords.lng)
    );

    if (validSelectedStations.length > 0) {
      // Sort times descending: Largest radius first (bottom layer), Smallest last (top layer)
      const sortedTimes = [...timeThresholds]
        .filter(t => !isNaN(t) && t > 0)
        .sort((a, b) => b - a);

      // Define visual styles mapped by SORTED order
      const styles = [
        { 
          // Largest area
          color: '#818cf8', weight: 1, dashArray: '4, 4', 
          fillColor: '#6366f1', fillOpacity: 0.15 
        },
        { 
          // Medium area
          color: 'transparent', weight: 0, 
          fillColor: '#4f46e5', fillOpacity: 0.20 
        },
        { 
          // Smallest area (Core)
          color: 'transparent', weight: 0, 
          fillColor: '#312e81', fillOpacity: 0.25 
        }
      ];

      // Loop through sorted times to draw layers
      sortedTimes.forEach((minutes, index) => {
        try {
          const styleIndex = Math.min(index, styles.length - 1);
          const style = styles[styleIndex];
          const radiusKm = Math.max(0.1, (minutes * 80) / 1000); 

          const circles = validSelectedStations.map(station => {
            return turf.circle(
              [station.coords.lng, station.coords.lat], 
              radiusKm, 
              { steps: 64, units: 'kilometers' }
            );
          });

          if (circles.length > 0) {
            // Start with the first circle
            let unionPoly: any = circles[0];

            if (circles.length > 1) {
              try {
                // Fix for Turf v6.5.0: union accepts exactly 2 arguments (poly1, poly2)
                // We must iterate through the array and union them one by one.
                for (let i = 1; i < circles.length; i++) {
                   const result = turf.union(unionPoly, circles[i]);
                   if (result) unionPoly = result;
                }
              } catch (err) {
                console.error("Turf union failed", err);
              }
            }

            if (unionPoly) {
              L.geoJSON(unionPoly, {
                style: style,
                interactive: false
              }).addTo(layersGroupRef.current!);
            }
          }
        } catch (e) {
          console.error("Error generating polygon layer:", e);
        }
      });
    }
  }, [selectedStations, timeThresholds]); 

  // Handle Map View Adjustment
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const validSelectedStations = selectedStations.filter(
      s => s.coords && isValidCoordinate(s.coords.lat, s.coords.lng)
    );

    try {
      if (validSelectedStations.length === 1) {
        const s = validSelectedStations[0];
        map.flyTo([s.coords.lat, s.coords.lng], 14, { duration: 1.2 });
      } else if (validSelectedStations.length > 1) {
        const markers: L.Layer[] = [];
        validSelectedStations.forEach(s => {
          const marker = markersRef.current[s.id];
          if (marker) {
            markers.push(marker);
          }
        });
        
        if (markers.length > 0) {
          const group = new L.FeatureGroup(markers);
          const bounds = group.getBounds();
          if (bounds.isValid()) {
             map.fitBounds(bounds.pad(0.3));
          }
        }
      }
    } catch (e) {
      console.warn("Error adjusting map view", e);
    }
  }, [selectedStations]); 

  return <div ref={mapContainerRef} className="w-full h-full z-0" />;
};

export default MapComponent;