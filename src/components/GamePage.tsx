// Jednoduchý GamePage.tsx - jen mapa s grid systémem
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GamePage.css';

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = (): void => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }
      // Simulace načítání
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="game-loading">
        <div className="game-loading__text">Načítání mapy...</div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-map-window">
        <div className="game-map-header">
          <h2>Herní mapa</h2>
          <button 
            onClick={() => navigate('/')} 
            className="game-map-close"
          >
            ×
          </button>
        </div>
        <div className="game-map-content">
          <SimpleGrid />
        </div>
      </div>
    </div>
  );
};

// Jednoduchá grid komponenta
const SimpleGrid: React.FC = () => {
  const gridSize = 20; // 20x20 grid
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  const handleCellClick = (index: number): void => {
    setSelectedCell(selectedCell === index ? null : index);
  };

  const generateGrid = () => {
    const cells = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const isSelected = selectedCell === i;
      
      cells.push(
        <div
          key={i}
          className={`grid-cell ${isSelected ? 'selected' : ''}`}
          onClick={() => handleCellClick(i)}
          title={`Pozice: ${col + 1}/${row + 1}`}
        >
          <span className="grid-coords">{col + 1}/{row + 1}</span>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="simple-grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
      {generateGrid()}
    </div>
  );
};

export default GamePage;