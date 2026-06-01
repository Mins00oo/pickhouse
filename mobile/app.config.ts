import { ConfigContext } from 'expo/config';

const APP_ID = 'com.pickhouse.app';
const KAKAO_NATIVE_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? '';
const NAVER_MAP_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID ?? '';
// 선택값. 네이버 Map Style Editor 에서 만든 커스텀 스타일 ID. 설정 시에만 지도에 적용된다.
// 최초 활성화는 네이티브 코드에 연결되므로 EAS 재빌드가 한 번 필요하다.
const NAVER_MAP_STYLE_ID = process.env.EXPO_PUBLIC_NAVER_MAP_STYLE_ID ?? '';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const IS_EAS_BUILD = process.env.EAS_BUILD === 'true';
const IS_PRODUCTION_BUILD = process.env.EAS_BUILD_PROFILE === 'production';
const REQUIRES_REMOTE_API_URL = IS_EAS_BUILD && ['preview', 'production'].includes(process.env.EAS_BUILD_PROFILE ?? '');

if (IS_EAS_BUILD && !KAKAO_NATIVE_APP_KEY) {
  throw new Error('EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY is required for EAS development builds.');
}

if (IS_EAS_BUILD && !NAVER_MAP_CLIENT_ID) {
  throw new Error('EXPO_PUBLIC_NAVER_MAP_CLIENT_ID is required for EAS development builds.');
}

if (REQUIRES_REMOTE_API_URL && (!API_BASE_URL || API_BASE_URL.includes('YOUR_LAN_IP'))) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL must point to your reachable backend URL for preview/production builds.');
}

export default ({ config }: ConfigContext) => ({
  ...config,
  name: 'PickHouse',
  slug: 'pickhouse',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'pickhouse',
  userInterfaceStyle: 'light',
  // EAS Update(OTA): 네이티브 버전(appVersion)에 묶인 런타임. 이후 JS-only 수정은
  // `eas update --branch <channel>` 로 재빌드 없이 배포된다.
  runtimeVersion: { policy: 'appVersion' },
  updates: {
    url: 'https://u.expo.dev/5385220b-1e37-4a99-a2b7-3b24178df31b',
  },
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
      NSLocationWhenInUseUsageDescription: 'Use your location to center the map around nearby house records.',
      ...(!IS_PRODUCTION_BUILD
        ? { NSAppTransportSecurity: { NSAllowsArbitraryLoads: true } }
        : {}),
    },
  },
  android: {
    ...config.android,
    package: APP_ID,
    usesCleartextTraffic: !IS_PRODUCTION_BUILD,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundImage: './assets/adaptive-bg.png',
      backgroundColor: '#2E3A78',
    },
    permissions: [
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
    ],
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
      '@mj-studio/react-native-naver-map',
      {
        client_id: NAVER_MAP_CLIENT_ID,
        android: {
          ACCESS_FINE_LOCATION: true,
          ACCESS_COARSE_LOCATION: true,
        },
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '15.1',
        },
        android: {
          extraMavenRepos: [
            'https://devrepo.kakao.com/nexus/content/groups/public/',
            'https://repository.map.naver.com/archive/maven',
          ],
        },
      },
    ],
  ],
  owner: 'mins00oo',
  extra: {
    ...config.extra,
    eas: { projectId: '5385220b-1e37-4a99-a2b7-3b24178df31b' },
    naverMapStyleId: NAVER_MAP_STYLE_ID,
  },
});
