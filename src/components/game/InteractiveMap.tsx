// InteractiveMap.tsx - Interaktivní mapa hry
import React, { useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import './InteractiveMap.css';

interface Province {
  id: string;
  name: string;
  x: number;
  y: number;
  population: number;
  resources: string[];
  color: string;
}

// Ukázková data provincií
const mockProvinces: Province[] = [
  { id: 'p1', name: 'Královské město', x: 200, y: 150, population: 15000, resources: ['Zlato', 'Kámen'], color: '#4a90e2' },
  { id: 'p2', name: 'Severní lesy', x: 150, y: 100, population: 8000, resources: ['Dřevo', 'Jídlo'], color: '#28a745' },
  { id: 'p3', name: 'Východní hory', x: 300, y: 120, population: 5000, resources: ['Železo', 'Kámen'], color: '#6c757d' },
  { id: 'p4', name: 'Jižní údolí', x: 180, y: 220, population: 12000, resources: ['Jídlo', 'Zlato'], color: '#ffc107' },
  { id: 'p5', name: 'Západní pláně', x: 100, y: 180, population: 9000, resources: ['Jídlo', 'Koně'], color: '#20c997' },
  { id: 'p6', name: 'Centrální tvrz', x: 220, y: 180, population: 18000, resources: ['Zlato', 'Železo'], color: '#dc3545' },
];

const InteractiveMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Store state
  const mapX = useGameStore((state) => state.mapX);
  const mapY = useGameStore((state) => state.mapY);
  const mapScale = useGameStore((state) => state.mapScale);
  const selectedProvince = useGameStore((state) => state.selectedProvince);
  
  // Store actions
  const setMapPosition = useGameStore((state) => state.setMapPosition);
  const setMapScale = useGameStore((state) => state.setMapScale);
  const setIsDragging = useGameStore((state) => state.setIsDragging);
  const setSelectedProvince = useGameStore((state) => state.setSelectedProvince);
  const openWindow = useGameStore((state) => state.openWindow);

  // Mouse handlers for map dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      isDraggingRef.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setIsDragging(true);
      
      if (mapRef.current) {
        mapRef.current.style.cursor = 'grabbing';
      }
    }
  }, [setIsDragging]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      
      setMapPosition(mapX + deltaX, mapY + deltaY);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [mapX, mapY, setMapPosition]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      
      if (mapRef.current) {
        mapRef.current.style.cursor = 'grab';
      }
    }
  }, [setIsDragging]);

  // Wheel handler for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setMapScale(mapScale + delta);
  }, [mapScale, setMapScale]);

  // Province click handler
  const handleProvinceClick = useCallback((province: Province, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isDraggingRef.current) {
      setSelectedProvince(province);
      
      // Otevřít okno s detaily provincie
      openWindow({
        type: 'province-detail',
        title: `${province.name}`,
        position: { x: 400, y: 100 },
        size: { width: 350, height: 280 }
      });
    }
  }, [setSelectedProvince, openWindow]);

  // Event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const mapStyle = {
    transform: `translate(${mapX}px, ${mapY}px) scale(${mapScale})`,
    transformOrigin: 'center center',
  };

  return (
    <div className="interactive-map">
      <div className="map-controls">
        <button 
          className="map-control-btn"
          onClick={() => setMapScale(mapScale + 0.2)}
          disabled={mapScale >= 3}
        >
          +
        </button>
        <span className="map-zoom-level">{Math.round(mapScale * 100)}%</span>
        <button 
          className="map-control-btn"
          onClick={() => setMapScale(mapScale - 0.2)}
          disabled={mapScale <= 0.5}
        >
          -
        </button>
        <button 
          className="map-control-btn map-control-center"
          onClick={() => {
            setMapPosition(0, 0);
            setMapScale(1);
          }}
        >
          🎯
        </button>
      </div>

      <div 
        ref={mapRef}
        className="map-container"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        style={{ cursor: 'grab' }}
      >
        <div className="map-content" style={mapStyle}>
          {/* Background terrain */}
          <div className="map-background">
            <div className="terrain-rivers"></div>
            <div className="terrain-mountains"></div>
            <div className="terrain-forests"></div>
          </div>

          {/* Provinces */}
          {mockProvinces.map((province) => (
            <div
              key={province.id}
              className={`province ${selectedProvince?.id === province.id ? 'province--selected' : ''}`}
              style={{
                left: province.x,
                top: province.y,
                backgroundColor: province.color,
              }}
              onClick={(e) => handleProvinceClick(province, e)}
              title={`${province.name} - ${province.population.toLocaleString()} obyvatel`}
            >
              <div className="province-name">{province.name}</div>
              <div className="province-population">{(province.population / 1000).toFixed(0)}k</div>
            </div>
          ))}

          {/* Grid for reference */}
          <div className="map-grid">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={`grid-v-${i}`} className="grid-line grid-line--vertical" style={{ left: i * 50 }} />
            ))}
            {Array.from({ length: 15 }, (_, i) => (
              <div key={`grid-h-${i}`} className="grid-line grid-line--horizontal" style={{ top: i * 50 }} />
            ))}
          </div>
        </div>
      </div>

      {selectedProvince && (
        <div className="province-info-panel">
          <h3>{selectedProvince.name}</h3>
          <p><strong>Obyvatelé:</strong> {selectedProvince.population.toLocaleString()}</p>
          <p><strong>Zdroje:</strong> {selectedProvince.resources.join(', ')}</p>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;