// src/stores/gameStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Province } from '../types/game-types';

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
  isDraggingWindow: boolean;  // NEW: Track dragging state
  
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
  setWindowDragging: (isDragging: boolean) => void;  // NEW: Set drag state
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
    isDraggingWindow: false,
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
      
      // Check if window of this type already exists
      const existingWindow = windows.find(w => w.type === type && w.isVisible);
      
      if (existingWindow) {
        // Just bring existing window to front
        get().bringToFront(existingWindow.id);
        return;
      }

      const id = `window-${type}-${Date.now()}`;
      
      // Better default sizes per window type
      const defaultSize = {
        inventory: { width: 280, height: 320 },
        buildings: { width: 350, height: 380 },
        research: { width: 400, height: 420 },
        'province-detail': { width: 340, height: 400 },
        'army-detail': { width: 380, height: 350 },
        diplomacy: { width: 450, height: 480 }
      };

      // Smart positioning - avoid overlap with validation
      const baseX = 50;
      const baseY = 100;
      const offset = (windows.length % 5) * 40; // Cascade windows
      
      // Ensure positions are valid numbers
      const positionX = typeof (baseX + offset) === 'number' && !isNaN(baseX + offset) ? baseX + offset : 50;
      const positionY = typeof (baseY + offset) === 'number' && !isNaN(baseY + offset) ? baseY + offset : 100;
      
      console.log('🆕 Creating new window:', {
        id,
        type,
        position: { x: positionX, y: positionY },
        size: defaultSize[type] || { width: 300, height: 250 }
      });

      const newWindow: GameWindow = {
        id,
        type,
        title,
        position: { 
          x: positionX, 
          y: positionY 
        },
        size: defaultSize[type] || { width: 300, height: 250 },
        isVisible: true,
        isMinimized: false,
        ...options
      };

      // Validate options position if provided
      if (options.position) {
        const optionsX = options.position.x;
        const optionsY = options.position.y;
        
        if (typeof optionsX === 'number' && !isNaN(optionsX) &&
            typeof optionsY === 'number' && !isNaN(optionsY)) {
          newWindow.position = { x: optionsX, y: optionsY };
        } else {
          console.warn('⚠️ Invalid position in options, using default:', options.position);
        }
      }

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

    // ============================================================
    // 🔧 OPRAVENÁ bringToFront - BEZ DOM REORDERING
    // ============================================================
    bringToFront: (id) => {
      set(state => {
        // POUZE změň activeWindow, windowOrder ponech stabilní!
        // Z-Index se bude řešit dynamicky v komponentě
        return {
          activeWindow: id
          // windowOrder: zůstává stejný → žádný DOM reordering!
        };
      });
    },

    setWindowPosition: (id, position) => {
      // Validate position before storing
      const validX = typeof position.x === 'number' && !isNaN(position.x) ? position.x : 100;
      const validY = typeof position.y === 'number' && !isNaN(position.y) ? position.y : 100;
      
      if (position.x !== validX || position.y !== validY) {
        console.warn('⚠️ Invalid position provided to setWindowPosition:', position, 'using:', { x: validX, y: validY });
      }
      
      set(state => ({
        windows: state.windows.map(w => 
          w.id === id ? { ...w, position: { x: validX, y: validY } } : w
        )
      }));
    },

    setWindowDragging: (isDragging) => {
      set({ isDraggingWindow: isDragging });
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
  isDraggingWindow: state.isDraggingWindow,
  openWindow: state.openWindow,
  closeWindow: state.closeWindow,
  toggleWindow: state.toggleWindow,
  bringToFront: state.bringToFront,
  setWindowPosition: state.setWindowPosition,
  setWindowDragging: state.setWindowDragging
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