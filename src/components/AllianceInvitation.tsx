import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, X, Shield, Check, UserPlus } from 'lucide-react';
import { db, addFriend } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { translations, type Language } from '../services/localizationService';

interface AllianceInvitationProps {
  inviterUid: string;
  currentUserUid: string;
  language: Language;
  onClose: () => void;
  onSuccess: (name: string) => void;
}

export function AllianceInvitation({ inviterUid, currentUserUid, language, onClose, onSuccess }: AllianceInvitationProps) {
  const t = translations[language];
  const [inviterName, setInviterName] = useState<string>('Unknown Warrior');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInviter = async () => {
      try {
        const docRef = doc(db, 'users', inviterUid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setInviterName(snap.data().displayName || 'Unknown Warrior');
        }
      } catch (e) {
        console.error("Error fetching inviter:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchInviter();
  }, [inviterUid]);

  const handleAccept = async () => {
    const success = await addFriend(currentUserUid, inviterUid);
    if (success) {
      onSuccess(inviterName);
      onClose();
    }
  };

  if (currentUserUid === inviterUid) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-zinc-950 border-2 border-cyan-500/50 w-full max-w-sm rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-scanline opacity-10 pointer-events-none" />
        
        <div className="p-6 text-center space-y-6 relative z-10">
          <div className="w-20 h-20 bg-cyan-500/10 border-2 border-cyan-500/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <UserPlus className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              {t.share_alliance_proposal}
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {t.share_alliance_desc.replace('{name}', inviterName)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={onClose}
              className="py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 font-black uppercase text-xs rounded-lg border border-zinc-800 transition-all active:scale-95"
            >
              {t.share_alliance_ignore}
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-xs rounded-lg shadow-[0_4px_0_#0891b2] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 group"
            >
              <Check className="w-4 h-4 group-hover:scale-125 transition-transform" />
              {t.share_alliance_accept}
            </button>
          </div>
        </div>

        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
          <div className="absolute top-[-24px] right-[-24px] w-12 h-12 bg-cyan-500 rotate-45" />
        </div>
      </motion.div>
    </div>
  );
}
