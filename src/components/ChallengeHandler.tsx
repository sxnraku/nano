import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, X, AlertTriangle } from 'lucide-react';
import { getChallenge, Challenge } from '../services/firebase';
import type { WarriorData } from '../services/gemini';

interface ChallengeHandlerProps {
  onAcceptChallenge: (opponent: WarriorData, challengeId: string) => void;
}

export function ChallengeHandler({ onAcceptChallenge }: ChallengeHandlerProps) {
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('challenge');
    if (id) {
      setChallengeId(id);
      fetchChallenge(id);
    }
  }, []);

  const fetchChallenge = async (id: string) => {
    setLoading(true);
    try {
      const data = await getChallenge(id);
      if (data) {
        setChallenge(data);
      } else {
        setError("Challenge not found or expired.");
      }
    } catch (err) {
      setError("Error loading challenge.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setChallengeId(null);
    setChallenge(null);
    // Clear URL param
    const url = new URL(window.location.href);
    url.searchParams.delete('challenge');
    window.history.replaceState({}, '', url);
  };

  const handleAccept = () => {
    if (challenge && challengeId) {
      try {
        const warrior = JSON.parse(challenge.warriorData) as WarriorData;
        onAcceptChallenge(warrior, challengeId);
        handleClose();
      } catch (e) {
        setError("Invalid warrior data.");
      }
    }
  };

  if (!challengeId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="bg-zinc-900 border-2 border-red-600 w-full max-w-md rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.5)] overflow-hidden flex flex-col relative max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-red-600 p-4 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
            <h2 className="text-2xl font-black text-white uppercase italic tracking-wider relative z-10 flex items-center gap-2">
              <Sword className="w-6 h-6 animate-pulse" />
              CHALLENGE!
            </h2>
            <button onClick={handleClose} className="p-1 hover:bg-red-700 rounded-full transition-colors relative z-10">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="p-6 flex flex-col items-center gap-4 text-center">
            {loading ? (
              <div className="py-10 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400 font-mono animate-pulse">Searching for opponent...</p>
              </div>
            ) : error ? (
              <div className="py-8 flex flex-col items-center gap-4 text-red-400">
                <AlertTriangle className="w-12 h-12" />
                <p className="font-bold">{error}</p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded border border-zinc-600"
                >
                  Close
                </button>
              </div>
            ) : challenge ? (
              <>
                <div className="w-full bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                  <p className="text-zinc-400 text-sm uppercase font-bold mb-2">Challenger</p>
                  <h3 className="text-2xl font-black text-white">{challenge.creatorName}</h3>
                  <div className="flex justify-center gap-4 mt-2 text-xs font-mono text-zinc-500">
                    <span>Wins: <span className="text-green-400">{challenge.wins}</span></span>
                    <span>Losses: <span className="text-red-400">{challenge.losses}</span></span>
                  </div>
                </div>

                <div className="relative w-32 h-32 my-4">
                  <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse" />
                  <img
                    src={JSON.parse(challenge.warriorData).imageUrl}
                    alt="Opponent"
                    className="w-full h-full object-cover rounded-lg border-2 border-white shadow-lg relative z-10 rotate-3"
                  />
                  <div className="absolute -bottom-3 -right-3 bg-black text-white text-xs font-black px-2 py-1 border border-white rotate-6 z-20">
                    VS
                  </div>
                </div>

                <p className="text-zinc-300 text-sm max-w-[80%]">
                  <span className="font-bold text-white">{JSON.parse(challenge.warriorData).name}</span> is calling you for a fight! Accept the challenge?
                </p>

                <button
                  onClick={handleAccept}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xl uppercase rounded-lg shadow-[0_4px_0_#991b1b] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <Sword className="w-6 h-6" />
                  ACCEPT BATTLE
                </button>
              </>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
