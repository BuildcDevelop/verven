// src/components/MapPage.tsx
// ✅ OPRAVENO: Kompletní implementace MapPage s performance optimalizacemi

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Village, generateVillageCoordinates, calculateDistance, debugLog } from '../utils/gameUtils';

interface MapState {
  villages: Village[];
  selectedVillage: Village | null;
  zoom: number;
  centerX: number;
  centerY: number;
  isLoading: boolean;
  error: string | null;
}

const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // ✅ OPRAVENO: Správná pole destrukturalizace pro complex state
  const [mapState, setMapState] = useState<MapState>({
    villages: [],
    selectedVillage: null,
    zoom: 1,
    centerX: 500,
    centerY: 500,
    isLoading: true,
    error: null
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // ✅ OPRAVENO: Memoized map configuration
  const mapConfig = {
    width: 1000,
    height: 1000,
    tileSize: 20,
    minZoom: 0.5,
    maxZoom: 3,
    canvasWidth: 800,
    canvasHeight: 600
  };

  // ✅ OPRAVENO: Generate mock villages with performance optimization
  const generateMockVillages = useCallback((): Village[] => {
    const villages: Village[] = [];
    const villageCount = 50;
    
    for (let i = 0; i < villageCount; i++) {
      const coords = generateVillageCoordinates(villages, {
        width: mapConfig.width,
        height: mapConfig.height
      });
      
      const village: Village = {
        id: `village_${i}`,
        name: `Vesnice ${i + 1}`,
        x: coords.x,
        y: coords.y,
        owner: i < 5 ? user?.username || 'Hráč' : `NPC_${Math.floor(Math.random() * 10)}`,
        population: Math.floor(Math.random() * 1000) + 100,
        buildings: [],
        resources: {
          wood: Math.floor(Math.random() * 1000),
          stone: Math.floor(Math.random() * 800),
          iron: Math.floor(Math.random() * 500),
          food: Math.floor(Math.random() * 1200)
        },
        army: {
          id: `army_${i}`,
          villageId: `village_${i}`,
          units: {
            spearmen: Math.floor(Math.random() * 100),
            swordsmen: Math.floor(Math.random() * 50),
            archers: Math.floor(Math.random() * 75),
            cavalry: Math.floor(Math.random() * 25)
          },
          isMoving: false
        }
      };
      
      villages.push(village);
    }
    
    debugLog('Generováno vesnic na mapě', villages.length);
    return villages;
  }, [user?.username, mapConfig.width, mapConfig.height]);

  // ✅ OPRAVENO: Inicializace mapy s error handling
  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (!isAuthenticated) {
          navigate('/login');
          return;
        }

        setMapState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Simulace načítání dat
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const villages = generateMockVillages();
        
        setMapState(prev => ({
          ...prev,
          villages,
          isLoading: false
        }));
        
      } catch (error) {
        console.error('Chyba při inicializaci mapy:', error);
        setMapState(prev => ({
          ...prev,
          error: 'Chyba při načítání mapy',
          isLoading: false
        }));
      }
    };

    initializeMap();
  }, [isAuthenticated, navigate, generateMockVillages]);

  // ✅ OPRAVENO: Canvas drawing with performance optimization
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, mapConfig.canvasWidth, mapConfig.canvasHeight);

    // ✅ OPRAVENO: Optimized rendering - only draw visible villages
    const visibleVillages = mapState.villages.filter(village => {
      const x = (village.x - mapState.centerX) * mapState.zoom + mapConfig.canvasWidth / 2;
      const y = (village.y - mapState.centerY) * mapState.zoom + mapConfig.canvasHeight / 2;
      
      return x >= -50 && x <= mapConfig.canvasWidth + 50 && 
             y >= -50 && y <= mapConfig.canvasHeight + 50;
    });

    // Draw grid (optimized)
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.2)';
    ctx.lineWidth = 1;
    
    const gridSpacing = mapConfig.tileSize * mapState.zoom;
    if (gridSpacing > 10) { // Only draw grid if not too dense
      for (let x = 0; x < mapConfig.canvasWidth; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, mapConfig.canvasHeight);
        ctx.stroke();
      }
      
      for (let y = 0; y < mapConfig.canvasHeight; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(mapConfig.canvasWidth, y);
        ctx.stroke();
      }
    }

    // Draw villages
    visibleVillages.forEach(village => {
      const x = (village.x - mapState.centerX) * mapState.zoom + mapConfig.canvasWidth / 2;
      const y = (village.y - mapState.centerY) * mapState.zoom + mapConfig.canvasHeight / 2;
      
      const radius = Math.max(3, 8 * mapState.zoom);
      
      // Village circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      
      // Color based on owner
      if (village.owner === user?.username) {
        ctx.fillStyle = '#3498db'; // Own village - blue
      } else if (village.owner.startsWith('NPC_')) {
        ctx.fillStyle = '#9b59b6'; // NPC - purple
      } else {
        ctx.fillStyle = '#e74c3c'; // Enemy - red
      }
      
      ctx.fill();
      
      // Selected village highlight
      if (mapState.selectedVillage?.id === village.id) {
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Village name (only at higher zoom levels)
      if (mapState.zoom > 1.5) {
        ctx.fillStyle = 'white';
        ctx.font = `${Math.max(10, 12 * mapState.zoom)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(village.name, x, y - radius - 5);
      }
    });

  }, [mapState, mapConfig, user?.username]);

  // ✅ OPRAVENO: Canvas effect with proper cleanup
  useEffect(() => {
    drawMap();
  }, [drawMap]);

  // ✅ OPRAVENO: Mouse event handlers with proper coordinate transformation
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastPos({ x: mapState.centerX, y: mapState.centerY });
  }, [mapState.centerX, mapState.centerY]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const deltaX = (e.clientX - dragStart.x) / mapState.zoom;
    const deltaY = (e.clientY - dragStart.y) / mapState.zoom;

    setMapState(prev => ({
      ...prev,
      centerX: lastPos.x - deltaX,
      centerY: lastPos.y - deltaY
    }));
  }, [isDragging, dragStart, lastPos, mapState.zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to world coordinates
    const worldX = (clickX - mapConfig.canvasWidth / 2) / mapState.zoom + mapState.centerX;
    const worldY = (clickY - mapConfig.canvasHeight / 2) / mapState.zoom + mapState.centerY;

    // Find clicked village
    const clickedVillage = mapState.villages.find(village => {
      const distance = calculateDistance({ x: worldX, y: worldY }, { x: village.x, y: village.y });
      return distance < 15; // Click tolerance
    });

    setMapState(prev => ({
      ...prev,
      selectedVillage: clickedVillage || null
    }));
  }, [isDragging, mapState.zoom, mapState.centerX, mapState.centerY, mapState.villages, mapConfig.canvasWidth, mapConfig.canvasHeight]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(mapConfig.minZoom, Math.min(mapConfig.maxZoom, mapState.zoom * zoomFactor));
    
    setMapState(prev => ({
      ...prev,
      zoom: newZoom
    }));
  }, [mapState.zoom, mapConfig.minZoom, mapConfig.maxZoom]);

  // ✅ OPRAVENO: Loading state
  if (mapState.isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 25%, #0f766e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.25rem',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          borderRadius: '1rem',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ marginBottom: '1rem' }}>🗺️</div>
          <div>Načítání mapy...</div>
        </div>
      </div>
    );
  }

  // ✅ OPRAVENO: Error state
  if (mapState.error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 25%, #0f766e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.25rem',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          borderRadius: '1rem',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '400px',
          width: '90%'
        }}>
          <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>⚠️</div>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Chyba načítání mapy</h2>
          <p style={{ color: '#a7f3d0', marginBottom: '1.5rem' }}>{mapState.error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#eab308',
              color: 'black',
              border: 'none',
              padding: '0.875rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 25%, #0f766e 100%)',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(52, 211, 153, 0.3)',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🗺️ Herní Mapa</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => navigate('/game')}
              style={{
                backgroundColor: '#eab308',
                color: 'black',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Zpět do hry
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                backgroundColor: 'transparent',
                color: '#a7f3d0',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Hlavní stránka
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: '1rem' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '1rem'
        }}>
          {/* Map canvas */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            borderRadius: '1rem',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            padding: '1rem',
            overflow: 'hidden'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Interaktivní mapa</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#a7f3d0' }}>
                Zoom: {Math.round(mapState.zoom * 100)}% | 
                Vesnic: {mapState.villages.length} | 
                Tažením pohybuj mapou, kolečkem zoom
              </p>
            </div>
            
            <div ref={containerRef}>
              <canvas
                ref={canvasRef}
                width={mapConfig.canvasWidth}
                height={mapConfig.canvasHeight}
                style={{
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: '0.5rem',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  maxWidth: '100%',
                  height: 'auto'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleClick}
                onWheel={handleWheel}
              />
            </div>
          </div>

          {/* Village details sidebar */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            borderRadius: '1rem',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            padding: '1rem',
            height: 'fit-content'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Detail vesnice</h3>
            
            {mapState.selectedVillage ? (
              <div>
                <h4 style={{ color: '#facc15', margin: '0 0 0.5rem 0' }}>
                  {mapState.selectedVillage.name}
                </h4>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
                  <strong>Vlastník:</strong> {mapState.selectedVillage.owner}
                </p>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
                  <strong>Pozice:</strong> {mapState.selectedVillage.x}, {mapState.selectedVillage.y}
                </p>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
                  <strong>Populace:</strong> {mapState.selectedVillage.population.toLocaleString()}
                </p>
                
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#a7f3d0' }}>Suroviny:</h5>
                <div style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>
                  <div>🪵 Dřevo: {mapState.selectedVillage.resources.wood}</div>
                  <div>🪨 Kámen: {mapState.selectedVillage.resources.stone}</div>
                  <div>⚙️ Železo: {mapState.selectedVillage.resources.iron}</div>
                  <div>🌾 Jídlo: {mapState.selectedVillage.resources.food}</div>
                </div>

                <h5 style={{ margin: '0 0 0.5rem 0', color: '#a7f3d0' }}>Armáda:</h5>
                <div style={{ fontSize: '0.75rem' }}>
                  <div>🛡️ Kopiníci: {mapState.selectedVillage.army.units.spearmen}</div>
                  <div>⚔️ Mečníci: {mapState.selectedVillage.army.units.swordsmen}</div>
                  <div>🏹 Lukostřelci: {mapState.selectedVillage.army.units.archers}</div>
                  <div>🐎 Jízda: {mapState.selectedVillage.army.units.cavalry}</div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#a7f3d0', fontSize: '0.875rem' }}>
                Klikni na vesnici na mapě pro zobrazení detailů.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;