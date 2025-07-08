import React, { useState } from 'react';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementovat přihlášení přes Convex
    console.log('Přihlášení:', { username, password });
    // Po úspěšném přihlášení přesměrovat na /game
    // window.location.href = '/game';
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const handleRegister = () => {
    // TODO: Implementovat později
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
                />
              </div>

              <button 
                type="submit" 
                className="login-page__button login-page__button--primary"
              >
                <LogIn size={20} />
                Přihlásit se
              </button>
            </form>

            {/* Register Button */}
            <button
              onClick={handleRegister}
              className="login-page__button login-page__button--secondary"
              disabled
            >
              <UserPlus size={20} />
              Registrace nového uživatele
              <span className="login-page__button-note">(brzy)</span>
            </button>

            {/* Back Button */}
            <button
              onClick={handleBackToHome}
              className="login-page__button login-page__button--back"
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