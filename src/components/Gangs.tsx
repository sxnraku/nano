import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Trophy, Target, Gift, Skull, Copy, Terminal, Radio, Brain, Activity, MessageSquare, Star, Coins } from 'lucide-react';
import type { Guild, UserProfile } from '../services/firebase';
import { createGuild, joinGuild, getGuilds, getGuildMembers, leaveGuild, promoteMember, kickMember, contributeToGuild } from '../services/firebase';
import { motion, AnimatePresence } from 'motion/react';
import type { User } from 'firebase/auth';
import { translations, type Language } from '../services/localizationService';
import { GangChat } from './GangChat';
import { GangPerks } from './GangPerks';

import { doc, getDoc } from 'firebase/firestore';

interface GangsProps {
    user: User | null;
    onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    onUpdateStats: (type?: 'claim_quest_scrap', amount?: number) => void;
    language?: Language;
    onStartRaid?: (bossLevel: number) => void;
}

type Tab = 'overview' | 'chat' | 'perks' | 'members';

export function Gangs({ user, onShowToast, onUpdateStats, language = 'en', onStartRaid }: GangsProps) {
    const t = translations[language];
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newGuildName, setNewGuildName] = useState('');
    const [guildMembers, setGuildMembers] = useState<UserProfile[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [donating, setDonating] = useState(false);
    const [donationAmount, setDonationAmount] = useState(100);

    useEffect(() => {
        loadGuilds();
        if (user) {
            loadProfile();
        }
    }, [user]);

    useEffect(() => {
        if (userProfile?.guildId) {
            loadGuildMembers(userProfile.guildId);
        }
    }, [userProfile?.guildId]);

    const loadGuildMembers = async (guildId: string) => {
        setLoadingMembers(true);
        const members = await getGuildMembers(guildId);
        setGuildMembers(members);
        setLoadingMembers(false);
    };

    const loadProfile = async () => {
        if (!user) return;
        try {
            const { db } = await import('../services/firebase');
            const docRef = doc(db, 'users', user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data() as UserProfile;

                // Reset quests if it's a new day
                const today = new Date().toISOString().split('T')[0];
                if (data.quests?.lastQuestDate !== today) {
                    data.quests = { scansToday: 0, gangWarWinsToday: 0, lastQuestDate: today };
                    // Don't auto-save to firebase here to save writes, just use local state
                }

                setUserProfile(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadGuilds = async () => {
        setLoading(true);
        const data = await getGuilds();
        setGuilds(data);
        setLoading(false);
    };

    const handleCreateGuild = async () => {
        if (!user) return onShowToast(t.gang_login_required, 'error');
        if (newGuildName.length < 3) return onShowToast(t.gang_name_too_short, 'error');
        if (userProfile?.guildId) return onShowToast(t.gang_already_in, 'error');

        setCreating(true);
        try {
            await createGuild(newGuildName, user);
            onShowToast(t.gang_created_success, 'success');
            setNewGuildName('');
            onUpdateStats();
            loadProfile();
            loadGuilds();
        } catch (e) {
            onShowToast(t.gang_create_error, 'error');
        }
        setCreating(false);
    };

    const handleJoinGuild = async (guildId: string) => {
        if (!user) return onShowToast(t.gang_login_required, 'error');
        if (userProfile?.guildId) return onShowToast(t.gang_already_in, 'error');

        try {
            const success = await joinGuild(guildId, user);
            if (success) {
                onShowToast(t.gang_welcome, 'success');
                onUpdateStats();
                loadProfile();
                loadGuilds();
            } else {
                onShowToast(t.gang_join_error, 'error');
            }
        } catch (e) {
            onShowToast(t.gang_join_error, 'error');
        }
    };

    const handleLeaveGuild = async () => {
        if (!user || !userProfile?.guildId) return;
        if (!window.confirm(t.gang_leave_confirm)) return;

        try {
            await leaveGuild(user.uid, userProfile.guildId);
            onShowToast('Left gang.', 'info');
            loadProfile();
            loadGuilds();
        } catch (e) {
            onShowToast('Error leaving gang.', 'error');
        }
    };

    const handleKickMember = async (targetUid: string) => {
        if (!userProfile?.guildId) return;
        try {
            await kickMember(targetUid, userProfile.guildId);
            onShowToast('Member kicked.', 'info');
            loadGuildMembers(userProfile.guildId);
        } catch (e) {
            onShowToast('Error kicking member.', 'error');
        }
    };

    const handlePromoteMember = async (targetUid: string, guildId: string, currentRole: string) => {
        try {
            await promoteMember(targetUid, guildId, currentRole);
            onShowToast('Member promoted.', 'success');
            loadGuildMembers(userProfile.guildId);
            loadProfile(); // In case self-leadership was transferred
        } catch (e) {
            onShowToast('Error promoting member.', 'error');
        }
    };

    const handleContribute = async () => {
        if (!user || !userProfile?.guildId || userProfile.scrap < donationAmount) return;
        setDonating(true);
        try {
            const success = await contributeToGuild(userProfile.guildId, user.uid, donationAmount);
            if (success) {
                onShowToast(t.success, 'success');
                loadProfile();
                loadGuilds();
            } else {
                onShowToast('Error contributing.', 'error');
            }
        } catch (e) {
            onShowToast('Error contributing.', 'error');
        } finally {
            setDonating(false);
        }
    };

    const claimQuestReward = (questType: 'scan' | 'gangWar') => {
        onUpdateStats('claim_quest_scrap', questType === 'scan' ? 50 : 200);
        onShowToast(questType === 'scan' ? t.quest_scan_claimed : t.quest_war_claimed, 'success');
    };

    if (!user) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800">
                    <Shield className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
                    <p className="text-zinc-400">Log in to create or join a Gang.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-white italic tracking-wider uppercase drop-shadow-[0_0_15px_rgba(168,85,247,0.3)] font-glitch">
                    <span className="text-zinc-600">//</span> UNDERWORLD <span className="text-purple-500">GANGS</span>
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="h-[1px] w-8 bg-zinc-800" />
                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">{t.gangs_subtitle}</p>
                    <div className="h-[1px] w-8 bg-zinc-800" />
                </div>
            </div>

            {/* User's Current Guild or Create New */}
            <div className="bg-zinc-950 border-4 border-black shadow-[8px_8px_0_#000] p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
                {userProfile?.guildId ? (() => {
                    const myGuild = guilds.find(g => g.id === userProfile.guildId);
                    return (
                        <div className="flex flex-col">
                            <div className="bg-purple-600 p-4 border-b-4 border-black flex items-center justify-between -mx-4 -mt-4 mb-4 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 bg-black border-2 border-white flex items-center justify-center -rotate-3 shadow-[4px_4px_0_#000] group-hover:rotate-0 transition-transform shrink-0">
                                        <Shield className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-[8px] text-white bg-black px-1.5 font-black uppercase tracking-widest inline-block -rotate-1 border border-white/20">
                                                {t.gang_ops_center}
                                            </div>
                                            <Activity className="w-3 h-3 text-white/50 animate-pulse" />
                                        </div>
                                        <h3 className="text-2xl font-marker text-white uppercase italic leading-none drop-shadow-[2px_2px_0_#000]">
                                            {myGuild ? myGuild.name : 'Gang Hub'}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLeaveGuild}
                                    className="bg-black border-2 border-white p-2 shadow-[2px_2px_0_#000] hover:bg-red-600 transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none group active:scale-95"
                                    title={t.gang_leave}
                                >
                                    <Plus className="w-5 h-5 rotate-45 transform" />
                                </button>
                            </div>

                            {/* XP Bar & Level */}
                            <div className="mb-4">
                                <div className="flex justify-between items-end mb-1 px-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">DOMINION_LEVEL</span>
                                        <span className="text-xl font-glitch text-purple-400 leading-none">LV. {myGuild?.level || 1}</span>
                                    </div>
                                    <span className="text-[9px] font-mono text-zinc-500 italic">XP: {myGuild?.xp || 0} / {myGuild?.xpToNextLevel || 1000}</span>
                                </div>
                                <div className="h-3 bg-zinc-900 border-2 border-black relative overflow-hidden shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((myGuild?.xp || 0) / (myGuild?.xpToNextLevel || 1000)) * 100}%` }}
                                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-400"
                                    />
                                    <div className="absolute inset-0 bg-scanline opacity-20" />
                                </div>
                            </div>

                            {/* Tab Navigation */}
                            <div className="flex border-b-2 border-black mb-4 -mx-4 overflow-x-auto no-scrollbar">
                                {(['overview', 'chat', 'perks', 'members'] as Tab[]).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0 ${
                                            activeTab === tab ? 'text-white bg-black' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                    >
                                        {tab === 'overview' && <div className="flex items-center gap-1"><Terminal className="w-3 h-3" /> DASH</div>}
                                        {tab === 'chat' && <div className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> CHAT</div>}
                                        {tab === 'perks' && <div className="flex items-center gap-1"><Star className="w-3 h-3" /> PERKS</div>}
                                        {tab === 'members' && <div className="flex items-center gap-1"><Users className="w-3 h-3" /> SQUAD</div>}
                                        
                                        {activeTab === tab && (
                                            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                {activeTab === 'overview' && (
                                    <motion.div
                                        key="overview"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-black border-2 border-zinc-800 p-2 shadow-[4px_4px_0_#000] text-center relative group/stat overflow-hidden">
                                                <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/30 animate-scan-fast" />
                                                <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1 group-hover/stat:scale-110 transition-transform" />
                                                <div className="text-white font-glitch font-black text-xl tracking-tighter">{myGuild ? myGuild.members : '1'}</div>
                                                <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest leading-none">{t.gangs_members}</div>
                                            </div>
                                            <div className="bg-black border-2 border-zinc-800 p-2 shadow-[4px_4px_0_#000] text-center relative group/stat overflow-hidden">
                                                <div className="absolute top-0 left-0 w-full h-[1px] bg-amber-500/30 animate-scan-fast" />
                                                <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1 group-hover/stat:scale-110 transition-transform" />
                                                <div className="text-white font-glitch font-black text-xl tracking-tighter">{myGuild ? myGuild.totalTrophies : '0'}</div>
                                                <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest leading-none">{t.gang_dominion_level}</div>
                                            </div>
                                        </div>

                                        {/* Donation Box */}
                                        <div className="bg-zinc-900/50 border-2 border-zinc-800 p-3 flex flex-col gap-2 relative group-contribution overflow-hidden">
                                            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-contribution:opacity-100 transition-opacity pointer-events-none" />
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <Coins className="w-4 h-4 text-amber-400" />
                                                    <span className="text-[10px] font-black text-white uppercase italic tracking-tighter">BOOST DOMINION</span>
                                                </div>
                                                <span className="text-[9px] text-zinc-500 font-bold uppercase">{userProfile.scrap} SCRAP AVAILABLE</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="number"
                                                    value={donationAmount}
                                                    onChange={(e) => setDonationAmount(Math.max(1, parseInt(e.target.value) || 0))}
                                                    className="w-20 bg-black border border-zinc-700 px-2 py-1 text-xs text-amber-400 focus:outline-none focus:border-amber-500 font-mono"
                                                />
                                                <button
                                                    onClick={handleContribute}
                                                    disabled={donating || userProfile.scrap < donationAmount}
                                                    className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:grayscale text-black font-black uppercase italic text-[10px] py-1 shadow-[2px_2px_0_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
                                                >
                                                    {donating ? 'TRANSMITTING...' : 'DONATE SCRAP'}
                                                </button>
                                            </div>
                                            <p className="text-[8px] text-zinc-600 font-bold italic tracking-tighter">*1 SCRAP = 2 GANG XP</p>
                                        </div>

                                        {/* Gang Raid Section */}
                                        <div className="bg-gradient-to-br from-indigo-900/50 to-black border-4 border-black shadow-[4px_4px_0_#000] p-4 relative overflow-hidden group/raid">
                                            <div className="absolute inset-0 bg-scanline opacity-10 pointer-events-none" />
                                            <div className="flex justify-between items-start mb-3 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <Skull className="w-5 h-5 text-indigo-400 animate-pulse" />
                                                    <div>
                                                        <div className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] leading-none mb-1">RAID_BOSS</div>
                                                        <h4 className="text-xl font-marker text-white uppercase italic tracking-tighter leading-none">GACHI TITAN</h4>
                                                    </div>
                                                </div>
                                                <div className="bg-indigo-600 text-[8px] text-white font-black px-1.5 py-0.5 rounded-sm uppercase skew-x-[-10deg]">LVL {myGuild?.raidBoss?.level || 1}</div>
                                            </div>
                                            <button
                                                onClick={() => onStartRaid?.(myGuild?.raidBoss?.level || 1)}
                                                disabled={!myGuild?.raidBoss || myGuild.raidBoss.hp <= 0}
                                                className="gachi-button-purple w-full py-2 text-xs flex items-center justify-center gap-2"
                                            >
                                                <Target className="w-4 h-4" />
                                                <span>{myGuild?.raidBoss && myGuild.raidBoss.hp > 0 ? 'BATTLE BOSS' : 'DEFEATED'}</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'chat' && (
                                    <motion.div
                                        key="chat"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <GangChat guildId={userProfile.guildId!} user={user} />
                                    </motion.div>
                                )}

                                {activeTab === 'perks' && (
                                    <motion.div
                                        key="perks"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                    >
                                        <GangPerks currentLevel={myGuild?.level || 1} />
                                    </motion.div>
                                )}

                                {activeTab === 'members' && (
                                    <motion.div
                                        key="members"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <div className="bg-zinc-950 p-2 border-2 border-zinc-800 flex justify-between items-center mb-4">
                                            <p className="text-purple-400 text-[10px] font-mono select-all truncate max-w-[200px]">{userProfile.guildId}</p>
                                            <button onClick={() => { navigator.clipboard.writeText(userProfile.guildId || ''); onShowToast(t.success, 'success'); }} className="p-1 text-zinc-500 hover:text-white"><Copy className="w-4 h-4" /></button>
                                        </div>
                                        {loadingMembers ? <div className="text-center py-4 text-zinc-500 animate-pulse uppercase text-[10px] font-black">SCANNING SQUAD...</div> : (
                                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                {guildMembers.map((member, idx) => (
                                                    <div key={member.uid} className="bg-black border border-zinc-800 p-2 rounded flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-zinc-600 font-mono text-[10px]">{idx + 1}.</span>
                                                                <span className={`font-bold text-xs ${member.uid === user?.uid ? 'text-purple-400' : 'text-zinc-300'}`}>{member.displayName}</span>
                                                                <span className="bg-zinc-800 text-[7px] text-zinc-400 px-1 py-0.5 rounded uppercase font-black">{member.guildRole}</span>
                                                            </div>
                                                            <span className="text-green-500 text-[10px] flex items-center gap-1"><Trophy className="w-3 h-3" /> {member.totalWins}</span>
                                                        </div>
                                                        {member.uid !== user?.uid && (userProfile?.guildRole === 'leader' || (userProfile?.guildRole === 'coleader' && member.guildRole === 'member')) && (
                                                            <div className="flex gap-2 border-t border-zinc-800 pt-1 mt-1">
                                                                {userProfile?.guildRole === 'leader' && member.guildRole !== 'leader' && <button onClick={() => handlePromoteMember(member.uid, userProfile.guildId!, member.guildRole || 'member')} className="text-[8px] font-black text-cyan-400 uppercase underline">PROMOTE</button>}
                                                                <button onClick={() => handleKickMember(member.uid)} className="text-[8px] font-black text-red-500 uppercase underline italic">KICK</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })() : (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-marker text-white flex items-center gap-3 mb-6 rotate-1 italic tracking-tighter">
                            <Plus className="w-7 h-7 text-purple-500 fill-purple-500" />
                            {t.gangs_found_new}
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder={t.gangs_name_placeholder}
                                value={newGuildName}
                                onChange={(e) => setNewGuildName(e.target.value)}
                                maxLength={20}
                                className="flex-1 bg-black border-4 border-black px-6 py-4 text-white focus:outline-none focus:border-purple-600 transition-all placeholder:text-zinc-600 font-glitch uppercase italic shadow-[4px_4px_0_#000]"
                            />
                            <button
                                onClick={handleCreateGuild}
                                disabled={creating || !newGuildName.trim()}
                                className="gachi-button px-6"
                            >
                                {t.gangs_create_button}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Daily Quests */}
            {userProfile && (
                <div className="bg-zinc-950 border-4 border-black shadow-[8px_8px_0_#000] p-4 relative overflow-hidden group mt-4">
                    <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
                    <h3 className="text-2xl font-marker text-white flex items-center gap-3 mb-6 -rotate-1 relative z-10 drop-shadow-[2px_2px_0_#000]">
                        <Terminal className="w-6 h-6 text-red-500 animate-pulse" />
                        {t.gang_contract_status} <span className="text-[10px] text-zinc-500 font-sans italic lowercase tracking-wider bg-black px-1 border border-zinc-800">{t.gangs_contracts_subtitle}</span>
                    </h3>

                    <div className="space-y-4 relative z-10">
                        {/* Quest 1 */}
                        <div className="bg-black border-2 border-zinc-800 p-4 shadow-[4px_4px_0_#000] flex items-center justify-between group/quest">
                            <div>
                                <h4 className="text-white text-sm font-bold">{t.quest_scanner_title}</h4>
                                <p className="text-xs text-zinc-500">{t.quest_scanner_desc} ({userProfile.quests?.scansToday || 0}/3)</p>
                            </div>
                            <button
                                onClick={() => claimQuestReward('scan')}
                                disabled={(userProfile.quests?.scansToday || 0) < 3}
                                className={`w-12 h-12 border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center transition-all active:shadow-none active:translate-x-1 active:translate-y-1 ${((userProfile.quests?.scansToday || 0) >= 3) ? 'bg-red-600 text-white animate-pulse' : 'bg-black text-zinc-600 opacity-50'}`}
                            >
                                <Gift className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Quest 2 */}
                        <div className="bg-black border-2 border-zinc-800 p-4 shadow-[4px_4px_0_#000] flex items-center justify-between group/quest">
                            <div>
                                <h4 className="text-white text-sm font-black uppercase italic tracking-tighter">{t.quest_brawler_title}</h4>
                                <p className="text-xs text-zinc-500 font-mono italic">{t.quest_brawler_desc} ({userProfile.quests?.gangWarWinsToday || 0}/1)</p>
                            </div>
                            <button
                                onClick={() => claimQuestReward('gangWar')}
                                disabled={(userProfile.quests?.gangWarWinsToday || 0) < 1}
                                className={`w-12 h-12 border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center transition-all active:shadow-none active:translate-x-1 active:translate-y-1 ${((userProfile.quests?.gangWarWinsToday || 0) >= 1) ? 'bg-orange-600 text-white animate-pulse' : 'bg-zinc-900 text-zinc-600'}`}
                            >
                                <Gift className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guild List */}
            <div className="space-y-4">
                <h3 className="text-xl font-black text-white flex items-center gap-3 px-2 uppercase italic tracking-tighter">
                    <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                    {t.gangs_recruiting_title}
                </h3>
                {loading ? (
                    <div className="text-center py-8 text-zinc-500 animate-pulse">{t.gangs_searching_underworld}</div>
                ) : guilds.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 border border-zinc-800 border-dashed rounded-xl">
                        {t.gangs_none_found}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {guilds.map((g) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={g.id}
                                className="bg-zinc-950 border-4 border-black p-4 flex items-center justify-between shadow-[6px_6px_0_#000] group/guild relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />
                                <div className="relative z-10">
                                    <h4 className="font-marker text-white text-2xl uppercase italic -rotate-1 tracking-tighter">{g.name}</h4>
                                    <div className="flex gap-4 mt-2">
                                        <span className="text-[10px] text-zinc-400 font-black uppercase flex items-center gap-1">
                                            <Users className="w-3 h-3" /> {g.members} {t.gangs_members}
                                        </span>
                                        <span className="text-[10px] text-amber-500 font-black uppercase flex items-center gap-1">
                                            <Trophy className="w-3 h-3" /> {g.totalTrophies} {t.gangs_dominion.split(' ')[0]}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-zinc-500 mt-2 font-mono uppercase tracking-widest border-l-2 border-zinc-800 pl-2">
                                        {t.gang_leader_label}: <span className="text-purple-400">{g.leaderName}</span>
                                    </p>
                                </div>

                                {!userProfile?.guildId && (
                                    <button
                                        onClick={() => handleJoinGuild(g.id!)}
                                        className="gachi-button-cyan px-6 py-2"
                                    >
                                        {t.gangs_join_button}
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
