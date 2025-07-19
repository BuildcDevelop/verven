// src/components/GamePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InteractiveMap from './game/InteractiveMap';
import './GamePage.css';
interface User {
id: number;
username: string;
email: string;
}
interface Province {
id: string;
name: string;
type: 'own' | 'abandoned' | 'neutral' | 'ally' | 'enemy';
position: { x: number; y: number };
units?: {
OFF: number;
DEFF: number;
SIEGE: number;
SPEC: number;
};
owner?: string;
alliance?: string;
}
type GameState = 'menu' | 'playing' | 'paused' | 'finished';
interface GameData {
score: number;
level: number;
gameTime: number;
}
export default function GamePage(): JSX.Element {
const [user, setUser] = useState<User | null>(null);
const [gameState, setGameState] = useState<GameState>('playing'); // Změněno na 'playing' pro zobrazení mapy
const [score, setScore] = useState<number>(0);
const [level, setLevel] = useState<number>(1);
const [gameTime, setGameTime] = useState<number>(0);
const [loading, setLoading] = useState<boolean>(true);
const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
const [hoveredProvince, setHoveredProvince] = useState<Province | null>(null);
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
const handleProvinceClick = (province: Province): void => {
setSelectedProvince(province);
console.log('Kliknuto na državu:', province);
};
const handleProvinceHover = (province: Province | null): void => {
setHoveredProvince(province);
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
const gameData: GameData = { score, level, gameTime };
console.log('Ukládám skóre:', gameData);
} catch (error) {
console.error('Chyba při ukládání skóre:', error);
}
};
const formatTime = (seconds: number): string => {
const minutes = Math.floor(seconds / 60);
const remainingSeconds = seconds % 60;
return ${minutes}:${remainingSeconds.toString().padStart(2, '0')};
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
        <div className="game-card game-menu__card">
          <h2 className="game-menu__title">Hlavní menu</h2>
          
          <div className="game-menu__buttons">
            <button
              onClick={startGame}
              className="game-button game-button--primary"
            >
              Začít hru
            </button>
            
            <button
              className="game-button game-button--secondary"
              onClick={() => alert('Nastavení - TODO')}
            >
              Nastavení
            </button>
            
            <button
              className="game-button game-button--secondary"
              onClick={() => alert('Žebříček - TODO')}
            >
              Žebříček
            </button>

            <button
              onClick={() => navigate('/')}
              className="game-button game-button--secondary"
            >
              Zpět na hlavní stránku
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Hrací stav - Interaktivní mapa */}
    {gameState === 'playing' && (
      <div className="game-playing">
        {/* Mapa */}
        <div style={{ width: '100%', height: '600px', position: 'relative' }}>
          <InteractiveMap 
            onProvinceClick={handleProvinceClick}
            onProvinceHover={handleProvinceHover}
          />
        </div>

        {/* Info panel pro vybranou državu */}
        {selectedProvince && (
          <div className="game-card" style={{ marginTop: '1rem', padding: '1rem' }}>
            <h3>Detail - {selectedProvince.name}</h3>
            <p><strong>Vlastník:</strong> {selectedProvince.owner}</p>
            <p><strong>Aliance:</strong> {selectedProvince.alliance}</p>
            {selectedProvince.units && (
              <div>
                <h4>Vojenské jednotky:</h4>
                <p>⚔️ Útočné: {selectedProvince.units.OFF}</p>
                <p>🛡️ Obranné: {selectedProvince.units.DEFF}</p>
                <p>🏰 Obléhací: {selectedProvince.units.SIEGE}</p>
                <p>✨ Speciální: {selectedProvince.units.SPEC}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="game-playing__controls" style={{ marginTop: '1rem' }}>
          <button
            onClick={pauseGame}
            className="game-button game-button--primary game-button--small"
          >
            Pozastavit
          </button>
          
          <button
            onClick={endGame}
            className="game-button game-button--secondary game-button--small"
          >
            Ukončit hru
          </button>

          <button
            onClick={resetGame}
            className="game-button game-button--secondary game-button--small"
          >
            Zpět do menu
          </button>
        </div>
      </div>
    )}

    {/* Pozastavený stav */}
    {gameState === 'paused' && (
      <div className="game-paused">
        <div className="game-card game-paused__card">
          <h2 className="game-paused__title">Hra pozastavena</h2>
          
          <div className="game-paused__stats">
            <p className="game-paused__stat">Čas: {formatTime(gameTime)}</p>
            <p className="game-paused__stat">Skóre: {score}</p>
            <p className="game-paused__stat">Level: {level}</p>
          </div>
          
          <div className="game-paused__buttons">
            <button
              onClick={resumeGame}
              className="game-button game-button--primary"
            >
              Pokračovat
            </button>
            
            <button
              onClick={resetGame}
              className="game-button game-button--secondary"
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
        <div className="game-card game-finished__card">
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
              className="game-button game-button--primary"
            >
              Hrát znovu
            </button>
            
            <button
              onClick={resetGame}
              className="game-button game-button--secondary"
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