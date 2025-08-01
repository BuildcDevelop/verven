// src/pages/InteractivePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConvex } from 'convex/react';
import { createGameService } from '../services/GameService';
import { useGameDatabase } from '../hooks/useGameDatabase';
import { useGameStore } from '../stores/gameStore';

// Import komponent z interactive složky
import Navigation from '../components/interactive/Navigation';
import InteractiveMap from '../components/interactive/InteractiveMap';
import WindowManager from '../components/interactive/WindowManager';

// ============================================================
// TYPY PRO KOMPONENTU
// ============================================================

interface User {
  id: number;
  username: string;
  email: string;
}

// ============================================================
// INTERACTIVE PAGE KOMPONENTA
// ============================================================

const InteractivePage: React.FC = () => {
  const navigate = useNavigate();
  const convex = useConvex();
  
  // Game Service a Database Hook
  const gameService = createGameService(convex);
  const { gameState, loading, error } = useGameDatabase();
  
  // Game Store
  const { initializeMockData, openWindow } = useGameStore();
  
  // Local State pro demo
  const [user] = useState<User | null>({
    id: 1,
    username: 'TestUser',
    email: 'test@verven.game'
  });
  
  const [gameTime, setGameTime] = useState(0);
  const [score] = useState(1250);
  const [level] = useState(3);

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    // Inicializuj mock data pro demonstraci
    initializeMockData();
    
    // Nastav default okna pro demo s malým delay
    const timer1 = setTimeout(() => {
    openWindow('inventory'); // Automaticky: "Inventář"
  }, 1000);

  const timer2 = setTimeout(() => {
    openWindow('army-detail', undefined, {
      data: { provinceName: 'Severní království' }
    }); // Automaticky: "Armáda: Severní království"
  }, 1500);

  return () => {
    clearTimeout(timer1);
    clearTimeout(timer2);
  };
}, [initializeMockData, openWindow]);

// ============================================================
// PŘÍKLADY PRO RŮZNÉ TYPY OKEN
// ============================================================

// Funkcce pro otevírání oken s kontextem:
const openProvinceDetail = (provinceName: string) => {
  openWindow('province-detail', undefined, {
    data: { provinceName }
  }); // Automaticky: "Provincie: [název]"
};

const openArmyDetail = (provinceName: string) => {
  openWindow('army-detail', undefined, {
    data: { provinceName }
  }); // Automaticky: "Armáda: [název]"
};

const openBuildingsManager = () => {
  openWindow('buildings'); // Automaticky: "Správa budov"
};

const openResearchTree = () => {
  openWindow('research'); // Automaticky: "Výzkum technologií"
};

const openDiplomacy = () => {
  openWindow('diplomacy'); // Automaticky: "Diplomacie & Aliance"
};

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const handleProvinceClick = (provinceName: string) => {
  console.log('🏰 Opening province detail for:', provinceName);
  openProvinceDetail(provinceName);
};

const handleArmyManagement = (provinceName: string) => {
  console.log('⚔️ Opening army management for:', provinceName);
  openArmyDetail(provinceName);
};

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 25%, #3d7ab8 50%, #2d5a87 75%, #1e3a5f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '1rem',
          padding: '2rem',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            🎮
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '0.5rem'
          }}>
            Načítání Verven Interactive Map...
          </h2>
          <p style={{
            opacity: 0.8,
            fontSize: '0.9rem'
          }}>
            Připravujeme vojenské jednotky a provincie
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '1rem',
          padding: '2rem',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Chyba při načítání
          </h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginRight: '1rem'
            }}
          >
            Obnovit stránku
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            Zpět domů
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // HLAVNÍ RENDER
  // ============================================================

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 25%, #3d7ab8 50%, #2d5a87 75%, #1e3a5f 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Navigation */}
      <Navigation
        user={user}
        onLogout={handleLogout}
        showGameControls={true}
        gameState="playing"
        score={score}
        level={level}
        gameTime={gameTime}
      />

      {/* Hlavní obsah - Interactive Map */}
      <div style={{
        position: 'relative',
        height: 'calc(100vh - 70px)',
        marginTop: '70px'
      }}>
        <InteractiveMap />
        <WindowManager />
      </div>

      {/* Quick Actions Panel - levý horní roh */}
      <div style={{
        position: 'fixed',
        top: '90px',
        left: '20px',
        background: 'rgba(20, 25, 35, 0.9)',
        border: '1px solid rgba(100, 120, 150, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        backdropFilter: 'blur(15px)',
        zIndex: 50,
        minWidth: '200px'
      }}>
        <h3 style={{
          color: '#4a90e2',
          margin: '0 0 12px 0',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          🎮 Rychlé akce
        </h3>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {[
            { 
              label: '🏰 Vybudovat pevnost', 
              action: () => openWindow('buildings', 'Stavění budov', { position: { x: 100, y: 100 } })
            },
            { 
              label: '⚔️ Verbovat armádu', 
              action: () => openWindow('army-detail', 'Správa armády', { position: { x: 150, y: 150 } })
            },
            { 
              label: '🤝 Diplomacie', 
              action: () => openWindow('diplomacy', 'Diplomatické vztahy', { position: { x: 200, y: 200 } })
            },
            { 
              label: '🔬 Výzkum', 
              action: () => openWindow('research', 'Technologický strom', { position: { x: 250, y: 250 } })
            }
          ].map((button, index) => (
            <button
              key={index}
              onClick={button.action}
              style={{
                background: 'rgba(74, 144, 226, 0.2)',
                border: '1px solid rgba(74, 144, 226, 0.4)',
                borderRadius: '6px',
                color: '#e8eaed',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(74, 144, 226, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(74, 144, 226, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>

      {/* Informační panel - pravý dolní roh */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(20, 25, 35, 0.9)',
        border: '1px solid rgba(100, 120, 150, 0.3)',
        borderRadius: '12px',
        padding: '12px',
        backdropFilter: 'blur(15px)',
        zIndex: 50,
        fontSize: '12px',
        color: '#e8eaed',
        maxWidth: '300px'
      }}>
        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
          ⌨️ Ovládání:
        </div>
        <div>• Drag & Drop - přesouvání oken</div>
        <div>• Kolečko myši - zoom mapy</div>
        <div>• Klik na provincii - detaily</div>
        <div>• C = center | S = přepnout jednotky</div>
      </div>

    </div>
  );
};

// ============================================================
// EXPORT DEFAULT
// ============================================================
export default InteractivePage;