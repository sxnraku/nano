import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';

interface AudioContextType {
  isMuted: boolean;
  volume: number;
  currentTrack: 'menu' | 'battle';
  toggleMute: () => void;
  setVolume: (value: number) => void;
  playSFX: (key: string) => void;
  playMusic: (track?: 'menu' | 'battle') => void;
  stopMusic: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolumeState] = useState(0.6);
  const [currentTrack, setCurrentTrack] = useState<'menu' | 'battle'>('menu');
  const bgMusicRef = useRef<Howl | null>(null);
  const sfxCache = useRef<Record<string, Howl>>({});

  useEffect(() => {
    const saved = localStorage.getItem('nano-audio-prefs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isMuted !== undefined) {
          setIsMuted(parsed.isMuted);
          Howler.mute(parsed.isMuted);
        }
        if (parsed.volume !== undefined) {
          setVolumeState(parsed.volume);
          Howler.volume(parsed.volume);
        }
      } catch (e) {
        console.warn("Audio prefs corrupted", e);
      }
    }
  }, []);

  const savePrefs = (muted: boolean, vol: number) => {
    localStorage.setItem('nano-audio-prefs', JSON.stringify({ isMuted: muted, volume: vol }));
  };

  const playMusic = (track: 'menu' | 'battle' = 'menu') => {
    if (bgMusicRef.current) {
      if (currentTrack === track && bgMusicRef.current.playing()) return;
      bgMusicRef.current.fade(bgMusicRef.current.volume(), 0, 500);
      const oldHowl = bgMusicRef.current;
      setTimeout(() => oldHowl.stop(), 500);
    }

    const src = track === 'battle' ? '/audio/battlemusic.mp3' : '/audio/Concrete_Pulse.mp3';
    
    bgMusicRef.current = new Howl({
      src: [src],
      loop: true,
      volume: 0, // Start at 0 for fade in
      html5: true,
    });

    bgMusicRef.current.play();
    bgMusicRef.current.fade(0, track === 'battle' ? 0.4 : 0.5, 1000);
    setCurrentTrack(track);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    Howler.mute(next);
    savePrefs(next, volume);
    
    if (!next) {
      playMusic(currentTrack);
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    Howler.volume(val);
    savePrefs(isMuted, val);
  };

  const playSFX = (key: string) => {
    if (isMuted) return;

    // Mapping keys to files. If files don't exist yet, it will fail silently in Howler
    const sfxMap: Record<string, string> = {
      'CLICK': '/audio/click.mp3',
      'PURCHASE': '/audio/success.mp3',
      'SCAN': '/audio/scan.mp3',
      'WIN': '/audio/win.mp3',
      'LOSS': '/audio/dead.mp3',
      'HIT': '/audio/hit.mp3',
      'CRITICAL': '/audio/crit.mp3'
    };

    const src = sfxMap[key];
    if (!src) return;

    if (!sfxCache.current[key]) {
      sfxCache.current[key] = new Howl({ src: [src], volume: 0.7 });
    }
    sfxCache.current[key].play();
  };

  const stopMusic = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.stop();
    }
  };

  return (
    <AudioContext.Provider value={{ isMuted, volume, currentTrack, toggleMute, setVolume, playSFX, playMusic, stopMusic }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) throw new Error('useAudio must be used within an AudioProvider');
  return context;
}
