// src/stores/gameStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Province, GameWindow, GameState, AudioPreferences, User } from '../types/game';

interface GameStore extends GameState {
  // User data
  user: User | null;
  setUser: (user: User | null) => void;

  // Map state
  setSelectedProvince: (province: Province | null) => void;
  setCurrentUnitType: (type: number) => void;
  setMapPosition: (x: number, y: number) => void;
  setMapScale: (scale: number) => void;
  setIsDragging: (isDragging: boolean) => void;

  // Provinces
  provinces: Province[];
  setProvinces: (provinces: Province[]) => void;
  updateProvince: (id: string, updates: Partial<Province>) => void;

  // Windows management
  windows: GameWindow[];
  activeWindow: string | null;
  windowOrder: string[];
  
  openWindow: (windowConfig: Omit<GameWindow, 'id'>) => string;
  closeWindow: (windowId: string) => void;
  updateWindow: (windowId: string, updates: Partial<GameWindow>) => void;
  setActiveWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  
  // Audio preferences
  audioPreferences: AudioPreferences;
  updateAudioPreference: <K extends keyof AudioPreferences>(
    key: K, 
    value: AudioPreferences[K]
  ) => void;
  
  // Utility actions
  resetGameState: () => void;
}

const defaultAudioPreferences: AudioPreferences = {
  masterVolume: 0.7,
  uiSoundsEnabled: true,
  hoverSoundsEnabled: true,
  clickSoundsEnabled: true,
  militarySoundsEnabled: true,
  scrollSoundsEnabled: true,
};

const defaultGameState: GameState = {
  selectedProvince: null,
  currentUnitType: 0,
  mapX: 0,
  mapY: 0,
  mapScale: 1,
  isDragging: false,
};

// Helper pro localStorage
const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    ...defaultGameState,
    user: null,
    provinces: [],
    windows: [],
    activeWindow: null,
    windowOrder: [],
    audioPreferences: loadFromLocalStorage('verven_audio_preferences', defaultAudioPreferences),

    // User actions
    setUser: (user) => set({ user }),

    // Map actions
    setSelectedProvince: (province) => set({ selectedProvince: province }),
    setCurrentUnitType: (type) => set({ currentUnitType: type }),
    setMapPosition: (x, y) => set({ mapX: x, mapY: y }),
    setMapScale: (scale) => set({ mapScale: Math.max(0.5, Math.min(3, scale)) }),
    setIsDragging: (isDragging) => set({ isDragging }),

    // Provinces actions
    setProvinces: (provinces) => set({ provinces }),
    updateProvince: (id, updates) => set((state) => ({
      provinces: state.provinces.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
    })),

    // Windows actions
    openWindow: (windowConfig) => {
      const windowId = `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newWindow: GameWindow = {
        id: windowId,
        ...windowConfig,
      };

      set((state) => ({
        windows: [...state.windows, newWindow],
        windowOrder: [...state.windowOrder, windowId],
        activeWindow: windowId,
      }));

      return windowId;
    },

    closeWindow: (windowId) => set((state) => ({
      windows: state.windows.filter(w => w.id !== windowId),
      windowOrder: state.windowOrder.filter(id => id !== windowId),
      activeWindow: state.windowOrder.length > 1 ? 
        state.windowOrder[state.windowOrder.length - 2] : null,
    })),

    updateWindow: (windowId, updates) => set((state) => ({
      windows: state.windows.map(w => 
        w.id === windowId ? { ...w, ...updates } : w
      )
    })),

    setActiveWindow: (windowId) => set((state) => ({
      activeWindow: windowId,
      windowOrder: [
        ...state.windowOrder.filter(id => id !== windowId),
        windowId
      ]
    })),

    minimizeWindow: (windowId) => set((state) => ({
      windows: state.windows.map(w => 
        w.id === windowId ? { ...w, isMinimized: !w.isMinimized } : w
      )
    })),

    // Audio actions
    updateAudioPreference: (key, value) => {
      const newPreferences = { ...get().audioPreferences, [key]: value };
      set({ audioPreferences: newPreferences });
      saveToLocalStorage('verven_audio_preferences', newPreferences);
    },

    // Utility actions
    resetGameState: () => set({
      ...defaultGameState,
      windows: [],
      activeWindow: null,
      windowOrder: [],
      provinces: [],
    }),
  }))
);

// Selector hooks pro optimalizaci
export const useUser = () => useGameStore((state) => state.user);
export const useSelectedProvince = () => useGameStore((state) => state.selectedProvince);
export const useMapState = () => useGameStore((state) => ({
  mapX: state.mapX,
  mapY: state.mapY,
  mapScale: state.mapScale,
  isDragging: state.isDragging,
}));
export const useWindows = () => useGameStore((state) => ({
  windows: state.windows,
  activeWindow: state.activeWindow,
  windowOrder: state.windowOrder,
}));
export const useAudioPreferences = () => useGameStore((state) => state.audioPreferences);