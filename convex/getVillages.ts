import { query } from "convex/_generated/server";

export default query(async ({ db }) => {
  // Vrátí všechny záznamy z kolekce "villages"
  return await db.query("villages").collect();
});
