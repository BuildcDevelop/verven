import { mutation } from "convex/_generated/server";
import { v } from "convex/values";

export default mutation({
  args: {
    name: v.string(),
    owner: v.string(),
  },
  handler: async ({ db }, args) => {
    const id = await db.insert("villages", {
      name: args.name,
      owner: args.owner,
      createdAt: Date.now(),
    });
    return id;
  },
});
