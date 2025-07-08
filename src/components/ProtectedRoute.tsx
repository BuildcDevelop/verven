// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import vašich komponent
import HomePage from './components/HomePage';        // Vaše existující hlavní stránka
import LoginPage from './components/LoginPage';      // Vaše existující login stránka
import GamePage from './components/GamePage';        // Nová game stránka
import ProtectedRoute from './components/ProtectedRoute'; // Ochrana routes

function App(): JSX.Element {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Hlavní stránka */}
          <Route path="/" element={<HomePage />} />
          
          {/* Login stránka */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Chráněná game stránka - pouze pro přihlášené */}
          <Route 
            path="/game" 
            element={
              <ProtectedRoute>
                <GamePage />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 stránka */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

// 404 komponenta
function NotFound(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl mb-4">Stránka nenalezena</p>
        <a 
          href="/" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          Zpět na hlavní stránku
        </a>
      </div>
    </div>
  );
}

export default App;