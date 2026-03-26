import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Users, X, RefreshCw, Trophy, Zap } from 'lucide-react';
import { auth, createPvPSession, findPvPSessions, joinPvPSession, subscribeToPvPSession, type PVPSession } from '../services/firebase';
import type { WarriorData } from '../services/gemini';
import { translations, type Language } from '../services/localizationService';
import { getRankByElo } from '../data/ranks';

interface PvPLobbyProps {
  user: any;
  currentWarrior: WarriorData | null;
  onClose: () => void;
  onStartBattle: (sessionId: string, opponent: WarriorData, isHost: boolean) => void;
  language?: Language;
}

export const PvPLobby: React.FC<PvPLobbyProps> = ({ user, currentWarrior, onClose, onStartBattle, language = 'en' }) => {
  const t = translations[language];
  const [rooms, setRooms] = useState<PVPSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [hosting, setHosting] = useState(false);
  const [mySessionId, setMySessionId] = useState<string | null>(null);

  useEffect(() => {
    refreshRooms();
  }, []);

  const refreshRooms = async () => {
    setLoading(true);
    try {
      const activeRooms = await findPvPSessions();
      setRooms(activeRooms.filter(r => r.hostId !== user?.uid)); // Don't show my own room
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleHost = async () => {
    if (!currentWarrior || !user) return;
    setHosting(true);
    try {
      const sessionId = await createPvPSession(user, currentWarrior);
      setMySessionId(sessionId);
      
      // Subscribe to wait for guest
      const unsubscribe = subscribeToPvPSession(sessionId, (session) => {
        if (session.status === 'starting' && session.guestWarrior) {
          unsubscribe();
          onStartBattle(sessionId, JSON.parse(session.guestWarrior), true);
        }
      });
    } catch (e) {
      console.error(e);
      setHosting(false);
    }
  };

  const handleJoin = async (room: PVPSession) => {
    if (!currentWarrior || !user || room.hostId === user.uid) return;
    try {
      await joinPvPSession(room.id, user, currentWarrior);
      onStartBattle(room.id, JSON.parse(room.hostWarrior), false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border-4 border-black shadow-[8px_8px_0_#000] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-red-600 border-b-4 border-black p-4 flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 -rotate-45 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 flex flex-col">
            <h2 className="font-marker text-3xl text-white italic drop-shadow-[2px_2px_0_#000]">
              {t.pvp_lobby_title}
            </h2>
            <span className="text-[10px] font-black tracking-widest text-zinc-950 uppercase">
              {t.pvp_lobby_subtitle}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="relative z-10 w-10 h-10 bg-black flex items-center justify-center border-2 border-white hover:bg-white hover:text-black transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          {hosting ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 border-4 border-red-500 border-t-white rounded-full animate-spin mb-6" />
              <h3 className="font-marker text-2xl text-white mb-2">{t.pvp_waiting_guest}</h3>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-tighter italic">
                {currentWarrior?.name} IS READY FOR COMBAT
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={handleHost}
                disabled={!currentWarrior}
                className="w-full py-4 bg-orange-500 border-4 border-black shadow-[4px_4px_0_#000] text-black font-black text-xl italic uppercase hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Zap fill="currentColor" />
                {t.pvp_host_button}
              </button>

              <div className="h-px bg-zinc-800 my-2 relative">
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 px-4 text-xs font-black text-zinc-600">
                  {t.pvp_vs}
                </span>
              </div>

              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                  {t.pvp_searching}
                </span>
                <button 
                  onClick={refreshRooms}
                  className="p-1 text-zinc-400 hover:text-white transition-colors"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 bg-zinc-800/50 border-2 border-zinc-700 animate-pulse" />
                  ))
                ) : rooms.length > 0 ? (
                  rooms.map(room => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-zinc-800 border-2 border-black p-3 flex justify-between items-center group hover:bg-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-zinc-950 border-2 border-zinc-600 overflow-hidden">
                          <img 
                            src={JSON.parse(room.hostWarrior).imageUrl} 
                            className="w-full h-full object-cover"
                            alt="host"
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-zinc-500 uppercase leading-none">
                              {room.hostName}
                            </span>
                            <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 border border-zinc-800 rounded">
                               <span className="text-[9px]">{getRankByElo(room.hostElo || 1000).icon}</span>
                               <span className="text-[9px] font-black text-yellow-500">{room.hostElo || 1000}</span>
                            </div>
                          </div>
                          <span className="text-sm font-black text-white italic truncate w-32">
                            {JSON.parse(room.hostWarrior).name}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoin(room)}
                        className="px-4 py-2 bg-white text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                      >
                        {t.pvp_join_button}
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-8 text-center bg-zinc-800/20 border-2 border-dashed border-zinc-800">
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                      {t.pvp_no_rooms}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-zinc-950 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase">
              ONLINE: {rooms.length + (hosting ? 1 : 0)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy size={14} className="text-yellow-500" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase">
              PVP VERSION PROTOCOL v1.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
