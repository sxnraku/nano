export type Language = 'en' | 'pt';

export interface Translation {
    // Navigation
    nav_scan: string;
    nav_gang: string;
    nav_arena: string;
    nav_settings: string;
    nav_clan: string;
    nav_profile: string;

    // Trophies
    trophies_title: string;
    trophies_subtitle: string;
    trophies_unlocked: string;

    // Ranks
    rank_title: string;
    rank_0: string;
    rank_1: string;
    rank_2: string;
    rank_3: string;
    rank_4: string;
    rank_5: string;
    rank_6: string;
    rank_7: string;

    // Arena
    arena_title: string;
    arena_subtitle: string;
    mode_survival_title: string;
    mode_survival_desc: string;
    mode_blitz_title: string;
    mode_blitz_desc: string;
    mode_boss_title: string;
    mode_boss_desc: string;
    mode_gang_war_title: string;
    mode_gang_war_desc: string;
    mode_pvp_title: string;
    mode_pvp_desc: string;
    pvp_lobby_title: string;
    pvp_lobby_subtitle: string;
    pvp_host_button: string;
    pvp_join_button: string;
    pvp_searching: string;
    pvp_no_rooms: string;
    pvp_waiting_guest: string;
    pvp_starting: string;
    pvp_vs: string;
    searching: string;
    retreat: string;
    targets_in_area: string;

    // Settings
    settings_title: string;
    settings_subtitle: string;
    settings_audio: string;
    settings_main_audio: string;
    settings_audio_desc: string;
    settings_volume: string;
    settings_player_data: string;
    settings_load_cloud: string;
    settings_save_cloud: string;
    settings_logout: string;
    settings_login: string;
    settings_language: string;
    settings_danger_zone: string;
    settings_danger_zone_desc: string;
    settings_reset_button: string;
    settings_reset_confirm: string;
    settings_about: string;
    settings_about_desc: string;
    settings_terms_link: string;
    settings_guide_link: string;

    // Scan / Processing
    scan_initiating: string;
    scan_step_extracting: string;
    scan_step_generating: string;
    scan_step_finalizing: string;

    // Gangs / Guilds
    gangs_title: string;
    gangs_subtitle: string;
    gangs_ops_base: string;
    gangs_recruitment_code: string;
    gangs_share_id: string;
    gangs_members: string;
    gangs_scanning_intel: string;
    gangs_active_members: string;
    gangs_dominion: string;
    gangs_found_new: string;
    gangs_name_placeholder: string;
    gangs_create_button: string;
    gangs_contracts_title: string;
    gangs_contracts_subtitle: string;
    gangs_recruiting_title: string;
    gangs_searching_underworld: string;
    gangs_none_found: string;
    gangs_join_button: string;
    gangs_login_required: string;
    gangs_login_desc: string;
    gang_leave: string;
    gang_kick: string;
    gang_promote: string;
    gang_role_leader: string;
    gang_role_coleader: string;
    gang_role_member: string;
    gang_leave_confirm: string;
    gang_ops_center: string;
    gang_raid_threat: string;
    gang_contract_status: string;
    gang_recruitment_open: string;
    gang_copy_code: string;
    gang_dominion_level: string;

    // Quests
    quest_scanner_title: string;
    quest_scanner_desc: string;
    quest_brawler_title: string;
    quest_brawler_desc: string;

    // Battle
    battle_tap_hint: string;
    battle_ultimate: string;
    battle_combo: string;
    battle_ko: string;
    battle_boss_defeated: string;
    battle_victory: string;
    battle_defeat: string;
    battle_wave_clear: string;
    battle_time_up: string;
    battle_gang_victorious: string;
    battle_total_kills: string;
    battle_waves_survived: string;
    battle_next_wave: string;
    battle_try_again: string;
    battle_leave_arena: string;
    battle_member_lost: string;
    battle_status_burn: string;
    battle_status_stun: string;
    battle_status_break: string;
    battle_miss: string;
    battle_crit: string;
    battle_dodge: string;
    battle_stunned: string;
    battle_burned: string;
    battle_broken: string;
    battle_heal: string;

    // Victory Screen
    victory_dominion: string;
    victory_boss_down: string;
    victory_title: string;
    victory_champion_defeated: string;
    victory_rival_gang_crushed: string;
    victory_battle_complete: string;
    victory_rewards: string;
    victory_experience: string;
    victory_claim_prize: string;
    victory_continue: string;
    victory_rank: string;
    victory_time: string;
    victory_max_combo: string;
    victory_damage: string;
    victory_hp_remaining: string;

    // Warrior Details
    warrior_class: string;
    warrior_rarity: string;
    warrior_element: string;
    warrior_description: string;
    warrior_origin: string;
    warrior_full_desc: string;
    warrior_creation_date: string;
    warrior_serial_id: string;
    warrior_confidential: string;
    warrior_stats_reroll_title: string;
    warrior_stats_reroll_desc: string;
    warrior_stats_reroll_button: string;
    warrior_visual_reroll_title: string;
    warrior_visual_reroll_button: string;
    warrior_share_button: string;
    warrior_attributes_title: string;
    warrior_equipment_title: string;
    warrior_no_weapon: string;
    warrior_change_weapon: string;
    warrior_empty_inventory: string;
    warrior_consumables_title: string;
    warrior_use_button: string;
    warrior_scrap_available: string;

    // Fusion
    fusion_title: string;
    fusion_select_two: string;
    fusion_stabilizer_title: string;
    fusion_stabilizer_desc: string;
    fusion_warning_title: string;
    fusion_warning_desc: string;
    fusion_stabilizer_button: string;
    fusion_start_button: string;
    fusion_step_analyzing: string;
    fusion_step_synthesizing: string;
    fusion_step_stabilizing: string;
    fusion_error: string;

    // Black Market
    market_title: string;
    market_buy_button: string;
    market_footer: string;
    market_permanent: string;
    market_weapon: string;
    market_boost: string;

    // Leaderboard
    leaderboard_title: string;
    leaderboard_subtitle: string;
    leaderboard_loading: string;
    leaderboard_empty: string;
    leaderboard_wins: string;
    leaderboard_combo: string;
    leaderboard_level: string;
    leaderboard_collection: string;
    leaderboard_scraps: string;
    leaderboard_high_wave: string;
    leaderboard_high_blitz: string;

    // Progression
    prog_street_cred: string;
    prog_level: string;
    prog_scrap: string;
    prog_xp: string;
    prog_missions_title: string;
    prog_wins: string;
    prog_scans: string;

    // Legal
    legal_title: string;
    legal_protocols: string;
    legal_terms_tab: string;
    legal_privacy_tab: string;
    legal_acceptance_title: string;
    legal_acceptance_desc: string;
    legal_ai_title: string;
    legal_ai_desc: string;
    legal_ai_list1: string;
    legal_ai_list2: string;
    legal_ai_list3: string;
    legal_ip_title: string;
    legal_ip_desc: string;
    legal_disclaimer_title: string;
    legal_disclaimer_desc: string;
    legal_virtual_items_title: string;
    legal_virtual_items_desc: string;
    legal_user_conduct_title: string;
    legal_user_conduct_desc: string;
    legal_data_title: string;
    legal_data_desc: string;
    legal_data_list1: string;
    legal_data_list2: string;
    legal_data_rights_title: string;
    legal_data_rights_desc: string;
    legal_children_title: string;
    legal_children_desc: string;
    legal_third_party_title: string;
    legal_third_party_desc: string;
    legal_storage_title: string;
    legal_storage_desc: string;
    legal_contact_title: string;
    legal_contact_desc: string;

    // Game Guide
    guide_title: string;
    guide_rarity_title: string;
    guide_rarity_desc: string;
    guide_chance: string;
    guide_base_stats: string;
    guide_combat_title: string;
    guide_hp_name: string;
    guide_hp_desc: string;
    guide_atk_name: string;
    guide_atk_desc: string;
    guide_def_name: string;
    guide_def_desc: string;
    guide_spd_name: string;
    guide_spd_desc: string;
    guide_economy_title: string;
    guide_new_scan: string;
    guide_arena_victory: string;
    guide_recycle: string;
    guide_footer: string;

    // Common / Misc
    info_local_id: string;
    info_version: string;
    loading: string;
    error: string;
    success: string;
    common_common: string;
    common_rare: string;
    common_epic: string;
    common_legendary: string;
    common_xp: string;
    common_seconds: string;
    upgrade: string;
    threat_low: string;
    threat_med: string;
    threat_high: string;
    threat_deadly: string;
    elite_prefix: string;
    // New Keys
    toast_syncing: string;
    toast_sync_success: string;
    toast_sync_error: string;
    toast_loading_cloud: string;
    toast_load_success: string;
    toast_load_error: string;
    toast_no_record: string;
    toast_welcome_matrix: string;
    toast_auth_failed: string;
    toast_welcome_back: string;
    toast_login_failed: string;
    toast_account_created: string;
    toast_signup_failed: string;
    toast_storage_error: string;
    toast_mission_complete: string;
    toast_level_up: string;
    toast_energy_depleted: string;
    toast_warrior_materialized: string;
    toast_gen_failed: string;
    confirm_overwrite: string;
    // Additional Keys
    battle_burn_status: string;
    battle_time_bonus: string;
    gang_login_required: string;
    gang_name_too_short: string;
    gang_already_in: string;
    gang_created_success: string;
    gang_create_error: string;
    gang_welcome: string;
    gang_join_error: string;
    quest_scan_claimed: string;
    quest_war_claimed: string;
    gang_leader_label: string;
    item_repair_name: string;
    item_repair_desc: string;
    item_overclock_name: string;
    item_overclock_desc: string;
    toast_targets_located: string;
    toast_boss_detected: string;
    toast_gang_war_started: string;
    toast_recalibrated: string;
    toast_warrior_updated: string;
    toast_nanites_purchased: string;
    toast_exchange_completed: string;
    toast_cells_recharged: string;
    toast_daily_bonus: string;
    toast_video_interrupted: string;
    toast_fusion_stabilized: string;
    toast_fusion_success: string;
    toast_ai_limit: string;
    toast_gen_error: string;
    arena_searching_match: string;
    arena_match_found: string;
    arena_cancel_search: string;
    loading_reality: string;
    share_card_title: string;
    share_card_download: string;
    share_card_native: string;
    share_friend_invite: string;
    share_friend_copy: string;
    share_alliance_proposal: string;
    share_alliance_accept: string;
    share_alliance_ignore: string;
    share_alliance_success: string;
    share_alliance_desc: string;
}

export const translations: Record<Language, Translation> = {
    en: {
        nav_scan: 'SCAN',
        nav_gang: 'GANG',
        nav_arena: 'ARENA',
        nav_settings: 'SETTINGS',
        nav_clan: 'CLAN',
        nav_profile: 'PROFILE',
        trophies_title: 'ACHIEVEMENTS',
        trophies_subtitle: 'YOUR HALL OF FAME',
        trophies_unlocked: 'Unlocked Trophies',
        rank_title: "Street Rank",
        rank_0: "Rookie",
        rank_1: "Street Prowler",
        rank_2: "Fighter",
        rank_3: "Enforcer",
        rank_4: "Lieutenant",
        rank_5: "Underboss",
        rank_6: "Gang Boss",
        rank_7: "NanoVerse Legend",
        arena_title: 'BATTLE ARENA',
        arena_subtitle: 'Fame and reward await the winners.',
        mode_survival_title: 'Survival',
        mode_survival_desc: "Infinite waves. HP doesn't regenerate.",
        mode_blitz_title: 'Blitz',
        mode_blitz_desc: '60s to cause maximum chaos.',
        mode_boss_title: 'Boss Rush',
        mode_boss_desc: 'Face an opponent with 3x more HP.',
        mode_gang_war_title: 'Gang War',
        mode_gang_war_desc: '3 vs 3. Winner take a card from the loser.',
        mode_pvp_title: 'Real-time PvP',
        mode_pvp_desc: 'Battle against other players in real-time.',
        pvp_lobby_title: 'PvP LOBBY',
        pvp_lobby_subtitle: 'FIGHT FOR GLORY',
        pvp_host_button: 'HOST BATTLE',
        pvp_join_button: 'JOIN',
        pvp_searching: 'SEARCHING FOR RIVALS...',
        pvp_no_rooms: 'NO ACTIVE CHALLENGES. HOST ONE!',
        pvp_waiting_guest: 'WAITING FOR CHALLENGER...',
        pvp_starting: 'STARTING BATTLE...',
        pvp_vs: 'VS',
        searching: 'SEARCHING...',
        retreat: 'Retreat',
        targets_in_area: 'TARGETS IN AREA',
        settings_title: 'Settings',
        settings_subtitle: 'SYSTEM CONFIGURATION',
        settings_audio: 'Audio',
        settings_main_audio: 'Main Audio',
        settings_audio_desc: 'ENABLE/DISABLE ALL SOUNDS',
        settings_volume: 'Volume',
        settings_player_data: 'Player Data',
        settings_load_cloud: 'Load Cloud Data',
        settings_save_cloud: 'Save Cloud Data',
        settings_logout: 'Logout',
        settings_login: 'Login',
        settings_language: 'Language',
        settings_danger_zone: 'Danger Zone',
        settings_danger_zone_desc: 'Irreversible actions that permanently affect your journey in the NanoVerse.',
        settings_reset_button: 'Reset Progress',
        settings_reset_confirm: 'Are you sure you want to reset all progress? This will erase your collection and stats.',
        settings_about: 'About',
        settings_about_desc: 'NanoVerse is a generative combat experience where real-world objects are transformed into digital warriors through advanced AI.',
        settings_terms_link: 'Terms',
        settings_guide_link: 'Guide',
        scan_initiating: 'INITIATING MATERIALIZATION SEQUENCE',
        scan_step_extracting: 'Extracting digital DNA...',
        scan_step_generating: 'Generating visual form...',
        scan_step_finalizing: 'Finalizing warrior...',
        gangs_title: 'Underworld Gangs',
        gangs_subtitle: 'Join other warriors. Battle for territories and gain power.',
        gangs_ops_base: 'Operations Base',
        gangs_recruitment_code: 'Recruitment Code',
        gangs_share_id: 'Share this ID with friends!',
        gangs_members: 'Members',
        gangs_scanning_intel: 'Scanning intelligence...',
        gangs_active_members: 'Active Members',
        gangs_dominion: 'Dominion (Trophies)',
        gangs_found_new: 'Found New Gang',
        gangs_name_placeholder: 'Gang Name...',
        gangs_create_button: 'Create Gang',
        gangs_contracts_title: 'Gang Contracts',
        gangs_contracts_subtitle: '(Daily Quests)',
        gangs_recruiting_title: 'Gangs Recruiting',
        gangs_searching_underworld: 'Searching for gangs in the underworld...',
        gangs_none_found: 'No gangs formed yet. Be the first!',
        gangs_join_button: 'Join',
        gangs_login_required: 'Login Required',
        gangs_login_desc: 'Log in to create or join a Gang.',
        gang_leave: 'LEAVE GANG',
        gang_kick: 'KICK',
        gang_promote: 'PROMOTE',
        gang_role_leader: 'LEADER',
        gang_role_coleader: 'CO-LEADER',
        gang_role_member: 'MEMBER',
        gang_leave_confirm: 'Are you sure you want to leave this gang?',
        gang_ops_center: 'OPS CENTER',
        gang_raid_threat: 'PRIORITY TARGET DETECTED',
        gang_contract_status: 'CONTRACT STATUS',
        gang_recruitment_open: 'RECRUITMENT ACTIVE',
        gang_copy_code: 'COPY CODE',
        gang_dominion_level: 'DOMINION LVL',
        quest_scanner_title: 'Obsessive Scanner',
        quest_scanner_desc: 'Scan 3 objects today.',
        quest_brawler_title: 'Alley Brawler',
        quest_brawler_desc: 'Win 1 Gang War.',
        battle_tap_hint: 'TAP FAST TO ATTACK!',
        battle_ultimate: 'ULTIMATE!',
        battle_combo: 'Combo!',
        battle_ko: 'K.O.!',
        battle_boss_defeated: 'BOSS DEFEATED!',
        battle_victory: 'VICTORY!',
        battle_defeat: 'DEFEAT...',
        battle_wave_clear: 'WAVE CLEAR!',
        battle_time_up: 'TIME UP!',
        battle_gang_victorious: 'GANG VICTORIOUS!',
        battle_total_kills: 'TOTAL KILLS',
        battle_waves_survived: 'WAVES SURVIVED',
        battle_next_wave: 'Next Wave',
        battle_try_again: 'Try Again',
        battle_leave_arena: 'Leave Arena',
        battle_member_lost: 'You lost a member of your gang...',
        battle_status_burn: 'BURN',
        battle_status_stun: 'STUN',
        battle_status_break: 'BREAK',
        battle_miss: 'MISS',
        battle_crit: 'CRIT!',
        battle_dodge: 'DODGE',
        battle_stunned: 'STUNNED',
        battle_burned: 'BURNED',
        battle_broken: 'BROKEN',
        battle_heal: 'HEAL',
        victory_dominion: 'DOMINION!',
        victory_boss_down: 'BOSS DOWN!',
        victory_title: 'VICTORY!',
        victory_champion_defeated: 'CHAMPION DEFEATED',
        victory_rival_gang_crushed: 'RIVAL GANG CRUSHED',
        victory_battle_complete: 'BATTLE COMPLETE',
        victory_rewards: 'BATTLE REWARDS',
        victory_experience: 'Experience',
        victory_claim_prize: 'CLAIM PRIZE',
        victory_continue: 'CONTINUE JOURNEY',
        victory_rank: 'RANK',
        victory_time: 'TIME',
        victory_max_combo: 'MAX COMBO',
        victory_damage: 'TOTAL DAMAGE',
        victory_hp_remaining: 'REMAINING HP',
        warrior_class: 'CLASS',
        warrior_rarity: 'Rarity',
        warrior_element: 'Element',
        warrior_description: 'Description',
        warrior_origin: 'Origin',
        warrior_full_desc: 'Full Description',
        warrior_creation_date: 'Creation Date',
        warrior_serial_id: 'Serial ID',
        warrior_confidential: 'CONFIDENTIAL // TOP SECRET',
        warrior_stats_reroll_title: 'Nanite Calibration',
        warrior_stats_reroll_desc: 'Re-generate all attributes with +15% premium bonus',
        warrior_stats_reroll_button: 'RE-GENERATE STATS (50 NTS)',
        warrior_visual_reroll_title: 'Visual Customization',
        warrior_visual_reroll_button: 'New Visual (50 SCRAP)',
        warrior_share_button: 'Share / Generate Card',
        warrior_attributes_title: 'Attributes & Upgrades',
        warrior_equipment_title: 'Equipment',
        warrior_no_weapon: 'No weapon equipped',
        warrior_change_weapon: 'Change Weapon',
        warrior_empty_inventory: 'Your weapon inventory is empty. Visit the Black Market!',
        warrior_consumables_title: 'Consumables',
        warrior_use_button: 'USE',
        warrior_scrap_available: 'Available Scrap',
        fusion_title: 'Fusion Chamber',
        fusion_select_two: 'Select 2 Warriors',
        fusion_stabilizer_title: 'Nanite Stabilizer',
        fusion_stabilizer_desc: 'Epic+ Guarantee & Stats Bonus (+50%)',
        fusion_warning_title: 'WARNING: IRREVERSIBLE FUSION',
        fusion_warning_desc: 'The two selected warriors will be consumed to create a powerful new warrior.',
        fusion_stabilizer_button: 'ACTIVATE STABILIZER (150 NTS)',
        fusion_start_button: 'START FUSION (100 SCRAP)',
        fusion_step_analyzing: 'Analyzing digital DNA...',
        fusion_step_synthesizing: 'Synthesizing new form...',
        fusion_step_stabilizing: 'Stabilizing Nanite core...',
        fusion_error: 'Fusion error!',
        market_title: 'Black Market',
        market_buy_button: 'BUY',
        market_footer: 'The inventory changes as the wind blows in the NanoVerse.',
        market_permanent: 'PERMANENT',
        market_weapon: 'WEAPON',
        market_boost: 'BOOST',
        leaderboard_title: 'Hall of Fame',
        leaderboard_subtitle: 'Legendary Warriors',
        leaderboard_loading: 'Loading warriors...',
        leaderboard_empty: 'No warriors found.',
        leaderboard_wins: 'Wins',
        leaderboard_combo: 'Combo',
        leaderboard_level: 'Lvl',
        leaderboard_collection: 'Cards',
        leaderboard_scraps: 'Scraps',
        leaderboard_high_wave: 'Wave',
        leaderboard_high_blitz: 'Blitz',
        prog_street_cred: 'Street Cred',
        prog_level: 'Current Level',
        prog_scrap: 'Scrap',
        prog_xp: 'Total XP',
        prog_missions_title: 'Active Missions',
        prog_wins: 'Wins',
        prog_scans: 'Scans',
        legal_title: 'Legal',
        legal_protocols: 'Security Protocols v1.0',
        legal_terms_tab: 'Terms of Use',
        legal_privacy_tab: 'Privacy',
        legal_acceptance_title: 'Acceptance',
        legal_acceptance_desc: 'By accessing the NanoVerse ("the Service") during its Beta phase, you agree to comply with these Terms of Service. If you do not agree with any part of the terms, you may not access the Service. This is an experimental game prototype provided via Firebase App Distribution for testing purposes.',
        legal_ai_title: 'AI Generated Content',
        legal_ai_desc: 'The Service uses artificial intelligence (Google Gemini) to generate content. You acknowledge that:',
        legal_ai_list1: 'The generated content may be unpredictable or inaccurate.',
        legal_ai_list2: 'You must not use the Service to generate illegal, offensive content or content that violates the rights of third parties.',
        legal_ai_list3: 'NanoVerse does not claim ownership over the images you submit, but you grant us a license to process them for gameplay purposes. Visual styles are inspired by artistic movements and processed by AI.',
        legal_ip_title: 'Intel Property',
        legal_ip_desc: 'The source code, visual design, and game mechanics are the property of the NanoVerse developers. AI-generated images are for your personal and non-commercial use within the game context.',
        legal_disclaimer_title: 'Disclaimer',
        legal_disclaimer_desc: 'THE SERVICE IS PROVIDED "AS IS", WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE. WE ARE NOT LIABLE FOR ANY DATA LOSS OR DAMAGES.',
        legal_virtual_items_title: 'Virtual Items',
        legal_virtual_items_desc: 'Scrap, Nanites, and digital warriors are virtual licenses for use within the game. They have no real-world monetary value, cannot be exchanged for "real" money, and are non-refundable.',
        legal_user_conduct_title: 'User Conduct',
        legal_user_conduct_desc: 'You are solely responsible for images scanned or uploaded. You must not use the camera to capture private, illegal, or unauthorized imagery. Cheating, hacking, or exploiting game bugs is strictly prohibited.',
        legal_data_title: 'Information We Collect',
        legal_data_desc: 'To provide the generative gameplay experience, we collect and process:',
        legal_data_list1: 'Authentication identifiers (Email/UID) via Google Firebase.',
        legal_data_list2: 'Visual data (Photos) which are sent to Google Gemini API for analysis.',
        legal_data_rights_title: 'Your Rights (GDPR/CCPA)',
        legal_data_rights_desc: 'You have the right to access, correct, or delete your data. Resetting your progress in the settings menu will clear local data, and you can contact us to delete your cloud profile.',
        legal_children_title: 'Children\'s Privacy',
        legal_children_desc: 'The Service is not intended for children under 13. We do not knowingly collect personal data from children. If you are a parent and aware of such data, please contact us.',
        legal_third_party_title: 'Third Party Services',
        legal_third_party_desc: 'We use third-party services that may collect information used to identify you:',
        legal_storage_title: 'Local Storage',
        legal_storage_desc: 'This application operates primarily on the client-side. If you clear your browser cache or site data, your progress (Warrior Collection) will be lost, as we do not maintain a centralized user database.',
        legal_contact_title: 'Contact',
        legal_contact_desc: 'If you have questions about this Privacy Policy, please contact us through the developer\'s official channels.',
        guide_title: 'Field Guide',
        guide_rarity_title: 'Rarity System',
        guide_rarity_desc: 'AI analyzes the complexity and uniqueness of the scanned object to determine its rarity.',
        guide_chance: 'Chance',
        guide_base_stats: 'Base Stats',
        guide_combat_title: 'Combat Attributes',
        guide_hp_name: 'Health (HP)',
        guide_hp_desc: 'Damage resistance. Increases +10 per upgrade.',
        guide_atk_name: 'Attack (ATK)',
        guide_atk_desc: 'Offensive power. Increases +2 per upgrade.',
        guide_def_name: 'Defense (DEF)',
        guide_def_desc: 'Damage reduction. Increases +2 per upgrade.',
        guide_spd_name: 'Speed (SPD)',
        guide_spd_desc: 'Determines who attacks first and dodge chance.',
        guide_economy_title: 'Scrap Economy',
        guide_new_scan: 'New Scan',
        guide_arena_victory: 'Arena Victory',
        guide_recycle: 'Recycle Warrior',
        guide_footer: '* Use Scrap to enhance your warriors\' attributes in the Details menu.',
        info_local_id: 'Local ID',
        info_version: 'NanoVerse Version',
        loading: 'LOADING...',
        error: 'Error',
        success: 'Success',
        common_common: 'COMMON',
        common_rare: 'RARE',
        common_epic: 'EPIC',
        common_legendary: 'LEGENDARY',
        common_xp: 'XP',
        common_seconds: 's',
        upgrade: 'UPGRADE',
        threat_low: 'LOW THREAT',
        threat_med: 'MEDIUM THREAT',
        threat_high: 'HIGH THREAT',
        threat_deadly: 'DEADLY THREAT',
        elite_prefix: 'ELITE',
        toast_syncing: 'Sending data to the database...',
        toast_sync_success: 'Data secured successfully!',
        toast_sync_error: 'Network sync error.',
        toast_loading_cloud: 'Downloading genetic material...',
        toast_load_success: 'Data extracted and restored successfully!',
        toast_load_error: 'Network file corrupted.',
        toast_no_record: 'No encrypted record associated with this account.',
        toast_welcome_matrix: 'Welcome to the matrix, {name}!',
        toast_auth_failed: 'Connection failed. Check your internet.',
        toast_welcome_back: 'Welcome back!',
        toast_login_failed: 'Login failed.',
        toast_account_created: 'Account created successfully!',
        toast_signup_failed: 'Sign up failed.',
        toast_storage_error: 'Error saving collection (Full Memory?)',
        toast_mission_complete: 'Mission Complete: {title}! +{xp} XP',
        toast_level_up: 'LEVEL UP! You reached level {level}!',
        toast_energy_depleted: 'Scanner Energy Depleted! Buy capsules or wait until tomorrow.',
        toast_warrior_materialized: 'Warrior materialized! +{scrap} Scrap | +{xp} XP',
        toast_gen_failed: 'Failed to generate warrior. Try again.',
        confirm_overwrite: 'This will OVERWRITE your local data (Warriors and Levels). Are you sure?',
        battle_burn_status: 'BURN',
        battle_time_bonus: '+5s',
        gang_login_required: 'Login required!',
        gang_name_too_short: 'Name too short!',
        gang_already_in: 'You are already in a gang!',
        gang_created_success: 'Gang created successfully!',
        gang_create_error: 'Error creating gang',
        gang_welcome: 'Welcome to the gang!',
        gang_join_error: 'Error joining gang',
        quest_scan_claimed: 'Scan Reward Claimed! +50 Scraps',
        quest_war_claimed: 'War Reward Claimed! +200 Scraps',
        gang_leader_label: 'Leader',
        item_repair_name: 'Repair Kit',
        item_repair_desc: '+50% HP (Next Battle)',
        item_overclock_name: 'Overclock Chip',
        item_overclock_desc: '+20% Stats (Next Battle)',
        toast_targets_located: '{count} Targets located!',
        toast_boss_detected: 'BOSS DETECTED! Get ready!',
        toast_gang_war_started: 'GANG WAR STARTED!',
        toast_recalibrated: 'Attributes Recalibrated with Nanites!',
        toast_warrior_updated: 'Warrior successfully updated!',
        toast_nanites_purchased: '{amount} Nanites purchase completed!',
        toast_exchange_completed: 'Exchange completed: +{amount} Scrap!',
        toast_cells_recharged: 'Cells recharged! +{amount} Energy',
        toast_daily_bonus: 'Daily Bonus: +1 Charge & +25 Nanites!',
        toast_video_interrupted: 'Video interrupted. No reward.',
        toast_fusion_stabilized: 'FUSION STABILIZED! {name} created with Nanite bonus!',
        toast_fusion_success: 'FUSION SUCCESSFUL! {name} created!',
        toast_ai_limit: 'AI limit reached (Quota 429). Try again tomorrow.',
        toast_gen_error: 'Error generating visual. Please try again.',
        arena_searching_match: 'Searching for Opponent...',
        arena_match_found: 'Match Found! Connecting...',
        arena_cancel_search: 'Cancel Search',
        loading_reality: 'STABILIZING REALITY...',
        share_card_title: 'MATERIALIZE CARD',
        share_card_download: 'DOWNLOAD PNG',
        share_card_native: 'SHARE CARD',
        share_friend_invite: 'FRIEND INVITE',
        share_friend_copy: 'COPY INVITE LINK',
        share_alliance_proposal: 'ALLIANCE PROPOSAL',
        share_alliance_accept: 'ACCEPT ALLIANCE',
        share_alliance_ignore: 'IGNORE',
        share_alliance_success: 'Alliance formed with {name}!',
        share_alliance_desc: '{name} wants to form a strategic alliance with you. Accept?',
    },
    pt: {
        nav_scan: 'SCAN',
        nav_gang: 'GANGUE',
        nav_arena: 'ARENA',
        nav_settings: 'OPÇÕES',
        nav_clan: 'CLÃ',
        nav_profile: 'PERFIL',
        trophies_title: 'CONQUISTAS',
        trophies_subtitle: 'HALL DA FAMA',
        trophies_unlocked: 'Troféus Desbloqueados',
        rank_title: "Rank de Rua",
        rank_0: "Recruta",
        rank_1: "Vagabundo de Rua",
        rank_2: "Lutador",
        rank_3: "Executor",
        rank_4: "Tenente",
        rank_5: "Sub-Chefe",
        rank_6: "Chefe de Gangue",
        rank_7: "Lenda do NanoVerse",
        arena_title: 'ARENA DE BATALHA',
        arena_subtitle: 'Fama e recompensa aguardam os vencedores.',
        mode_survival_title: 'Sobrevivência',
        mode_survival_desc: 'Ondas infinitas. O HP não se regenera.',
        mode_blitz_title: 'Blitz',
        mode_blitz_desc: '60s para causar o caos máximo.',
        mode_boss_title: 'Desafio Chefe',
        mode_boss_desc: 'Enfrente um oponente com 3x mais HP.',
        mode_gang_war_title: 'Guerra de Gangues',
        mode_gang_war_desc: '3 vs 3. O vencedor leva uma carta do perdedor.',
        mode_pvp_title: 'PvP em Tempo Real',
        mode_pvp_desc: 'Lute contra outros jogadores ao vivo.',
        pvp_lobby_title: 'LOBBY PvP',
        pvp_lobby_subtitle: 'LUTE PELA GLÓRIA',
        pvp_host_button: 'CRIAR BATALHA',
        pvp_join_button: 'ENTRAR',
        pvp_searching: 'PROCURANDO RIVAIS...',
        pvp_no_rooms: 'SEM DESAFIOS ATIVOS. CRIA UM!',
        pvp_waiting_guest: 'AGUARDANDO DESAFIANTE...',
        pvp_starting: 'INICIANDO BATALHA...',
        pvp_vs: 'VS',
        searching: 'BUSCANDO...',
        retreat: 'Fugir',
        targets_in_area: 'ALVOS NA ÁREA',
        settings_title: 'Configurações',
        settings_subtitle: 'CONFIGURAÇÃO DO SISTEMA',
        settings_audio: 'Áudio',
        settings_main_audio: 'Áudio Principal',
        settings_audio_desc: 'ATIVAR/DESATIVAR TODOS OS SONS',
        settings_volume: 'Volume',
        settings_player_data: 'Dados do Jogador',
        settings_load_cloud: 'Carregar Dados da Nuvem',
        settings_save_cloud: 'Salvar Dados na Nuvem',
        settings_logout: 'Sair',
        settings_login: 'Entrar',
        settings_language: 'Idioma',
        settings_danger_zone: 'Zona de Perigo',
        settings_danger_zone_desc: 'Ações irreversíveis que afetam permanentemente sua jornada no NanoVerse.',
        settings_reset_button: 'Resetar Progresso',
        settings_reset_confirm: 'Tem certeza que deseja resetar todo o progresso? Isso apagará sua coleção e estatísticas.',
        settings_about: 'Sobre',
        settings_about_desc: 'NanoVerse é uma experiência de combate generativa onde objetos do mundo real são transformados em guerreiros digitais através de IA avançada.',
        settings_terms_link: 'Termos',
        settings_guide_link: 'Guia',
        scan_initiating: 'INICIANDO SEQUÊNCIA DE MATERIALIZAÇÃO',
        scan_step_extracting: 'Extraindo DNA digital...',
        scan_step_generating: 'Gerando forma visual...',
        scan_step_finalizing: 'Finalizando guerreiro...',
        gangs_title: 'Gangues do Submundo',
        gangs_subtitle: 'Junte-se a outros guerreiros. Lute por territórios e ganhe poder.',
        gangs_ops_base: 'Base de Operações',
        gangs_recruitment_code: 'Código de Recrutamento',
        gangs_share_id: 'Compartilhe este ID com amigos!',
        gangs_members: 'Membros',
        gangs_scanning_intel: 'Escaneando inteligência...',
        gangs_active_members: 'Membros Ativos',
        gangs_dominion: 'Domínio (Troféus)',
        gangs_found_new: 'Fundar Nova Gangue',
        gangs_name_placeholder: 'Nome da Gangue...',
        gangs_create_button: 'Fundar Gangue',
        gangs_contracts_title: 'Contratos da Gangue',
        gangs_contracts_subtitle: '(Missões Diárias)',
        gangs_recruiting_title: 'Gangues Recrutando',
        gangs_searching_underworld: 'Procurando gangues no submundo...',
        gangs_none_found: 'Nenhuma gangue formada ainda. Seja o primeiro!',
        gangs_join_button: 'Entrar',
        gangs_login_required: 'Login Necessário',
        gangs_login_desc: 'Faz login para criar ou entrar numa Gangue.',
        gang_leave: 'SAIR DA GANGUE',
        gang_kick: 'EXPULSAR',
        gang_promote: 'PROMOVER',
        gang_role_leader: 'LÍDER',
        gang_role_coleader: 'CO-LÍDER',
        gang_role_member: 'MEMBRO',
        gang_leave_confirm: 'Tens a certeza que queres sair desta gangue?',
        gang_ops_center: 'CENTRO DE OPERAÇÕES',
        gang_raid_threat: 'ALVO DE PRIORIDADE DETETADO',
        gang_contract_status: 'ESTADO DOS CONTRATOS',
        gang_recruitment_open: 'RECRUTAMENTO ATIVO',
        gang_copy_code: 'COPIAR CÓDIGO',
        gang_dominion_level: 'NÍVEL DE DOMÍNIO',
        quest_scanner_title: 'Escaneador Obsessivo',
        quest_scanner_desc: 'Escaneie 3 objetos hoje.',
        quest_brawler_title: 'Lutador de Beco',
        quest_brawler_desc: 'Vença 1 Guerra de Gangues.',
        battle_tap_hint: 'TOQUE RÁPIDO PARA ATACAR!',
        battle_ultimate: 'ESPECIAL!',
        battle_combo: 'Combo!',
        battle_ko: 'K.O.!',
        battle_boss_defeated: 'CHEFE DERROTADO!',
        battle_victory: 'VITÓRIA!',
        battle_defeat: 'DERROTA...',
        battle_wave_clear: 'ONDA LIMPA!',
        battle_time_up: 'TEMPO ESGOTADO!',
        battle_gang_victorious: 'GANGUE VITORIOSA!',
        battle_total_kills: 'TOTAL DE KILLS',
        battle_waves_survived: 'ONDAS SOBREVIVIDAS',
        battle_next_wave: 'Próxima Onda',
        battle_try_again: 'Tentar Novamente',
        battle_leave_arena: 'Sair da Arena',
        battle_member_lost: 'Você perdeu um membro da sua gangue...',
        battle_status_burn: 'QUEIMAR',
        battle_status_stun: 'ATORD.',
        battle_status_break: 'QUEBRA',
        battle_miss: 'ERRO',
        battle_crit: 'CRÍTR.!',
        battle_dodge: 'ESQUIVA',
        battle_stunned: 'ATORD.',
        battle_burned: 'QUEIMADO',
        battle_broken: 'QUEBRADO',
        battle_heal: 'CURA',
        victory_dominion: 'DOMÍNIO!',
        victory_boss_down: 'CHEFE CAIU!',
        victory_title: 'VITÓRIA!',
        victory_champion_defeated: 'CAMPEÃO DERROTADO',
        victory_rival_gang_crushed: 'GANGUE RIVAL ESMAGADA',
        victory_battle_complete: 'BATALHA CONCLUÍDA',
        victory_rewards: 'RECOMPENSAS DE BATALHA',
        victory_experience: 'Experiência',
        victory_claim_prize: 'REIVINDICAR PRÊMIO',
        victory_continue: 'CONTINUAR JORNADA',
        victory_rank: 'RANK',
        victory_time: 'TEMPO',
        victory_max_combo: 'COMBO MÁXIMO',
        victory_damage: 'DANO TOTAL',
        victory_hp_remaining: 'HP RESTANTE',
        warrior_class: 'CLASSE',
        warrior_rarity: 'Raridade',
        warrior_element: 'Elemento',
        warrior_description: 'Descrição',
        warrior_origin: 'Origem',
        warrior_full_desc: 'Descrição Completa',
        warrior_creation_date: 'Data de Criação',
        warrior_serial_id: 'ID Serial',
        warrior_confidential: 'CONFIDENCIAL // SECRETO',
        warrior_stats_reroll_title: 'Calibração de Nanites',
        warrior_stats_reroll_desc: 'Regerar todos os atributos com bônus premium de +15%',
        warrior_stats_reroll_button: 'REGERAR ATRIBUTOS (50 NTS)',
        warrior_visual_reroll_title: 'Customização Visual',
        warrior_visual_reroll_button: 'Novo Visual (50 SUCATA)',
        warrior_share_button: 'Compartilhar / Gerar Carta',
        warrior_attributes_title: 'Atributos & Melhorias',
        warrior_equipment_title: 'Equipamento',
        warrior_no_weapon: 'Nenhuma arma equipada',
        warrior_change_weapon: 'Trocar Arma',
        warrior_empty_inventory: 'Seu inventário de armas está vazio. Visite o Mercado Negro!',
        warrior_consumables_title: 'Consumíveis',
        warrior_use_button: 'USAR',
        warrior_scrap_available: 'Sucatas Disponíveis',
        fusion_title: 'Câmara de Fusão',
        fusion_select_two: 'Selecione 2 Guerreiros',
        fusion_stabilizer_title: 'Estabilizador de Nanite',
        fusion_stabilizer_desc: 'Garantia Epic+ & Bônus de Stats (+50%)',
        fusion_warning_title: 'AVISO: FUSÃO IRREVERSÍVEL',
        fusion_warning_desc: 'Os dois guerreiros selecionados serão consumidos para criar um novo guerreiro poderoso.',
        fusion_stabilizer_button: 'ATIVAR ESTABILIZADOR (150 NTS)',
        fusion_start_button: 'INICIAR FUSÃO (100 SUCATA)',
        fusion_step_analyzing: 'Analisando DNA digital...',
        fusion_step_synthesizing: 'Sintetizando nova forma...',
        fusion_step_stabilizing: 'Estabilizando núcleo de Nanite...',
        fusion_error: 'Erro na fusão!',
        market_title: 'Mercado Negro',
        market_buy_button: 'COMPRAR',
        market_footer: 'O estoque muda conforme o vento sopra no NanoVerse.',
        market_permanent: 'PERMANENTE',
        market_weapon: 'ARMA',
        market_boost: 'BOOST',
        leaderboard_title: 'Hall da Fama',
        leaderboard_subtitle: 'Guerreiros Lendários',
        leaderboard_loading: 'Carregando guerreiros...',
        leaderboard_empty: 'Nenhum guerreiro encontrado.',
        leaderboard_wins: 'Vitórias',
        leaderboard_combo: 'Combo',
        leaderboard_level: 'Nível',
        leaderboard_collection: 'Cartas',
        leaderboard_scraps: 'Sucatas',
        leaderboard_high_wave: 'Onda',
        leaderboard_high_blitz: 'Blitz',
        prog_street_cred: 'Crédito de Rua',
        prog_level: 'Nível Atual',
        prog_scrap: 'Sucata',
        prog_xp: 'XP Total',
        prog_missions_title: 'Missões Ativas',
        prog_wins: 'Vitórias',
        prog_scans: 'Scans',
        legal_title: 'Jurídico',
        legal_protocols: 'Protocolos de Segurança v1.0',
        legal_terms_tab: 'Termos de Uso',
        legal_privacy_tab: 'Privacidade',
        legal_acceptance_title: 'Aceitação',
        legal_acceptance_desc: 'Ao acessar o NanoVerse ("o Serviço") durante a sua fase Beta, você concorda em cumprir estes Termos de Serviço. Se você não concordar com qualquer parte dos termos, não poderá acessar o Serviço. Este é um protótipo de jogo experimental distribuído via Firebase App Distribution para fins de teste.',
        legal_ai_title: 'Conteúdo Gerado por IA',
        legal_ai_desc: 'O Serviço utiliza inteligência artificial (Google Gemini) para gerar conteúdo. Você reconhece que:',
        legal_ai_list1: 'O conteúdo gerado pode ser imprevisível ou impreciso.',
        legal_ai_list2: 'Você não deve usar o Serviço para gerar conteúdo ilegal, ofensivo ou que viole os direitos de terceiros.',
        legal_ai_list3: 'O NanoVerse não reivindica a propriedade das imagens que você envia, mas você nos concede uma licença para processá-las para fins de jogabilidade. Os estilos visuais são inspirados em movimentos artísticos e processados por IA.',
        legal_ip_title: 'Propriedade Intelectual',
        legal_ip_desc: 'O código-fonte, o design visual e as mecânicas de jogo são propriedade dos desenvolvedores do NanoVerse. Imagens geradas por IA são para seu uso pessoal e não comercial dentro do contexto do jogo.',
        legal_disclaimer_title: 'Aviso Legal',
        legal_disclaimer_desc: 'O SERVIÇO É FORNECIDO "COMO ESTÁ", SEM GARANTIAS DE QUALQUER TIPO. NÃO GARANTIMOS QUE O SERVIÇO SERÁ ININTERRUPTO OU LIVRE DE ERROS. NÃO NOS RESPONSABILIZAMOS POR PERDA DE DADOS.',
        legal_virtual_items_title: 'Itens Virtuais',
        legal_virtual_items_desc: 'Sucata, Nanites e guerreiros digitais são licenças virtuais para uso dentro do jogo. Eles não têm valor monetário real, não podem ser trocados por dinheiro "real" e não são reembolsáveis.',
        legal_user_conduct_title: 'Conduta do Usuário',
        legal_user_conduct_desc: 'Você é o único responsável pelas imagens escaneadas ou enviadas. Você não deve usar a câmera para capturar imagens privadas, ilegais ou não autorizadas. Trapaças, hacking ou exploração de bugs são estritamente proibidos.',
        legal_data_title: 'Informações que Coletamos',
        legal_data_desc: 'Para fornecer a experiência de jogo generativa, coletamos e processamos:',
        legal_data_list1: 'Identificadores de autenticação (E-mail/UID) via Google Firebase.',
        legal_data_list2: 'Dados visuais (Fotos) que são enviados para a API Google Gemini para análise.',
        legal_data_rights_title: 'Seus Direitos (LGPD/GDPR)',
        legal_data_rights_desc: 'Você tem o direito de acessar, corrigir ou excluir seus dados. Resetar o progresso nas configurações apagará os dados locais, e você pode entrar em contato para excluir seu perfil na nuvem.',
        legal_children_title: 'Privacidade de Crianças',
        legal_children_desc: 'O Serviço não é destinado a crianças menores de 13 anos (ou 16 em certas jurisdições). Não coletamos conscientemente dados de crianças. Se você é pai/mãe e souber de tais dados, contate-nos.',
        legal_third_party_title: 'Serviços de Terceiros',
        legal_third_party_desc: 'Utilizamos serviços de terceiros que podem coletar informações usadas para identificá-lo:',
        legal_storage_title: 'Armazenamento Local',
        legal_storage_desc: 'Esta aplicação opera principalmente no lado do cliente. Se você limpar o cache do navegador ou os dados do site, seu progresso (Coleção de Guerreiros) será perdido, pois não mantemos um banco de dados de usuários centralizado.',
        legal_contact_title: 'Contato',
        legal_contact_desc: 'Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco através dos canais oficiais do desenvolvedor.',
        guide_title: 'Guia de Campo',
        guide_rarity_title: 'Sistema de Raridade',
        guide_rarity_desc: 'A IA analisa a complexidade e a singularidade do objeto escaneado para determinar sua raridade.',
        guide_chance: 'Chance',
        guide_base_stats: 'Atributos Base',
        guide_combat_title: 'Atributos de Combate',
        guide_hp_name: 'Vida (HP)',
        guide_hp_desc: 'Resistência a danos. Aumenta +10 por melhoria.',
        guide_atk_name: 'Ataque (ATK)',
        guide_atk_desc: 'Poder ofensivo. Aumenta +2 por melhoria.',
        guide_def_name: 'Defesa (DEF)',
        guide_def_desc: 'Redução de danos. Aumenta +2 por melhoria.',
        guide_spd_name: 'Velocidade (SPD)',
        guide_spd_desc: 'Determina quem ataca primeiro e a chance de esquiva.',
        guide_economy_title: 'Economia de Sucata',
        guide_new_scan: 'Novo Scan',
        guide_arena_victory: 'Vitória na Arena',
        guide_recycle: 'Reciclar Guerreiro',
        guide_footer: '* Use Sucata para melhorar os atributos dos seus guerreiros no menu Detalhes.',
        info_local_id: 'ID Local',
        info_version: 'Versão do NanoVerse',
        loading: 'CARREGANDO...',
        error: 'Erro',
        success: 'Sucesso',
        common_common: 'COMUM',
        common_rare: 'RARO',
        common_epic: 'ÉPICO',
        common_legendary: 'LENDÁRIO',
        common_xp: 'XP',
        common_seconds: 's',
        upgrade: 'MELHORAR',
        threat_low: 'AMEAÇA BAIXA',
        threat_med: 'AMEAÇA MÉDIA',
        threat_high: 'ALTA AMEAÇA',
        threat_deadly: 'AMEAÇA MORTAL',
        elite_prefix: 'ELITE',
        toast_syncing: 'Sincronizando dados com a base...',
        toast_sync_success: 'Dados protegidos com sucesso!',
        toast_sync_error: 'Erro na sincronização de rede.',
        toast_loading_cloud: 'Descarregando material genético...',
        toast_load_success: 'Dados extraídos e restaurados!',
        toast_load_error: 'Ficheiro de rede corrompido.',
        toast_no_record: 'Nenhum registo encriptado nesta conta.',
        toast_welcome_matrix: 'Bem-vindo à matrix, {name}!',
        toast_auth_failed: 'Falha na ligação. Verifica a tua internet.',
        toast_welcome_back: 'Bem-vindo de volta!',
        toast_login_failed: 'Falha no login.',
        toast_account_created: 'Conta criada com sucesso!',
        toast_signup_failed: 'Falha ao criar conta.',
        toast_storage_error: 'Erro ao guardar coleção (Memória Cheia?)',
        toast_mission_complete: 'Missão Concluída: {title}! +{xp} XP',
        toast_level_up: 'LEVEL UP! Chegaste ao nível {level}!',
        toast_energy_depleted: 'Energia do Scanner Esgotada! Compra cápsulas ou aguarda até amanhã.',
        toast_warrior_materialized: 'Guerreiro materializado! +{scrap} Sucata | +{xp} XP',
        toast_gen_failed: 'Falha ao gerar guerreiro. Tenta novamente.',
        confirm_overwrite: 'Isto irá SOBREPOR os teus dados locais. Tens a certeza?',
        battle_burn_status: 'ARDE',
        battle_time_bonus: '+5s',
        gang_login_required: 'Login necessário!',
        gang_name_too_short: 'Nome muito curto!',
        gang_already_in: 'Já pertences a uma gangue!',
        gang_created_success: 'Gangue criada com sucesso!',
        gang_create_error: 'Erro ao criar gangue.',
        gang_welcome: 'Bem-vindo à gangue!',
        gang_join_error: 'Erro ao entrar na gangue.',
        quest_scan_claimed: 'Recompensa de Scan Resgatada! +50 Sucatas',
        quest_war_claimed: 'Recompensa de Guerra Resgatada! +200 Sucatas',
        gang_leader_label: 'Líder',
        item_repair_name: 'Kit de Reparo',
        item_repair_desc: '+50% HP (Próxima Batalha)',
        item_overclock_name: 'Chip Overclock',
        item_overclock_desc: '+20% Stats (Próxima Batalha)',
        toast_targets_located: '{count} Alvos localizados!',
        toast_boss_detected: 'BOSS DETECTADO! Prepara-te!',
        toast_gang_war_started: 'GUERRA DE GANGUES COMEÇOU!',
        toast_recalibrated: 'Atributos Recalibrados com Nanites!',
        toast_warrior_updated: 'Guerreiro atualizado com sucesso!',
        toast_nanites_purchased: 'Compra de {amount} Nanites concluída!',
        toast_exchange_completed: 'Troca concluída: +{amount} Sucata!',
        toast_cells_recharged: 'Células recarregadas! +{amount} Energia',
        toast_daily_bonus: 'Bónus Diário: +1 Carga e +25 Nanites!',
        toast_video_interrupted: 'Vídeo interrompido. Sem recompensa.',
        toast_fusion_stabilized: 'FUSÃO ESTABILIZADA! {name} criado com bónus!',
        toast_fusion_success: 'FUSÃO BEM SUCEDIDA! {name} criado!',
        toast_ai_limit: 'Limite IA atingido (Quota 429). Tenta novamente amanhã.',
        toast_gen_error: 'Erro ao gerar visual. Tenta novamente.',
        arena_searching_match: 'Procurando Oponente...',
        arena_match_found: 'Oponente Encontrado! Conectando...',
        arena_cancel_search: 'Cancelar Busca',
        loading_reality: 'ESTABILIZANDO REALIDADE...',
        share_card_title: 'MATERIALIZAR CARTA',
        share_card_download: 'DESCARREGAR PNG',
        share_card_native: 'PARTILHAR CARTA',
        share_friend_invite: 'CONVITE DE AMIGO',
        share_friend_copy: 'COPIAR LINK DE CONVITE',
        share_alliance_proposal: 'PROPOSTA DE ALIANÇA',
        share_alliance_accept: 'ACEITAR ALIANÇA',
        share_alliance_ignore: 'IGNORAR',
        share_alliance_success: 'Aliança formada com {name}!',
        share_alliance_desc: '{name} quer formar uma aliança estratégica contigo. Aceitar?',
    }
};
