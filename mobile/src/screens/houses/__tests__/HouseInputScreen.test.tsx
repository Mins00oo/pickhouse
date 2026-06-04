import { act, render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HouseInputScreen } from '../HouseInputScreen';
import { useAuthStore } from '@/stores/authStore';
import { housesApi } from '@/api/houses.api';
import { geocodeAddress } from '@/integrations/kakaoGeocode';
import { cameraHelper } from '@/photos/cameraHelper';
import { photosRepo } from '@/db/photos.repo';

jest.mock('@/api/houses.api');
jest.mock('@/db/photos.repo');
jest.mock('@/photos/cameraHelper');

// 위저드는 Daum WebView(KakaoAddressPicker)를 직접 띄운다 → 선택 결과만 시뮬레이션.
jest.mock('@/integrations/kakaoAddress', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    KakaoAddressPicker: ({ onSelect }: { onSelect: (a: unknown) => void }) =>
      React.createElement(
        Pressable,
        {
          testID: 'mock-address-search',
          onPress: () =>
            onSelect({
              roadAddress: '서울 용산구 청파로47길 22',
              jibunAddress: '청파동1가 56-3',
              zonecode: '04303',
            }),
        },
        React.createElement(Text, null, '주소 선택'),
      ),
  };
});

jest.mock('@/integrations/kakaoGeocode', () => ({
  geocodeAddress: jest.fn().mockResolvedValue({ latitude: 37.556, longitude: 126.901 }),
}));

let queryClient: QueryClient | null = null;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const wrap = (c: React.ReactNode) => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>{c}</NavigationContainer>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  (geocodeAddress as jest.Mock).mockResolvedValue({ latitude: 37.556, longitude: 126.901 });
  (housesApi.create as jest.Mock).mockImplementation((body) =>
    Promise.resolve({ ...body, id: body?.id ?? 'new', photoIds: [] }),
  );
  (housesApi.update as jest.Mock).mockImplementation((id, patch) =>
    Promise.resolve({ id, ...patch, photoIds: [] }),
  );
  (housesApi.list as jest.Mock).mockResolvedValue([]);
  useAuthStore.setState({
    user: { id: 'u1', authProviders: {}, createdAt: '' },
    accessToken: 'a',
    refreshToken: 'r',
    status: 'authenticated',
  });
});

afterEach(() => {
  queryClient?.clear();
  queryClient = null;
});

const navMock = () => ({ goBack: jest.fn(), navigate: jest.fn() }) as never;
const route = (params?: { houseId?: string }) => ({ params } as never);

async function pickAddress(getByTestId: (id: string) => unknown, findByTestId: (id: string) => Promise<unknown>) {
  fireEvent.press(getByTestId('mock-address-search') as never);
  await findByTestId('address-detail'); // 좌표 머지 + 주소 적용 대기
}

describe('HouseInputScreen (위저드)', () => {
  it('renders the four step tabs and step-1 fields', () => {
    const { getByTestId } = render(
      wrap(<HouseInputScreen navigation={navMock()} route={route()} />),
    );
    expect(getByTestId('add-step-tab-기본')).toBeTruthy();
    expect(getByTestId('add-step-tab-가격')).toBeTruthy();
    expect(getByTestId('add-step-tab-구조')).toBeTruthy();
    expect(getByTestId('add-step-tab-체크')).toBeTruthy();
    expect(getByTestId('nickname-input')).toBeTruthy();
    expect(getByTestId('dealtype-월세')).toBeTruthy();
    expect(getByTestId('address-search')).toBeTruthy();
  });

  it('jumps to any step non-linearly via the tabs', () => {
    const { getByTestId, queryByTestId } = render(
      wrap(<HouseInputScreen navigation={navMock()} route={route()} />),
    );
    expect(queryByTestId('pyeong-input')).toBeNull();
    fireEvent.press(getByTestId('add-step-tab-구조'));
    expect(getByTestId('pyeong-input')).toBeTruthy();
    fireEvent.press(getByTestId('add-step-tab-체크'));
    expect(getByTestId('condition-수압-좋음')).toBeTruthy();
  });

  it('dealType toggle swaps the price inputs (전세 hides 월세)', () => {
    const { getByTestId, queryByTestId } = render(
      wrap(<HouseInputScreen navigation={navMock()} route={route()} />),
    );
    fireEvent.press(getByTestId('add-step-tab-가격'));
    expect(getByTestId('amount-월세')).toBeTruthy();
    fireEvent.press(getByTestId('add-step-tab-기본'));
    fireEvent.press(getByTestId('dealtype-전세'));
    fireEvent.press(getByTestId('add-step-tab-가격'));
    expect(queryByTestId('amount-월세')).toBeNull();
    expect(getByTestId('amount-전세금')).toBeTruthy();
  });

  it('blocks save when required fields are empty', async () => {
    const nav = navMock();
    const { getByTestId } = render(wrap(<HouseInputScreen navigation={nav} route={route()} />));
    fireEvent.press(getByTestId('save-button'));
    await waitFor(() => expect(housesApi.create).not.toHaveBeenCalled());
    expect((nav as { goBack: jest.Mock }).goBack).not.toHaveBeenCalled();
  });

  it('saves a 월세 house with geocoded coordinates, queues sync, and navigates back', async () => {
    const nav = navMock();
    const { getByTestId, findByTestId } = render(
      wrap(<HouseInputScreen navigation={nav} route={route()} />),
    );
    fireEvent.changeText(getByTestId('nickname-input'), '청파동 빌라');
    await pickAddress(getByTestId, findByTestId);
    fireEvent.press(getByTestId('add-step-tab-가격'));
    fireEvent.changeText(getByTestId('amount-보증금'), '1000');
    fireEvent.changeText(getByTestId('amount-월세'), '50');
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => expect(housesApi.create).toHaveBeenCalled());
    expect(geocodeAddress).toHaveBeenCalledWith('서울 용산구 청파로47길 22');
    expect(housesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: '청파동 빌라',
        dealType: 'WOLSE',
        deposit: 1000,
        rent: 50,
        address: expect.objectContaining({ latitude: 37.556, longitude: 126.901 }),
      }),
    );
    expect((nav as { goBack: jest.Mock }).goBack).toHaveBeenCalled();
  });

  it('saves a new house without a client id and attaches local photos to the server id', async () => {
    (cameraHelper.takePhoto as jest.Mock).mockResolvedValueOnce({
      id: 'p-local',
      localUri: 'file:///tmp/p-local.jpg',
      mimeType: 'image/jpeg',
    });
    (housesApi.create as jest.Mock).mockResolvedValueOnce({
      id: 'server-h1',
      address: {},
      dealType: 'WOLSE',
      deposit: 1000,
      rent: 50,
      photoIds: [],
      createdAt: '2026-06-04T00:00:00.000Z',
      updatedAt: '2026-06-04T00:00:00.000Z',
    });
    const nav = navMock();
    const { getByTestId, getAllByRole, getAllByPlaceholderText, findByTestId } = render(
      wrap(<HouseInputScreen navigation={nav} route={route()} />),
    );
    fireEvent.changeText(getByTestId('nickname-input'), 'test house');
    await pickAddress(getByTestId, findByTestId);
    const tabs = getAllByRole('tab');
    fireEvent.press(tabs[1]);
    const amountInputs = getAllByPlaceholderText('0');
    fireEvent.changeText(amountInputs[0], '1000');
    fireEvent.changeText(amountInputs[1], '50');
    fireEvent.press(tabs[3]);
    fireEvent.press(getByTestId('photo-add-button'));
    await waitFor(() => expect(cameraHelper.takePhoto).toHaveBeenCalledWith(undefined));
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => expect(housesApi.create).toHaveBeenCalled());
    const [body] = (housesApi.create as jest.Mock).mock.calls[0]!;
    expect(body).not.toHaveProperty('id');
    await waitFor(() => expect(photosRepo.attachToHouse).toHaveBeenCalledWith(['p-local'], 'server-h1'));
    expect((nav as { goBack: jest.Mock }).goBack).toHaveBeenCalled();
  });

  it('shows the detail address input immediately while geocoding is still pending', async () => {
    const pending = deferred<{ latitude: number; longitude: number } | null>();
    (geocodeAddress as jest.Mock).mockReturnValueOnce(pending.promise);
    const { getByTestId, findByTestId } = render(
      wrap(<HouseInputScreen navigation={navMock()} route={route()} />),
    );

    fireEvent.press(getByTestId('mock-address-search') as never);

    expect(await findByTestId('address-detail')).toBeTruthy();
    expect(geocodeAddress).toHaveBeenCalledWith('서울 용산구 청파로47길 22');

    await act(async () => {
      pending.resolve(null);
      await pending.promise;
    });
  });

  it('shows electricity/gas as separate utility estimates (water is not a separate-pay input)', () => {
    const { getByTestId, queryByTestId } = render(
      wrap(<HouseInputScreen navigation={navMock()} route={route()} />),
    );

    fireEvent.press(getByTestId('add-step-tab-가격'));

    expect(getByTestId('utility-전기')).toBeTruthy();
    expect(getByTestId('utility-가스')).toBeTruthy();
    expect(queryByTestId('utility-수도')).toBeNull();
  });

  it('hides the electricity estimate when electricity is included in maintenance', () => {
    const { getByTestId, queryByTestId } = render(
      wrap(<HouseInputScreen navigation={navMock()} route={route()} />),
    );

    fireEvent.press(getByTestId('add-step-tab-가격'));
    expect(getByTestId('utility-전기')).toBeTruthy();

    fireEvent.press(getByTestId('maint-include-전기'));

    expect(queryByTestId('utility-전기')).toBeNull();
    expect(getByTestId('utility-가스')).toBeTruthy();
  });

  it('saves an electricity utility estimate when electricity is paid separately', async () => {
    const nav = navMock();
    const { getByTestId, findByTestId } = render(
      wrap(<HouseInputScreen navigation={nav} route={route()} />),
    );
    fireEvent.changeText(getByTestId('nickname-input'), '구로동 오피스텔');
    await pickAddress(getByTestId, findByTestId);
    fireEvent.press(getByTestId('add-step-tab-가격'));
    fireEvent.changeText(getByTestId('amount-보증금'), '1000');
    fireEvent.changeText(getByTestId('amount-월세'), '50');
    fireEvent.changeText(getByTestId('utility-전기'), '2');
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => expect(housesApi.create).toHaveBeenCalled());
    expect(housesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        utilityEstimates: expect.objectContaining({ ELECTRIC: 2 }),
      }),
    );
  });

  it('shows the live maintenance summary banner on the price step', () => {
    const { getByTestId } = render(
      wrap(<HouseInputScreen navigation={navMock()} route={route()} />),
    );
    fireEvent.press(getByTestId('add-step-tab-가격'));
    fireEvent.changeText(getByTestId('amount-관리비'), '7');
    expect(getByTestId('maintenance-summary')).toHaveTextContent(/관리비\s*7만원/);
  });

  it('persists structure & condition fields chosen across steps', async () => {
    const nav = navMock();
    const { getByTestId, findByTestId } = render(
      wrap(<HouseInputScreen navigation={nav} route={route()} />),
    );
    fireEvent.changeText(getByTestId('nickname-input'), '청파동 빌라');
    await pickAddress(getByTestId, findByTestId);
    fireEvent.press(getByTestId('add-step-tab-가격'));
    fireEvent.changeText(getByTestId('amount-보증금'), '1000');
    fireEvent.changeText(getByTestId('amount-월세'), '50');
    fireEvent.press(getByTestId('add-step-tab-구조'));
    fireEvent.press(getByTestId('roomtype-1.5룸'));
    fireEvent.press(getByTestId('pyeong-preset-9'));
    fireEvent.changeText(getByTestId('builtyear-input'), '2018');
    fireEvent.press(getByTestId('direction-남향'));
    fireEvent.press(getByTestId('add-step-tab-체크'));
    fireEvent.press(getByTestId('condition-수압-좋음'));
    fireEvent.press(getByTestId('switch-엘리베이터'));
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => expect(housesApi.create).toHaveBeenCalled());
    expect(housesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roomType: 'ONE_AND_HALF',
        area: 9,
        builtYear: 2018,
        direction: 'SOUTH',
        waterPressure: 3,
        hasElevator: true,
        floorType: 'GROUND',
      }),
    );
  });

  it('omits rent for 전세 records', async () => {
    const nav = navMock();
    const { getByTestId, findByTestId } = render(
      wrap(<HouseInputScreen navigation={nav} route={route()} />),
    );
    fireEvent.changeText(getByTestId('nickname-input'), '서계동 신축');
    await pickAddress(getByTestId, findByTestId);
    fireEvent.press(getByTestId('dealtype-전세'));
    fireEvent.press(getByTestId('add-step-tab-가격'));
    fireEvent.changeText(getByTestId('amount-전세금'), '18000');
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => expect(housesApi.create).toHaveBeenCalled());
    expect(housesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ dealType: 'JEONSE', deposit: 18000, rent: 0 }),
    );
  });

  it('still saves when geocoding fails (no coordinates)', async () => {
    (geocodeAddress as jest.Mock).mockResolvedValueOnce(null);
    const nav = navMock();
    const { getByTestId, findByTestId } = render(
      wrap(<HouseInputScreen navigation={nav} route={route()} />),
    );
    fireEvent.changeText(getByTestId('nickname-input'), '효창동 빌라');
    await pickAddress(getByTestId, findByTestId);
    fireEvent.press(getByTestId('add-step-tab-가격'));
    fireEvent.changeText(getByTestId('amount-보증금'), '1000');
    fireEvent.changeText(getByTestId('amount-월세'), '50');
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => expect(housesApi.create).toHaveBeenCalled());
    const [house] = (housesApi.create as jest.Mock).mock.calls[0]!;
    expect(house.address.latitude).toBeUndefined();
    expect((nav as { goBack: jest.Mock }).goBack).toHaveBeenCalled();
  });

  it('prefills an existing house and updates instead of creating', async () => {
    const existing = {
      id: 'h1',
      address: {
        roadAddress: '서울 용산구 청파로 1',
        jibunAddress: '청파동 1',
        zonecode: '04300',
        latitude: 37.546,
        longitude: 126.967,
        detail: '302호',
      },
      dealType: 'WOLSE',
      deposit: 1200,
      rent: 55,
      maintenanceFee: 7,
      area: 9,
      floor: 3,
      nickname: '청파동 빌라',
      roomType: 'ONE_AND_HALF',
      floorType: 'GROUND',
      memo: '기존 메모',
      photoIds: ['p1'],
      createdAt: '2026-05-16T00:00:00.000Z',
      updatedAt: '2026-05-16T00:00:00.000Z',
    };
    (housesApi.get as jest.Mock).mockResolvedValue(existing);
    const nav = navMock();
    const { getByTestId, findByDisplayValue } = render(
      wrap(<HouseInputScreen navigation={nav} route={route({ houseId: 'h1' })} />),
    );

    fireEvent.press(getByTestId('add-step-tab-가격'));
    // 보증금 1200 은 천단위 콤마로 표시된다
    expect(await findByDisplayValue('1,200')).toBeTruthy();
    fireEvent.changeText(getByTestId('amount-월세'), '60');
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => expect(housesApi.update).toHaveBeenCalled());
    expect(housesApi.create).not.toHaveBeenCalled();
    expect(housesApi.update).toHaveBeenCalledWith('h1', expect.objectContaining({ rent: 60 }));
  });
});
