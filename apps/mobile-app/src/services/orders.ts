import { apiGetData } from "../lib/api";

export type OrderStatusResponse = {
  orderId: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  itemCount: number;
  channel: string;
  placedAt: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
};

export const ORDER_MOBILE_LABELS: Record<string, string> = {
  placed: "Order Placed",
  accepted: "Accepted",
  preparing: "Being Prepared",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export async function fetchOrderById(orderId: string): Promise<OrderStatusResponse> {
  return apiGetData<OrderStatusResponse>(`/orders/${orderId}`);
}