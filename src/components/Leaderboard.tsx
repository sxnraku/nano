import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, User, X, RefreshCw, Database, Swords, Layers, Zap, Timer } from 'lucide-react';
import { subscribeToLeaderboard, UserProfile } from '../services/firebase';
import { translations, type Language } from '../services/localizationService';

interface LeaderboardProps {
  onClose: () => void;
  language?: Language;
}

export function Leaderboard({ onClose, language = 'en' }: LeaderboardProps) {
  const t = translations[language];
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((data) => {
      setUsers(data);
      setLoading(false);
    }, 15); // Show top 15
    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-zinc-900 border-2 border-zinc-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-yellow-400 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-black p-2 border-2 border-white rotate-3 shadow-[4px_4px_0_#000]">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-3xl font-marker text-black uppercase italic -rotate-1">{t.leaderboard_title}</h2>
              <p className="text-[10px] font-black text-black/60 uppercase tracking-widest -mt-1">{t.leaderboard_subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative z-10 p-2 bg-black text-white border-2 border-white shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="text-center text-zinc-500 py-8 flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin" />
              {t.leaderboard_loading}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">{t.leaderboard_empty}</div>
          ) : (
            users.map((user, index) => (
              <motion.div
                key={user.uid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`relative flex flex-col p-3 rounded-lg border-2 ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' :
                  index === 1 ? 'bg-gradient-to-r from-zinc-400/20 to-transparent border-zinc-400/50' :
                    index === 2 ? 'bg-gradient-to-r from-orange-700/20 to-transparent border-orange-700/50' :
                      'bg-zinc-800/50 border-zinc-700'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 flex items-center justify-center font-black text-xl shrink-0 ${index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-zinc-300' :
                      index === 2 ? 'text-orange-400' :
                        'text-zinc-600'
                    }`}>
                    #{index + 1}
                  </div>

                  <div className="w-12 h-12 rounded-full bg-zinc-700 overflow-hidden border-2 border-black shrink-0 shadow-[2px_2px_0_#000]">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-full h-full p-2 text-zinc-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-white truncate">{user.displayName}</span>
                      <span className="bg-black text-yellow-400 text-[10px] px-1.5 py-0.5 border border-yellow-400/50 rounded uppercase font-black">
                        LVL {user.level || 1}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-y-1 gap-x-4 mt-1">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Swords className="w-3 h-3 text-green-400 shrink-0" />
                        <span className="text-[10px] text-zinc-400 truncate whitespace-nowrap">
                          {user.totalWins || 0} <span className="text-[8px] uppercase opacity-50">{t.leaderboard_wins}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Zap className="w-3 h-3 text-yellow-400 shrink-0" />
                        <span className="text-[10px] text-zinc-400 truncate whitespace-nowrap">
                          {user.highestCombo || 0}x <span className="text-[8px] uppercase opacity-50">{t.leaderboard_combo}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Layers className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="text-[10px] text-zinc-400 truncate whitespace-nowrap">
                          {user.collectionSize || 0} <span className="text-[8px] uppercase opacity-50">{t.leaderboard_collection}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Database className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="text-[10px] text-zinc-400 truncate whitespace-nowrap">
                          {user.scrap || 0} <span className="text-[8px] uppercase opacity-50">{t.leaderboard_scraps}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Timer className="w-3 h-3 text-orange-400 shrink-0" />
                        <span className="text-[10px] text-zinc-400 truncate whitespace-nowrap">
                          {user.highestWave || 0} <span className="text-[8px] uppercase opacity-50">{t.leaderboard_high_wave}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Zap className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="text-[10px] text-zinc-400 truncate whitespace-nowrap">
                          {user.highestBlitzScore || 0} <span className="text-[8px] uppercase opacity-50">{t.leaderboard_high_blitz}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
