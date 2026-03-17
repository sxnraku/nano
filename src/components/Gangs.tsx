import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Trophy, Target, Gift, Skull, Copy, Terminal, Radio, Brain, Activity } from 'lucide-react';
import type { Guild, UserProfile } from '../services/firebase';
import { createGuild, joinGuild, getGuilds, getGuildMembers, leaveGuild, promoteMember, kickMember } from '../services/firebase';
import { motion } from 'motion/react';
import type { User } from 'firebase/auth';
import { translations, type Language } from '../services/localizationService';

import { doc, getDoc } from 'firebase/firestore';

interface GangsProps {
    user: User | null;
    onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    onUpdateStats: (type?: 'claim_quest_scrap', amount?: number) => void;
    language?: Language;
    onStartRaid?: (bossLevel: number) => void;
}

export function Gangs({ user, onShowToast, onUpdateStats, language = 'en', onStartRaid }: GangsProps) {
    const t = translations[language];
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newGuildName, setNewGuildName] = useState('');
    const [guildMembers, setGuildMembers] = useState<UserProfile[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

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
                            <div className="bg-purple-600 p-4 border-b-4 border-black flex items-center justify-between -mx-4 -mt-4 mb-6 relative overflow-hiddenGroup">
                                <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-12 h-12 bg-black border-2 border-white flex items-center justify-center -rotate-3 shadow-[4px_4px_0_#000] group-hover:rotate-0 transition-transform">
                                        <Shield className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-[9px] text-white bg-black px-1.5 font-black uppercase tracking-widest inline-block -rotate-1 border border-white/20">
                                                {t.gang_ops_center}
                                            </div>
                                            <Activity className="w-3 h-3 text-white/50 animate-pulse" />
                                        </div>
                                        <h3 className="text-3xl font-marker text-white uppercase italic leading-none drop-shadow-[2px_2px_0_#000]">
                                            {myGuild ? myGuild.name : 'Gang Hub'}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLeaveGuild}
                                    className="bg-black border-2 border-white p-2 shadow-[4px_4px_0_#000] hover:bg-red-600 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none group active:scale-95"
                                    title={t.gang_leave}
                                >
                                    <Plus className="w-6 h-6 rotate-45 transform" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-black border-2 border-zinc-800 p-3 shadow-[4px_4px_0_#000] text-center relative group/stat overflow-hidden">
                                     <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/30 animate-scan-fast" />
                                    <Users className="w-5 h-5 text-cyan-400 mx-auto mb-1 group-hover/stat:scale-110 transition-transform" />
                                    <div className="text-white font-glitch font-black text-2xl tracking-tighter">{myGuild ? myGuild.members : '1'}</div>
                                    <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{t.gangs_members}</div>
                                </div>
                                <div className="bg-black border-2 border-zinc-800 p-3 shadow-[4px_4px_0_#000] text-center relative group/stat overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-amber-500/30 animate-scan-fast" />
                                    <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1 group-hover/stat:scale-110 transition-transform" />
                                    <div className="text-white font-glitch font-black text-2xl tracking-tighter">{myGuild ? myGuild.totalTrophies : '0'}</div>
                                    <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{t.gang_dominion_level}</div>
                                </div>
                            </div>

                            <div className="bg-zinc-950 p-3 border-2 border-zinc-800 flex justify-between items-center mb-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                                <div>
                                    <div className="text-[9px] text-zinc-500 uppercase font-black mb-1 flex items-center gap-1">
                                        <Terminal className="w-3 h-3" /> {t.gangs_recruitment_code}
                                    </div>
                                    <p className="text-purple-400 text-xs font-mono select-all bg-purple-900/20 px-2 py-1.5 rounded border border-purple-500/30 truncate max-w-[180px] shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                                        {userProfile.guildId}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(userProfile.guildId || '');
                                        onShowToast(t.success, 'success');
                                    }}
                                    className="bg-zinc-900 border border-zinc-700 p-2.5 text-zinc-400 hover:text-white hover:border-white transition-all active:scale-95 shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Gang Raid Section */}
                            <div className="bg-gradient-to-br from-indigo-900/50 to-black border-4 border-black shadow-[8px_8px_0_#000] p-5 mb-6 relative overflow-hidden group/raid">
                                <div className="absolute inset-0 bg-scanline opacity-10 pointer-events-none" />
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full" />
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 rounded flex items-center justify-center">
                                            <Skull className="w-6 h-6 text-indigo-400 animate-pulse" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/20 inline-block mb-1">
                                                {t.gang_raid_threat}
                                            </div>
                                            <h4 className="text-2xl font-marker text-white uppercase italic tracking-tighter leading-none">
                                                GACHI TITAN <span className="text-[10px] lowercase font-sans opacity-50 not-italic">v.{myGuild?.raidBoss?.level || 1}.0</span>
                                            </h4>
                                        </div>
                                    </div>
                                    <div className="bg-indigo-600 text-[10px] text-white font-black px-2.5 py-1 rounded-sm uppercase skew-x-[-10deg] shadow-[2px_2px_0_#000]">
                                        LVL {myGuild?.raidBoss?.level || 1}
                                    </div>
                                </div>

                                <div className="relative h-8 bg-zinc-950 border-2 border-zinc-800 p-1 mb-4 overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-red-600 via-indigo-600 to-cyan-400 relative"
                                        initial={{ width: '100%' }}
                                        animate={{ width: `${((myGuild?.raidBoss?.hp || 1000) / (myGuild?.raidBoss?.maxHp || 1000)) * 100}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    >
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                                    </motion.div>
                                    <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-black text-white drop-shadow-[1px_1px_0_#000] uppercase tracking-tighter italic">
                                        <span>SYSTEM_STABILITY: {(myGuild?.raidBoss?.hp || 0).toLocaleString()} UNITS</span>
                                        <span className="opacity-50">/ {(myGuild?.raidBoss?.maxHp || 1000).toLocaleString()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onStartRaid?.(myGuild?.raidBoss?.level || 1)}
                                    disabled={!myGuild?.raidBoss || myGuild.raidBoss.hp <= 0}
                                    className="gachi-button-purple w-full py-4 text-xl flex items-center justify-center gap-4 group/btn"
                                >
                                    <Target className="w-6 h-6 group-hover/btn:scale-125 transition-transform" />
                                    <span>{myGuild?.raidBoss && myGuild.raidBoss.hp > 0 ? 'NEUTRALIZE THREAT' : 'TARGET_ELIMINATED'}</span>
                                </button>
                            </div>

                            {/* Guild Members List */}
                            <div className="mt-4">
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <Radio className="w-3 h-3 animate-pulse text-purple-500" /> {t.gang_recruitment_open}
                                </h4>
                                {loadingMembers ? (
                                    <div className="text-center py-4 text-zinc-500 text-xs animate-pulse">Scanning intelligence...</div>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                        {guildMembers.map((member, idx) => (
                                            <div key={member.uid} className="bg-black/50 border border-zinc-800 p-2 text-sm rounded flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-zinc-600 font-mono text-xs w-4">{idx + 1}.</span>
                                                        <span className={`font-bold ${member.uid === user?.uid ? 'text-purple-400' : 'text-zinc-300'}`}>
                                                            {member.displayName}
                                                        </span>
                                                        <span className="bg-zinc-800 text-[8px] text-zinc-400 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">
                                                            {member.guildRole === 'leader' ? t.gang_role_leader : member.guildRole === 'coleader' ? t.gang_role_coleader : t.gang_role_member}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-3 text-xs">
                                                        <span className="text-green-500 flex items-center gap-1"><Trophy className="w-3 h-3" /> {member.totalWins}</span>
                                                        <span className="text-zinc-500 hidden sm:flex items-center gap-1"><Target className="w-3 h-3" /> Lv. {member.collectionSize}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Actions */}
                                                {member.uid !== user?.uid && (userProfile?.guildRole === 'leader' || (userProfile?.guildRole === 'coleader' && member.guildRole === 'member')) && (
                                                    <div className="flex gap-2">
                                                        {userProfile?.guildRole === 'leader' && member.guildRole !== 'leader' && (
                                                            <button 
                                                                onClick={() => handlePromoteMember(member.uid, userProfile.guildId!, member.guildRole || 'member')}
                                                                className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase underline"
                                                            >
                                                                {t.gang_promote}
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleKickMember(member.uid)}
                                                            className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase underline"
                                                        >
                                                            {t.gang_kick}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
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
