// src/hooks/useGameDatabase.ts
// ============================================================
// REACT HOOK PRO SNADNÉ POUŽITÍ DATABÁZE
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  GameState,
  Position,
  Province,
  UseGameDatabaseReturn
} from '../types/game-types';
import { useConvex } from "convex/react";
import { createGameService } from '../services/GameService';

export const useGameDatabase = () => {
  const convex = useConvex();
  const gameService = createGameService(convex);

  // ============================================================
  // STATE DECLARATIONS (CHYBĚJÍCÍ ČÁST!)
  // ============================================================
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // NAČÍTÁNÍ HERNÍHO STAVU
  // ============================================================

  const loadGameState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await gameService.getGameState();
      
      if (response.success && response.data) {
        setGameState(response.data);
      } else {
        setError(response.error || 'Chyba při načítání herního stavu');
      }
    } catch (err) {
      console.error('Chyba při načítání game state:', err);
      setError('Neočekávaná chyba při načítání dat');
    } finally {
      setLoading(false);
    }
  }, [gameService]);

  // ============================================================
  // VYTVOŘENÍ NOVÉ DRŽAVY
  // ============================================================

  const createProvince = useCallback(async (name: string, position: Position): Promise<boolean> => {
    if (!gameState?.currentPlayer) {
      setError('Není nalezen současný hráč');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await gameService.createProvince(
        name, 
        position, 
        gameState.currentPlayer.id
      );

      if (response.success && response.data) {
        // Aktualizuj lokální stav
        const newProvince = response.data;
        
        setGameState(prevState => {
          if (!prevState) return null;
          
          return {
            ...prevState,
            provinces: [...prevState.provinces, newProvince],
            players: prevState.players.map(player => 
              player.id === gameState.currentPlayer?.id
                ? { ...player, provinces: [...player.provinces, newProvince.id] }
                : player
            ),
            map: prevState.map.map(row => 
              row.map(tile => {
                if (newProvince.tileIds.includes(tile.id)) {
                  return {
                    ...tile,
                    ownerId: newProvince.ownerId,
                    provinceId: newProvince.id
                  };
                }
                return tile;
              })
            )
          };
        });

        return true;
      } else {
        setError(response.error || 'Chyba při vytváření državy');
        return false;
      }
    } catch (err) {
      console.error('Chyba při vytváření province:', err);
      setError('Neočekávaná chyba při vytváření državy');
      return false;
    } finally {
      setLoading(false);
    }
  }, [gameState?.currentPlayer, gameService]);

  // ============================================================
  // PŘIPOJENÍ K ALIANCI
  // ============================================================

  const joinAlliance = useCallback(async (allianceId: string): Promise<boolean> => {
    if (!gameState?.currentPlayer) {
      setError('Není nalezen současný hráč');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await gameService.joinAlliance(
        gameState.currentPlayer.id,
        allianceId
      );

      if (response.success && response.data) {
        // Aktualizuj lokální stav
        const updatedAlliance = response.data;
        
        setGameState(prevState => {
          if (!prevState) return null;
          
          return {
            ...prevState,
            players: prevState.players.map(player => 
              player.id === gameState.currentPlayer?.id
                ? { 
                    ...player, 
                    allianceId: updatedAlliance.id,
                    color: updatedAlliance.color
                  }
                : player
            ),
            alliances: prevState.alliances.map(alliance =>
              alliance.id === updatedAlliance.id
                ? updatedAlliance
                : alliance
            ),
            provinces: prevState.provinces.map(province =>
              province.ownerId === gameState.currentPlayer?.id
                ? {
                    ...province,
                    allianceId: updatedAlliance.id,
                    color: updatedAlliance.color
                  }
                : province
            ),
            currentPlayer: prevState.currentPlayer
              ? {
                  ...prevState.currentPlayer,
                  allianceId: updatedAlliance.id,
                  color: updatedAlliance.color
                }
              : null
          };
        });

        return true;
      } else {
        setError(response.error || 'Chyba při připojování k alianci');
        return false;
      }
    } catch (err) {
      console.error('Chyba při připojování k alianci:', err);
      setError('Neočekávaná chyba při připojování k alianci');
      return false;
    } finally {
      setLoading(false);
    }
  }, [gameState?.currentPlayer, gameService]);

  // ============================================================
  // REFRESH HERNÍHO STAVU
  // ============================================================

  const refreshGameState = useCallback(async (): Promise<void> => {
    await loadGameState();
  }, [loadGameState]);

  // ============================================================
  // EFFECT PRO AUTOMATICKÉ NAČÍTÁNÍ
  // ============================================================

  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  // ============================================================
  // AUTO-REFRESH (volitelné)
  // ============================================================

  useEffect(() => {
    if (!gameState) return;

    // Auto-refresh každých 30 sekund
    const intervalId = setInterval(() => {
      if (!loading) {
        refreshGameState();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [gameState, loading, refreshGameState]);

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================
  // DODATEČNÉ HELPER FUNKCE
  // ============================================================

  const getPlayerProvinces = useCallback((playerId: string): Province[] => {
    if (!gameState) return [];
    
    return gameState.provinces.filter(province => province.ownerId === playerId);
  }, [gameState]);

  const getCurrentPlayerProvinces = useCallback((): Province[] => {
    if (!gameState?.currentPlayer) return [];
    
    return getPlayerProvinces(gameState.currentPlayer.id);
  }, [gameState, getPlayerProvinces]);

  const isPositionAvailable = useCallback((position: Position): boolean => {
    if (!gameState) return false;
    
    const tile = gameState.map[position.y]?.[position.x];
    return tile?.isSpawnZone && !tile.ownerId;
  }, [gameState]);

  const getAvailableSpawnPositions = useCallback((): Position[] => {
    if (!gameState) return [];
    
    const positions: Position[] = [];
    gameState.map.forEach(row => {
      row.forEach(tile => {
        if (tile.isSpawnZone && !tile.ownerId) {
          positions.push(tile.position);
        }
      });
    });
    
    return positions;
  }, [gameState]);

  // ============================================================
  // RETURN OBJECT
  // ============================================================

  return {
    // Základní stav
    gameState,
    loading,
    error,
    
    // Akce
    createProvince,
    joinAlliance,
    refreshGameState,
    
    // Helper funkce (rozšíření pro budoucí použití)
    clearError,
    getPlayerProvinces,
    getCurrentPlayerProvinces,
    isPositionAvailable,
    getAvailableSpawnPositions
  } as UseGameDatabaseReturn & {
    clearError: () => void;
    getPlayerProvinces: (playerId: string) => Province[];
    getCurrentPlayerProvinces: () => Province[];
    isPositionAvailable: (position: Position) => boolean;
    getAvailableSpawnPositions: () => Position[];
  };
};