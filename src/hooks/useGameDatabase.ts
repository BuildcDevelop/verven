// src/hooks/useGameDatabase.ts
import { useState, useEffect } from 'react';

// ============================================================
// ZJEDNODUŠENÉ TYPY PRO HOOK
// ============================================================

interface SimpleGameState {
  loaded: boolean;
  initialized: boolean;
}

// ============================================================
// ZJEDNODUŠENÝ DATABASE HOOK
// ============================================================

export const useGameDatabase = () => {
  const [gameState, setGameState] = useState<SimpleGameState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // SIMULACE NAČÍTÁNÍ DAT
  // ============================================================

  useEffect(() => {
    // Simulace načítání databáze
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulace 1 sekundového načítání
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock načtených dat
        setGameState({
          loaded: true,
          initialized: true
        });
        
      } catch (err) {
        console.error('Error loading game data:', err);
        setError('Chyba při načítání herních dat');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ============================================================
  // RETURN OBJECT
  // ============================================================

  return {
    gameState,
    loading,
    error
  };
};