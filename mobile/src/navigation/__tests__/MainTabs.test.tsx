import { act, fireEvent, render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainTabs } from '../MainTabs';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';
import { anchorPlacesRepo } from '@/db/anchorPlaces.repo';
import { useAuthStore } from '@/stores/authStore';

jest.mock('@/db/houses.repo');
jest.mock('@/api/houses.api');
jest.mock('@/db/anchorPlaces.repo');

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
  (anchorPlacesRepo.listActive as jest.Mock).mockResolvedValue([]);
});

afterEach(() => {
  flushNavigationTimers();
  jest.useRealTimers();
});

describe('MainTabs', () => {
  it('starts on the map and exposes the five-tab footer (지도/목록/집 추가/비교/마이)', async () => {
    const { findByPlaceholderText, getByTestId } = renderMainTabs();

    expect(await findByPlaceholderText('장소, 지명, 집 이름 검색')).toBeTruthy();
    expect(getByTestId('tab-Map')).toBeTruthy();
    expect(getByTestId('tab-List')).toBeTruthy();
    expect(getByTestId('tab-add-house')).toBeTruthy();
    expect(getByTestId('tab-Compare')).toBeTruthy();
    expect(getByTestId('tab-My')).toBeTruthy();
  });

  it('moves to 목록, 비교, and 마이 from the footer', async () => {
    const { findByText, getByTestId } = renderMainTabs();

    act(() => {
      fireEvent.press(getByTestId('tab-List'));
      jest.runOnlyPendingTimers();
    });
    expect(await findByText(/전체 기록/)).toBeTruthy();

    act(() => {
      fireEvent.press(getByTestId('tab-Compare'));
      jest.runOnlyPendingTimers();
    });
    expect(await findByText('비교 기능 준비 중')).toBeTruthy();

    act(() => {
      fireEvent.press(getByTestId('tab-My'));
      jest.runOnlyPendingTimers();
    });
    expect(await findByText('통근 기준지')).toBeTruthy();
  });

  it('routes the centre add button to the house input flow instead of switching tabs', async () => {
    const { findByPlaceholderText, findByText, getByTestId, queryByText } = renderMainTabs();

    await findByPlaceholderText('장소, 지명, 집 이름 검색');
    act(() => {
      fireEvent.press(getByTestId('tab-add-house'));
      jest.runOnlyPendingTimers();
    });

    // HouseInput 위저드의 탭(기본/가격/구조/체크) 중 하나가 보이면 진입 성공.
    expect(await findByText('기본')).toBeTruthy();
    expect(queryByText('비교 기능 준비 중')).toBeNull();
  });
});
