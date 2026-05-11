export type RootStackParamList = {
  HomeMenu: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderStatus: { orderId: string } | undefined;
  RewardsProfile: undefined;
};

export type RootScreenName = keyof RootStackParamList;
