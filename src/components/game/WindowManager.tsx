// src/components/game/WindowManager.tsx
import React from 'react';
import FloatingWindow from './FloatingWindow';
import { useWindows } from '../../stores/gameStore';
import { GameWindow } from '../../types/game';
import './FloatingWindow.css';

/* WindowContent.css - inline pro teď */
const windowContentStyles = `
.army-detail-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(52, 211, 153, 0.2);
}

.army-detail-header h3 {
  color: #34d399;
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.coordinates {
  color: #a7f3d0;
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.8;
}

.army-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.army-stat {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.3), rgba(52, 211, 153, 0.1));
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
}

.army-stat:hover {
  border-color: rgba(52, 211, 153, 0.4);
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.4), rgba(52, 211, 153, 0.2));
  transform: translateY(-2px);
}

.army-stat-icon {
  font-size: 1.5rem;
  min-width: 2rem;
  text-align: center;
}

.army-stat-info {
  flex: 1;
}

.army-stat-label {
  color: #facc15;
  font-weight: bold;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.army-stat-value {
  color: white;
  font-size: 1.4rem;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.army-stat-desc {
  color: #a7f3d0;
  font-size: 0.75rem;
  opacity: 0.8;
  line-height: 1.2;
}

.player-detail-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(52, 211, 153, 0.2);
}

.player-detail-header h3 {
  color: #34d399;
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-info-item {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.3), rgba(52, 211, 153, 0.1));
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.player-info-item:hover {
  border-color: rgba(52, 211, 153, 0.4);
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.4), rgba(52, 211, 153, 0.2));
}

.player-info-icon {
  font-size: 1.5rem;
  min-width: 2rem;
  text-align: center;
}

.player-info-content {
  flex: 1;
}

.player-info-label {
  color: #facc15;
  font-weight: bold;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.player-info-value {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .army-stats {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .army-stat,
  .player-info-item {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .army-stat-icon,
  .player-info-icon {
    font-size: 1.25rem;
    min-width: 1.5rem;
  }
  
  .army-stat-value {
    font-size: 1.2rem;
  }
  
  .army-detail-header h3,
  .player-detail-header h3 {
    font-size: 1.1rem;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = windowContentStyles;
  document.head.appendChild(styleElement);
}

// Content komponenty pro různé typy oken
const ArmyDetailContent: React.FC<{ window: GameWindow }> = ({ window }) => {
  const { province } = window.content || {};
  
  if (!province) {
    return <div>Žádné data o provincii</div>;
  }

  if (province.type === 'own') {
    // Vlastní provincie - zobraz vojenské jednotky
    const army = province.army || { OFF: 0, DEFF: 0, SIEGE: 0, SPEC: 0 };
    
    return (
      <div className="army-detail">
        <div className="army-detail-header">
          <h3>{province.name}</h3>
          <p className="coordinates">({province.gridX}/{province.gridY})</p>
        </div>
        
        <div className="army-stats">
          <div className="army-stat">
            <div className="army-stat-icon">⚔️</div>
            <div className="army-stat-info">
              <div className="army-stat-label">OFF</div>
              <div className="army-stat-value">{army.OFF}</div>
              <div className="army-stat-desc">Útočné jednotky</div>
            </div>
          </div>
          
          <div className="army-stat">
            <div className="army-stat-icon">🛡️</div>
            <div className="army-stat-info">
              <div className="army-stat-label">DEFF</div>
              <div className="army-stat-value">{army.DEFF}</div>
              <div className="army-stat-desc">Obranné jednotky</div>
            </div>
          </div>
          
          <div className="army-stat">
            <div className="army-stat-icon">🏰</div>
            <div className="army-stat-info">
              <div className="army-stat-label">SIEGE</div>
              <div className="army-stat-value">{army.SIEGE}</div>
              <div className="army-stat-desc">Obléhací jednotky</div>
            </div>
          </div>
          
          <div className="army-stat">
            <div className="army-stat-icon">✨</div>
            <div className="army-stat-info">
              <div className="army-stat-label">SPEC</div>
              <div className="army-stat-value">{army.SPEC}</div>
              <div className="army-stat-desc">Speciální jednotky</div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Cizí provincie - zobraz informace o hráči
    const player = province.player || { player: 'Neznámý', alliance: 'Žádná' };
    
    return (
      <div className="player-detail">
        <div className="player-detail-header">
          <h3>{province.name}</h3>
          <p className="coordinates">({province.gridX}/{province.gridY})</p>
        </div>
        
        <div className="player-info">
          <div className="player-info-item">
            <div className="player-info-icon">👤</div>
            <div className="player-info-content">
              <div className="player-info-label">Vládce</div>
              <div className="player-info-value">{player.player}</div>
            </div>
          </div>
          
          <div className="player-info-item">
            <div className="player-info-icon">🤝</div>
            <div className="player-info-content">
              <div className="player-info-label">Aliance</div>
              <div className="player-info-value">{player.alliance}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

const VillageOverviewContent: React.FC<{ window: GameWindow }> = ({ window }) => {
  return (
    <div className="village-overview">
      <h3>Přehled vesnice</h3>
      <p>Zde bude přehled vesnice s budovami, produkcí a jednotkami.</p>
      {/* TODO: Implementovat detailní přehled vesnice */}
    </div>
  );
};

const AllianceContent: React.FC<{ window: GameWindow }> = ({ window }) => {
  return (
    <div className="alliance-overview">
      <h3>Aliance</h3>
      <p>Zde bude správa aliance, členové, eventy a komunikace.</p>
      {/* TODO: Implementovat alianční systém */}
    </div>
  );
};

const SettingsContent: React.FC<{ window: GameWindow }> = ({ window }) => {
  return (
    <div className="settings">
      <h3>Nastavení</h3>
      <p>Zde budou herní nastavení, audio preference a ovládání.</p>
      {/* TODO: Implementovat nastavení */}
    </div>
  );
};

// Mapping typů oken na komponenty
const windowComponents = {
  'army-detail': ArmyDetailContent,
  'village-overview': VillageOverviewContent,
  'alliance': AllianceContent,
  'settings': SettingsContent,
} as const;

const WindowManager: React.FC = () => {
  const { windows, windowOrder } = useWindows();

  const renderWindowContent = (window: GameWindow) => {
    const ContentComponent = windowComponents[window.type];
    
    if (!ContentComponent) {
      return <div>Neznámý typ okna: {window.type}</div>;
    }
    
    return <ContentComponent window={window} />;
  };

  return (
    <div className="window-manager">
      {windows.map((window) => {
        const zIndex = 1000 + windowOrder.indexOf(window.id);
        
        return (
          <FloatingWindow
            key={window.id}
            window={window}
            zIndex={zIndex}
          >
            {renderWindowContent(window)}
          </FloatingWindow>
        );
      })}
    </div>
  );
};

export default WindowManager;