import "./App.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

// DŮLEŽITÉ: ZADEJ SPRÁVNÝ Convex URL z tvého .env nebo dashboardu!
const convex = new ConvexReactClient("https://dark-swan-999.convex.cloud");

function TaskList() {
  const tasks = useQuery(api.tasks.get);
  if (tasks === undefined) return <div>Načítání...</div>;
  return (
    <div>
      {tasks.map(({ _id, text }: any) => <div key={_id}>{text}</div>)}
    </div>
  );
}

function App() {
  return (
    <ConvexProvider client={convex}>
      <div className="App">
        <h1>Seznam úkolů</h1>
        <TaskList />
      </div>
    </ConvexProvider>
  );
}

export default App;
