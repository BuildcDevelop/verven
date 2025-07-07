import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function App() {
  const villages = useQuery(api.getVillages);
  const addVillage = useMutation(api.addVillage);

  return (
    <div>
      <h1>Vesnice</h1>
      <ul>
        {villages?.map((v) => (
          <li key={v._id}>{v.name}</li>
        ))}
      </ul>
      <button onClick={() => addVillage({ name: "Nová vesnice", owner: "patrik" })}>
        Přidat vesnici
      </button>
    </div>
  );
}

function App() {
  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h1>Hello z Verven app na Convexu! 🚀</h1>
      <p>Frontend a backend jsou připraveny.</p>
    </div>
  );
}

export default App;
