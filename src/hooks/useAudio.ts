import { useEffect, useCallback } from 'react';
import { useAudioPreferences } from '../stores/gameStore';

const useGameSound = (soundFile: string) => {
  const audioPreferences = useAudioPreferences();

  const playSound = useCallback(() => {
    if (audioPreferences?.uiSoundsEnabled) {
      const audio = new Audio(soundFile);
      audio.volume = audioPreferences.masterVolume;
      audio.play().catch(error => {
        console.error('Audio playback error:', error);
      });
    }
  }, [audioPreferences, soundFile]);

  return playSound;
};

export const useGameAudio = () => {
  const playClick = useGameSound('/sounds/click.mp3');
  const playHover = useGameSound('/sounds/hover.mp3');

  useEffect(() => {
    // Případná inicializace při načtení komponenty
  }, []);

  return { playClick, playHover };
};