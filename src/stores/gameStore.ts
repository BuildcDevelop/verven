
// Corrected gameStore.ts with zustand shallow fix
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// rest of the imports and types remain unchanged
// (omitted here for brevity; add these from original code)

// zustand store setup with shallow comparison
export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // original state and actions (unchanged, omitted here for brevity)

    // add all your original state and methods here unchanged...
  }))
);

// fixed selector hooks using shallow
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
