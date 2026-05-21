import { ConfigContext, ExpoConfig } from 'expo/config';

const APP_ID = 'com.pickhouse.app';
const KAKAO_NATIVE_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PickHouse',
  slug: 'pickhouse',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'pickhouse',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#2E3A78',
  },
  newArchEnabled: true,
  ios: {
    ...config.ios,
    bundleIdentifier: APP_ID,
    supportsTablet: false,
    usesAppleSignIn: true,
    infoPlist: {
      ...config.ios?.infoPlist,
      NSCameraUsageDescription: 'Use the camera to capture house photos.',
      NSPhotoLibraryUsageDescription: 'Use the photo library to choose house photos.',
      NSLocationWhenInUseUsageDescription: 'Use location while entering addresses.',
    },
  },
  android: {
    ...config.android,
    package: APP_ID,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundImage: './assets/adaptive-bg.png',
      backgroundColor: '#2E3A78',
    },
    permissions: ['CAMERA', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
  },
  plugins: [
    'expo-apple-authentication',
    'expo-secure-store',
    'expo-sqlite',
    'expo-camera',
    'expo-file-system',
    [
      '@react-native-seoul/kakao-login',
      {
        kakaoAppKey: KAKAO_NATIVE_APP_KEY,
        kotlinVersion: '1.9.0',
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '15.1',
        },
        android: {
          extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'],
        },
      },
    ],
  ],
  owner: 'mins00oo',
  extra: {
    ...config.extra,
    eas: { projectId: '5385220b-1e37-4a99-a2b7-3b24178df31b' },
  },
});
