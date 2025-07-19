// Kompletní opravený GamePage.tsx s tlačítky pro okna
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { useGameAudio } from '../hooks/useAudio';
import WindowManager from './game/WindowManager';
import InteractiveMap from './game/InteractiveMap';
import './GamePage.css';

interface User {
  id: number;
  username: string;
  email: string;
}

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const user = useGameStore((state) => state.user);
  const setUser = useGameStore((state) => state.setUser);
  const resetGameState = useGameStore((state) => state.resetGameState);
  const openWindow = useGameStore((state) => state.openWindow);

  const { playClick } = useGameAudio();

  useEffect(() => {
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

    checkAuth();
  }, [setUser, navigate]);

  const handleLogout = (): void => {
    playClick();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    resetGameState();
    navigate('/');
  };

  const handleOpenSettings = (): void => {
    playClick();
    openWindow({
      type: 'settings',
      title: 'Nastavení',
      position: { x: 400, y: 100 },
      size: { width: 350, height: 300 }
    });
  };

  const handleOpenInventory = (): void => {
    playClick();
    openWindow({
      type: 'inventory',
      title: 'Inventář',
      position: { x: 100, y: 100 },
      size: { width: 350, height: 250 }
    });
  };

  const handleOpenBuildings = (): void => {
    playClick();
    openWindow({
      type: 'buildings',
      title: 'Budovy',
      position: { x: 200, y: 150 },
      size: { width: 400, height: 300 }
    });
  };

  const handleOpenResearch = (): void => {
    playClick();
    openWindow({
      type: 'research',
      title: 'Výzkum',
      position: { x: 300, y: 200 },
      size: { width: 380, height: 280 }
    });
  };

  if (loading) {
    return (
      <div className="game-loading">
        <div className="game-loading__overlay"></div>
        <div className="game-loading__pattern"></div>
        <div className="game-loading__content">
          <div className="game-loading__text">Načítání hry...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-page__overlay"></div>
      <div className="game-page__pattern"></div>
      <header className="game-header">
        <div className="game-header__container">
          <div className="game-header__info">
            <h1 className="game-header__title">Verven</h1>
            <p className="game-header__welcome">Vítej, {user?.username}!</p>
          </div>
          <div className="game-header__controls">
            <button onClick={handleOpenInventory} className="game-header__button game-header__button--secondary">
              📦 Inventář
            </button>
            <button onClick={handleOpenBuildings} className="game-header__button game-header__button--secondary">
              🏛️ Budovy
            </button>
            <button onClick={handleOpenResearch} className="game-header__button game-header__button--secondary">
              🔬 Výzkum
            </button>
            <button
  className="game-button game-button--secondary"
  onClick={() => navigate('/map')}
>
  Mapa světa
</button>
            <button onClick={handleLogout} className="game-header__button game-header__button--logout">
              🚪 Odhlásit se
            </button>
          </div>
        </div>
      </header>
      <main className="game-main">
        <div className="game-map-container">
          <InteractiveMap />
        </div>
        <WindowManager />
      </main>
      <footer className="game-footer">
        <div className="game-footer__container">
          <p className="game-footer__text">&copy; 2025 Verven Game. Postaveno na Convex.</p>
        </div>
      </footer>
    </div>
  );
};

export default GamePage;