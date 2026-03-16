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

        await AdMob.prepareRewardVideoAd(options);

        return new Promise(async (resolve) => {
            const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
                console.log('AdMob: Reward received', reward);
                rewardListener.remove();
                resolve(true);
            });

            const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
                console.log('AdMob: Ad dismissed');
                dismissListener.remove();
                resolve(false);
            });

            const failedListener = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
                console.error('AdMob: Failed to load', error);
                failedListener.remove();
                resolve(false);
            });

            await AdMob.showRewardVideoAd();
        });
    } catch (error) {
        console.error('AdMob error:', error);
        return false;
    }
}
