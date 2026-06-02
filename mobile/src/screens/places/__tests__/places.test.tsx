import type { ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { anchorPlacesRepo } from '@/db/anchorPlaces.repo';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';
import { useAuthStore } from '@/stores/authStore';
import type { AnchorPlace } from '@/types';
import { MyScreen } from '@/screens/my/MyScreen';
import { PlacesListScreen } from '../PlacesListScreen';

jest.mock('@/db/anchorPlaces.repo');
jest.mock('@/db/houses.repo');
jest.mock('@/api/houses.api');

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

const workplace: AnchorPlace = {
  id: 'w1',
  anchorType: 'WORKPLACE',
  label: '판교 회사',
  address: { roadAddress: '경기 성남시 분당구 판교역로 152', jibunAddress: '', zonecode: '', latitude: 37.4, longitude: 127.1 },
  transport: 'TRANSIT',
  isPrimary: true,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

beforeEach(() => {
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

describe('MyScreen', () => {
  it('shows the registration guidance and opens the places hub when nothing is registered', async () => {
    const parentNav = { navigate: jest.fn() };
    const nav = { navigate: jest.fn(), getParent: () => parentNav } as any;
    const { findByText, getByTestId } = render(wrap(<MyScreen navigation={nav} route={{} as any} />));

    expect(await findByText('직장·학교를 등록해 보세요')).toBeTruthy();
    fireEvent.press(getByTestId('my-register-anchor'));
    expect(parentNav.navigate).toHaveBeenCalledWith('Places');
  });

  it('lists registered places with the 주 통근지 badge', async () => {
    (anchorPlacesRepo.listActive as jest.Mock).mockResolvedValue([workplace]);
    const nav = { navigate: jest.fn(), getParent: () => ({ navigate: jest.fn() }) } as any;
    const { findByText, getByTestId } = render(wrap(<MyScreen navigation={nav} route={{} as any} />));

    expect(await findByText('판교 회사')).toBeTruthy();
    expect(getByTestId('my-place-row-w1')).toBeTruthy();
    expect(await findByText('주 통근지')).toBeTruthy();
  });
});

describe('PlacesListScreen', () => {
  it('shows the empty onboarding and routes to AddPlace', async () => {
    const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;
    const { findByText, getByTestId } = render(wrap(<PlacesListScreen navigation={nav} route={{} as any} />));

    expect(await findByText('통근 기준지를 등록해 보세요')).toBeTruthy();
    fireEvent.press(getByTestId('places-empty-add'));
    expect(nav.navigate).toHaveBeenCalledWith('AddPlace', undefined);
  });

  it('lists registered places and opens edit for a card', async () => {
    (anchorPlacesRepo.listActive as jest.Mock).mockResolvedValue([workplace]);
    const nav = { navigate: jest.fn(), goBack: jest.fn() } as any;
    const { findByText, getByTestId } = render(wrap(<PlacesListScreen navigation={nav} route={{} as any} />));

    expect(await findByText(/등록된 장소/)).toBeTruthy();
    fireEvent.press(getByTestId('place-card-w1'));
    expect(nav.navigate).toHaveBeenCalledWith('AddPlace', { placeId: 'w1' });
  });
});
