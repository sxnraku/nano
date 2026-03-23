import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, MessageSquare, Terminal } from 'lucide-react';
import { subscribeToGuildMessages, sendGuildMessage, GuildMessage, Timestamp } from '../services/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

interface GangChatProps {
  guildId: string;
  user: FirebaseUser;
  language?: string;
}

export function GangChat({ guildId, user }: GangChatProps) {
  const [messages, setMessages] = useState<GuildMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToGuildMessages(guildId, (newMessages) => {
      setMessages(newMessages);
      // Wait for DOM update
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [guildId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendGuildMessage(guildId, {
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        content: newMessage.trim(),
        timestamp: Timestamp.now(),
        type: 'chat'
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px] bg-black border-2 border-zinc-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
      <div className="absolute inset-0 bg-scanline opacity-5 pointer-events-none" />
      
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 italic">
            <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-[10px] uppercase font-black tracking-widest">No signals detected... Start the transmission.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user.uid;
          const isSystem = msg.type === 'system';
          
          if (isSystem) {
            return (
              <div key={msg.id || idx} className="flex justify-center my-2">
                <div className="bg-zinc-900/50 border border-zinc-800 px-3 py-1 rounded-full text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-purple-500" />
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <motion.div
              initial={{ opacity: 0, x: isMe ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={msg.id || idx}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {!isMe && <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center"><User className="w-2 h-2 text-zinc-400" /></div>}
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">
                  {msg.senderName}
                </span>
                {isMe && <div className="w-4 h-4 rounded-full bg-purple-900/50 flex items-center justify-center border border-purple-500/30"><User className="w-2 h-2 text-purple-400" /></div>}
              </div>
              <div className={`max-w-[80%] p-2.5 rounded-lg border-2 text-xs font-bold leading-snug shadow-[4px_4px_0_rgba(0,0,0,0.3)] ${
                isMe 
                  ? 'bg-purple-600 border-white text-white rounded-tr-none' 
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleSendMessage}
        className="p-3 bg-zinc-950 border-t-2 border-zinc-900 flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="TYPE MESSAGE..."
          maxLength={100}
          className="flex-1 bg-black border-2 border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-600 font-mono"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white p-2 border-2 border-black shadow-[2px_2px_0_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <Send className={`w-4 h-4 ${sending ? 'animate-pulse' : ''}`} />
        </button>
      </form>
    </div>
  );
}
