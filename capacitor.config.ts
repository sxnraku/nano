import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.Nano.Nanoverse',
  appName: 'Nano Verse',
  webDir: 'dist',
  plugins: {
    AdMob: {
      androidAppId: 'ca-app-pub-7583056430043166~1046367909',
      iosAppId: 'ca-app-pub-7583056430043166~1046367909'
    }
  }
};

export default config;
