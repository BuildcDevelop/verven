// src/components/GamePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { useGameAudio } from '../hooks/useAudio';
import WindowManager from './game/WindowManager';
import InteractiveMap from './game/InteractiveMap';
import './GamePage.css';

// Inline CSS pro novou GamePage
const gamePageStyles = `
/* Základní layout - stejný jako HomePage/LoginPage */
.game-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #064e3b 0%, #065f46 25%, #0f766e 100%);
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
}

.game-page__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.game-page__pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 30h-12v12h12V30zm-18 0h-12v12h12V30zm18-18h-12v12h12V12zm-18 0h-12v12h12V12z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.1;
  z-index: 2;
}

/* Loading screen */
.game-loading {
  min-height: 100vh;
  background: linear-gradient(135deg, #064e3b 0%, #065f46 25%, #0f766e 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-loading__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.game-loading__pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 30h-12v12h12V30zm-18 0h-12v12h12V30zm18-18h-12v12h12V12zm-18 0h-12v12h12V12z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.1;
  z-index: 2;
}

.game-loading__content {
  position: relative;
  z-index: 10;
  text-align: center;
}

.game-loading__text {
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Header */
.game-header {
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(52, 211, 153, 0.3);
  padding: 1rem 0;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.game-header__container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.game-header__info {
  color: white;
}

.game-header__title {
  font-size: 1.75rem;
  font-weight: bold;
  margin: 0 0 0.25rem 0;
  text-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
  color: #facc15;
}

.game-header__welcome {
  font-size: 0.95rem;
  color: #a7f3d0;
  margin: 0;
}

.game-header__controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.game-header__button {
  font-weight: bold;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  transform: scale(1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.game-header__button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
}

.game-header__button--secondary {
  background-color: transparent;
  color: #a7f3d0;
  border: 2px solid rgba(52, 211, 153, 0.3);
}

.game-header__button--secondary:hover {
  background-color: rgba(52, 211, 153, 0.1);
  border-color: #34d399;
  color: white;
}

.game-header__button--logout {
  background-color: #dc2626;
  color: white;
}

.game-header__button--logout:hover {
  background-color: #b91c1c;
}

/* Main game area */
.game-main {
  flex: 1;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.game-map-container {
  flex: 1;
  padding: 2rem;
  min-height: 0;
}

/* Footer */
.game-footer {
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(52, 211, 153, 0.3);
  padding: 1rem 0;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.game-footer__container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
}

.game-footer__text {
  color: #a7f3d0;
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.8;
}

/* Responsive design */
@media (max-width: 768px) {
  .game-header__container {
    padding: 0 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .game-header__title {
    font-size: 1.5rem;
  }
  
  .game-header__controls {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .game-map-container {
    padding: 1rem;
  }
  
  .game-footer__container {
    padding: 0 1rem;
  }
}

@media (max-width: 480px) {
  .game-header {
    padding: 0.75rem 0;
  }
  
  .game-header__title {
    font-size: 1.25rem;
  }
  
  .game-header__welcome {
    font-size: 0.85rem;
  }
  
  .game-header__button {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
  
  .game-map-container {
    padding: 0.75rem;
  }
}
/* Quick Menu Styles */
.game-header__quick-menu {
  position: relative;
  margin-right: 1rem;
}

.quick-menu__toggle {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(52, 211, 153, 0.3);
  border-radius: 0.5rem;
  padding: 0.6rem 1rem;
  color: #a7f3d0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-weight: 600;
}

.quick-menu__toggle:hover {
  background: rgba(52, 211, 153, 0.1);
  border-color: #34d399;
  color: white;
}

.quick-menu__dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(52, 211, 153, 0.4);
  border-radius: 0.75rem;
  padding: 1rem;
  min-width: 300px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  animation: dropdownSlide 0.3s ease;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.quick-menu__section {
  margin-bottom: 1rem;
}

.quick-menu__section:last-child {
  margin-bottom: 0;
}

.quick-menu__section h4 {
  color: #facc15;
  font-size: 0.9rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quick-menu__section button {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.3), rgba(52, 211, 153, 0.1));
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  color: white;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.quick-menu__section button:hover {
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.4), rgba(52, 211, 153, 0.2));
  border-color: rgba(52, 211, 153, 0.4);
  transform: translateY(-1px);
}

.quick-menu__resources {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.quick-resource {
  display: flex;
  justify-content: space-between;
  color: #a7f3d0;
  font-size: 0.85rem;
  padding: 0.25rem 0;
}

.quick-resource span:first-child {
  color: #34d399;
  font-weight: 500;
}

.quick-project {
  color: #a7f3d0;
  font-size: 0.85rem;
}

.quick-project__progress {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.25rem;
  height: 8px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.quick-project__bar {
  background: linear-gradient(90deg, #facc15, #eab308);
  height: 100%;
  transition: width 0.3s ease;
}

/* Updated Header Controls */
.game-header__controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.game-header__button {
  font-weight: 600;
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  transform: scale(1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  border: none;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.game-header__button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
}

.game-header__button--secondary {
  background-color: transparent;
  color: #a7f3d0;
  border: 2px solid rgba(52, 211, 153, 0.3);
}

.game-header__button--secondary:hover {
  background-color: rgba(52, 211, 153, 0.1);
  border-color: #34d399;
  color: white;
}

.game-header__button--logout {
  background-color: #dc2626;
  color: white;
  border: 2px solid transparent;
}

.game-header__button--logout:hover {
  background-color: #b91c1c;
  border-color: #ef4444;
}

/* Responsive Design for Quick Menu */
@media (max-width: 768px) {
  .game-header__container {
    flex-direction: column;
    gap: 1rem;
  }

  .game-header__quick-menu {
    margin-right: 0;
    margin-bottom: 0.5rem;
    order: 2;
  }

  .quick-menu__dropdown {
    right: auto;
    left: 0;
    min-width: 280px;
  }

  .game-header__controls {
    order: 3;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .game-header__button {
    padding: 0.5rem 0.8rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .quick-menu__dropdown {
    min-width: 260px;
    padding: 0.75rem;
  }

  .game-header__controls {
    flex-direction: column;
    width: 100%;
  }

  .game-header__button {
    width: 100%;
    justify-content: center;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.querySelector('style[data-game-page]');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-game-page', 'true');
  styleElement.textContent = gamePageStyles;
  document.head.appendChild(styleElement);
}

interface User {
  id: number;
  username: string;
  email: string;
}

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Game store
  const { user, setUser, resetGameState } = useGameStore();
  
  // Audio systém
  const { playClick } = useGameAudio();

  // Kontrola přihlášení při načtení
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<void> => {
    try {
      // Kontrola auth tokenu
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Simulace načtení uživatelských dat (později nahradit Convex query)
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
    playClick();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    resetGameState();
    navigate('/');
  };

  const handleOpenSettings = (): void => {
    playClick();
    // TODO: Otevřít nastavení window
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
      
      {/* Header */}
      <header className="game-header">
        <div className="game-header__container">
          <div className="game-header__info">
            <h1 className="game-header__title">Verven</h1>
            <p className="game-header__welcome">Vítej, {user?.username}!</p>
          </div>
          
          <div className="game-header__controls">
            <button
              onClick={handleOpenSettings}
              className="game-header__button game-header__button--secondary"
            >
              Nastavení
            </button>
            
            <button
              onClick={handleLogout}
              className="game-header__button game-header__button--logout"
            >
              Odhlásit se
            </button>
          </div>
        </div>
      </header>

      {/* Hlavní herní oblast */}
      <main className="game-main">
        {/* Interaktivní mapa */}
        <div className="game-map-container">
          <InteractiveMap />
        </div>
        
        {/* Floating windows */}
        <WindowManager />
      </main>

      {/* Footer */}
      <footer className="game-footer">
        <div className="game-footer__container">
          <p className="game-footer__text">
            &copy; 2025 Verven Game. Postaveno na Convex.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default GamePage;