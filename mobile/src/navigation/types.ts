export type AuthStackParamList = {
  Auth: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  HouseList: undefined;
  My: undefined;
};

export type HouseStackParamList = {
  MainTabs: undefined;
  HouseInput: { houseId?: string } | undefined;
  HouseDetail: { houseId: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends HouseStackParamList, AuthStackParamList {}
  }
}
