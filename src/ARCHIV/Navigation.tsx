// src/components/Navigation.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Gamepad2, LogOut, User } from 'lucide-react';
import './Navigation.css';

interface NavigationProps {
  user?: {
    id: number;
    username: string;
    email: string;
  } | null;
  onLogout?: () => void;
  showGameControls?: boolean;
  gameState?: 'menu' | 'playing' | 'paused' | 'finished';
  score?: number;
  level?: number;
  gameTime?: number;
}

const Navigation: React.FC<NavigationProps> = ({
  user,
  onLogout,
  showGameControls = false,
  gameState,
  score = 0,
  level = 1,
  gameTime = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      navigate('/');
    }
  };

  const isGamePage = location.pathname === '/game';
  const isHomePage = location.pathname === '/';

  return (
    <nav className="navigation">
      <div className="navigation__container">
        {/* Logo a název */}
        <div className="navigation__brand">
          <img 
            src="/verven.jpeg" 
            alt="Verven Logo" 
            className="navigation__logo"
            onClick={() => navigate('/')}
          />
          <h1 className="navigation__title" onClick={() => navigate('/')}>
            Verven
          </h1>
        </div>

        {/* Střední část - herní informace */}
        {showGameControls && user && (
          <div className="navigation__game-info">
            <div className="navigation__user-info">
              <User size={16} />
              <span>{user.username}</span>
            </div>
            
            {gameState === 'playing' && (
              <div className="navigation__game-stats">
                <div className="navigation__stat">
                  <span className="navigation__stat-label">Skóre:</span>
                  <span className="navigation__stat-value">{score}</span>
                </div>
                <div className="navigation__stat">
                  <span className="navigation__stat-label">Level:</span>
                  <span className="navigation__stat-value">{level}</span>
                </div>
                <div className="navigation__stat">
                  <span className="navigation__stat-label">Čas:</span>
                  <span className="navigation__stat-value">{formatTime(gameTime)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pravá část - akční tlačítka */}
        <div className="navigation__actions">
          {user ? (
            <>
              {!isGamePage && (
                <button
                  onClick={() => navigate('/game')}
                  className="navigation__button navigation__button--primary"
                >
                  <Gamepad2 size={18} />
                  <span className="navigation__button-text">Hra</span>
                </button>
              )}
              
              {!isHomePage && (
                <button
                  onClick={() => navigate('/')}
                  className="navigation__button navigation__button--secondary"
                >
                  <Home size={18} />
                  <span className="navigation__button-text">Domů</span>
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="navigation__button navigation__button--logout"
              >
                <LogOut size={18} />
                <span className="navigation__button-text">Odhlásit</span>
              </button>
            </>
          ) : (
            <>
              {!isHomePage && (
                <button
                  onClick={() => navigate('/')}
                  className="navigation__button navigation__button--secondary"
                >
                  <Home size={18} />
                  <span className="navigation__button-text">Domů</span>
                </button>
              )}
              
              <button
                onClick={() => navigate('/login')}
                className="navigation__button navigation__button--primary"
              >
                <User size={18} />
                <span className="navigation__button-text">Přihlásit</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;