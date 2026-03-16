import { AdMob, AdMobRewardItem, RewardAdOptions, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export const REWARDED_AD_UNIT_ID = 'ca-app-pub-7583056430043166/8113371532';

export async function initializeAdMob() {
    if (Capacitor.getPlatform() === 'web') return;

    try {
        await AdMob.initialize({
            initializeForTesting: false,
        });
    } catch (e) {
        console.error("AdMob init error", e);
    }
}

export async function showRewardedAd(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
        return false;
    }

    try {
        const options: RewardAdOptions = {
            adId: REWARDED_AD_UNIT_ID,
        };

        console.log('AdMob: Preparing ad...');
        await AdMob.prepareRewardVideoAd(options);
        console.log('AdMob: Ad prepared');

        return new Promise(async (resolve) => {
            // Safety timeout after 30 seconds
            const timeout = setTimeout(() => {
                console.warn('AdMob: Ad timeout reached');
                rewardListener.remove();
                dismissListener.remove();
                failedListener.remove();
                resolve(false);
            }, 30000);

            const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
                console.log('AdMob: Reward received', reward);
                clearTimeout(timeout);
                rewardListener.remove();
                dismissListener.remove();
                failedListener.remove();
                resolve(true);
            });

            const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
                console.log('AdMob: Ad dismissed');
                clearTimeout(timeout);
                rewardListener.remove();
                dismissListener.remove();
                failedListener.remove();
                resolve(false);
            });

            const failedListener = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
                console.error('AdMob: Failed to load', error);
                clearTimeout(timeout);
                rewardListener.remove();
                dismissListener.remove();
                failedListener.remove();
                resolve(false);
            });

            console.log('AdMob: Showing ad...');
            await AdMob.showRewardVideoAd();
        });
    } catch (error) {
        console.error('AdMob error:', error);
        return false;
    }
}
