// src/components/interactive/InteractiveMap.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Province } from '../../types/game-types';
import './styles/InteractiveMap.css';
import ProvinceManagementPanel from './ProvinceManagementPanel';

// ============================================================
// KONSTANTY PRO MAPU
// ============================================================

const CELL_SIZE = 50;  // Zvětšeno z 40px
const PROVINCE_SIZE = 45;  // Zvětšeno z 35px  
const GRID_SIZE = 30;

const unitTypes = ['OFF', 'DEFF', 'SIEGE', 'SPEC'] as const;
const unitIcons = ['⚔️', '🛡️', '🏰', '🎯'];
const unitNames = ['Útočné jednotky', 'Obranné jednotky', 'Obléhací stroje', 'Speciální jednotky'];

// ============================================================
// HELPER FUNCTIONS PRO POZICOVÁNÍ
// ============================================================

const getProvincePosition = (index: number, totalProvinces: number, gridSize: number = GRID_SIZE) => {
  // Optimalizovaný layout pro lepší využití prostoru
  const cols = Math.min(6, Math.ceil(Math.sqrt(totalProvinces))); // Max 6 sloupců
  const rows = Math.ceil(totalProvinces / cols);
  
  // Grid pozice
  const gridX = index % cols;
  const gridY = Math.floor(index / cols);
  
  // Větší spacing pro lepší čitelnost
  const cellSpacing = Math.max(3, Math.floor((gridSize - 4) / Math.max(cols, rows)));
  const startOffsetX = Math.floor((gridSize - (cols - 1) * cellSpacing) / 2);
  const startOffsetY = Math.floor((gridSize - (rows - 1) * cellSpacing) / 2);
  
  const x = startOffsetX + gridX * cellSpacing;
  const y = startOffsetY + gridY * cellSpacing;
  
  // Zajisti že jsme v bounds s většími marginy
  return {
    x: Math.max(2, Math.min(gridSize - 3, x)),
    y: Math.max(2, Math.min(gridSize - 3, y))
  };
};

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
  
  // UI State
  const [hoveredProvince, setHoveredProvince] = React.useState<string | null>(null);
  const [keyboardHints, setKeyboardHints] = React.useState<string | null>(null);
  const [managementPanel, setManagementPanel] = React.useState<{
    provinceName: string;
    coordinates: { x: number; y: number };
    position: { x: number; y: number };
  } | null>(null);

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
    
    if (mapContentRef.current) {
      mapContentRef.current.style.transform = `translate(${newPosition.x}px, ${newPosition.y}px) scale(${mapZoom})`;
    }
  }, [setMapPosition, mapZoom]);
  
  const switchUnitType = useCallback(() => {
    setCurrentUnitType((currentUnitType + 1) % unitTypes.length);
  }, [currentUnitType, setCurrentUnitType]);

  // ============================================================
  // PROVINCE MANAGEMENT HANDLERS
  // ============================================================
  
  const handleOwnProvinceClick = useCallback((e: React.MouseEvent, provinceName: string) => {
    if (!isDragging && !wasDraggingInThisSession) {
      e.preventDefault();
      e.stopPropagation();
      
      // Získej pozici provincie pro výpočet souřadnic
      const allProvinces = [...Object.keys(gameData), ...Object.keys(playerData)];
      const provinceIndex = allProvinces.indexOf(provinceName);
      const provincePosition = getProvincePosition(provinceIndex, allProvinces.length, GRID_SIZE);
      
      // Vypočítej pozici panelu (trochu vpravo od provincie)
      const rect = mapContainerRef.current?.getBoundingClientRect();
      const panelPosition = {
        x: Math.min(window.innerWidth - 450, (rect?.left || 0) + mapPosition.x + 300), // OPRAVENO: mapPosition.x
        y: Math.max(20, (rect?.top || 0) + mapPosition.y - 50) // OPRAVENO: mapPosition.y
      };
      
      setManagementPanel({
        provinceName,
        coordinates: { x: provincePosition.x, y: provincePosition.y },
        position: panelPosition
      });
      
      // Audio feedback
      setKeyboardHints(`🏰 Správa: ${provinceName}`);
      setTimeout(() => setKeyboardHints(null), 2000);
    }
  }, [isDragging, wasDraggingInThisSession, gameData, playerData, mapPosition]);

  const handleCloseManagementPanel = useCallback(() => {
    setManagementPanel(null);
  }, []);

  const handleExpandedDetail = useCallback(() => {
    console.log('🔍 Rozšířený detail bude implementován později');
    // Zde bude logika pro otevření detailního okna
  }, []);

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
      setDragStart({ x: e.clientX, y: e.clientY });
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
  // ENHANCED PROVINCE INTERACTION
  // ============================================================

  const handleProvinceHover = useCallback((provinceName: string, isEntering: boolean) => {
    if (isEntering) {
      setHoveredProvince(provinceName);
    } else {
      setHoveredProvince(null);
    }
  }, []);

  const handleProvinceClick = useCallback((e: React.MouseEvent, provinceName: string, provinceType: string) => {
    if (!isDragging && !wasDraggingInThisSession) {
      e.preventDefault(); // Zabrání kontextovému menu
      e.stopPropagation();
        
      // Vytvoř mock provincii pro demonstraci
      const allProvinces = [...Object.keys(gameData), ...Object.keys(playerData)];
      const provinceIndex = allProvinces.indexOf(provinceName);
      const position = getProvincePosition(provinceIndex, allProvinces.length);
      
      const mockProvince: Province = {
        id: `province-${provinceName.replace(/\s+/g, '-').toLowerCase()}`,
        name: provinceName,
        ownerId: provinceType === 'own' ? 'player-1' : 'other',
        color: provinceType === 'own' ? '#4a90e2' : '#666',
        centerPosition: { x: position.x, y: position.y },
        tileIds: [`tile-${position.x}-${position.y}`],
        population: Math.floor(Math.random() * 5000) + 1000,
        resources: Math.floor(Math.random() * 1000) + 500,
        buildings: [],
        createdAt: new Date(),
        allianceId: provinceType === 'ally' ? 'alliance-1' : undefined
      };
      
      setSelectedProvince(mockProvince);
      
      // Otevři detail okno s lepším obsahem
      openWindow('province-detail', `📍 ${provinceName}`, {
        position: { x: Math.random() * 200 + 50, y: Math.random() * 150 + 100 },
        size: { width: 350, height: 450 }
      });

      // Audio feedback (mock)
      setKeyboardHints(`🏰 Vybráno: ${provinceName}`);
      setTimeout(() => setKeyboardHints(null), 2000);
    }
  }, [isDragging, wasDraggingInThisSession, gameData, playerData, setSelectedProvince, openWindow]);

  const hideProvinceDetail = useCallback(() => {
    if (!isDragging && !wasDraggingInThisSession) {
      setSelectedProvince(null);
      setManagementPanel(null); // Zavře také management panel
    }
  }, [isDragging, wasDraggingInThisSession, setSelectedProvince]);

  // ============================================================
  // ENHANCED KEYBOARD CONTROLS + TOOLTIPS
  // ============================================================

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent default pro game controls
      const gameKeys = ['c', 's', '=', '+', '-'];
      if (gameKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      switch(e.key.toLowerCase()) {
        case 'c':
          handleCenterMap();
          setKeyboardHints('🎯 Mapa vycentrována');
          setTimeout(() => setKeyboardHints(null), 2000);
          break;
        case 's':
          switchUnitType();
          setKeyboardHints(`🔄 Přepnuto na: ${unitNames[(currentUnitType + 1) % unitTypes.length]}`);
          setTimeout(() => setKeyboardHints(null), 2000);
          break;
        case '+':
        case '=':
          if (mapZoom < 3) {
            handleZoomIn();
            setKeyboardHints(`🔍 Zoom: ${Math.round((mapZoom + 0.2) * 100)}%`);
            setTimeout(() => setKeyboardHints(null), 1500);
          }
          break;
        case '-':
          if (mapZoom > 0.5) {
            handleZoomOut();
            setKeyboardHints(`🔍 Zoom: ${Math.round((mapZoom - 0.2) * 100)}%`);
            setTimeout(() => setKeyboardHints(null), 1500);
          }
          break;
        case 'escape':
          setSelectedProvince(null);
          setManagementPanel(null); // Zavře také management panel
          setKeyboardHints('❌ Detail zavřen');
          setTimeout(() => setKeyboardHints(null), 1500);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleCenterMap, switchUnitType, handleZoomIn, handleZoomOut, mapZoom, currentUnitType, setSelectedProvince]);

  // ============================================================
  // RENDER PROVINCE FUNCTION - HLAVNÍ IMPLEMENTACE!
  // ============================================================

  const renderProvince = useCallback((name: string, type: 'own' | 'abandoned' | 'neutral' | 'ally' | 'enemy', index: number) => {
    const isOwn = type === 'own';
    const data = isOwn ? gameData[name] : playerData[name];
    
    if (!data) return null;

    // Získej pozici na gridu s celkovým počtem provincií
    const allProvinces = [...Object.keys(gameData), ...Object.keys(playerData)];
    const globalIndex = isOwn ? index : Object.keys(gameData).length + index;
    const position = getProvincePosition(globalIndex, allProvinces.length, GRID_SIZE);
    
    const style: React.CSSProperties = {
      left: `${position.x * CELL_SIZE + (CELL_SIZE - PROVINCE_SIZE) / 2}px`,
      top: `${position.y * CELL_SIZE + (CELL_SIZE - PROVINCE_SIZE) / 2}px`,
      width: `${PROVINCE_SIZE}px`,
      height: `${PROVINCE_SIZE}px`,
      position: 'absolute'
    };

    return (
      <div
        key={`${type}-${index}-${name}`}
        className={`province ${type} ${selectedProvince?.name === name ? 'selected' : ''}`}
        style={{
          ...style,
          borderRadius: '8px',
          border: selectedProvince?.name === name ? '3px solid #fbbf24' : '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: selectedProvince?.name === name 
            ? '0 0 20px rgba(251, 191, 36, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3)' 
            : hoveredProvince === name 
              ? '0 0 15px rgba(255, 255, 255, 0.4), 0 6px 16px rgba(0, 0, 0, 0.4)'
              : '0 4px 12px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          // Lepší barvy podle typu
          background: type === 'own' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' :
                     type === 'abandoned' ? 'linear-gradient(135deg, #6b7280 0%, #374151 100%)' :
                     type === 'neutral' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                     type === 'ally' ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' :
                     'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          transform: hoveredProvince === name ? 'scale(1.08)' : 'scale(1)',
          zIndex: hoveredProvince === name ? 10 : selectedProvince?.name === name ? 8 : 1
        }}
        // Levé tlačítko pro vlastní državy = management panel
        onClick={type === 'own' ? (e) => handleOwnProvinceClick(e, name) : undefined}
        // Pravé tlačítko pro detail provincie
        onContextMenu={(e) => handleProvinceClick(e, name, type)}
        title={type === 'own' ? `${name} (Levé klik = správa, pravé = detail)` : `${name} (Pravé tlačítko pro detail)`}
        onMouseEnter={() => handleProvinceHover(name, true)}
        onMouseLeave={() => handleProvinceHover(name, false)}
      >
        {/* Název provincie */}
        <div className="province-name" style={{
          fontSize: '11px',  // Zvětšeno z 9px
          fontWeight: '700',
          textShadow: '1px 1px 3px rgba(0, 0, 0, 0.9)',
          marginBottom: '3px',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          color: 'white'
        }}>
          {name.length > 14 ? name.substring(0, 12) + '...' : name}
        </div>
        
        {/* Obsah pro vlastní državy - zobraz jednotky */}
        {isOwn && data && (
          <>
            <div className="unit-type-indicator" style={{
              fontSize: '10px',  // Zvětšeno z 8px
              opacity: 0.95,
              marginBottom: '2px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
            }}>
              {unitIcons[currentUnitType]} {unitTypes[currentUnitType]}
            </div>
            <div className="unit-count-display" style={{
              fontSize: '12px',  // Zvětšeno z 10px
              fontWeight: 'bold',
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '3px 6px',
              borderRadius: '4px',
              textAlign: 'center',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
            }}>
              {(data as any)[unitTypes[currentUnitType]] || 0}
            </div>
          </>
        )}
        
        {/* Obsah pro cizí državy - zobraz hráče a alianci */}
        {!isOwn && data && (
          <div className="province-info" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px'
          }}>
            <div className="province-player" style={{
              fontSize: '10px',  // Zvětšeno z 8px
              opacity: 0.95,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              color: 'white',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
              fontWeight: '600'
            }}>
              {(data as any).player.length > 10 ? 
                (data as any).player.substring(0, 8) + '...' : 
                (data as any).player
              }
            </div>
            <div className="province-alliance" style={{
              fontSize: '9px',  // Zvětšeno z 7px
              opacity: 0.8,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.8)',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
            }}>
              {(data as any).alliance.length > 12 ? 
                (data as any).alliance.substring(0, 10) + '...' : 
                (data as any).alliance
              }
            </div>
          </div>
        )}
      </div>
    );
  }, [gameData, playerData, currentUnitType, selectedProvince, hoveredProvince, handleProvinceClick, handleOwnProvinceClick]);

  // ============================================================
  // ENHANCED WHEEL ZOOM WITH MOUSE POSITION
  // ============================================================

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    // Get mouse position relative to map container
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Zoom direction
    const zoomDirection = e.deltaY > 0 ? -1 : 1;
    const zoomFactor = 1 + (zoomDirection * 0.1);
    const newZoom = Math.max(0.5, Math.min(3, mapZoom * zoomFactor));
    
    if (newZoom !== mapZoom) {
      // Calculate new position to zoom towards mouse
      const scaleDiff = newZoom / mapZoom;
      const newX = mouseX - (mouseX - mapPosition.x) * scaleDiff;
      const newY = mouseY - (mouseY - mapPosition.y) * scaleDiff;
      
      setMapPosition({ x: newX, y: newY });
      setMapZoom(newZoom);
      
      // Show zoom feedback
      setKeyboardHints(`🔍 Zoom: ${Math.round(newZoom * 100)}%`);
      setTimeout(() => setKeyboardHints(null), 1000);
    }
  }, [mapZoom, mapPosition, setMapPosition, setMapZoom]);

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (!gameData || Object.keys(gameData).length === 0) {
    return (
      <div className="map-loading">
        <div className="map-loading__text">Načítání provincií...</div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div className="interactive-map" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Keyboard Hints Popup */}
      {keyboardHints && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          color: '#34d399',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1000,
          border: '1px solid rgba(52, 211, 153, 0.5)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          animation: 'fadeInOut 2s ease-in-out'
        }}>
          {keyboardHints}
        </div>
      )}

      {/* Connection Status Indicator */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(20, 25, 35, 0.9)',
        border: '1px solid rgba(52, 211, 153, 0.3)',
        borderRadius: '20px',
        padding: '6px 12px',
        fontSize: '11px',
        color: '#34d399',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#10b981',
          animation: 'pulse 2s infinite'
        }}></div>
        🌐 LIVE | {Object.keys(gameData).length + Object.keys(playerData).length} provincií
      </div>

      {/* Mini-Map */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: '120px',
        height: '120px',
        background: 'rgba(20, 25, 35, 0.95)',
        border: '1px solid rgba(100, 120, 150, 0.4)',
        borderRadius: '8px',
        padding: '8px',
        backdropFilter: 'blur(15px)',
        zIndex: 100
      }}>
        <div style={{
          fontSize: '10px',
          color: '#4a90e2',
          fontWeight: 'bold',
          marginBottom: '4px',
          textAlign: 'center'
        }}>
          📍 Mini Mapa
        </div>
        <div style={{
          width: '100%',
          height: '80px',
          background: 'rgba(0, 100, 200, 0.1)',
          borderRadius: '4px',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* Viewport indicator */}
          <div style={{
            position: 'absolute',
            width: '20px',
            height: '15px',
            border: '2px solid #34d399',
            borderRadius: '2px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}></div>
          {/* Mini provinces dots */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '3px',
                height: '3px',
                background: i < 3 ? '#3b82f6' : '#10b981',
                borderRadius: '50%',
                left: `${15 + (i % 3) * 25}%`,
                top: `${20 + Math.floor(i / 3) * 20}%`
              }}
            />
          ))}
        </div>
      </div>

      {/* Unit Type Indicator - MOVED TO TOP */}
      <div className="unit-type-panel" style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(20, 25, 35, 0.95)',
        border: '1px solid rgba(100, 120, 150, 0.4)',
        borderRadius: '10px',
        padding: '12px',
        backdropFilter: 'blur(15px)',
        zIndex: 200,  // Vyšší z-index
        minWidth: '200px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="unit-type-header" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '6px'
        }}>
          <span className="unit-icon" style={{ 
            fontSize: '18px',
            filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5))'
          }}>
            {unitIcons[currentUnitType]}
          </span>
          <span className="unit-name" style={{
            color: '#4a90e2',
            fontSize: '15px',
            fontWeight: 'bold',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}>
            {unitNames[currentUnitType]}
          </span>
        </div>
        <div className="unit-type-hint" style={{
          fontSize: '12px',
          color: '#e8eaed',
          opacity: 0.9,
          lineHeight: 1.3
        }}>
          Scrolluj kolečkem pro změnu typu (klávesa S)
        </div>
      </div>

      {/* Map Controls */}
      <div className="map-controls" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(20, 25, 35, 0.95)',
        border: '1px solid rgba(100, 120, 150, 0.4)',
        borderRadius: '10px',
        padding: '10px 12px',
        backdropFilter: 'blur(15px)',
        zIndex: 200,  // Stejný z-index jako Unit Type Panel
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <button 
          className="map-control-btn" 
          onClick={handleZoomOut}
          disabled={mapZoom <= 0.5}
          title="Oddálit (klávesa -)"
          style={{
            width: '36px',  // Trochu větší
            height: '36px',
            border: 'none',
            borderRadius: '6px',
            background: mapZoom <= 0.5 ? 'rgba(100, 100, 100, 0.4)' : 'rgba(74, 144, 226, 0.7)',
            color: 'white',
            cursor: mapZoom <= 0.5 ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          −
        </button>
        
        <div className="map-zoom-level" style={{
          minWidth: '55px',
          textAlign: 'center',
          color: '#e8eaed',
          fontSize: '13px',
          fontWeight: 'bold',
          padding: '0 6px'
        }}>
          {Math.round(mapZoom * 100)}%
        </div>
        
        <button 
          className="map-control-btn" 
          onClick={handleZoomIn}
          disabled={mapZoom >= 3}
          title="Přiblížit (klávesa +)"
          style={{
            width: '36px',
            height: '36px',
            border: 'none',
            borderRadius: '6px',
            background: mapZoom >= 3 ? 'rgba(100, 100, 100, 0.4)' : 'rgba(74, 144, 226, 0.7)',
            color: 'white',
            cursor: mapZoom >= 3 ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          +
        </button>
        
        <button 
          className="map-control-btn map-control-center" 
          onClick={handleCenterMap}
          title="Vycentrovat mapu (klávesa C)"
          style={{
            width: '36px',
            height: '36px',
            border: 'none',
            borderRadius: '6px',
            background: 'rgba(52, 211, 153, 0.7)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            marginLeft: '8px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          ⌖
        </button>
        
        <button 
          className="map-control-btn" 
          onClick={switchUnitType}
          title="Přepnout typ jednotek (klávesa S)"
          style={{
            width: '36px',
            height: '36px',
            border: 'none',
            borderRadius: '6px',
            background: 'rgba(168, 85, 247, 0.7)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          {unitIcons[currentUnitType]}
        </button>
      </div>

      {/* Map Container */}
      <div 
        className={`map-container ${isDragging ? 'map-container--dragging' : ''}`}
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={hideProvinceDetail}
      >
        <div 
          className="map-content" 
          ref={mapContentRef}
          style={{ 
            transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${mapZoom})`,
            transformOrigin: '0 0',
            width: `${GRID_SIZE * CELL_SIZE}px`,
            height: `${GRID_SIZE * CELL_SIZE}px`,
            position: 'relative'
          }}
        >
          {/* Background terrain */}
          <div className="map-background" style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}>
            {/* Grid overlay pro vizualizaci */}
            <div className="grid-overlay" style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: 0.15,
              pointerEvents: 'none'
            }}>
              {Array.from({ length: GRID_SIZE }, (_, y) => 
                Array.from({ length: GRID_SIZE }, (_, x) => (
                  <div
                    key={`grid-${x}-${y}`}
                    className="grid-cell"
                    style={{
                      position: 'absolute',
                      left: `${x * CELL_SIZE}px`,
                      top: `${y * CELL_SIZE}px`,
                      width: `${CELL_SIZE}px`,
                      height: `${CELL_SIZE}px`,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxSizing: 'border-box'
                    }}
                  />
                ))
              )}
            </div>
            
            <div className="continent-base" style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at center, rgba(0, 100, 200, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }}></div>
            
            {/* Compass Rose */}
            <div className="compass-rose" style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '60px',
              height: '60px',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              <div className="compass-pointer compass-north" style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)' }}>S</div>
              <div className="compass-pointer compass-east" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>V</div>
              <div className="compass-pointer compass-south" style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)' }}>J</div>
              <div className="compass-pointer compass-west" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>Z</div>
            </div>
          </div>

          {/* VLASTNÍ DRŽAVY - renderProvince v akci! */}
          {Object.keys(gameData).map((name, index) => 
            renderProvince(name, 'own', index)
          )}

          {/* OSTATNÍ TYPY DRŽAV */}
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

      {/* Enhanced Tooltip for Hovered Province */}
      {hoveredProvince && !selectedProvince && (
        <div style={{
          position: 'absolute',
          bottom: '160px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(100, 120, 150, 0.6)',
          borderRadius: '8px',
          padding: '12px',
          backdropFilter: 'blur(15px)',
          zIndex: 150,
          minWidth: '200px',
          color: '#e8eaed',
          fontSize: '12px',
          pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: 'bold', color: '#4a90e2', marginBottom: '6px' }}>
            🏰 {hoveredProvince}
          </div>
          {gameData[hoveredProvince] && (
            <div>
              <div>⚔️ Útok: {gameData[hoveredProvince].OFF}</div>
              <div>🛡️ Obrana: {gameData[hoveredProvince].DEFF}</div>
              <div>🏰 Obléhání: {gameData[hoveredProvince].SIEGE}</div>
              <div>🎯 Speciální: {gameData[hoveredProvince].SPEC}</div>
            </div>
          )}
          {playerData[hoveredProvince] && (
            <div>
              <div>👤 Hráč: {playerData[hoveredProvince].player}</div>
              <div>🤝 Aliance: {playerData[hoveredProvince].alliance}</div>
            </div>
          )}
          <div style={{ marginTop: '6px', fontSize: '10px', opacity: 0.7 }}>
            Klik pro detail
          </div>
        </div>
      )}

      {/* Enhanced Province Info Panel */}
      {selectedProvince && (
        <div className="province-info-panel" style={{
          position: 'absolute',
          bottom: '20px',
          left: '160px',  // Moved right to make space for mini-map
          background: 'rgba(20, 25, 35, 0.98)',
          border: '1px solid rgba(100, 120, 150, 0.4)',
          borderRadius: '12px',
          padding: '16px',
          minWidth: '280px',
          backdropFilter: 'blur(15px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          zIndex: 150
        }}>
          <div className="province-info-header" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px'
          }}>
            <span className="province-type-icon" style={{
              fontSize: '20px',
              filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5))'
            }}>
              {selectedProvince.ownerId === 'player-1' ? '👑' : '🏛️'}
            </span>
            <h3 style={{
              margin: 0,
              color: '#4a90e2',
              fontSize: '16px',
              fontWeight: '700',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}>
              {selectedProvince.name}
            </h3>
            <button
              onClick={() => setSelectedProvince(null)}
              style={{
                marginLeft: 'auto',
                background: 'rgba(239, 68, 68, 0.7)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          </div>
          <div className="province-info-content" style={{
            color: '#e8eaed',
            fontSize: '13px',
            lineHeight: 1.5
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <strong style={{ color: '#ffffff' }}>Obyvatelé:</strong><br />
                {selectedProvince.population.toLocaleString()}
              </div>
              <div>
                <strong style={{ color: '#ffffff' }}>Zdroje:</strong><br />
                {selectedProvince.resources.toLocaleString()}
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <strong style={{ color: '#ffffff' }}>Pozice:</strong> ({selectedProvince.centerPosition.x}, {selectedProvince.centerPosition.y})
            </div>
            {selectedProvince.allianceId && (
              <div style={{ marginTop: '8px' }}>
                <strong style={{ color: '#ffffff' }}>Aliance:</strong> Severní pakt
              </div>
            )}
            <div style={{
              marginTop: '12px',
              padding: '8px',
              background: 'rgba(74, 144, 226, 0.1)',
              borderRadius: '6px',
              fontSize: '11px'
            }}>
              💡 <strong>Tip:</strong> Stiskni ESC pro zavření nebo klikni na jinou provincii
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="map-instructions" style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(20, 25, 35, 0.95)',
        border: '1px solid rgba(100, 120, 150, 0.4)',
        borderRadius: '10px',
        padding: '12px',
        backdropFilter: 'blur(15px)',
        zIndex: 100,
        maxWidth: '320px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="instructions-content" style={{
          color: '#e8eaed',
          fontSize: '12px',
          lineHeight: 1.4
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#4a90e2' }}>
            ⌨️ Ovládání:
          </div>
          <div>• <strong>Drag & Drop</strong> - pohyb po mapě</div>
          <div>• <strong>Kolečko myši</strong> - zoom na pozici kurzoru</div>
          <div>• <strong>Levé klik</strong> - správa vlastní državy</div>
          <div>• <strong>Pravé klik</strong> - detail provincie</div>
          <div style={{ marginTop: '4px' }}>
            <strong>Klávesy:</strong> <kbd style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2px 4px',
              borderRadius: '3px',
              fontSize: '10px'
            }}>C</kbd> center | <kbd style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2px 4px',
              borderRadius: '3px',
              fontSize: '10px'
            }}>S</kbd> switch | <kbd style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2px 4px',
              borderRadius: '3px',
              fontSize: '10px'
            }}>ESC</kbd> close
          </div>
        </div>
      </div>

      {/* Province Management Panel - SPRÁVNĚ UMÍSTĚNÝ */}
      {managementPanel && (
        <ProvinceManagementPanel
          provinceName={managementPanel.provinceName}
          coordinates={managementPanel.coordinates}
          position={managementPanel.position}
          onClose={handleCloseManagementPanel}
          onExpandedDetail={handleExpandedDetail}
        />
      )}

      {/* CSS Animations Injection */}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .province.selected {
          animation: selectedPulse 2s ease-in-out infinite;
        }
        
        @keyframes selectedPulse {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          50% { 
            box-shadow: 0 0 30px rgba(251, 191, 36, 0.9), 0 6px 20px rgba(0, 0, 0, 0.4);
          }
        }
      `}</style>
    </div>
  );
};

export default InteractiveMap;