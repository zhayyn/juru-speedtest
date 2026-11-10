import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.juru.speedtest',
  appName: 'Juru Speedtest',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

