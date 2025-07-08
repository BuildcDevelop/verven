// src/components/GamePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Načítání...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black bg-opacity-30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-2xl font-bold">Verven Game</h1>
            <p className="text-sm opacity-80">Vítej, {user?.username}!</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-white text-right">
              <div className="text-sm opacity-80">Skóre: {score}</div>
              <div className="text-sm opacity-80">Level: {level}</div>
              {gameState === 'playing' && (
                <div className="text-sm opacity-80">Čas: {formatTime(gameTime)}</div>
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              Odhlásit se
            </button>
          </div>
        </div>
      </header>

      {/* Hlavní obsah */}
      <main className="container mx-auto px-4 py-8">
        {/* Menu stav */}
        {gameState === 'menu' && (
          <div className="text-center">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-8 max-w-md mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6">Hlavní menu</h2>
              
              <div className="space-y-4">
                <button
                  onClick={startGame}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Začít hru
                </button>
                
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  onClick={() => alert('Nastavení - TODO')}
                >
                  Nastavení
                </button>
                
                <button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  onClick={() => alert('Žebříček - TODO')}
                >
                  Žebříček
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Zpět na hlavní stránku
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hrací stav */}
        {gameState === 'playing' && (
          <div className="text-center">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Hra běží!</h2>
              
              {/* Herní oblast - zde bude vaše hra */}
              <div className="bg-gray-800 h-96 rounded-lg mb-6 flex items-center justify-center relative">
                <div className="text-white text-center">
                  <div className="text-4xl mb-4">🎮</div>
                  <p className="text-lg">Zde bude herní obsah</p>
                  <p className="text-sm opacity-80 mt-2">
                    Toto je placeholder pro vaši hru
                  </p>
                  <div className="mt-4 space-y-2">
                    <div>Čas: {formatTime(gameTime)}</div>
                    <div>Skóre: {score}</div>
                    <div>Level: {level}</div>
                  </div>
                </div>
                
                {/* Simulace herního obsahu */}
                <div className="absolute top-4 left-4 text-white text-sm">
                  <div>Hra běží {gameTime}s</div>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={pauseGame}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Pozastavit
                </button>
                
                <button
                  onClick={endGame}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Ukončit hru
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pozastavený stav */}
        {gameState === 'paused' && (
          <div className="text-center">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Hra pozastavena</h2>
              
              <div className="text-white mb-6">
                <p>Čas: {formatTime(gameTime)}</p>
                <p>Skóre: {score}</p>
                <p>Level: {level}</p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={resumeGame}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Pokračovat
                </button>
                
                <button
                  onClick={resetGame}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Zpět do menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dokončený stav */}
        {gameState === 'finished' && (
          <div className="text-center">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Hra skončena!</h2>
              
              <div className="text-white mb-6">
                <p className="text-lg">Finální skóre: <span className="font-bold">{score}</span></p>
                <p className="text-lg">Dosažený level: <span className="font-bold">{level}</span></p>
                <p className="text-lg">Celkový čas: <span className="font-bold">{formatTime(gameTime)}</span></p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={startGame}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Hrát znovu
                </button>
                
                <button
                  onClick={resetGame}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Zpět do menu
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black bg-opacity-30 p-4 mt-8">
        <div className="container mx-auto text-center text-white text-sm opacity-80">
          <p>&copy; 2024 Verven Game. Všechna práva vyhrazena.</p>
        </div>
      </footer>
    </div>
  );
}