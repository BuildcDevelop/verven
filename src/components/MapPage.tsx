// src/components/MapPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Users, Sword } from 'lucide-react';
import './MapPage.css';

interface User {
  id: number;
  username: string;
  email: string;
}

interface MapCell {
  x: number;
  y: number;
  type: 'village' | 'barbarian' | 'empty' | 'bonus';
  owner?: string;
  village?: string;
  population?: number;
}

export default function MapPage(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchCoords, setSearchCoords] = useState<string>('456|537');
  const [centerX, setCenterX] = useState<number>(456);
  const [centerY, setCenterY] = useState<number>(537);
  const navigate = useNavigate();

  // Mock map data - generování okolních buněk
  const generateMapData = (centerX: number, centerY: number): MapCell[] => {
    const cells: MapCell[] = [];
    const mapSize = 15; // 15x15 mřížka
    const offset = Math.floor(mapSize / 2);

    for (let i = 0; i < mapSize; i++) {
      for (let j = 0; j < mapSize; j++) {
        const x = centerX - offset + i;
        const y = centerY - offset + j;
        
        // Určí typ buňky podle pozice
        let cellType: 'village' | 'barbarian' | 'empty' | 'bonus' = 'empty';
        let owner: string | undefined;
        let village: string | undefined;
        let population: number | undefined;

        // Naše hlavní vesnice
        if (x === 456 && y === 537) {
          cellType = 'village';
          owner = 'Hráč';
          village = 'Hlavní vesnice';
          population = 8542;
        }
        // Naše druhá vesnice
        else if (x === 445 && y === 523) {
          cellType = 'village';
          owner = 'Hráč';
          village = 'Severní základna';
          population = 3241;
        }
        // Náhodné vesnice ostatních hráčů
        else if (Math.random() < 0.15) {
          cellType = 'village';
          owner = `Hráč${Math.floor(Math.random() * 999) + 1}`;
          village = `Vesnice (${x}|${y})`;
          population = Math.floor(Math.random() * 8000) + 1000;
        }
        // Barbarské vesnice
        else if (Math.random() < 0.08) {
          cellType = 'barbarian';
          village = `Vesnice barbarů`;
          population = Math.floor(Math.random() * 3000) + 500;
        }
        // Bonus pole
        else if (Math.random() < 0.05) {
          cellType = 'bonus';
        }

        cells.push({
          x,
          y,
          type: cellType,
          owner,
          village,
          population
        });
      }
    }

    return cells;
  };

  const [mapData, setMapData] = useState<MapCell[]>(() => generateMapData(centerX, centerY));

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    setMapData(generateMapData(centerX, centerY));
  }, [centerX, centerY]);

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
    navigate('/login');
  };

  const handleSearchCoords = (): void => {
    const coords = searchCoords.split('|');
    if (coords.length === 2) {
      const x = parseInt(coords[0]);
      const y = parseInt(coords[1]);
      if (!isNaN(x) && !isNaN(y)) {
        setCenterX(x);
        setCenterY(y);
      }
    }
  };

  const handleCellClick = (cell: MapCell): void => {
    if (cell.type !== 'empty') {
      // TODO: Zobrazit detail vesnice
      console.log('Kliknuto na:', cell);
    }
  };

  const getCellColor = (cell: MapCell): string => {
    switch (cell.type) {
      case 'village':
        if (cell.owner === 'Hráč') return '#eab308'; // Naše vesnice - žlutá
        return '#3b82f6'; // Cizí vesnice - modrá
      case 'barbarian':
        return '#6b7280'; // Barbarské vesnice - šedá
      case 'bonus':
        return '#10b981'; // Bonus pole - zelená
      default:
        return 'transparent'; // Prázdné pole
    }
  };

  const getCellIcon = (cell: MapCell): JSX.Element | null => {
    switch (cell.type) {
      case 'village':
        if (cell.owner === 'Hráč') return <Home size={12} />;
        return <Users size={12} />;
      case 'barbarian':
        return <Sword size={12} />;
      case 'bonus':
        return <span style={{ fontSize: '10px' }}>+</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="map-loading">
        <div className="map-loading__text">Načítání...</div>
      </div>
    );
  }

  return (
    <div className="map-page">
      {/* Header stejný jako GamePage */}
      <header className="map-header">
        <div className="map-header__container">
          <nav className="map-header__nav">
            <button 
              className="map-nav__item"
              onClick={() => navigate('/game')}
            >
              Náhled království
            </button>
            <button 
              className="map-nav__item map-nav__item--active"
            >
              Mapa
            </button>
            <button className="map-nav__item" disabled>
              Profil
            </button>
            <button className="map-nav__item" disabled>
              Aliance
            </button>
            <button className="map-nav__item" disabled>
              Žebříček
            </button>
            <button className="map-nav__item" disabled>
              Nastavení
            </button>
          </nav>
          
          <button
            onClick={handleLogout}
            className="map-header__logout"
          >
            Odhlásit se
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="map-main">
        <div className="map-container">
          {/* Navigace */}
          <div className="map-controls">
            <div className="map-controls__search">
              <input
                type="text"
                value={searchCoords}
                onChange={(e) => setSearchCoords(e.target.value)}
                placeholder="Souřadnice (x|y)"
                className="map-controls__input"
              />
              <button
                onClick={handleSearchCoords}
                className="map-controls__search-btn"
              >
                <Search size={16} />
              </button>
            </div>

            <div className="map-controls__center">
              Střed mapy: {centerX}|{centerY}
            </div>
          </div>

          {/* Mapa */}
          <div className="map-grid-container">
            <div className="map-grid">
              {mapData.map((cell, index) => (
                <div
                  key={index}
                  className={`map-cell ${cell.type !== 'empty' ? 'map-cell--interactive' : ''}`}
                  style={{ backgroundColor: getCellColor(cell) }}
                  onClick={() => handleCellClick(cell)}
                  title={cell.village ? `${cell.village} (${cell.x}|${cell.y})${cell.owner ? ` - ${cell.owner}` : ''}` : `${cell.x}|${cell.y}`}
                >
                  <div className="map-cell__coords">
                    {cell.x}|{cell.y}
                  </div>
                  {cell.type !== 'empty' && (
                    <div className="map-cell__icon">
                      {getCellIcon(cell)}
                    </div>
                  )}
                  {cell.population && (
                    <div className="map-cell__population">
                      {cell.population}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legenda */}
          <div className="map-legend">
            <div className="map-legend__item">
              <div className="map-legend__color" style={{ backgroundColor: '#eab308' }}></div>
              <Home size={12} />
              <span>Vaše vesnice</span>
            </div>
            <div className="map-legend__item">
              <div className="map-legend__color" style={{ backgroundColor: '#3b82f6' }}></div>
              <Users size={12} />
              <span>Vesnice hráčů</span>
            </div>
            <div className="map-legend__item">
              <div className="map-legend__color" style={{ backgroundColor: '#6b7280' }}></div>
              <Sword size={12} />
              <span>Barbarské vesnice</span>
            </div>
            <div className="map-legend__item">
              <div className="map-legend__color" style={{ backgroundColor: '#10b981' }}></div>
              <span>+</span>
              <span>Bonus pole</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="map-footer">
        <div className="map-footer__container">
          <p className="map-footer__text">
            © 2025 Patrik Brnušák
          </p>
          <p className="map-footer__text">
            Postaveno na Convex - moderní backend pro webové aplikace
          </p>
        </div>
      </footer>
    </div>
  );
}