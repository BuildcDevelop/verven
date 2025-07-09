// src/components/MapPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MapPage.css';

interface User {
  id: number;
  username: string;
  email: string;
}

type TileType = 'player' | 'meadow' | 'mountain';

interface MapTile {
  x: number;
  y: number;
  type: TileType;
  owner?: string;
  villageName?: string;
}

export default function MapPage(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTile, setSelectedTile] = useState<MapTile | null>(null);
  const [mapData, setMapData] = useState<MapTile[]>([]);
  const navigate = useNavigate();

  // Kontrola přihlášení při načtení
  useEffect(() => {
    checkAuth();
    generateMap();
  }, []);

  const checkAuth = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Simulace načtení uživatelských dat
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

  const generateMap = (): void => {
    const tiles: MapTile[] = [];
    
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        let tileType: TileType;
        let owner: string | undefined;
        let villageName: string | undefined;
        
        // Logika pro generování mapy
        if (x === 5 && y === 5) {
          // Hráčova vesnice uprostřed
          tileType = 'player';
          owner = 'Hráč';
          villageName = 'Hlavní osada';
        } else if (Math.random() < 0.15) {
          // 15% šance na hory
          tileType = 'mountain';
        } else if (Math.random() < 0.3) {
          // 30% šance na cizí vesnice
          tileType = 'player';
          owner = `Hráč ${Math.floor(Math.random() * 100) + 1}`;
          villageName = `Vesnice ${Math.floor(Math.random() * 1000) + 1}`;
        } else {
          // Zbytek jsou louky
          tileType = 'meadow';
        }
        
        tiles.push({
          x,
          y,
          type: tileType,
          owner,
          villageName
        });
      }
    }
    
    setMapData(tiles);
  };

  const handleLogout = (): void => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  const handleTileClick = (tile: MapTile): void => {
    setSelectedTile(tile);
  };

  const getTileClass = (tile: MapTile): string => {
    const baseClass = 'map-grid__tile';
    const typeClass = `map-grid__tile--${tile.type}`;
    const selectedClass = selectedTile?.x === tile.x && selectedTile?.y === tile.y ? 'map-grid__tile--selected' : '';
    
    return `${baseClass} ${typeClass} ${selectedClass}`.trim();
  };

  const getTileContent = (tile: MapTile): string => {
    switch (tile.type) {
      case 'player':
        return tile.owner === 'Hráč' ? '🏰' : '🏘️';
      case 'mountain':
        return '🏔️';
      case 'meadow':
      default:
        return '🌾';
    }
  };

  if (loading) {
    return (
      <div className="map-loading">
        <div className="map-loading__text">Načítání mapy...</div>
      </div>
    );
  }

  return (
    <div className="map-page">
      {/* Header */}
      <header className="map-header">
        <div className="map-header__container">
          <div className="map-header__info">
            <h1 className="map-header__title">Mapa světa</h1>
            <p className="map-header__welcome">Vítej, {user?.username}!</p>
          </div>
          
          <div className="map-header__actions">
            <button
              onClick={() => navigate('/game')}
              className="map-header__button map-header__button--secondary"
            >
              Zpět do hry
            </button>
            
            <button
              onClick={handleLogout}
              className="map-header__button map-header__button--logout"
            >
              Odhlásit se
            </button>
          </div>
        </div>
      </header>

      {/* Hlavní obsah */}
      <main className="map-main">
        <div className="map-container">
          {/* Mapa */}
          <div className="map-section">
            <div className="map-card">
              <div className="map-header-section">
                <h2 className="map-section__title">Kontinent 54</h2>
                <div className="map-coordinates">
                  {selectedTile && (
                    <span className="map-coordinates__text">
                      Vybrané políčko: {selectedTile.x + 1}|{selectedTile.y + 1}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="map-grid">
                {/* Číslování sloupců */}
                <div className="map-grid__row map-grid__row--header">
                  <div className="map-grid__coordinate"></div>
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="map-grid__coordinate">
                      {i + 1}
                    </div>
                  ))}
                </div>
                
                {/* Řádky mapy */}
                {Array.from({ length: 10 }, (_, y) => (
                  <div key={y} className="map-grid__row">
                    {/* Číslování řádků */}
                    <div className="map-grid__coordinate">{y + 1}</div>
                    
                    {/* Políčka */}
                    {Array.from({ length: 10 }, (_, x) => {
                      const tile = mapData.find(t => t.x === x && t.y === y);
                      if (!tile) return null;
                      
                      return (
                        <div
                          key={`${x}-${y}`}
                          className={getTileClass(tile)}
                          onClick={() => handleTileClick(tile)}
                          title={`${x + 1}|${y + 1} - ${tile.type === 'player' ? (tile.villageName || 'Vesnice') : tile.type === 'mountain' ? 'Hory' : 'Louky'}`}
                        >
                          <span className="map-grid__tile-content">
                            {getTileContent(tile)}
                          </span>
                          <span className="map-grid__tile-coords">
                            {x + 1}|{y + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info panel */}
          <div className="map-info">
            <div className="map-card map-info__card">
              <h3 className="map-info__title">Informace o políčku</h3>
              
              {selectedTile ? (
                <div className="map-info__content">
                  <div className="map-info__item">
                    <strong>Souřadnice:</strong> {selectedTile.x + 1}|{selectedTile.y + 1}
                  </div>
                  
                  <div className="map-info__item">
                    <strong>Typ:</strong> {
                      selectedTile.type === 'player' ? 'Vesnice' :
                      selectedTile.type === 'mountain' ? 'Hory' : 'Louky'
                    }
                  </div>
                  
                  {selectedTile.type === 'player' && (
                    <>
                      <div className="map-info__item">
                        <strong>Vlastník:</strong> {selectedTile.owner}
                      </div>
                      
                      <div className="map-info__item">
                        <strong>Název:</strong> {selectedTile.villageName}
                      </div>
                      
                      {selectedTile.owner === 'Hráč' && (
                        <button className="map-info__action">
                          Přejít do vesnice
                        </button>
                      )}
                    </>
                  )}
                  
                  {selectedTile.type === 'meadow' && (
                    <div className="map-info__item">
                      <span className="map-info__empty">Volné území</span>
                      <button className="map-info__action map-info__action--disabled" disabled>
                        Založit vesnici <span className="map-info__note">(brzy)</span>
                      </button>
                    </div>
                  )}
                  
                  {selectedTile.type === 'mountain' && (
                    <div className="map-info__item">
                      <span className="map-info__empty">Neobyvatelné území</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="map-info__empty">
                  Klikni na políčko pro zobrazení informací
                </div>
              )}
            </div>

            {/* Legenda */}
            <div className="map-card map-legend">
              <h3 className="map-legend__title">Legenda</h3>
              <div className="map-legend__items">
                <div className="map-legend__item">
                  <span className="map-legend__icon">🏰</span>
                  <span className="map-legend__text">Tvoje vesnice</span>
                </div>
                <div className="map-legend__item">
                  <span className="map-legend__icon">🏘️</span>
                  <span className="map-legend__text">Cizí vesnice</span>
                </div>
                <div className="map-legend__item">
                  <span className="map-legend__icon">🌾</span>
                  <span className="map-legend__text">Volné území</span>
                </div>
                <div className="map-legend__item">
                  <span className="map-legend__icon">🏔️</span>
                  <span className="map-legend__text">Hory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="map-footer">
        <div className="map-footer__container">
          <p className="map-footer__text">
            &copy; 2025 Verven Game. Všechna práva vyhrazena.
          </p>
        </div>
      </footer>
    </div>
  );
}