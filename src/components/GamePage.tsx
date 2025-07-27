import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './GamePage.css';

interface User {
  id: number;
  username: string;
  email: string;
}

export default function GamePage(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const navigate = useNavigate();

  const positionRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrame = useRef<number | null>(null);

  const setTransform = (x: number, y: number) => {
    if (dragRef.current) {
      dragRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current || !dragRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const mapRect = dragRef.current.getBoundingClientRect();

    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;

    const minX = containerRect.width - mapRect.width;
    const minY = containerRect.height - mapRect.height;

    positionRef.current.x = Math.min(0, Math.max(minX, newX));
    positionRef.current.y = Math.min(0, Math.max(minY, newY));

    if (!animationFrame.current) {
      animationFrame.current = requestAnimationFrame(() => {
        setTransform(positionRef.current.x, positionRef.current.y);
        animationFrame.current = null;
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  };

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
        email: 'hrac@example.com',
      };
      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Chyba při kontrole autentifikace:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  const handleLogout = (): void => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  const handleCellClick = (col: number, row: number): void => {
    const cellId = `${col}/${row}`;
    setSelectedCell(cellId);
  };

  const generateMapGrid = (): JSX.Element[] => {
    const grid = [];
    for (let row = 1; row <= 100; row++) {
      for (let col = 1; col <= 100; col++) {
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
      <main className="game-main">
        <div className="game-map-area">
          <div className="game-map-container">
            <div className="game-map-header">
              <div className="game-map-header-left">
                <h3 className="game-map-title">Herní mapa</h3>
                {selectedCell && (
                  <div className="selected-info">Vybráno: {selectedCell}</div>
                )}
              </div>
              <div className="game-map-header-right">
                <button onClick={() => navigate('/')} className="game-header__logout">
                  Zpět na hlavní stránku
                </button>
                <button onClick={handleLogout} className="game-header__logout">
                  Odhlásit se
                </button>
              </div>
            </div>

            <div
              ref={containerRef}
              className={`game-map-content ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div ref={dragRef} className="map-drag-container">
                <div className="game-map-grid">{generateMapGrid()}</div>
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
                onClick={() => setIsMapFullscreen(true)}
                className="game-button game-button--primary game-button--small"
              >
                Fullscreen mapa
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}