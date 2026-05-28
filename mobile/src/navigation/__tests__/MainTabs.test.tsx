import { act, fireEvent, render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainTabs } from '../MainTabs';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';
import { useAuthStore } from '@/stores/authStore';

jest.mock('@/db/houses.repo');
jest.mock('@/api/houses.api');

function renderMainTabs() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 44, right: 0, bottom: 34, left: 0 },
        }}
      >
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  flushNavigationTimers();
  return result;
}

function flushNavigationTimers() {
  act(() => {
    jest.runOnlyPendingTimers();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  useAuthStore.setState({
    user: { id: 'u1', authProviders: {}, createdAt: '' },
    accessToken: 'a',
    refreshToken: 'r',
    status: 'authenticated',
  });
  (housesRepo.listActive as jest.Mock).mockResolvedValue([]);
  (housesApi.list as jest.Mock).mockRejectedValue(new Error('offline'));
});

afterEach(() => {
  flushNavigationTimers();
  jest.useRealTimers();
});

describe('MainTabs', () => {
  it('starts on Home and exposes only Home, Storage, and My tabs', async () => {
    const { findByPlaceholderText, findByText, queryByText } = renderMainTabs();

    expect(await findByPlaceholderText('장소, 지명, 집 이름 검색')).toBeTruthy();
    expect(await findByText('홈')).toBeTruthy();
    expect(await findByText('보관함')).toBeTruthy();
    expect(await findByText('마이')).toBeTruthy();
    expect(queryByText('비교')).toBeNull();
  });

  it('moves between Storage and My from the footer', async () => {
    const { findByText } = renderMainTabs();

    const storageTab = await findByText('보관함');
    act(() => {
      fireEvent.press(storageTab);
      jest.runOnlyPendingTimers();
    });
    expect(await findByText(/전체 기록/)).toBeTruthy();

    const myTab = await findByText('마이');
    act(() => {
      fireEvent.press(myTab);
      jest.runOnlyPendingTimers();
    });
    expect(await findByText('프로필 준비 중')).toBeTruthy();
  });
});
