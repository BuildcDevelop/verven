import "./App.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";

// DŮLEŽITÉ: ZADEJ SPRÁVNÝ Convex URL z tvého .env nebo dashboardu!
const convex = new ConvexReactClient("https://dark-swan-999.convex.cloud");

function App() {
  return (
    <ConvexProvider client={convex}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </div>
      </Router>
    </ConvexProvider>
  );
}

export default App;