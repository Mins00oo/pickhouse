export type AuthStackParamList = {
  Auth: undefined;
};

export type HouseStackParamList = {
  HouseList: undefined;
  HouseInput: { houseId?: string } | undefined;
  HouseDetail: { houseId: string };
};

export type MainTabParamList = {
  Houses: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends HouseStackParamList, AuthStackParamList {}
  }
}
