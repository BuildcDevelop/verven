import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import './LoginPage.css'; // Pouze LoginPage CSS!

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Implementovat přihlášení přes Convex
      console.log('Přihlášení:', { username, password });
      
      // Simulace API volání
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Uložení auth tokenu (nahradit skutečným tokenem z Convex)
      localStorage.setItem('authToken', 'dummy-token-123');
      localStorage.setItem('userData', JSON.stringify({
        id: 1,
        username: username,
        email: `${username}@example.com`
      }));
      
      // Po úspěšném přihlášení přesměrovat na /game
      navigate('/game');
      
    } catch (error) {
      console.error('Chyba při přihlášení:', error);
      alert('Chyba při přihlášení. Zkuste to znovu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleRegister = () => {
    // TODO: Implementovat později nebo navigovat na registrační stránku
    // navigate('/register');
    alert('Registrace bude brzy dostupná!');
  };

  return (
    <div className="login-page">
      <div className="login-page__overlay"></div>
      <div className="login-page__pattern"></div>
      
      <div className="login-page__container">
        {/* Header */}
        <div className="login-page__header">
          <div className="login-page__logo-wrapper">
            <img 
              src="/verven.jpeg" 
              alt="Verven Logo" 
              className="login-page__logo"
            />
          </div>
          
          <h1 className="login-page__title">Verven</h1>
          <h2 className="login-page__subtitle">Přihlášení do hry</h2>
        </div>

        {/* Login Form */}
        <div className="login-page__form-section">
          <div className="login-page__form-card">
            <form onSubmit={handleLogin} className="login-page__form">
              <div className="login-page__form-group">
                <label htmlFor="username" className="login-page__label">
                  Jméno
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-page__input"
                  placeholder="Zadejte vaše jméno"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="login-page__form-group">
                <label htmlFor="password" className="login-page__label">
                  Heslo
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-page__input"
                  placeholder="Zadejte vaše heslo"
                  required
                  disabled={isLoading}
                />
              </div>

              <button 
                type="submit" 
                className="login-page__button login-page__button--primary"
                disabled={isLoading}
              >
                <LogIn size={20} />
                {isLoading ? 'Přihlašuji...' : 'Přihlásit se'}
              </button>
            </form>

            {/* Register Button */}
            <button
              onClick={handleRegister}
              className="login-page__button login-page__button--secondary"
              disabled={isLoading}
            >
              <UserPlus size={20} />
              Registrace nového uživatele
              <span className="login-page__button-note">(brzy)</span>
            </button>

            {/* Back Button */}
            <button
              onClick={handleBackToHome}
              className="login-page__button login-page__button--back"
              disabled={isLoading}
            >
              <ArrowLeft size={20} />
              Zpět na Verven stránku
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="login-page__footer">
          <p className="login-page__copyright">
            © 2025 Patrik Brnušák
          </p>
          <p className="login-page__convex">
            Postaveno na Convex - moderní backend pro webové aplikace
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;