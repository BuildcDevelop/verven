// gameStore.ts - Kompletní opravený store
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// Types
interface User {
  id: number;
  username: string;
  email: string;
}

interface Province {
  id: string;
  name: string;
  x: number;
  y: number;
  population: number;
  resources: string[];
}

interface GameWindow {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isVisible: boolean;
  isMinimized: boolean;
}

interface AudioPreferences {
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  isMuted: boolean;
}

// Store interface
interface GameStore {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Map state
  mapX: number;
  mapY: number;
  mapScale: number;
  isDragging: boolean;
  selectedProvince: Province | null;
  setMapPosition: (x: number, y: number) => void;
  setMapScale: (scale: number) => void;
  setIsDragging: (dragging: boolean) => void;
  setSelectedProvince: (province: Province | null) => void;

  // Window management
  windows: GameWindow[];
  activeWindow: string | null;
  windowOrder: string[];
  openWindow: (window: Omit<GameWindow, 'id'>) => void;
  closeWindow: (id: string) => void;
  toggleWindow: (id: string) => void;
  setWindowPosition: (id: string, position: { x: number; y: number }) => void;
  setWindowSize: (id: string, size: { width: number; height: number }) => void;
  bringToFront: (id: string) => void;

  // Audio preferences
  audioPreferences: AudioPreferences;
  setAudioPreferences: (preferences: Partial<AudioPreferences>) => void;

  // Game actions
  resetGameState: () => void;
}

// Initial states
const initialAudioPreferences: AudioPreferences = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  effectsVolume: 0.8,
  isMuted: false,
};

// Create store
export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // User state
    user: null,
    setUser: (user: User | null) => set({ user }),

    // Map state
    mapX: 0,
    mapY: 0,
    mapScale: 1,
    isDragging: false,
    selectedProvince: null,
    setMapPosition: (x: number, y: number) => set({ mapX: x, mapY: y }),
    setMapScale: (scale: number) => set({ mapScale: Math.max(0.5, Math.min(3, scale)) }),
    setIsDragging: (dragging: boolean) => set({ isDragging: dragging }),
    setSelectedProvince: (province: Province | null) => set({ selectedProvince: province }),

    // Window management
    windows: [],
    activeWindow: null,
    windowOrder: [],
    
    openWindow: (windowData) => {
      const id = `${windowData.type}-${Date.now()}`;
      const newWindow: GameWindow = {
        ...windowData,
        id,
        isVisible: true,
        isMinimized: false,
      };
      
      set((state) => ({
        windows: [...state.windows, newWindow],
        activeWindow: id,
        windowOrder: [id, ...state.windowOrder],
      }));
    },

    closeWindow: (id: string) => {
      set((state) => ({
        windows: state.windows.filter(w => w.id !== id),
        activeWindow: state.activeWindow === id ? null : state.activeWindow,
        windowOrder: state.windowOrder.filter(wId => wId !== id),
      }));
    },

    toggleWindow: (id: string) => {
      set((state) => ({
        windows: state.windows.map(w => 
          w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
        ),
      }));
    },

    setWindowPosition: (id: string, position: { x: number; y: number }) => {
      set((state) => ({
        windows: state.windows.map(w => 
          w.id === id ? { ...w, position } : w
        ),
      }));
    },

    setWindowSize: (id: string, size: { width: number; height: number }) => {
      set((state) => ({
        windows: state.windows.map(w => 
          w.id === id ? { ...w, size } : w
        ),
      }));
    },

    bringToFront: (id: string) => {
      set((state) => ({
        activeWindow: id,
        windowOrder: [id, ...state.windowOrder.filter(wId => wId !== id)],
      }));
    },

    // Audio preferences
    audioPreferences: initialAudioPreferences,
    setAudioPreferences: (preferences: Partial<AudioPreferences>) => {
      set((state) => ({
        audioPreferences: { ...state.audioPreferences, ...preferences },
      }));
    },

    // Reset game state
    resetGameState: () => {
      set({
        user: null,
        mapX: 0,
        mapY: 0,
        mapScale: 1,
        isDragging: false,
        selectedProvince: null,
        windows: [],
        activeWindow: null,
        windowOrder: [],
        audioPreferences: initialAudioPreferences,
      });
    },
  }))
);

// Selector hooks with shallow comparison
export const useUser = () => useGameStore(state => state.user);
export const useSelectedProvince = () => useGameStore(state => state.selectedProvince);

export const useMapState = () => useGameStore(state => ({
  mapX: state.mapX,
  mapY: state.mapY,
  mapScale: state.mapScale,
  isDragging: state.isDragging,
}), shallow);

export const useWindows = () => useGameStore(state => ({
  windows: state.windows,
  activeWindow: state.activeWindow,
  windowOrder: state.windowOrder,
}), shallow);

export const useAudioPreferences = () => useGameStore(state => state.audioPreferences);