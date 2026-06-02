export type AuthStackParamList = {
  Auth: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  List: undefined;
  AddHouseTab: undefined; // 중앙 ＋집추가 버튼(탭 전환 대신 HouseInput으로 이동)
  Compare: undefined;
  My: undefined;
};

export type HouseStackParamList = {
  MainTabs: undefined;
  HouseInput: { houseId?: string } | undefined;
  HouseDetail: { houseId: string };
  Places: undefined;
  AddPlace: { placeId?: string } | undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends HouseStackParamList, AuthStackParamList {}
  }
}
