// src/components/interactive/WindowManager.tsx
import React, { useCallback, useMemo } from 'react';
import { useGameStore, type GameWindow } from '../../stores/gameStore';
import './styles/WindowManager.css';

// ============================================================
// DRAGGABLE WINDOW COMPONENT
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
  onPositionChange,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('window-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - window.position.x,
        y: e.clientY - window.position.y,
      });
      onBringToFront(window.id);
    }
  }, [window.position, window.id, onBringToFront]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y)),
      };
      onPositionChange(window.id, newPosition);
    }
  }, [isDragging, dragOffset, window.id, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const windowStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: window.position.x,
    top: window.position.y,
    width: window.size.width,
    height: window.isMinimized ? 'auto' : window.size.height,
    zIndex: isActive ? 1000 : 900,
  }), [window.position, window.size, window.isMinimized, isActive]);

  if (!window.isVisible) return null;

  return (
    <div
      className={`game-window ${isActive ? 'game-window--active' : ''} ${window.isMinimized ? 'game-window--minimized' : ''}`}
      style={windowStyle}
      onMouseDown={handleMouseDown}
    >
      <div className="window-header">
        <h3 className="window-title">{window.title}</h3>
        <div className="window-controls">
          <button
            className="window-control window-control--minimize"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize(window.id);
            }}
          >
            {window.isMinimized ? '□' : '_'}
          </button>
          <button
            className="window-control window-control--close"
            onClick={(e) => {
              e.stopPropagation();
              onClose(window.id);
            }}
          >
            ×
          </button>
        </div>
      </div>
      {!window.isMinimized && (
        <div className="window-content">
          {renderWindowContent(window.type)}
        </div>
      )}
    </div>
  );
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
          <h4>Inventář</h4>
          <div className="inventory-grid">
            <div className="inventory-item">
              <span className="item-icon">💰</span>
              <span className="item-name">Zlato:</span>
              <span className="item-value">1,250</span>
            </div>
            <div className="inventory-item">
              <span className="item-icon">🪵</span>
              <span className="item-name">Dřevo:</span>
              <span className="item-value">45</span>
            </div>
            <div className="inventory-item">
              <span className="item-icon">🪨</span>
              <span className="item-name">Kámen:</span>
              <span className="item-value">32</span>
            </div>
            <div className="inventory-item">
              <span className="item-icon">🍞</span>
              <span className="item-name">Jídlo:</span>
              <span className="item-value">89</span>
            </div>
          </div>
        </div>
      );
      
    case 'buildings':
      return (
        <div className="window-content-buildings">
          <h4>Budovy</h4>
          <div className="buildings-list">
            <div className="building-item">
              <span className="building-icon">🏰</span>
              <span className="building-info">
                <div className="building-name">Kasárna</div>
                <div className="building-level">Úroveň 2</div>
              </span>
              <button className="building-upgrade-btn">⬆️</button>
            </div>
            <div className="building-item">
              <span className="building-icon">🏪</span>
              <span className="building-info">
                <div className="building-name">Trh</div>
                <div className="building-level">Úroveň 1</div>
              </span>
              <button className="building-upgrade-btn">⬆️</button>
            </div>
            <div className="building-item">
              <span className="building-icon">🏛️</span>
              <span className="building-info">
                <div className="building-name">Městské hradby</div>
                <div className="building-level">Úroveň 3</div>
              </span>
              <button className="building-upgrade-btn">⬆️</button>
            </div>
          </div>
        </div>
      );
      
    case 'research':
      return (
        <div className="window-content-research">
          <h4>Výzkum</h4>
          <div className="research-tree">
            <div className="research-item research-item--completed">
              <span className="research-icon">🌾</span>
              <span className="research-name">Zemědělství</span>
              <span className="research-status">✅ Dokončeno</span>
            </div>
            <div className="research-item research-item--in-progress">
              <span className="research-icon">⚒️</span>
              <span className="research-name">Kovářství</span>
              <div className="research-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '65%' }}></div>
                </div>
                <span className="research-status">65%</span>
              </div>
            </div>
            <div className="research-item research-item--available">
              <span className="research-icon">🏗️</span>
              <span className="research-name">Architektura</span>
              <button className="research-start-btn">Začít výzkum</button>
            </div>
          </div>
        </div>
      );
      
    case 'province-detail':
      return (
        <div className="window-content-province">
          <h4>Detail provincie</h4>
          {selectedProvince ? (
            <div className="province-detail">
              <div className="province-stat">
                <strong>Název:</strong> {selectedProvince.name}
              </div>
              <div className="province-stat">
                <strong>Obyvatelé:</strong> {selectedProvince.population.toLocaleString()}
              </div>
              <div className="province-stat">
                <strong>Zdroje:</strong> {selectedProvince.resources}
              </div>
              <div className="province-actions">
                <button className="province-action-btn">🔧 Upravit</button>
                <button className="province-action-btn">💰 Obchodovat</button>
                <button className="province-action-btn">⚔️ Rekrutovat</button>
              </div>
            </div>
          ) : (
            <div className="no-province-selected">
              <p>🗺️ Žádná provincie není vybrána.</p>
              <p style={{ fontSize: '12px', color: '#666' }}>
                Klikněte na provincii na mapě pro zobrazení detailů.
              </p>
            </div>
          )}
        </div>
      );
      
    case 'army-detail':
      return (
        <div className="window-content-army">
          <h4>Detail armády</h4>
          {selectedProvince && gameData[selectedProvince.name] ? (
            <div className="army-stats">
              <div className="army-stat">
                <span className="army-icon">⚔️</span>
                <div className="army-info">
                  <div className="army-name">Útočné jednotky</div>
                  <div className="army-value">{gameData[selectedProvince.name].OFF}</div>
                </div>
              </div>
              <div className="army-stat">
                <span className="army-icon">🛡️</span>
                <div className="army-info">
                  <div className="army-name">Obranné jednotky</div>
                  <div className="army-value">{gameData[selectedProvince.name].DEFF}</div>
                </div>
              </div>
              <div className="army-stat">
                <span className="army-icon">🏰</span>
                <div className="army-info">
                  <div className="army-name">Obléhací stroje</div>
                  <div className="army-value">{gameData[selectedProvince.name].SIEGE}</div>
                </div>
              </div>
              <div className="army-stat">
                <span className="army-icon">🎯</span>
                <div className="army-info">
                  <div className="army-name">Speciální jednotky</div>
                  <div className="army-value">{gameData[selectedProvince.name].SPEC}</div>
                </div>
              </div>
            </div>
          ) : (
            <p>Žádná armáda není vybrána.</p>
          )}
        </div>
      );
      
    case 'diplomacy':
      return (
        <div className="window-content-diplomacy">
          <h4>Diplomacie</h4>
          <div className="diplomacy-content">
            <div className="diplomacy-section">
              <h5>🤝 Aliance</h5>
              <div className="alliance-info">
                <div className="alliance-item">
                  <span className="alliance-name">Severní pakt</span>
                  <span className="alliance-status">Aktivní</span>
                </div>
              </div>
            </div>
            
            <div className="diplomacy-section">
              <h5>⚔️ Konflikty</h5>
              <div className="conflicts-info">
                <div className="conflict-item">
                  <span className="conflict-name">Válka s Temným řádem</span>
                  <span className="conflict-duration">12 dní</span>
                </div>
              </div>
            </div>
            
            <div className="diplomacy-section">
              <h5>📜 Smlouvy</h5>
              <div className="treaties-info">
                <div className="treaty-item">
                  <span className="treaty-name">Obchodní dohoda</span>
                  <span className="treaty-partner">Zlatá liga</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      
    default:
      return (
        <div className="window-content-default">
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            <p>📋 Obsah okna typu: <strong>{type}</strong></p>
            <p style={{ fontSize: '12px' }}>
              Tento typ okna ještě není implementován.
            </p>
          </div>
        </div>
      );
  }
};

// ============================================================
// MAIN WINDOW MANAGER COMPONENT
// ============================================================

const WindowManager: React.FC = () => {
  // Použijeme jednotlivé selektory místo složeného objektu
  const windows = useGameStore((state) => state.windows);
  const activeWindow = useGameStore((state) => state.activeWindow);
  const windowOrder = useGameStore((state) => state.windowOrder);
  
  // Actions
  const bringToFront = useGameStore((state) => state.bringToFront);
  const closeWindow = useGameStore((state) => state.closeWindow);
  const toggleWindow = useGameStore((state) => state.toggleWindow);
  const setWindowPosition = useGameStore((state) => state.setWindowPosition);

  // Memoizované callback funkce
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

  // Seřadíme okna podle windowOrder
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
      
      {/* Keyboard shortcuts helper */}
      {windows.length > 0 && (
        <div className="window-shortcuts">
          <div className="shortcuts-content">
            ESC: Zavřít aktivní okno | F1: Nápověda | TAB: Přepnout okna
          </div>
        </div>
      )}
    </div>
  );
};

export default WindowManager;