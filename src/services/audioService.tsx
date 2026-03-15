import React, { createContext, useContext, useState } from 'react';

interface AudioContextType {
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (value: number) => void;
  playSFX: (key: string) => void;
  playMusic: (key: string) => void;
  stopMusic: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted] = useState(true);
  const [volume] = useState(0);

  const toggleMute = () => { };
  const setVolume = () => { };
  const playSFX = () => { };
  const playMusic = () => { };
  const stopMusic = () => { };

  return (
    <AudioContext.Provider value={{ isMuted, volume, toggleMute, setVolume, playSFX, playMusic, stopMusic }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
