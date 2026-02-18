import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quickprohost.android',
  appName: 'QuickProHost',
  webDir: 'dist/apps/client',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LiveUpdates: {
      appId: '93c006bc',
      channel: 'Production',
      autoUpdateMethod: 'background',
      maxVersions: 2
    },
    SplashScreen: {
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_INSIDE",
      showSpinner: false,
      launchShowDuration: 0,
      launchAutoHide: true,
    }
  }
};

export default config;