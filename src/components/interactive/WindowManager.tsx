// src/components/interactive/WindowManager.tsx
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GameWindow } from '../../stores/gameStore';
import './styles/WindowManager.css';

// ============================================================
// SMOOTH DRAGGABLE WINDOW COMPONENT (60fps)
// ============================================================

interface DraggableWindowProps {
  window: GameWindow;
  isActive: boolean;
  onBringToFront: (id: string) => void;
  onClose: (id: string) => void;
  onToggleMinimize: (id: string) => void;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onDragStateChange: (isDragging: boolean) => void;  // NEW: Drag state callback
}

const DraggableWindow: React.FC<DraggableWindowProps> = React.memo(({
  window,
  isActive,
  onBringToFront,
  onClose,
  onToggleMinimize,
  onPositionChange,
  onDragStateChange
}) => {
  // Refs pro smooth dragging
  const windowRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    windowStartX: 0,
    windowStartY: 0,
    finalX: 0,  // Store final position for mouseUp
    finalY: 0
  });
  const animationFrameRef = useRef<number>();

  // ============================================================
  // SMOOTH DRAG HANDLERS (60fps) - FIXED VERSION
  // ============================================================

  const updateWindowPosition = useCallback((x: number, y: number) => {
    if (!windowRef.current) return;
    
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
      console.error('❌ Invalid position parameters:', { x, y });
      return;
    }
    
    // Get viewport dimensions with fallbacks
    const viewportWidth = window.innerWidth || 1920;
    const viewportHeight = window.innerHeight || 1080;
    const windowWidth = window.size?.width || 300;
    const windowHeight = window.size?.height || 250;
    
    // Calculate bounds
    const navigationHeight = 70;
    const maxX = Math.max(0, viewportWidth - windowWidth);
    const maxY = Math.max(navigationHeight, viewportHeight - windowHeight);
    
    // Constrain position
    const constrainedX = Math.max(0, Math.min(maxX, x));
    const constrainedY = Math.max(navigationHeight, Math.min(maxY, y));
    
    // Final validation
    if (isNaN(constrainedX) || isNaN(constrainedY)) {
      console.error('❌ Constrained position is NaN');
      return;
    }
    
    // Apply transform immediately for smooth movement
    windowRef.current.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
    
    // Store final position in component state for mouseUp
    dragStateRef.current.finalX = constrainedX;
    dragStateRef.current.finalY = constrainedY;
    
  }, [window.id, window.size]);

  // ============================================================
  // PŘIDANÁ HELPER FUNKCE - getCurrentDOMPosition
  // ============================================================

  const getCurrentDOMPosition = useCallback((): { x: number; y: number } => {
    if (!windowRef.current) {
      return { x: window.position?.x || 100, y: window.position?.y || 100 };
    }

    const transform = windowRef.current.style.transform;
    if (!transform || transform === 'none') {
      return { x: window.position?.x || 100, y: window.position?.y || 100 };
    }

    // Parse current DOM transform values
    const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
    if (match) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      if (!isNaN(x) && !isNaN(y)) {
        return { x, y };
      }
    }

    // Fallback to store position
    return { x: window.position?.x || 100, y: window.position?.y || 100 };
  }, [window.position]);

  // ============================================================
  // OPRAVENÁ handleMouseDown FUNKCE
  // ============================================================

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't drag when clicking control buttons
    const target = e.target as HTMLElement;
    if (target.classList.contains('window-control') || target.closest('.window-controls')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Starting drag for window:', window.id);
    
    // Bring to front immediately
    onBringToFront(window.id);
    
    // *** KLÍČOVÁ OPRAVA *** - použij DOM pozici místo store pozice
    const currentPos = getCurrentDOMPosition();
    const startX = currentPos.x;
    const startY = currentPos.y;
    
    // Validate starting position
    const validStartX = typeof startX === 'number' && !isNaN(startX) ? startX : 100;
    const validStartY = typeof startY === 'number' && !isNaN(startY) ? startY : 100;
    
    console.log('📍 Drag starting from validated DOM position:', { x: validStartX, y: validStartY });
    
    // Initialize drag state with DOM position
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      windowStartX: validStartX,  // *** OPRAVA *** - DOM pozice místo store
      windowStartY: validStartY,  // *** OPRAVA *** - DOM pozice místo store
      finalX: validStartX,
      finalY: validStartY
    };
    
    onDragStateChange(true);
    
    // Add dragging class for visual feedback
    if (windowRef.current) {
      windowRef.current.classList.add('window--dragging');
    }
    
    // Attach global listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
  }, [window.id, getCurrentDOMPosition, onBringToFront, onDragStateChange]);

  // ============================================================
  // PŘIDANÉ CHYBĚJÍCÍ MOUSE HANDLERS
  // ============================================================

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;
    
    // Calculate movement delta
    const deltaX = e.clientX - dragStateRef.current.startX;
    const deltaY = e.clientY - dragStateRef.current.startY;
    
    // Calculate new position
    const newX = dragStateRef.current.windowStartX + deltaX;
    const newY = dragStateRef.current.windowStartY + deltaY;
    
    if (isNaN(newX) || isNaN(newY)) {
      console.error('❌ Invalid new position calculation:', { newX, newY });
      return;
    }
    
    // Update position smoothly
    updateWindowPosition(newX, newY);
  }, [updateWindowPosition]);

  const handleMouseUp = useCallback(() => {
    if (!dragStateRef.current.isDragging) return;
    
    console.log('🔚 Drag ended for window:', window.id);
    
    dragStateRef.current.isDragging = false;
    
    // Use stored final position
    const finalX = dragStateRef.current.finalX || window.position?.x || 100;
    const finalY = dragStateRef.current.finalY || window.position?.y || 100;
    
    if (!isNaN(finalX) && !isNaN(finalY)) {
      console.log('💾 Saving final position to store:', { x: finalX, y: finalY });
      onPositionChange(window.id, { x: finalX, y: finalY });
    }
    
    // Cleanup
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    onDragStateChange(false);
    
    if (windowRef.current) {
      windowRef.current.classList.remove('window--dragging');
    }
  }, [window.id, window.position, onPositionChange, onDragStateChange]);

  // ============================================================
  // OPRAVENÝ SYNC USEEFFECT - BEZ FUNCTION DEPENDENCIES 🔧
  // ============================================================

  // NOVÝ STABILNÍ SYNC - OVERLAP FIX:
  useEffect(() => {
    // Skip sync during drag nebo pokud není mounted
    if (dragStateRef.current.isDragging || !windowRef.current) {
      return;
    }

    const storePos = window.position || { x: 100, y: 100 };
    
    // Přečti DOM pozici inline (bez function dependency)
    let domPos = { x: storePos.x, y: storePos.y }; // fallback
    const transform = windowRef.current.style.transform;
    if (transform && transform !== 'none') {
      const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
      if (match) {
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        if (!isNaN(x) && !isNaN(y)) {
          domPos = { x, y };
        }
      }
    }
    
    // Sync POUZE pokud je VÝZNAMNÝ rozdíl (větší tolerance)
    const diffX = Math.abs(storePos.x - domPos.x);
    const diffY = Math.abs(storePos.y - domPos.y);
    
    if (diffX > 10 || diffY > 10) {  // Větší tolerance = méně false sync
      console.log('🔄 Major position difference, syncing:', { 
        store: storePos, 
        dom: domPos, 
        diff: { x: diffX, y: diffY }
      });
      
      // Inline update position (bez function dependency)
      if (typeof storePos.x === 'number' && typeof storePos.y === 'number' && 
          !isNaN(storePos.x) && !isNaN(storePos.y)) {
        
        const viewportWidth = window.innerWidth || 1920;
        const viewportHeight = window.innerHeight || 1080;
        const windowWidth = window.size?.width || 300;
        const windowHeight = window.size?.height || 250;
        const navigationHeight = 70;
        
        const maxX = Math.max(0, viewportWidth - windowWidth);
        const maxY = Math.max(navigationHeight, viewportHeight - windowHeight);
        
        const constrainedX = Math.max(0, Math.min(maxX, storePos.x));
        const constrainedY = Math.max(navigationHeight, Math.min(maxY, storePos.y));
        
        windowRef.current.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
        dragStateRef.current.finalX = constrainedX;
        dragStateRef.current.finalY = constrainedY;
      }
    }
  }, [window.position?.x, window.position?.y, window.size?.width, window.size?.height]); 
  // ^^^^ POUZE primitive values, žádné funkce = stabilní!

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  // Only log on mount, not on every render
  useEffect(() => {
    console.log('🪟 DraggableWindow mounted for:', window.id, 'at position:', window.position);
  }, [window.id]); // Only depend on window.id, not position

  // ============================================================
  // 🔧 NOVÝ DYNAMICKÝ Z-INDEX SYSTÉM
  // ============================================================

  // Get all windows for z-index calculation
  const allWindows = useGameStore((state) => state.windows);

  const getZIndex = useCallback(() => {
    const baseZIndex = 1000;
    
    if (dragStateRef.current?.isDragging) {
      return baseZIndex + 200;  // Dragging = highest
    }
    
    if (isActive) {
      return baseZIndex + 100;  // Active = high
    }
    
    // Window order index for stable layering
    const windowIndex = allWindows.findIndex(w => w.id === window.id);
    return baseZIndex + windowIndex;
  }, [isActive, allWindows, window.id]);

  // ============================================================
  // WINDOW STYLE S DYNAMICKÝM Z-INDEX
  // ============================================================

  const windowStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: 0,
    top: 0,
    width: window.size.width,
    height: window.isMinimized ? 'auto' : window.size.height,
    zIndex: getZIndex(),  // 🔧 Dynamický z-index místo static
    opacity: window.isMinimized ? 0.9 : 1,
    transition: dragStateRef.current?.isDragging ? 'none' : 'opacity 0.2s ease',
    willChange: 'transform',
  }), [window.size.width, window.size.height, window.isMinimized, getZIndex]);

  // Apply initial position ONLY when component mounts, not on every position change
  useEffect(() => {
    if (windowRef.current) {
      // Validate position from store
      const storeX = window.position?.x ?? 100;
      const storeY = window.position?.y ?? 100;
      
      const validX = typeof storeX === 'number' && !isNaN(storeX) ? storeX : 100;
      const validY = typeof storeY === 'number' && !isNaN(storeY) ? storeY : 100;
      
      const transform = `translate(${validX}px, ${validY}px)`;
      console.log('🏁 Applying INITIAL transform on mount:', transform, 'for window:', window.id);
      
      windowRef.current.style.transform = transform;
    }
  }, [window.id]); // ONLY depend on window.id (mount), not position

  if (!window.isVisible || window.isMinimized) {
    return null;
  }

  return (
    <div
      ref={windowRef}
      className={`game-window ${isActive ? 'game-window--active' : ''} ${window.isMinimized ? 'game-window--minimized' : ''}`}
      style={windowStyle}
      onClick={(e) => {
        e.stopPropagation();
        
        // 🔧 OVERLAP FIX - Guard pro už aktivní okna
        if (isActive) {
          console.log('💭 Window already active, skipping bringToFront:', window.id);
          return;
        }
        
        console.log('👆 Window clicked, bringing to front:', window.id);
        onBringToFront(window.id);
      }}
    >
      <div 
        className="window-header" 
        style={{ cursor: 'grab' }}
        onMouseDown={handleMouseDown}
        title="Přetáhni pro přesun okna"
      >
        <div className="window-title-area">
          <div className="window-type-icon">
            {getWindowIcon(window.type)}
          </div>
          <h3 className="window-title">{window.title}</h3>
          {/* Debug position info */}
          {process.env.NODE_ENV === 'development' && (
            <span style={{ 
              fontSize: '10px', 
              color: 'rgba(255, 255, 255, 0.6)',
              marginLeft: '8px'
            }}>
              ({Math.round(window.position.x)}, {Math.round(window.position.y)}) z:{getZIndex()}
            </span>
          )}
        </div>
        <div className="window-controls" onClick={(e) => e.stopPropagation()}>
          <button
            className="window-control window-control--minimize"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Minimize button clicked for window:', window.id);
              onToggleMinimize(window.id);
            }}
            title="Minimalizovat"
          >
            {window.isMinimized ? '□' : '_'}
          </button>
          <button
            className="window-control window-control--close"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Close button clicked for window:', window.id);
              onClose(window.id);
            }}
            title="Zavřít"
          >
            ×
          </button>
        </div>
      </div>
      
      {!window.isMinimized && (
        <div className="window-content" onClick={(e) => e.stopPropagation()}>
          {renderWindowContent(window.type)}
        </div>
      )}
      
      {/* Resize Handle */}
      {!window.isMinimized && (
        <div className="window-resize-handle" title="Přetáhni pro změnu velikosti">
          ⋱
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  return (
    prevProps.window.id === nextProps.window.id &&
    prevProps.window.size.width === nextProps.window.size.width &&
    prevProps.window.size.height === nextProps.window.size.height &&
    prevProps.window.isMinimized === nextProps.window.isMinimized &&
    prevProps.window.isVisible === nextProps.window.isVisible &&
    prevProps.window.title === nextProps.window.title &&
    prevProps.isActive === nextProps.isActive
    // Specifically NOT comparing window.position to avoid re-renders during drag
  );
});

// ============================================================
// WINDOW ICON HELPER
// ============================================================

const getWindowIcon = (type: string): string => {
  const icons = {
    'inventory': '🎒',
    'buildings': '🏗️',
    'research': '🔬',
    'province-detail': '🏰',
    'army-detail': '⚔️',
    'diplomacy': '🤝'
  };
  return icons[type as keyof typeof icons] || '📋';
};

// ============================================================
// WINDOW CONTENT RENDERER
// ============================================================

const renderWindowContent = (type: string) => {
  const selectedProvince = useGameStore((state) => state.selectedProvince);
  const gameData = useGameStore((state) => state.gameData);
  const playerData = useGameStore((state) => state.playerData);
  
  switch (type) {
    case 'inventory':
      return (
        <div className="window-content-inventory">
          <div className="inventory-header">
            <h4>💰 Inventář</h4>
            <div className="inventory-summary">Celková hodnota: 2,847 zlata</div>
          </div>
          <div className="inventory-grid">
            <div className="inventory-item">
              <span className="item-icon">💰</span>
              <div className="item-details">
                <span className="item-name">Zlato</span>
                <span className="item-value">1,250</span>
              </div>
            </div>
            <div className="inventory-item">
              <span className="item-icon">🪵</span>
              <div className="item-details">
                <span className="item-name">Dřevo</span>
                <span className="item-value">45</span>
              </div>
            </div>
            <div className="inventory-item">
              <span className="item-icon">🪨</span>
              <div className="item-details">
                <span className="item-name">Kámen</span>
                <span className="item-value">32</span>
              </div>
            </div>
            <div className="inventory-item">
              <span className="item-icon">🥖</span>
              <div className="item-details">
                <span className="item-name">Jídlo</span>
                <span className="item-value">187</span>
              </div>
            </div>
          </div>
          <div className="inventory-actions">
            <button className="inventory-btn">🏪 Obchodovat</button>
            <button className="inventory-btn">📦 Použít předmět</button>
          </div>
        </div>
      );

    case 'buildings':
      return (
        <div className="window-content-buildings">
          <div className="buildings-header">
            <h4>🏗️ Budovy</h4>
            <div className="buildings-summary">Aktivní stavby: 3</div>
          </div>
          <div className="buildings-list">
            <div className="building-item">
              <span className="building-icon">🏛️</span>
              <div className="building-info">
                <div className="building-name">Kasárna</div>
                <div className="building-level">Úroveň 2</div>
                <div className="building-status">✅ Připraveno</div>
              </div>
              <button className="building-action">⬆️</button>
            </div>
            <div className="building-item">
              <span className="building-icon">🏪</span>
              <div className="building-info">
                <div className="building-name">Trh</div>
                <div className="building-level">Úroveň 1</div>
                <div className="building-status">🔨 Stavba 2h</div>
              </div>
              <button className="building-action">⏸️</button>
            </div>
            <div className="building-item">
              <span className="building-icon">🏛️</span>
              <div className="building-info">
                <div className="building-name">Městské hradby</div>
                <div className="building-level">Úroveň 3</div>
                <div className="building-status">✅ Hotovo</div>
              </div>
              <button className="building-action">⬆️</button>
            </div>
          </div>
          <div className="buildings-actions">
            <button className="building-btn">🔨 Nová stavba</button>
            <button className="building-btn">📋 Plán budování</button>
          </div>
        </div>
      );

    case 'research':
      return (
        <div className="window-content-research">
          <div className="research-header">
            <h4>🔬 Výzkum</h4>
            <div className="research-points">Výzkumné body: 45</div>
          </div>
          <div className="research-tree">
            <div className="research-item available">
              <span className="research-icon">⚔️</span>
              <div className="research-info">
                <div className="research-name">Lepší zbraně</div>
                <div className="research-cost">15 bodů</div>
              </div>
              <button className="research-action">🔬</button>
            </div>
            <div className="research-item locked">
              <span className="research-icon">🛡️</span>
              <div className="research-info">
                <div className="research-name">Pokročilá obrana</div>
                <div className="research-cost">30 bodů</div>
              </div>
              <button className="research-action" disabled>🔒</button>
            </div>
          </div>
        </div>
      );

    case 'province-detail':
      return (
        <div className="window-content-province">
          <div className="province-header">
            <h4>🏰 {selectedProvince?.name || 'Detail provincie'}</h4>
          </div>
          {selectedProvince && (
            <div className="province-details">
              <div className="province-stats">
                <div className="stat-item">
                  <span className="stat-icon">👥</span>
                  <span className="stat-label">Obyvatelé:</span>
                  <span className="stat-value">{selectedProvince.population.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">💎</span>
                  <span className="stat-label">Zdroje:</span>
                  <span className="stat-value">{selectedProvince.resources.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📍</span>
                  <span className="stat-label">Pozice:</span>
                  <span className="stat-value">({selectedProvince.centerPosition.x}, {selectedProvince.centerPosition.y})</span>
                </div>
              </div>
              
              <div className="province-actions">
                <button className="province-btn">🚀 Poslat armádu</button>
                <button className="province-btn">🏗️ Postavit budovu</button>
                <button className="province-btn">🤝 Diplomacie</button>
              </div>
            </div>
          )}
        </div>
      );

    case 'army-detail':
      return (
        <div className="window-content-army">
          <div className="army-header">
            <h4>⚔️ Správa armády</h4>
            <div className="army-summary">Celková síla: 847</div>
          </div>
          <div className="army-units">
            {Object.entries(gameData).slice(0, 1).map(([name, data]) => (
              <div key={name} className="army-unit-group">
                <div className="unit-group-name">{name}</div>
                <div className="unit-stats">
                  <div className="unit-stat">⚔️ {data.OFF}</div>
                  <div className="unit-stat">🛡️ {data.DEFF}</div>
                  <div className="unit-stat">🏰 {data.SIEGE}</div>
                  <div className="unit-stat">🎯 {data.SPEC}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="army-actions">
            <button className="army-btn">➕ Verbovat</button>
            <button className="army-btn">🎯 Útok</button>
            <button className="army-btn">🏃 Pohyb</button>
          </div>
        </div>
      );

    case 'diplomacy':
      return (
        <div className="window-content-diplomacy">
          <div className="diplomacy-header">
            <h4>🤝 Diplomacie</h4>
          </div>
          <div className="diplomacy-sections">
            <div className="diplomacy-section">
              <h5>🏰 Aliance</h5>
              <div className="alliance-item">
                <span className="alliance-name">Severní pakt</span>
                <span className="alliance-status">✅ Člen</span>
              </div>
            </div>
            <div className="diplomacy-section">
              <h5>⚡ Vztahy</h5>
              <div className="relation-item">
                <span className="relation-player">Král Thorin</span>
                <span className="relation-status">🤝 Spojenec</span>
              </div>
              <div className="relation-item">
                <span className="relation-player">Temný pán</span>
                <span className="relation-status">⚔️ Nepřítel</span>
              </div>
            </div>
          </div>
          <div className="diplomacy-actions">
            <button className="diplomacy-btn">📜 Návrh smlouvy</button>
            <button className="diplomacy-btn">⚔️ Vyhlásit válku</button>
          </div>
        </div>
      );

    default:
      return (
        <div className="window-content-default">
          <p>Obsah okna typu: {type}</p>
        </div>
      );
  }
};

// ============================================================
// MAIN WINDOW MANAGER COMPONENT
// ============================================================

const WindowManager: React.FC = () => {
  // Store selectors
  const windows = useGameStore((state) => state.windows);
  const activeWindow = useGameStore((state) => state.activeWindow);
  const windowOrder = useGameStore((state) => state.windowOrder);
  const isDraggingWindow = useGameStore((state) => state.isDraggingWindow);
  
  // Actions
  const bringToFront = useGameStore((state) => state.bringToFront);
  const closeWindow = useGameStore((state) => state.closeWindow);
  const toggleWindow = useGameStore((state) => state.toggleWindow);
  const setWindowPosition = useGameStore((state) => state.setWindowPosition);
  const setWindowDragging = useGameStore((state) => state.setWindowDragging);

  // Keyboard shortcuts for windows
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeWindow) {
        closeWindow(activeWindow);
      }
      if (e.key === 'Tab' && e.altKey && windows.length > 1) {
        e.preventDefault();
        const currentIndex = windowOrder.indexOf(activeWindow || '');
        const nextIndex = (currentIndex + 1) % windowOrder.length;
        const nextWindowId = windowOrder[nextIndex];
        if (nextWindowId) {
          bringToFront(nextWindowId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [activeWindow, windows, windowOrder, closeWindow, bringToFront]);

  // Memoized callbacks with throttling
  const handleBringToFront = useCallback((id: string) => {
    bringToFront(id);
  }, [bringToFront]);

  const handleClose = useCallback((id: string) => {
    closeWindow(id);
  }, [closeWindow]);

  const handleToggleMinimize = useCallback((id: string) => {
    toggleWindow(id);
  }, [toggleWindow]);

  // Throttled position updates to prevent spam
  const throttledPositionUpdates = useRef(new Map<string, number>());
  
  const handlePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
    const now = Date.now();
    const lastUpdate = throttledPositionUpdates.current.get(id) || 0;
    
    // Throttle to max 10 updates per second per window
    if (now - lastUpdate < 100) {
      return;
    }
    
    throttledPositionUpdates.current.set(id, now);
    setWindowPosition(id, position);
  }, [setWindowPosition]);

  const handleDragStateChange = useCallback((isDragging: boolean) => {
    setWindowDragging(isDragging);
  }, [setWindowDragging]);

  // ============================================================
  // 🔧 STABILNÍ WINDOWS - BEZ SORTING
  // ============================================================

  // PŮVODNĚ PROBLEMATICKÉ:
  /*
  const sortedWindows = useMemo(() => {
    return [...windows].sort((a, b) => {
      const aIndex = windowOrder.indexOf(a.id);
      const bIndex = windowOrder.indexOf(b.id);
      return aIndex - bIndex;  // ← ZPŮSOBUJE DOM REORDERING
    });
  }, [windows, windowOrder]);  // ← windowOrder dependency
  */

  // NOVÉ STABILNÍ - žádné sorting, z-index řeší layering:
  const stableWindows = useMemo(() => {
    // Windows v původním pořadí, z-index řeší vrstvy
    return windows;
  }, [windows]);  // ← POUZE windows dependency = stabilní

  // Cleanup throttle map when component unmounts
  useEffect(() => {
    return () => {
      throttledPositionUpdates.current.clear();
    };
  }, []);

  return (
    <div className="window-manager">
      {stableWindows.map((window) => (
        <DraggableWindow
          key={window.id}
          window={window}
          isActive={activeWindow === window.id}
          onBringToFront={handleBringToFront}
          onClose={handleClose}
          onToggleMinimize={handleToggleMinimize}
          onPositionChange={handlePositionChange}
          onDragStateChange={handleDragStateChange}
        />
      ))}
      
      {/* Window Management Shortcuts */}
      {windows.length > 0 && (
        <div className="window-shortcuts">
          <div className="shortcuts-content">
            ESC: Zavřít aktivní | Alt+Tab: Přepnout okna | Drag: Přesunout
          </div>
        </div>
      )}
      
      {/* Debug Panel for Window Management (dev only) */}
      {process.env.NODE_ENV === 'development' && windows.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '150px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: '#34d399',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '10px',
          fontFamily: 'monospace',
          zIndex: 1100,
          border: '1px solid rgba(52, 211, 153, 0.3)',
          maxWidth: '250px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🪟 Z-Index Window System:</div>
          <div>Count: {windows.length} | Active: {activeWindow?.slice(-8)}</div>
          <div style={{ color: isDraggingWindow ? '#fbbf24' : '#34d399' }}>
            Status: {isDraggingWindow ? 'DRAGGING' : 'IDLE'}
          </div>
          <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '4px' }}>
            Stable Order: [{windows.map(w => w.id.slice(-4)).join(' → ')}]
          </div>
          {!isDraggingWindow && windows.map(w => (
            <div key={w.id} style={{ fontSize: '8px', opacity: 0.8 }}>
              {w.type}: ({Math.round(w.position?.x || 0)}, {Math.round(w.position?.y || 0)})
              {w.isMinimized ? ' [MIN]' : ''}
              {activeWindow === w.id ? ' [ACTIVE]' : ''}
            </div>
          ))}
          {isDraggingWindow && (
            <div style={{ fontSize: '8px', color: '#fbbf24', marginTop: '4px' }}>
              Z-Index handling active drag
            </div>
          )}
        </div>
      )}

      {/* Visual Drag Indicator */}
      {isDraggingWindow && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(74, 144, 226, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 1500,
          pointerEvents: 'none',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          animation: 'pulse 1s ease-in-out infinite'
        }}>
          🚀 Přesouvání okna...
        </div>
      )}
    </div>
  );
};

export default WindowManager;