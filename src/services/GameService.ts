// src/services/GameService.ts
import { ConvexReactClient } from "convex/react";

// ============================================================
// ZJEDNODUŠENÝ GAME SERVICE PRO DEVELOPMENT
// ============================================================

export class SimpleGameService {
  private convex: ConvexReactClient;

  constructor(convexClient: ConvexReactClient) {
    this.convex = convexClient;
  }

  // Mock metody pro development
  async getGameState() {
    return {
      success: true,
      data: {
        loaded: true,
        initialized: true
      }
    };
  }

  isConnected(): boolean {
    return this.convex?.connectionState?.isConnected || false;
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

export const createGameService = (convex: ConvexReactClient): SimpleGameService => {
  return new SimpleGameService(convex);
};