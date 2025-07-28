// src/stores/gameStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Province, Player } from '../types/game-types';

// ============================================================
// TYPY PRO WINDOW MANAGEMENT
// ============================================================

export interface GameWindow {
  id: string;
  type: 'inventory' | 'buildings' | 'research' | 'province-detail' | 'army-detail' | 'diplomacy';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isVisible: boolean;
  isMinimized: boolean;
}

export interface GameData {
  OFF: number;
  DEFF: number;
  SIEGE: number;
  SPEC: number;
}

export interface PlayerData {
  player: string;
  alliance: string;
}

// ============================================================
// GAME STORE STATE
// ============================================================

interface GameStoreState {
  // Window Management
  windows: GameWindow[];
  activeWindow: string | null;
  windowOrder: string[];
  
  // Game State
  selectedProvince: Province | null;
  currentUnitType: number;
  showArmyDetail: boolean;
  
  // Map State
  mapPosition: { x: number; y: number };
  mapZoom: number;
  
  // Mock Data pro demonstraci
  gameData: Record<string, GameData>;
  playerData: Record<string, PlayerData>;
  
  // Actions
  openWindow: (type: GameWindow['type'], title: string, options?: Partial<GameWindow>) => void;
  closeWindow: (id: string) => void;
  toggleWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  setWindowPosition: (id: string, position: { x: number; y: number }) => void;
  setSelectedProvince: (province: Province | null) => void;
  setCurrentUnitType: (type: number) => void;
  setMapPosition: (position: { x: number; y: number }) => void;
  setMapZoom: (zoom: number) => void;
  toggleArmyDetail: () => void;
  initializeMockData: () => void;
}

// ============================================================
// MOCK DATA GENERATORS
// ============================================================

const generateMockGameData = (): Record<string, GameData> => ({
  'Severní království': {
    OFF: Math.floor(Math.random() * 500) + 100,
    DEFF: Math.floor(Math.random() * 400) + 150,
    SIEGE: Math.floor(Math.random() * 100) + 20,
    SPEC: Math.floor(Math.random() * 80) + 10
  },
  'Východní údolí': {
    OFF: Math.floor(Math.random() * 350) + 80,
    DEFF: Math.floor(Math.random() * 300) + 120,
    SIEGE: Math.floor(Math.random() * 80) + 15,
    SPEC: Math.floor(Math.random() * 60) + 8
  },
  'Horské křídlo': {
    OFF: Math.floor(Math.random() * 450) + 120,
    DEFF: Math.floor(Math.random() * 380) + 160,
    SIEGE: Math.floor(Math.random() * 70) + 12,
    SPEC: Math.floor(Math.random() * 90) + 15
  },
  'Pobřežní pevnost': {
    OFF: Math.floor(Math.random() * 400) + 90,
    DEFF: Math.floor(Math.random() * 450) + 180,
    SIEGE: Math.floor(Math.random() * 120) + 25,
    SPEC: Math.floor(Math.random() * 70) + 12
  },
  'Jižní pláně': {
    OFF: Math.floor(Math.random() * 600) + 150,
    DEFF: Math.floor(Math.random() * 500) + 200,
    SIEGE: Math.floor(Math.random() * 90) + 18,
    SPEC: Math.floor(Math.random() * 100) + 20
  }
});

const generateMockPlayerData = (): Record<string, PlayerData> => ({
  'Opuštěná vesnice Drakmoor': { player: 'Barbars', alliance: 'Žádná' },
  'Svobodné město Aethon': { player: 'NPC', alliance: 'Městské státy' },
  'Neutrální území Frostheim': { player: 'Neutral', alliance: 'Žádná' },
  'Spojené království Valdris': { player: 'Král Thorin', alliance: 'Severní pakt' },
  'Obchodní přístav Goldport': { player: 'Kupec Magnus', alliance: 'Zlatá liga' },
  'Řemeslnický cech Ironforge': { player: 'Mistr Gareth', alliance: 'Kovářská únie' },
  'Volná komunita Greendale': { player: 'Starosta Elena', alliance: 'Svobodné obce' }
});

// ============================================================
// ZUSTAND STORE
// ============================================================

export const useGameStore = create<GameStoreState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    windows: [],
    activeWindow: null,
    windowOrder: [],
    selectedProvince: null,
    currentUnitType: 0,
    showArmyDetail: false,
    mapPosition: { x: 0, y: 0 },
    mapZoom: 1,
    gameData: {},
    playerData: {},

    // ============================================================
    // WINDOW MANAGEMENT ACTIONS
    // ============================================================

    openWindow: (type, title, options = {}) => {
      const windows = get().windows;
      const existingWindow = windows.find(w => w.type === type);
      
      if (existingWindow) {
        // Pokud okno už existuje, přiveď ho do popředí
        get().bringToFront(existingWindow.id);
        return;
      }

      const id = `window-${type}-${Date.now()}`;
      const defaultSize = {
        inventory: { width: 300, height: 250 },
        buildings: { width: 350, height: 300 },
        research: { width: 400, height: 350 },
        'province-detail': { width: 320, height: 280 },
        'army-detail': { width: 380, height: 320 },
        diplomacy: { width: 450, height: 400 }
      };

      const newWindow: GameWindow = {
        id,
        type,
        title,
        position: { 
          x: 100 + (windows.length * 30), 
          y: 100 + (windows.length * 30) 
        },
        size: defaultSize[type] || { width: 300, height: 250 },
        isVisible: true,
        isMinimized: false,
        ...options
      };

      set(state => ({
        windows: [...state.windows, newWindow],
        windowOrder: [...state.windowOrder, id],
        activeWindow: id
      }));
    },

    closeWindow: (id) => {
      set(state => ({
        windows: state.windows.filter(w => w.id !== id),
        windowOrder: state.windowOrder.filter(wId => wId !== id),
        activeWindow: state.activeWindow === id ? 
          state.windowOrder[state.windowOrder.length - 2] || null : 
          state.activeWindow
      }));
    },

    toggleWindow: (id) => {
      set(state => ({
        windows: state.windows.map(w => 
          w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
        )
      }));
    },

    bringToFront: (id) => {
      set(state => {
        const newWindowOrder = state.windowOrder.filter(wId => wId !== id);
        newWindowOrder.push(id);
        
        return {
          windowOrder: newWindowOrder,
          activeWindow: id
        };
      });
    },

    setWindowPosition: (id, position) => {
      set(state => ({
        windows: state.windows.map(w => 
          w.id === id ? { ...w, position } : w
        )
      }));
    },

    // ============================================================
    // GAME STATE ACTIONS
    // ============================================================

    setSelectedProvince: (province) => {
      set({ selectedProvince: province });
    },

    setCurrentUnitType: (type) => {
      set({ currentUnitType: type });
    },

    setMapPosition: (position) => {
      set({ mapPosition: position });
    },

    setMapZoom: (zoom) => {
      set({ mapZoom: Math.max(0.5, Math.min(3, zoom)) });
    },

    toggleArmyDetail: () => {
      set(state => ({ showArmyDetail: !state.showArmyDetail }));
    },

    // ============================================================
    // INITIALIZATION
    // ============================================================

    initializeMockData: () => {
      set({
        gameData: generateMockGameData(),
        playerData: generateMockPlayerData()
      });
    }
  }))
);

// ============================================================
// SELECTOR HOOKS PRO OPTIMALIZACI
// ============================================================

export const useWindowManager = () => useGameStore(state => ({
  windows: state.windows,
  activeWindow: state.activeWindow,
  windowOrder: state.windowOrder,
  openWindow: state.openWindow,
  closeWindow: state.closeWindow,
  toggleWindow: state.toggleWindow,
  bringToFront: state.bringToFront,
  setWindowPosition: state.setWindowPosition
}));

export const useMapState = () => useGameStore(state => ({
  mapPosition: state.mapPosition,
  mapZoom: state.mapZoom,
  setMapPosition: state.setMapPosition,
  setMapZoom: state.setMapZoom
}));

export const useGameData = () => useGameStore(state => ({
  gameData: state.gameData,
  playerData: state.playerData,
  selectedProvince: state.selectedProvince,
  currentUnitType: state.currentUnitType,
  setSelectedProvince: state.setSelectedProvince,
  setCurrentUnitType: state.setCurrentUnitType
}));