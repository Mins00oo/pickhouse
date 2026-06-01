module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-modules-core|expo-crypto|expo-image-picker|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-seoul/.*)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-webview$': '<rootDir>/src/__mocks__/react-native-webview.ts',
    '^@gorhom/bottom-sheet$': '<rootDir>/src/__mocks__/gorhom-bottom-sheet.tsx',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  // jest-expo RN 통합 테스트는 다수 스위트 동시 실행 시 기본 5초를 넘길 수 있어 여유를 둠.
  testTimeout: 15000,
};
