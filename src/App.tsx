// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
// Import všech komponent
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import GamePage from './components/GamePage';

function App(): JSX.Element {
return (
<Router>
<div className="App">
<Routes>
{/* Hlavní stránka */}
<Route path="/" element={<HomePage />} />
      {/* Login stránka */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Herní stránka */}
      <Route path="/game" element={<GamePage />} />
      
      {/* 404 stránka */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </div>
</Router>
);
}
// 404 komponenta s standardním CSS (ne Tailwind)
function NotFound(): JSX.Element {
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
onMouseOver={(e) => {
e.currentTarget.style.background = '#facc15';
e.currentTarget.style.transform = 'translateY(-2px)';
}}
onMouseOut={(e) => {
e.currentTarget.style.background = '#eab308';
e.currentTarget.style.transform = 'translateY(0)';
}}
>
Zpět na hlavní stránku
</a>
</div>
</div>
);
}
export default App;