// src/components/interactive/InteractiveMap.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Province } from '../../types/game-types';
import './styles/InteractiveMap.css';

// ============================================================
// KONSTANTY PRO MAPU
// ============================================================

const CELL_SIZE = 40;
const PROVINCE_SIZE = 35;
const GRID_SIZE = 30;

const unitTypes = ['OFF', 'DEFF', 'SIEGE', 'SPEC'] as const;
const unitIcons = ['⚔️', '🛡️', '🏰', '🎯'];
const unitNames = ['Útočné jednotky', 'Obranné jednotky', 'Obléhací stroje', 'Speciální jednotky'];

// ============================================================
// INTERACTIVE MAP COMPONENT
// ============================================================

const InteractiveMap: React.FC = () => {
  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);

  // Game Store
  const {
    mapPosition,
    mapZoom,
    currentUnitType,
    selectedProvince,
    gameData,
    playerData,
    setMapPosition,
    setMapZoom,
    setCurrentUnitType,
    setSelectedProvince,
    openWindow
  } = useGameStore();

  // Drag state
  const [isDragging, setIsDragging] = React.useState(false);
  const [wasDraggingInThisSession, setWasDraggingInThisSession] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  // ============================================================
  // MAP CONTROL HANDLERS
  // ============================================================

  const handleZoomIn = useCallback(() => {
    setMapZoom(Math.min(mapZoom + 0.2, 3));
  }, [mapZoom, setMapZoom]);

  const handleZoomOut = useCallback(() => {
    setMapZoom(Math.max(mapZoom - 0.2, 0.5));
  }, [mapZoom, setMapZoom]);

  const handleCenterMap = useCallback(() => {
    const gridCenterX = (GRID_SIZE * CELL_SIZE) / 2;
    const gridCenterY = (GRID_SIZE * CELL_SIZE) / 2;
    const containerCenterX = mapContainerRef.current ? mapContainerRef.current.offsetWidth / 2 : 400;
    const containerCenterY = mapContainerRef.current ? mapContainerRef.current.offsetHeight / 2 : 250;
    
    const newPosition = {
      x: containerCenterX - gridCenterX,
      y: containerCenterY - gridCenterY
    };
    
    setMapPosition(newPosition);
  }, [setMapPosition]);

  const switchUnitType = useCallback(() => {
    setCurrentUnitType((currentUnitType + 1) % unitTypes.length);
  }, [currentUnitType, setCurrentUnitType]);

  // ============================================================
  // DRAG AND DROP HANDLERS
  // ============================================================

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setWasDraggingInThisSession(false);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = (e.clientX - dragStart.x) * 2.0;
      const deltaY = (e.clientY - dragStart.y) * 2.0;
      
      const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (dragDistance > 5) {
        setWasDraggingInThisSession(true);
      }
      
      const newPosition = {
        x: mapPosition.x + deltaX,
        y: mapPosition.y + deltaY
      };
      
      setMapPosition(newPosition);
    }
  }, [isDragging, dragStart, mapPosition, setMapPosition]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setTimeout(() => {
        setWasDraggingInThisSession(false);
      }, 50);
    }
  }, [isDragging]);

  // ============================================================
  // PROVINCE INTERACTION
  // ============================================================

  const handleProvinceClick = useCallback((e: React.MouseEvent, provinceName: string, provinceType: string) => {
    if (!isDragging && !wasDraggingInThisSession) {
      e.stopPropagation();
      
      // Vytvoř mock provincii pro demonstraci
      const mockProvince: Province = {
        id: `province-${provinceName}`,
        name: provinceName,
        ownerId: provinceType === 'own' ? 'player-1' : 'other',
        color: provinceType === 'own' ? '#4a90e2' : '#666',
        centerPosition: { x: 100, y: 100 },
        tileIds: [],
        population: Math.floor(Math.random() * 5000) + 1000,
        resources: Math.floor(Math.random() * 1000) + 500,
        buildings: [],
        createdAt: new Date(),
        allianceId: provinceType === 'ally' ? 'alliance-1' : undefined
      };
      
      setSelectedProvince(mockProvince);
      
      // Otevři detail okno
      if (provinceType === 'own') {
        openWindow('army-detail', `Armáda - ${provinceName}`);
      } else {
        openWindow('province-detail', `Detail - ${provinceName}`);
      }
    }
  }, [isDragging, wasDraggingInThisSession, setSelectedProvince, openWindow]);

  const hideProvinceDetail = useCallback(() => {
    if (!isDragging) {
      setSelectedProvince(null);
    }
  }, [isDragging, setSelectedProvince]);

  // ============================================================
  // KEYBOARD SHORTCUTS
  // ============================================================

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'c':
          handleCenterMap();
          break;
        case 's':
          switchUnitType();
          break;
        case '=':
        case '+':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleCenterMap, switchUnitType, handleZoomIn, handleZoomOut]);

  // ============================================================
  // RENDER PROVINCES
  // ============================================================

  const renderProvince = (name: string, type: 'own' | 'abandoned' | 'neutral' | 'ally' | 'enemy', index: number) => {
    const isOwn = type === 'own';
    const data = isOwn ? gameData[name] : playerData[name];
    
    const style: React.CSSProperties = {
      left: `${(12 + Math.random() * 6) * CELL_SIZE + (CELL_SIZE - PROVINCE_SIZE) / 2}px`,
      top: `${(12 + Math.random() * 6) * CELL_SIZE + (CELL_SIZE - PROVINCE_SIZE) / 2}px`,
      transform: `scale(${mapZoom})`,
      transformOrigin: 'center center'
    };

    return (
      <div
        key={`${type}-${index}`}
        className={`province ${type} ${selectedProvince?.name === name ? 'selected' : ''}`}
        style={style}
        onClick={(e) => handleProvinceClick(e, name, type)}
        title={name}
      >
        <div className="province-name">{name}</div>
        
        {isOwn && data && (
          <>
            <div className="unit-type-indicator">
              {unitIcons[currentUnitType]} {unitTypes[currentUnitType]}
            </div>
            <div className="unit-count-display">
              {(data as any)[unitTypes[currentUnitType]]}
            </div>
          </>
        )}
        
        {!isOwn && data && (
          <div className="province-info">
            <div className="province-player">{(data as any).player}</div>
            <div className="province-alliance">{(data as any).alliance}</div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div className="interactive-map">
      {/* Map Controls */}
      <div className="map-controls">
        <button 
          className="map-control-btn" 
          onClick={handleZoomOut}
          disabled={mapZoom <= 0.5}
          title="Oddálit (klávesa -)"
        >
          −
        </button>
        
        <div className="map-zoom-level">
          {Math.round(mapZoom * 100)}%
        </div>
        
        <button 
          className="map-control-btn" 
          onClick={handleZoomIn}
          disabled={mapZoom >= 3}
          title="Přiblížit (klávesa +)"
        >
          +
        </button>
        
        <button 
          className="map-control-btn map-control-center" 
          onClick={handleCenterMap}
          title="Vycentrovat mapu (klávesa C)"
        >
          ⌖
        </button>
        
        <button 
          className="map-control-btn" 
          onClick={switchUnitType}
          title="Přepnout typ jednotek (klávesa S)"
        >
          {unitIcons[currentUnitType]}
        </button>
      </div>

      {/* Unit Type Indicator */}
      <div className="unit-type-panel">
        <div className="unit-type-header">
          <span className="unit-icon">{unitIcons[currentUnitType]}</span>
          <span className="unit-name">{unitNames[currentUnitType]}</span>
        </div>
        <div className="unit-type-hint">
          Kliknutím na mapu přepnete typ (klávesa S)
        </div>
      </div>

      {/* Map Container */}
      <div 
        className={`map-container ${isDragging ? 'map-container--dragging' : ''}`}
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={hideProvinceDetail}
      >
        <div 
          className="map-content" 
          ref={mapContentRef}
          style={{ 
            transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${mapZoom})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Background terrain */}
          <div className="map-background">
            <div className="continent-base"></div>
            
            {/* Compass Rose */}
            <div className="compass-rose">
              <div className="compass-pointer compass-north">S</div>
              <div className="compass-pointer compass-east">V</div>
              <div className="compass-pointer compass-south">J</div>
              <div className="compass-pointer compass-west">Z</div>
            </div>
          </div>

          {/* Vlastní državy */}
          {Object.keys(gameData).map((name, index) => 
            renderProvince(name, 'own', index)
          )}

          {/* Ostatní typy držav */}
          {Object.keys(playerData).map((name, index) => {
            let type: 'abandoned' | 'neutral' | 'ally' | 'enemy' = 'neutral';
            
            if (name.includes('Opuštěná')) type = 'abandoned';
            else if (name.includes('Svobodné') || name.includes('Obchodní') || name.includes('Neutrální') || name.includes('Řemeslnický') || name.includes('Volná')) type = 'neutral';
            else if (name.includes('Spojené')) type = 'ally';
            else if (name.includes('Temný') || name.includes('Nepřátelský')) type = 'enemy';
            
            return renderProvince(name, type, index);
          })}
        </div>
      </div>

      {/* Province Info Panel */}
      {selectedProvince && (
        <div className="province-info-panel">
          <div className="province-info-header">
            <span className="province-type-icon">
              {selectedProvince.ownerId === 'player-1' ? '👑' : '🏛️'}
            </span>
            <h3>{selectedProvince.name}</h3>
          </div>
          <div className="province-info-content">
            <p><strong>Obyvatelé:</strong> {selectedProvince.population.toLocaleString()}</p>
            <p><strong>Zdroje:</strong> {selectedProvince.resources}</p>
            <p><strong>Pozice:</strong> ({selectedProvince.centerPosition.x}, {selectedProvince.centerPosition.y})</p>
            {selectedProvince.allianceId && (
              <p><strong>Aliance:</strong> Severní pakt</p>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="map-instructions">
        <div className="instructions-content">
          <strong>Ovládání:</strong>
          Táhni pro pohyb | Kolečko pro zoom | Klik na provincii pro detail | C = center | S = přepnout jednotky
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;