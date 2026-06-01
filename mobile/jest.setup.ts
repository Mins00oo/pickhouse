import '@testing-library/jest-native/extend-expect';
import { act } from '@testing-library/react-native';
import { notifyManager } from '@tanstack/react-query';

notifyManager.setNotifyFunction((callback) => {
  act(callback);
});

// @gorhom/bottom-sheet 가 의존하는 reanimated / gesture-handler 테스트 지원
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('react-native-gesture-handler/jestSetup');
jest.mock('react-native-reanimated', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-reanimated/mock'),
);

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock-doc/',
  cacheDirectory: 'file:///mock-cache/',
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
  uploadAsync: jest.fn(),
}));

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 1, EMAIL: 2 },
  AppleAuthenticationButtonType: { SIGN_IN: 0, CONTINUE: 1, SIGN_UP: 2 },
  AppleAuthenticationButtonStyle: { WHITE: 0, WHITE_OUTLINE: 1, BLACK: 2 },
  AppleAuthenticationButton: 'AppleAuthenticationButton',
}));

jest.mock('@react-native-seoul/kakao-login', () => ({
  login: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({ isConnected: true }),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 37.5563, longitude: 126.9236 },
  }),
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
  },
}));

jest.mock(
  '@mj-studio/react-native-naver-map',
  () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, View } = require('react-native');
    const naverMapMock = {
      animateCameraTo: jest.fn(),
      animateRegionTo: jest.fn(),
      cancelAnimation: jest.fn(),
      coordinateToScreen: jest.fn(async ({ latitude, longitude }: any) => ({
        isValid: true,
        screenX: Math.round((longitude - 126.82) * 1500),
        screenY: Math.round((37.63 - latitude) * 1500),
      })),
      setLocationTrackingMode: jest.fn(),
    };
    const MockNaverMapView = React.forwardRef(({ children, testID = 'naver-map-view', ...props }: any, ref: any) => {
      React.useImperativeHandle(ref, () => naverMapMock);
      return React.createElement(View, { testID, ...props }, children);
    });
    MockNaverMapView.displayName = 'MockNaverMapView';

    return {
      __naverMapMock: naverMapMock,
      NaverMapView: MockNaverMapView,
      NaverMapMarkerOverlay: ({ latitude, longitude, onTap, testID, children, ...props }: any) =>
        React.createElement(Pressable, {
          testID: testID ?? `house-map-marker-${latitude}-${longitude}`,
          onPress: onTap,
          accessibilityLabel: `marker-${latitude}-${longitude}`,
          latitude,
          longitude,
          ...props,
        }, children),
    };
  },
  { virtual: true },
);

jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name, testID }: { name: string; testID?: string }) =>
      React.createElement(Text, { testID }, name),
  };
});

jest.mock('react-native-calendars', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text } = require('react-native');

  return {
    Calendar: ({ onDayPress, testID }: { onDayPress?: (d: { dateString: string }) => void; testID?: string }) =>
      React.createElement(
        Pressable,
        {
          testID: testID ?? 'mock-calendar',
          onPress: () => onDayPress && onDayPress({ dateString: '2026-06-15' }),
        },
        React.createElement(Text, null, 'calendar'),
      ),
  };
});
