import { apiGetList, apiGetData, apiPostData, apiPatchData } from "./api";

export type OrderListRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  channel: string;
  totalCents: number;
  itemCount: number;
  placedAt: string;
};

export type OrderDetail = OrderListRow & {
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
};

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "placed",
  "accepted",
  "preparing",
  "ready",
  "completed",
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function centsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "placed":
      return "bg-blue-100 text-blue-800";
    case "accepted":
      return "bg-indigo-100 text-indigo-800";
    case "preparing":
      return "bg-amber-100 text-amber-800";
    case "ready":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-slate-100 text-slate-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

/** Fetch all orders. */
export async function fetchOrders(): Promise<OrderListRow[]> {
  const result = await apiGetList<OrderListRow[]>("/orders");
  return result.data;
}

/** Fetch a single order with line items. */
export async function fetchOrderById(id: string): Promise<OrderDetail> {
  return apiGetData<OrderDetail>(`/orders/${id}`);
}

/** Cancel an order and release reservations. */
export async function cancelOrder(id: string): Promise<OrderDetail> {
  return apiPostData<OrderDetail>(`/orders/${id}/cancel`, {});
}

export const PATCHABLE_STATUSES: Record<string, string | null> = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "completed",
};

/** Send a status update to the backend. Returns refreshed order. */
export async function updateOrderStatus(
  id: string,
  status: string
): Promise<OrderDetail> {
  return apiPatchData<OrderDetail>(`/orders/${id}/status`, { status });
}