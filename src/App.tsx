import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import vašich komponent
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import GamePage from './components/GamePage';
import MapPage from './components/MapPage';  // <-- Přidejte tento řádek

function App(): JSX.Element {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/map" element={<MapPage />} />  {/* <-- Přidejte tento řádek */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

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