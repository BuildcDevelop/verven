import "./App.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import HomePage from "./HomePage";

// DŮLEŽITÉ: ZADEJ SPRÁVNÝ Convex URL z tvého .env nebo dashboardu!
const convex = new ConvexReactClient("https://dark-swan-999.convex.cloud");

function App() {
  return (
    <ConvexProvider client={convex}>
      <div className="App">
        <HomePage />
      </div>
    </ConvexProvider>
  );
}

export default App;