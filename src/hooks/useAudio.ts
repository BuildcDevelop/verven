// src/hooks/useAudio.ts
import { useEffect, useRef, useCallback } from 'react';
import useSound from 'use-sound';
import { useGameStore } from '../stores/gameStore';

type SoundType = 'hover' | 'click' | 'military' | 'scroll';

interface AudioContextRef {
  audioContext: AudioContext | null;
  isUnlocked: boolean;
}

// Hook pro Web Audio API unlock (nutné pro mobile)
export const useAudioUnlock = () => {
  const audioContextRef = useRef<AudioContextRef>({
    audioContext: null,
    isUnlocked: false,
  });

  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContextRef.current.audioContext) {
        audioContextRef.current.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    const unlockAudio = async () => {
      initAudioContext();
      
      if (audioContextRef.current.audioContext?.state === 'suspended') {
        try {
          await audioContextRef.current.audioContext.resume();
          audioContextRef.current.isUnlocked = true;
        } catch (error) {
          console.warn('Failed to unlock audio context:', error);
        }
      } else if (audioContextRef.current.audioContext?.state === 'running') {
        audioContextRef.current.isUnlocked = true;
      }
    };

    // Event listenery pro unlock audio
    const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
    
    const handleUnlock = () => {
      unlockAudio();
      // Remove listeners po úspěšném unlocku
      if (audioContextRef.current.isUnlocked) {
        unlockEvents.forEach(event => 
          document.removeEventListener(event, handleUnlock)
        );
      }
    };

    unlockEvents.forEach(event => 
      document.addEventListener(event, handleUnlock, { once: true })
    );

    return () => {
      unlockEvents.forEach(event => 
        document.removeEventListener(event, handleUnlock)
      );
    };
  }, []);

  return audioContextRef.current;
};

// Hook pro jednotlivé zvuky
export const useGameSound = (soundType: SoundType) => {
  const audioPreferences = useGameStore((state) => state.audioPreferences);
  const { isUnlocked } = useAudioUnlock();

  // Konfigurace zvuků
  const soundConfig = {
    hover: {
      src: '/sounds/hover.mp3',
      volume: 0.3,
      enabledKey: 'hoverSoundsEnabled' as const,
    },
    click: {
      src: '/sounds/click.mp3', 
      volume: 0.5,
      enabledKey: 'clickSoundsEnabled' as const,
    },
    military: {
      src: '/sounds/military.mp3',
      volume: 0.7,
      enabledKey: 'militarySoundsEnabled' as const,
    },
    scroll: {
      src: '/sounds/scroll.mp3',
      volume: 0.2,
      enabledKey: 'scrollSoundsEnabled' as const,
    },
  };

  const config = soundConfig[soundType];
  const isEnabled = audioPreferences.uiSoundsEnabled && audioPreferences[config.enabledKey];
  const finalVolume = config.volume * audioPreferences.masterVolume;

  const [play, { stop }] = useSound(config.src, {
    volume: finalVolume,
    soundEnabled: isEnabled && isUnlocked,
  });

  const playSound = useCallback(() => {
    if (isEnabled && isUnlocked) {
      try {
        play();
      } catch (error) {
        console.warn(`Failed to play ${soundType} sound:`, error);
      }
    }
  }, [play, isEnabled, isUnlocked, soundType]);

  return { play: playSound, stop };
};

// Hook pro fallback Web Audio API zvuky (pro složitější efekty)
export const useWebAudioSound = () => {
  const audioPreferences = useGameStore((state) => state.audioPreferences);
  const { audioContext, isUnlocked } = useAudioUnlock();

  const createTone = useCallback((frequency: number, duration: number, volume: number = 0.1) => {
    if (!audioContext || !isUnlocked || !audioPreferences.uiSoundsEnabled) {
      return;
    }

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(volume * audioPreferences.masterVolume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Failed to create Web Audio tone:', error);
    }
  }, [audioContext, isUnlocked, audioPreferences.uiSoundsEnabled, audioPreferences.masterVolume]);

  return { createTone };
};

// Kompletní audio hook pro hru
export const useGameAudio = () => {
  const hoverSound = useGameSound('hover');
  const clickSound = useGameSound('click');
  const militarySound = useGameSound('military');
  const scrollSound = useGameSound('scroll');
  const { createTone } = useWebAudioSound();

  return {
    // Připravené zvuky
    playHover: hoverSound.play,
    playClick: clickSound.play,
    playMilitary: militarySound.play,
    playScroll: scrollSound.play,
    
    // Web Audio pro custom efekty
    createTone,
    
    // Utility funkce
    playProvinceHover: () => hoverSound.play(),
    playProvinceClick: (provinceType: string) => {
      if (provinceType === 'own') {
        militarySound.play();
      } else {
        clickSound.play();
      }
    },
    playUnitScroll: () => scrollSound.play(),
  };
};