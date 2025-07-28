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
      openWindow('inventory', 'Inventář');
    }, 500);
    
    const timer2 = setTimeout(() => {
      openWindow('province-detail', 'Detail provincie');
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [initializeMockData, openWindow]);

  // Game timer
  useEffect(() => {
    const timer = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const handleOpenInventory = () => {
    openWindow('inventory', 'Inventář');
  };

  const handleOpenBuildings = () => {
    openWindow('buildings', 'Budovy');
  };

  const handleOpenResearch = () => {
    openWindow('research', 'Výzkum');
  };

  const handleOpenDiplomacy = () => {
    openWindow('diplomacy', 'Diplomacie');
  };

  // ============================================================
  // LOADING & ERROR STATES
  // ============================================================

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 25%, #0f766e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem', fontSize: '3rem' }}>⚔️</div>
          <div>Načítám herní svět...</div>
          <div style={{ fontSize: '0.9rem', color: '#a7f3d0', marginTop: '0.5rem' }}>
            Připravuji interaktivní mapu pro Verven
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 25%, #0f766e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ 
          textAlign: 'center',
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: '0.5rem',
          padding: '2rem',
          maxWidth: '400px'
        }}>
          <h2 style={{ marginBottom: '1rem', color: '#fca5a5' }}>Chyba načítání</h2>
          <p style={{ marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
            onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
          >
            Obnovit stránku
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 25%, #0f766e 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navigation */}
      <Navigation
        user={user}
        onLogout={handleLogout}
        showGameControls={true}
        gameState="playing"
        score={score}
        level={level}
        gameTime={gameTime}
      />

      {/* Main Game Content */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Interactive Map */}
        <InteractiveMap />

        {/* Window Manager (plovoucí okna) */}
        <WindowManager />

        {/* Herní ovládání - levý panel */}
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
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            🎮 Herní menu
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {[
              { label: '📦 Inventář', handler: handleOpenInventory },
              { label: '🏗️ Budovy', handler: handleOpenBuildings },
              { label: '🔬 Výzkum', handler: handleOpenResearch },
              { label: '🤝 Diplomacie', handler: handleOpenDiplomacy }
            ].map((button, index) => (
              <button
                key={index}
                onClick={button.handler}
                style={{
                  background: 'rgba(74, 144, 226, 0.2)',
                  border: '1px solid rgba(74, 144, 226, 0.4)',
                  borderRadius: '6px',
                  color: '#e8eaed',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
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

        {/* Debug informace (pouze v developmentu) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'fixed',
            top: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#34d399',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 100,
            border: '1px solid rgba(52, 211, 153, 0.3)'
          }}>
            🎮 Interactive Mode | {gameState ? 'Game State Loaded' : 'Mock Data'} | 
            Verven v0.1.0
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// EXPORT DEFAULT
// ============================================================
export default InteractivePage;