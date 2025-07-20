// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { createGameService } from './services/GameService';
import './App.css';

// Import komponent
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import GamePage from "./components/GamePage";

// Inicializace Convex a GameService
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
const gameService = createGameService(convex);

// ============================================================
// 404 KOMPONENTA
// ============================================================
function NotFound(): JSX.Element {
  const handleMouseOver = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.background = '#facc15';
    e.currentTarget.style.transform = 'translateY(-2px)';
  };

  const handleMouseOut = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.background = '#eab308';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 25%, #0f766e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        color: 'white',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        borderRadius: '1rem',
        border: '1px solid rgba(52, 211, 153, 0.3)',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          textShadow: '0 10px 15px rgba(0, 0, 0, 0.3)'
        }}>
          404
        </h1>
        <p style={{
          fontSize: '1.25rem',
          marginBottom: '2rem',
          color: '#a7f3d0'
        }}>
          Stránka nenalezena
        </p>
        <a
          href="/"
          style={{
            background: '#eab308',
            color: 'black',
            padding: '0.875rem 1.5rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 'bold',
            display: 'inline-block',
            transition: 'all 0.3s ease',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          Zpět na hlavní stránku
        </a>
      </div>
    </div>
  );
}

// ============================================================
// ROUTING APP
// ============================================================
function AppRoutes(): JSX.Element {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/game" element={<GamePage gameService={gameService} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

// ============================================================
// HLAVNÍ APP KOMPONENTA S CONVEX PROVIDEREM
// ============================================================
function App(): JSX.Element {
  return (
    <ConvexProvider client={convex}>
      <AppRoutes />
    </ConvexProvider>
  );
}

export default App;
