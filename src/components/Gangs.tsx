import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Trophy, Target, Gift, Skull } from 'lucide-react';
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
                <h2 className="text-3xl font-black text-white italic tracking-wider uppercase drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    Underworld <span className="text-purple-500">Gangs</span>
                </h2>
                <p className="text-zinc-400 mt-2">Join other warriors. Battle for territories and gain power.</p>
            </div>

            {/* User's Current Guild or Create New */}
            <div className="bg-zinc-950 border-4 border-black shadow-[8px_8px_0_#000] p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
                {userProfile?.guildId ? (() => {
                    const myGuild = guilds.find(g => g.id === userProfile.guildId);
                    return (
                        <div className="flex flex-col">
                            <div className="bg-purple-600 p-4 border-b-4 border-black flex items-center justify-between -mx-4 -mt-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-black border-2 border-white flex items-center justify-center -rotate-3 shadow-[4px_4px_0_#000]">
                                        <Shield className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-white bg-black px-1 font-bold uppercase tracking-widest inline-block -rotate-1">Base Ops</div>
                                        <h3 className="text-3xl font-marker text-white uppercase italic leading-none">{myGuild ? myGuild.name : 'Gang Hub'}</h3>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLeaveGuild}
                                    className="bg-black border-2 border-white p-2 shadow-[4px_4px_0_#000] hover:bg-red-600 transition-colors group active:shadow-none active:translate-x-1 active:translate-y-1"
                                    title={t.gang_leave}
                                >
                                    <Plus className="w-6 h-6 rotate-45 transform" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-black border-2 border-zinc-800 p-3 shadow-[4px_4px_0_#000] text-center skew-x-[-4deg]">
                                    <Users className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                                    <div className="text-white font-glitch font-black text-2xl">{myGuild ? myGuild.members : '1'}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Members</div>
                                </div>
                                <div className="bg-black border-2 border-zinc-800 p-3 shadow-[4px_4px_0_#000] text-center skew-x-[4deg]">
                                    <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                                    <div className="text-white font-glitch font-black text-2xl">{myGuild ? myGuild.totalTrophies : '0'}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Dominion</div>
                                </div>
                            </div>

                            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between items-center mb-4">
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Recruitment Code</div>
                                    <p className="text-purple-400 text-xs font-mono select-all bg-purple-900/30 px-2 py-1 rounded border border-purple-500/30 truncate max-w-[150px]">{userProfile.guildId}</p>
                                </div>
                                <div className="text-[10px] text-zinc-500 text-right pr-2">
                                    Share this ID<br />with friends!
                                </div>
                            </div>

                            {/* Gang Raid Section */}
                            <div className="bg-gradient-to-br from-indigo-900/40 to-black border-2 border-indigo-500/50 rounded-xl p-4 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <Skull className="w-5 h-5 text-indigo-400" />
                                        <span className="text-sm font-black text-white uppercase italic tracking-tighter">Gang Raid Boss</span>
                                    </div>
                                    <div className="bg-indigo-600 text-[10px] text-white font-black px-2 py-0.5 rounded uppercase">Level {myGuild?.raidBoss?.level || 1}</div>
                                </div>

                                <div className="relative h-6 bg-zinc-950 border-2 border-indigo-500/30 rounded-full overflow-hidden mb-3">
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-red-600 via-indigo-500 to-indigo-400"
                                        initial={{ width: '100%' }}
                                        animate={{ width: `${((myGuild?.raidBoss?.hp || 1000) / (myGuild?.raidBoss?.maxHp || 1000)) * 100}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-[1px_1px_0_#000]">
                                        BOSS HP: {myGuild?.raidBoss?.hp || 0} / {myGuild?.raidBoss?.maxHp || 1000}
                                    </div>
                                </div>

                                <button
                                    onClick={() => onStartRaid?.(myGuild?.raidBoss?.level || 1)}
                                    disabled={!myGuild?.raidBoss || myGuild.raidBoss.hp <= 0}
                                    className="gachi-button w-full flex items-center justify-center gap-3 py-3"
                                >
                                    <Skull className="w-6 h-6" />
                                    <span className="text-lg">{myGuild?.raidBoss && myGuild.raidBoss.hp > 0 ? 'ATTACK RAID BOSS' : 'BOSS ELIMINATED'}</span>
                                </button>
                            </div>

                            {/* Guild Members List */}
                            <div className="mt-2">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Members
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
                    <h3 className="text-2xl font-marker text-white flex items-center gap-3 mb-6 -rotate-1 relative z-10">
                        <Target className="w-6 h-6 text-red-500" />
                        {t.gangs_contracts_title} <span className="text-xs text-zinc-500 font-sans italic lowercase">{t.gangs_contracts_subtitle}</span>
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
                                className={`w-12 h-12 border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center transition-all active:shadow-none active:translate-x-1 active:translate-y-1 ${((userProfile.quests?.gangWarWinsToday || 0) >= 1) ? 'bg-orange-600 text-white animate-pulse' : 'bg-black text-zinc-600 opacity-50'}`}
                            >
                                <Gift className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guild List */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 px-2">
                    <Users className="w-5 h-5 text-cyan-400" />
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
                                    <p className="text-[8px] text-zinc-600 mt-2 font-mono uppercase tracking-widest">{t.gang_leader_label}: <span className="text-zinc-400">{g.leaderName}</span></p>
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
