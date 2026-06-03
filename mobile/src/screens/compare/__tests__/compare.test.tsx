import type { ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';
import { anchorPlacesRepo } from '@/db/anchorPlaces.repo';
import { useAuthStore } from '@/stores/authStore';
import { ComparePickerScreen } from '../ComparePickerScreen';
import { CompareResultScreen } from '../CompareResultScreen';

jest.mock('@/db/houses.repo');
jest.mock('@/api/houses.api');
jest.mock('@/db/anchorPlaces.repo');

const wrap = (content: ReactNode) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider
        initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 44, right: 0, bottom: 34, left: 0 } }}
      >
        {content}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: { id: 'u1', authProviders: {}, createdAt: '' },
    accessToken: 'a',
    refreshToken: 'r',
    status: 'authenticated',
  });
  // 로컬/원격 모두 비어 있으면 샘플 7개로 폴백(getDisplayHouses).
  (housesRepo.listActive as jest.Mock).mockResolvedValue([]);
  (housesApi.list as jest.Mock).mockRejectedValue(new Error('offline'));
  (anchorPlacesRepo.listActive as jest.Mock).mockResolvedValue([]);
});

describe('ComparePickerScreen', () => {
  it('selects exactly two houses and navigates to the result', async () => {
    const stackNav = { navigate: jest.fn() };
    const nav = { navigate: jest.fn(), goBack: jest.fn(), getParent: () => stackNav } as any;
    const { findByText, getByTestId } = render(wrap(<ComparePickerScreen navigation={nav} route={{} as any} />));

    expect(await findByText(/내가 기록한 집/)).toBeTruthy();

    fireEvent.press(getByTestId('compare-house-sample-1'));
    fireEvent.press(getByTestId('compare-house-sample-3'));
    fireEvent.press(getByTestId('compare-start'));

    expect(stackNav.navigate).toHaveBeenCalledWith('CompareResult', { aId: 'sample-1', bId: 'sample-3' });
  });

  it('caps the selection at two houses', async () => {
    const stackNav = { navigate: jest.fn() };
    const nav = { navigate: jest.fn(), goBack: jest.fn(), getParent: () => stackNav } as any;
    const { findByTestId, getByTestId } = render(wrap(<ComparePickerScreen navigation={nav} route={{} as any} />));

    await findByTestId('compare-house-sample-1');
    fireEvent.press(getByTestId('compare-house-sample-1'));
    fireEvent.press(getByTestId('compare-house-sample-2'));
    fireEvent.press(getByTestId('compare-house-sample-3')); // 3번째는 무시돼야 함
    fireEvent.press(getByTestId('compare-start'));

    expect(stackNav.navigate).toHaveBeenCalledWith('CompareResult', { aId: 'sample-1', bId: 'sample-2' });
  });
});

describe('CompareResultScreen', () => {
  const route = { params: { aId: 'sample-1', bId: 'sample-3' } } as any;

  it('renders both houses with metric and facility comparisons (summary)', async () => {
    const nav = { goBack: jest.fn() } as any;
    const { findByText, getByText } = render(wrap(<CompareResultScreen navigation={nav} route={route} />));

    // 두 집 헤더 이름
    expect(await findByText('청파동 빌라')).toBeTruthy();
    expect(getByText('서계동 신축빌라')).toBeTruthy();
    // 요약 카드 라벨
    expect(getByText('관리비')).toBeTruthy();
    expect(getByText('평수')).toBeTruthy();
    expect(getByText('컨디션')).toBeTruthy();
    expect(getByText('엘베')).toBeTruthy();
  });

  it('toggles to the full comparison table', async () => {
    const nav = { goBack: jest.fn() } as any;
    const { findByTestId, getByTestId, getByText } = render(wrap(<CompareResultScreen navigation={nav} route={route} />));

    fireEvent.press(await findByTestId('compare-view-toggle'));

    // 풀표 전용 행(거래/보증금)이 나타난다.
    expect(getByText('거래')).toBeTruthy();
    expect(getByText('보증금')).toBeTruthy();
    expect(getByTestId('compare-view-toggle')).toBeTruthy();
  });
});
