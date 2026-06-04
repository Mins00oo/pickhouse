import type { ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { housesApi } from '@/api/houses.api';
import { anchorPlacesRepo } from '@/db/anchorPlaces.repo';
import { useAuthStore } from '@/stores/authStore';
import { ComparePickerScreen } from '../ComparePickerScreen';
import { CompareResultScreen } from '../CompareResultScreen';

jest.mock('@/api/houses.api');
jest.mock('@/db/anchorPlaces.repo');

const houses = [
  {
    id: 'h1',
    nickname: '청파동 빌라',
    address: { roadAddress: '서울 용산구 청파로 1', jibunAddress: '청파동 1', zonecode: '04303', detail: '청파동 빌라' },
    dealType: 'WOLSE',
    deposit: 1000,
    rent: 50,
    maintenanceFee: 7,
    area: 9,
    floor: 3,
    totalFloor: 5,
    roomType: 'ONE_AND_HALF',
    hasElevator: true,
    sunlight: 3,
    waterPressure: 3,
    moisture: 2,
    photoIds: [],
    createdAt: '2026-05-16T00:00:00.000Z',
    updatedAt: '2026-05-16T00:00:00.000Z',
  },
  {
    id: 'h2',
    nickname: '서계동 신축빌라',
    address: { roadAddress: '서울 용산구 서계동 2', jibunAddress: '서계동 2', zonecode: '04316', detail: '서계동 신축빌라' },
    dealType: 'JEONSE',
    deposit: 18000,
    maintenanceFee: 5,
    area: 12,
    floor: 2,
    totalFloor: 4,
    roomType: 'TWO',
    hasElevator: false,
    sunlight: 2,
    waterPressure: 2,
    moisture: 1,
    photoIds: [],
    createdAt: '2026-05-15T00:00:00.000Z',
    updatedAt: '2026-05-15T00:00:00.000Z',
  },
  {
    id: 'h3',
    nickname: '효창동 집',
    address: { roadAddress: '서울 용산구 효창동 3', jibunAddress: '효창동 3', zonecode: '04317' },
    dealType: 'WOLSE',
    deposit: 500,
    rent: 40,
    area: 7,
    photoIds: [],
    createdAt: '2026-05-14T00:00:00.000Z',
    updatedAt: '2026-05-14T00:00:00.000Z',
  },
] as any[];

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
  (housesApi.list as jest.Mock).mockResolvedValue(houses);
  (anchorPlacesRepo.listActive as jest.Mock).mockResolvedValue([]);
});

describe('ComparePickerScreen', () => {
  it('selects exactly two houses and navigates to the result', async () => {
    const stackNav = { navigate: jest.fn() };
    const nav = { navigate: jest.fn(), goBack: jest.fn(), getParent: () => stackNav } as any;
    const { findByTestId, getByTestId } = render(wrap(<ComparePickerScreen navigation={nav} route={{} as any} />));

    await findByTestId('compare-house-h1');

    fireEvent.press(getByTestId('compare-house-h1'));
    fireEvent.press(getByTestId('compare-house-h2'));
    fireEvent.press(getByTestId('compare-start'));

    expect(stackNav.navigate).toHaveBeenCalledWith('CompareResult', { aId: 'h1', bId: 'h2' });
  });

  it('caps the selection at two houses', async () => {
    const stackNav = { navigate: jest.fn() };
    const nav = { navigate: jest.fn(), goBack: jest.fn(), getParent: () => stackNav } as any;
    const { findByTestId, getByTestId } = render(wrap(<ComparePickerScreen navigation={nav} route={{} as any} />));

    await findByTestId('compare-house-h1');
    fireEvent.press(getByTestId('compare-house-h1'));
    fireEvent.press(getByTestId('compare-house-h2'));
    fireEvent.press(getByTestId('compare-house-h3')); // 3번째는 무시돼야 함
    fireEvent.press(getByTestId('compare-start'));

    expect(stackNav.navigate).toHaveBeenCalledWith('CompareResult', { aId: 'h1', bId: 'h2' });
  });

  it('shows an empty state when there are fewer than two recorded houses', async () => {
    (housesApi.list as jest.Mock).mockResolvedValue([houses[0]]);
    const stackNav = { navigate: jest.fn() };
    const nav = { navigate: jest.fn(), goBack: jest.fn(), getParent: () => stackNav } as any;
    const { findByText } = render(wrap(<ComparePickerScreen navigation={nav} route={{} as any} />));

    expect(await findByText('비교할 집이 부족해요')).toBeTruthy();
  });
});

describe('CompareResultScreen', () => {
  const route = { params: { aId: 'h1', bId: 'h2' } } as any;

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
