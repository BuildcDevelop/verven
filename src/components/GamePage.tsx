// src/components/GamePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GamePage.css';

interface User {
  id: number;
  username: string;
  email: string;
}

type GameState = 'menu' | 'playing' | 'paused' | 'finished';

interface GameData {
  score: number;
  level: number;
  gameTime: number;
}

export default function GamePage(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [gameTime, setGameTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Kontrola přihlášení při načtení
  useEffect(() => {
    checkAuth();
  }, []);

  // Timer pro hru
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState]);

  const checkAuth = async (): Promise<void> => {
    try {
      // Zde byste kontrolovali autentifikaci (localStorage, Convex auth)
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
    localStorage.removeItem('authToken');
    navigate('/');
  };

  const startGame = (): void => {
    setGameState('playing');
    setScore(0);
    setLevel(1);
    setGameTime(0);
  };

  const pauseGame = (): void => {
    setGameState('paused');
  };

  const resumeGame = (): void => {
    setGameState('playing');
  };

  const endGame = (): void => {
    setGameState('finished');
    // Zde byste uložili skóre do Convex databáze
    saveScore();
  };

  const resetGame = (): void => {
    setGameState('menu');
    setScore(0);
    setLevel(1);
    setGameTime(0);
  };

  const saveScore = async (): Promise<void> => {
    try {
      // TODO: Implementovat uložení skóre přes Convex
      const gameData: GameData = { score, level, gameTime };
      console.log('Ukládám skóre:', gameData);
    } catch (error) {
      console.error('Chyba při ukládání skóre:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
      {/* Header */}
      <header className="game-header">
        <div className="game-header__container">
          <div className="game-header__info">
            <h1 className="game-header__title">Verven Game</h1>
            <p className="game-header__welcome">Vítej, {user?.username}!</p>
          </div>
          
          <div className="game-header__stats-section">
            <div className="game-header__stats">
              <div className="game-header__stat">Skóre: {score}</div>
              <div className="game-header__stat">Level: {level}</div>
              {gameState === 'playing' && (
                <div className="game-header__stat">Čas: {formatTime(gameTime)}</div>
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className="game-header__logout"
            >
              Odhlásit se
            </button>
          </div>
        </div>
      </header>

      {/* Hlavní obsah */}
      <main className="game-main">
        {/* Menu stav */}
        {gameState === 'menu' && (
          <div className="game-menu">
            <div className="game-menu__card">
              <h2 className="game-menu__title">Hlavní menu</h2>
              
              <div className="game-menu__buttons">
                <button
                  onClick={startGame}
                  className="game-button game-button--green"
                >
                  Začít hru
                </button>
                
                <button
                  className="game-button game-button--blue"
                  onClick={() => alert('Nastavení - TODO')}
                >
                  Nastavení
                </button>
                
                <button
                  className="game-button game-button--purple"
                  onClick={() => alert('Žebříček - TODO')}
                >
                  Žebříček
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="game-button game-button--gray"
                >
                  Zpět na hlavní stránku
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hrací stav */}
        {gameState === 'playing' && (
          <div className="game-playing">
            <div className="game-playing__card">
              <h2 className="game-playing__title">Hra běží!</h2>
              
              {/* Herní oblast - zde bude vaše hra */}
              <div className="game-area">
                <div className="game-area__content">
                  <div className="game-area__icon">🎮</div>
                  <p className="game-area__text">Zde bude herní obsah</p>
                  <p className="game-area__subtext">
                    Toto je placeholder pro vaši hru
                  </p>
                  <div className="game-area__stats">
                    <div className="game-area__stat">Čas: {formatTime(gameTime)}</div>
                    <div className="game-area__stat">Skóre: {score}</div>
                    <div className="game-area__stat">Level: {level}</div>
                  </div>
                </div>
                
                {/* Simulace herního obsahu */}
                <div className="game-area__timer">
                  <div>Hra běží {gameTime}s</div>
                </div>
              </div>
              
              <div className="game-playing__controls">
                <button
                  onClick={pauseGame}
                  className="game-button game-button--yellow game-button--small"
                >
                  Pozastavit
                </button>
                
                <button
                  onClick={endGame}
                  className="game-button game-button--red game-button--small"
                >
                  Ukončit hru
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pozastavený stav */}
        {gameState === 'paused' && (
          <div className="game-paused">
            <div className="game-paused__card">
              <h2 className="game-paused__title">Hra pozastavena</h2>
              
              <div className="game-paused__stats">
                <p className="game-paused__stat">Čas: {formatTime(gameTime)}</p>
                <p className="game-paused__stat">Skóre: {score}</p>
                <p className="game-paused__stat">Level: {level}</p>
              </div>
              
              <div className="game-paused__buttons">
                <button
                  onClick={resumeGame}
                  className="game-button game-button--green"
                >
                  Pokračovat
                </button>
                
                <button
                  onClick={resetGame}
                  className="game-button game-button--gray"
                >
                  Zpět do menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dokončený stav */}
        {gameState === 'finished' && (
          <div className="game-finished">
            <div className="game-finished__card">
              <h2 className="game-finished__title">Hra skončena!</h2>
              
              <div className="game-finished__stats">
                <p className="game-finished__stat">
                  Finální skóre: <span className="game-finished__stat-value">{score}</span>
                </p>
                <p className="game-finished__stat">
                  Dosažený level: <span className="game-finished__stat-value">{level}</span>
                </p>
                <p className="game-finished__stat">
                  Celkový čas: <span className="game-finished__stat-value">{formatTime(gameTime)}</span>
                </p>
              </div>
              
              <div className="game-finished__buttons">
                <button
                  onClick={startGame}
                  className="game-button game-button--green"
                >
                  Hrát znovu
                </button>
                
                <button
                  onClick={resetGame}
                  className="game-button game-button--gray"
                >
                  Zpět do menu
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="game-footer">
        <div className="game-footer__container">
          <p className="game-footer__text">
            &copy; 2025 Verven Game. Všechna práva vyhrazena.
          </p>
        </div>
      </footer>
    </div>
  );
}