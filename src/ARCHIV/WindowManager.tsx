// WindowManager.tsx - Opravená komponenta bez nekonečné smyčky
import React, { useCallback, useMemo } from 'react';
import { useGameStore } from './gameStore';
import './WindowManager.css';

interface GameWindow {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isVisible: boolean;
  isMinimized: boolean;
}

// Draggable Window Component
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

// Window content renderer
const renderWindowContent = (type: string) => {
  const selectedProvince = useGameStore((state) => state.selectedProvince);
  
  switch (type) {
    case 'inventory':
      return (
        <div className="window-content-inventory">
          <h4>Inventář</h4>
          <div className="inventory-grid">
            <div className="inventory-item">Zlato: 1,250</div>
            <div className="inventory-item">Dřevo: 45</div>
            <div className="inventory-item">Kámen: 32</div>
            <div className="inventory-item">Jídlo: 89</div>
          </div>
        </div>
      );
    case 'buildings':
      return (
        <div className="window-content-buildings">
          <h4>Budovy</h4>
          <div className="buildings-list">
            <div className="building-item">Kasárna - Úroveň 2</div>
            <div className="building-item">Trh - Úroveň 1</div>
            <div className="building-item">Městské hradby - Úroveň 3</div>
          </div>
        </div>
      );
    case 'research':
      return (
        <div className="window-content-research">
          <h4>Výzkum</h4>
          <div className="research-tree">
            <div className="research-item research-item--completed">Zemědělství</div>
            <div className="research-item research-item--in-progress">Kovářství (65%)</div>
            <div className="research-item research-item--available">Architektura</div>
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
                <strong>Zdroje:</strong> {selectedProvince.resources.join(', ')}
              </div>
              <div className="province-actions">
                <button className="province-action-btn">Upravit</button>
                <button className="province-action-btn">Obchodovat</button>
                <button className="province-action-btn">Rekrutovat</button>
              </div>
            </div>
          ) : (
            <p>Žádná provincie není vybrána.</p>
          )}
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

// Main WindowManager Component
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
    </div>
  );
};

export default WindowManager;