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
  type: 'city' | 'village' | 'fortress' | 'port';
}

// Rozšířená data s více provinciemi a lepším rozmístěním
const mockProvinces: Province[] = [
  { id: 'p1', name: 'Královské město', x: 400, y: 200, population: 25000, resources: ['Zlato', 'Kámen'], color: '#4a90e2', type: 'city' },
  { id: 'p2', name: 'Severní lesy', x: 250, y: 120, population: 8000, resources: ['Dřevo', 'Jídlo'], color: '#28a745', type: 'village' },
  { id: 'p3', name: 'Východní hory', x: 600, y: 180, population: 5000, resources: ['Železo', 'Kámen'], color: '#6c757d', type: 'fortress' },
  { id: 'p4', name: 'Jižní údolí', x: 350, y: 350, population: 12000, resources: ['Jídlo', 'Zlato'], color: '#ffc107', type: 'village' },
  { id: 'p5', name: 'Západní pláně', x: 150, y: 280, population: 9000, resources: ['Jídlo', 'Koně'], color: '#20c997', type: 'village' },
  { id: 'p6', name: 'Centrální tvrz', x: 420, y: 280, population: 18000, resources: ['Zlato', 'Železo'], color: '#dc3545', type: 'fortress' },
  { id: 'p7', name: 'Přístav Modrý', x: 700, y: 320, population: 15000, resources: ['Ryby', 'Korály'], color: '#17a2b8', type: 'port' },
  { id: 'p8', name: 'Horská vesnice', x: 550, y: 100, population: 3000, resources: ['Kámen', 'Dřevo'], color: '#6f42c1', type: 'village' },
  { id: 'p9', name: 'Obchodní město', x: 300, y: 200, population: 20000, resources: ['Zlato', 'Hedvábí'], color: '#fd7e14', type: 'city' },
  { id: 'p10', name: 'Lesní věž', x: 180, y: 150, population: 2000, resources: ['Dřevo', 'Bylinky'], color: '#198754', type: 'fortress' },
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

  const getProvinceIcon = (type: string) => {
    switch (type) {
      case 'city': return '🏛️';
      case 'village': return '🏘️';
      case 'fortress': return '🏰';
      case 'port': return '⚓';
      default: return '🏘️';
    }
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
          {/* Enhanced Background with more visible terrain */}
          <div className="map-background">
            {/* Main continent shape */}
            <div className="continent-base"></div>
            
            {/* Rivers and waterways */}
            <div className="river river-main"></div>
            <div className="river river-north"></div>
            <div className="river river-south"></div>
            
            {/* Mountain ranges */}
            <div className="mountain-range mountain-range-east"></div>
            <div className="mountain-range mountain-range-north"></div>
            
            {/* Forest areas */}
            <div className="forest-area forest-north"></div>
            <div className="forest-area forest-west"></div>
            
            {/* Desert area */}
            <div className="desert-area"></div>
            
            {/* Coastal waters */}
            <div className="coastal-water coastal-east"></div>
            <div className="coastal-water coastal-south"></div>
          </div>

          {/* Roads connecting major cities */}
          <div className="road-network">
            <div className="road road-main-east"></div>
            <div className="road road-main-west"></div>
            <div className="road road-north-south"></div>
            <div className="road road-coastal"></div>
          </div>

          {/* Provinces with enhanced styling */}
          {mockProvinces.map((province) => (
            <div
              key={province.id}
              className={`province province--${province.type} ${selectedProvince?.id === province.id ? 'province--selected' : ''}`}
              style={{
                left: province.x,
                top: province.y,
                backgroundColor: province.color,
              }}
              onClick={(e) => handleProvinceClick(province, e)}
              title={`${province.name} - ${province.population.toLocaleString()} obyvatel`}
            >
              <div className="province-icon">{getProvinceIcon(province.type)}</div>
              <div className="province-name">{province.name}</div>
              <div className="province-population">{(province.population / 1000).toFixed(0)}k</div>
            </div>
          ))}

          {/* Decorative elements */}
          <div className="map-decorations">
            {/* Compass rose */}
            <div className="compass-rose">
              <div className="compass-pointer compass-north">N</div>
              <div className="compass-pointer compass-east">E</div>
              <div className="compass-pointer compass-south">S</div>
              <div className="compass-pointer compass-west">W</div>
            </div>
            
            {/* Scale indicator */}
            <div className="scale-indicator">
              <div className="scale-line"></div>
              <span className="scale-text">100 km</span>
            </div>
          </div>

          {/* Subtle grid for reference */}
          <div className="map-grid">
            {Array.from({ length: 30 }, (_, i) => (
              <div key={`grid-v-${i}`} className="grid-line grid-line--vertical" style={{ left: i * 40 }} />
            ))}
            {Array.from({ length: 20 }, (_, i) => (
              <div key={`grid-h-${i}`} className="grid-line grid-line--horizontal" style={{ top: i * 40 }} />
            ))}
          </div>
        </div>
      </div>

      {selectedProvince && (
        <div className="province-info-panel">
          <div className="province-info-header">
            <span className="province-type-icon">{getProvinceIcon(selectedProvince.type)}</span>
            <h3>{selectedProvince.name}</h3>
          </div>
          <div className="province-info-content">
            <p><strong>Typ:</strong> {selectedProvince.type === 'city' ? 'Město' : selectedProvince.type === 'village' ? 'Vesnice' : selectedProvince.type === 'fortress' ? 'Pevnost' : 'Přístav'}</p>
            <p><strong>Obyvatelé:</strong> {selectedProvince.population.toLocaleString()}</p>
            <p><strong>Zdroje:</strong> {selectedProvince.resources.join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;