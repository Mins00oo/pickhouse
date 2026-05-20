import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HouseInputScreen } from '../HouseInputScreen';
import { useAuthStore } from '@/stores/authStore';
import { housesRepo } from '@/db/houses.repo';
import { syncQueue } from '@/sync/syncQueue';

jest.mock('@/db/houses.repo');
jest.mock('@/sync/syncQueue');
jest.mock('@/db/photos.repo');
jest.mock('@/photos/cameraHelper');

const wrap = (c: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <NavigationContainer>{c}</NavigationContainer>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: { id: 'u1', authProviders: {}, createdAt: '' },
    accessToken: 'a', refreshToken: 'r', status: 'authenticated',
  });
});

describe('HouseInputScreen', () => {
  it('renders two tabs: 현장 모드 / 디테일 모드', () => {
    const nav = { goBack: jest.fn(), navigate: jest.fn() } as any;
    const { getByText } = render(wrap(<HouseInputScreen navigation={nav} route={{ params: undefined } as any} />));
    expect(getByText('현장 모드')).toBeTruthy();
    expect(getByText('디테일 모드')).toBeTruthy();
  });

  it('save in quick mode persists deposit and goes back', async () => {
    const nav = { goBack: jest.fn(), navigate: jest.fn() } as any;
    const { getByText, getByPlaceholderText } = render(
      wrap(<HouseInputScreen navigation={nav} route={{ params: undefined } as any} />),
    );
    fireEvent.changeText(getByPlaceholderText('보증금 (만원)'), '1000');
    fireEvent.changeText(getByPlaceholderText('월세 (만원)'), '50');
    fireEvent.press(getByText('저장'));
    await waitFor(() => {
      expect(housesRepo.insert).toHaveBeenCalled();
      expect(syncQueue.queueHouseCreate).toHaveBeenCalled();
      expect(nav.goBack).toHaveBeenCalled();
    });
  });
});
