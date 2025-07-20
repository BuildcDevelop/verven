// src/components/GamePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GamePage.css';

interface User {
  id: number;
  username: string;
  email: string;
}

type GameState = 'menu' | 'playing';

export default function GamePage(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [loading, setLoading] = useState<boolean>(true);
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const navigate = useNavigate();

  // Kontrola přihlášení při načtení
  useEffect(() => {
    checkAuth();
  }, []);

  // ESC key pro zavření fullscreen mapy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMapFullscreen) {
        setIsMapFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMapFullscreen]);

  const checkAuth = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const userData: User = {
        id: 1,
        username: 'Hráč',
        email: 'hrac@example.com'
      };
      
      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Chyba při kontrole autentifikace:', error);
      navigate('/login');
    }
  };

  const handleLogout = (): void => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  const startGame = (): void => {
    setGameState('playing');
  };

  const openFullscreenMap = (): void => {
    setIsMapFullscreen(true);
  };

  const closeFullscreenMap = (): void => {
    setIsMapFullscreen(false);
  };

  const handleCellClick = (col: number, row: number): void => {
    const cellId = `${col}/${row}`;
    setSelectedCell(cellId);
    console.log(`Vybráno pole: ${cellId}`);
  };

  const generateMapGrid = (): JSX.Element[] => {
    const grid = [];
    for (let row = 1; row <= 20; row++) {
      for (let col = 1; col <= 20; col++) {
        const cellId = `${col}/${row}`;
        grid.push(
          <div
            key={cellId}
            className={`grid-cell ${selectedCell === cellId ? 'grid-cell--selected' : ''}`}
            onClick={() => handleCellClick(col, row)}
          >
            {cellId}
          </div>
        );
      }
    }
    return grid;
  };

  if (loading) {
    return (
      <div className="game-loading">
        <div className="game-loading__text">Načítání...</div>
      </div>
    );
  }

  return (
    <div className="game-page">
      {/* Hlavní obsah */}
      <main className="game-main">
        {/* Mapa na celou šířku */}
        <div className="game-map-area">
          <div className="game-map-container">
            <div className="game-map-header">
              <div className="game-map-header-left">
                <h3 className="game-map-title">Herní mapa</h3>
                {selectedCell && (
                  <div className="selected-info">
                    Vybráno: {selectedCell}
                  </div>
                )}
              </div>
              <div className="game-map-header-right">
                <button
                  onClick={() => navigate('/')}
                  className="game-header__logout"
                >
                  Zpět na hlavní stránku
                </button>
                <button
                  onClick={handleLogout}
                  className="game-header__logout"
                >
                  Odhlásit se
                </button>
              </div>
            </div>
            <div className="game-map-content">
              <div className="game-map-grid">
                {generateMapGrid()}
              </div>
            </div>
            <div className="game-map-footer">
              <button
                onClick={() => alert('Nastavení - TODO')}
                className="game-button game-button--secondary game-button--small"
              >
                Nastavení
              </button>
              <button
                onClick={() => alert('Žebříček - TODO')}
                className="game-button game-button--secondary game-button--small"
              >
                Žebříček
              </button>
              <button
                onClick={openFullscreenMap}
                className="game-button game-button--primary game-button--small"
              >
                Fullscreen mapa
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen mapa overlay */}
      {isMapFullscreen && (
        <div className="map-overlay">
          <div className="map-container">
            <div className="map-header">
              <div className="map-title">Herní mapa</div>
              <button className="close-btn" onClick={closeFullscreenMap}>
                &times;
              </button>
            </div>
            <div className="map-content">
              <div className="map-grid" id="mapGrid">
                {generateMapGrid()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}