import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tufix.app',
  appName: 'TUFIX',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
