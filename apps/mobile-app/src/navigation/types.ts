export type RootStackParamList = {
  HomeMenu: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderStatus: undefined;
  RewardsProfile: undefined;
};

export type RootScreenName = keyof RootStackParamList;
