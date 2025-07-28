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
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({
  window,
  isActive,
  onBringToFront,
  onClose,
  onToggleMinimize,
  onPositionChange
}) => {
  // Refs pro smooth dragging
  const windowRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    windowStartX: 0,
    windowStartY: 0
  });
  const animationFrameRef = useRef<number>();

  // ============================================================
  // SMOOTH DRAG HANDLERS (60fps) - FIXED VERSION
  // ============================================================

  const updateWindowPosition = useCallback((x: number, y: number) => {
    if (!windowRef.current) return;
    
    // Get actual viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Ensure window stays within bounds
    const maxX = Math.max(0, viewportWidth - window.size.width);
    const maxY = Math.max(0, viewportHeight - window.size.height - 70); // 70px for navigation
    
    const constrainedX = Math.max(0, Math.min(maxX, x));
    const constrainedY = Math.max(70, Math.min(maxY + 70, y)); // Navigation offset
    
    console.log('updateWindowPosition:', {
      input: { x, y },
      constrained: { x: constrainedX, y: constrainedY },
      viewport: { viewportWidth, viewportHeight },
      windowSize: window.size
    });
    
    // Apply transform immediately for 60fps smooth movement
    const transform = `translate(${constrainedX}px, ${constrainedY}px)`;
    windowRef.current.style.transform = transform;
    
    console.log('Applied transform:', transform);
    
    // Debounced store update
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      console.log('Updating store position:', { x: constrainedX, y: constrainedY });
      onPositionChange(window.id, { x: constrainedX, y: constrainedY });
    });
  }, [window.id, window.size, onPositionChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't drag when clicking control buttons
    const target = e.target as HTMLElement;
    if (target.classList.contains('window-control') || target.closest('.window-controls')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Starting drag for window:', window.id, 'at position:', window.position);
    
    // Bring to front immediately
    onBringToFront(window.id);
    
    // Get current actual position from DOM element
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Set up drag state with actual current position
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      windowStartX: rect.left,
      windowStartY: rect.top
    };
    
    console.log('Drag state initialized:', dragStateRef.current);
    
    // Add global listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    
    // Add dragging class for visual feedback
    if (windowRef.current) {
      windowRef.current.classList.add('window--dragging');
    }
  }, [window.id, window.position, onBringToFront]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;
    
    e.preventDefault();
    
    // Calculate new position based on mouse delta
    const deltaX = e.clientX - dragStateRef.current.startX;
    const deltaY = e.clientY - dragStateRef.current.startY;
    
    const newX = dragStateRef.current.windowStartX + deltaX;
    const newY = dragStateRef.current.windowStartY + deltaY;
    
    console.log('Mouse move - Delta:', { deltaX, deltaY }, 'New position:', { newX, newY });
    
    // Update position smoothly
    updateWindowPosition(newX, newY);
  }, [updateWindowPosition]);

  const handleMouseUp = useCallback(() => {
    if (!dragStateRef.current.isDragging) return;
    
    console.log('Drag ended for window:', window.id);
    
    dragStateRef.current.isDragging = false;
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Remove dragging class
    if (windowRef.current) {
      windowRef.current.classList.remove('window--dragging');
    }
    
    // Final position update
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [handleMouseMove, window.id]);

  // ============================================================
  // CLEANUP AND ERROR HANDLING
  // ============================================================

  useEffect(() => {
    // Cleanup function to remove any lingering listeners
    const cleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    return cleanup;
  }, [handleMouseMove, handleMouseUp]);

  // Debug: Log when component re-renders
  useEffect(() => {
    console.log('DraggableWindow re-rendered for window:', window.id, 'position:', window.position);
  });

  // ============================================================
  // WINDOW STYLE WITH CLEAN POSITIONING
  // ============================================================

  const windowStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: 0,
    top: 0,
    // IMPORTANT: Don't set transform here if we're setting it manually
    // transform: `translate(${window.position.x}px, ${window.position.y}px)`,
    width: window.size.width,
    height: window.isMinimized ? 'auto' : window.size.height,
    zIndex: isActive ? 1000 : 900,
    opacity: window.isMinimized ? 0.9 : 1,
    transition: dragStateRef.current?.isDragging ? 'none' : 'opacity 0.2s ease, z-index 0s',
    willChange: 'transform', // Optimize for animations
  }), [window.size, window.isMinimized, isActive]);

  // Apply initial position when component mounts or position changes from store
  useEffect(() => {
    if (windowRef.current && !dragStateRef.current.isDragging) {
      const transform = `translate(${window.position.x}px, ${window.position.y}px)`;
      console.log('Applying initial/updated transform:', transform, 'for window:', window.id);
      windowRef.current.style.transform = transform;
    }
  }, [window.position.x, window.position.y, window.id]);

  if (!window.isVisible) return null;

  return (
    <div
      ref={windowRef}
      className={`game-window ${isActive ? 'game-window--active' : ''} ${window.isMinimized ? 'game-window--minimized' : ''}`}
      style={windowStyle}
      onClick={(e) => {
        // Bring window to front when clicked anywhere
        e.stopPropagation();
        console.log('Window clicked, bringing to front:', window.id);
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
              ({Math.round(window.position.x)}, {Math.round(window.position.y)})
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
            title={window.isMinimized ? 'Obnovit' : 'Minimalizovat'}
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
};

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
  
  // Actions
  const bringToFront = useGameStore((state) => state.bringToFront);
  const closeWindow = useGameStore((state) => state.closeWindow);
  const toggleWindow = useGameStore((state) => state.toggleWindow);
  const setWindowPosition = useGameStore((state) => state.setWindowPosition);

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

  // Memoized callbacks
  const handleBringToFront = useCallback((id: string) => {
    bringToFront(id);
  }, [bringToFront]);

  const handleClose = useCallback((id: string) => {
    closeWindow(id);
  }, [closeWindow]);

  const handleToggleMinimize = useCallback((id: string) => {
    toggleWindow(id);
  }, [toggleWindow]);

  const handlePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
    setWindowPosition(id, position);
  }, [setWindowPosition]);

  // Sort windows by order
  const sortedWindows = useMemo(() => {
    return [...windows].sort((a, b) => {
      const aIndex = windowOrder.indexOf(a.id);
      const bIndex = windowOrder.indexOf(b.id);
      return aIndex - bIndex;
    });
  }, [windows, windowOrder]);

  return (
    <div className="window-manager">
      {sortedWindows.map((window) => (
        <DraggableWindow
          key={window.id}
          window={window}
          isActive={activeWindow === window.id}
          onBringToFront={handleBringToFront}
          onClose={handleClose}
          onToggleMinimize={handleToggleMinimize}
          onPositionChange={handlePositionChange}
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
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🪟 Window Debug:</div>
          <div>Count: {windows.length} | Active: {activeWindow?.slice(-8)}</div>
          <div>Order: [{windowOrder.map(id => id.slice(-4)).join(', ')}]</div>
          {windows.map(w => (
            <div key={w.id} style={{ fontSize: '9px', opacity: 0.8 }}>
              {w.id.slice(-8)}: ({Math.round(w.position.x)}, {Math.round(w.position.y)})
              {w.isMinimized ? ' [MIN]' : ''}
              {activeWindow === w.id ? ' [ACTIVE]' : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WindowManager;