import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.Nano.Nanoverse',
  appName: 'Nano Verse',
  webDir: 'dist',
  plugins: {
    AdMob: {
      androidAppId: 'ca-app-pub-2396252945133485~4166507807',
      iosAppId: 'ca-app-pub-2396252945133485~4166507807'
    }
  }
};

export default config;
