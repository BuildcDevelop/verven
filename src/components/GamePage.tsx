// Kompletní opravený GamePage.tsx bez chyby setUser
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
            <button onClick={handleOpenSettings} className="game-header__button game-header__button--secondary">
              Nastavení
            </button>
            <button onClick={handleLogout} className="game-header__button game-header__button--logout">
              Odhlásit se
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
