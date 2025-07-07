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
