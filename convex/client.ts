// src/convex/client.ts
import { ConvexReactClient } from "convex/react";

// Pro development bez skutečného Convex URL
export const convex = new ConvexReactClient(
  process.env.REACT_APP_CONVEX_URL || "https://temporary-url.convex.cloud"
);