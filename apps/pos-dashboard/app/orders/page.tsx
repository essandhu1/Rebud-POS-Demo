"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../lib/api";
import {
  fetchOrders,
  fetchOrderById,
  cancelOrder,
  updateOrderStatus,
  centsToDollars,
  statusBadgeClass,
  ORDER_STATUS_LABELS,
  PATCHABLE_STATUSES,
  type OrderListRow,
  type OrderDetail,
} from "../lib/orders";

type ViewState = { kind: "list" } | { kind: "detail"; orderId: string };

export default function OrdersPage() {
  const [view, setView] = useState<ViewState>({ kind: "list" });

  return view.kind === "list" ? (
    <OrderListView onSelectOrder={(id) => setView({ kind: "detail", orderId: id })} />
  ) : (
    <OrderDetailView
      orderId={view.orderId}
      onBack={() => setView({ kind: "list" })}
    />
  );
}

// ── List View ──────────────────────────────────────────────────────────────

function OrderListView({ onSelectOrder }: { onSelectOrder: (id: string) => void }) {
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">Orders</h2>
        <p className="text-slate-500">Loading orders…</p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">Orders</h2>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Failed to load orders</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={() => void load()}
            className="mt-3 rounded-md bg-red-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-900"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Orders</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => void load()}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Order #</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Customer</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Total</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Items</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No orders yet. Place an order from the mobile app to see it here.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => onSelectOrder(order.id)}
                >
                  <td className="px-4 py-3 font-mono font-medium text-slate-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-900">{order.customerName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {order.channel === "mobile_app" ? "Mobile App" : "POS Dashboard"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(order.status)}`}
                    >
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                    {centsToDollars(order.totalCents)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {order.itemCount}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {new Date(order.placedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Detail View ────────────────────────────────────────────────────────────

function OrderDetailView({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderById(orderId);
      setOrder(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCancel = useCallback(async () => {
    if (!confirm("Cancel this order? Inventory reservations will be released."))
      return;
    setCancelling(true);
    try {
      const updated = await cancelOrder(orderId);
      setOrder(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  }, [orderId]);

  if (loading && !order) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to orders
        </button>
        <p className="text-slate-500">Loading order details…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to orders
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Failed to load order</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={() => void load()}
            className="mt-3 rounded-md bg-red-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-900"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const canCancel = ["placed", "accepted", "preparing"].includes(order.status);
  const nextStatus = PATCHABLE_STATUSES[order.status] ?? null;
  const [updating, setUpdating] = useState(false);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-slate-600 hover:text-slate-900">
        ← Back to orders
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Order {order.orderNumber}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {order.channel === "mobile_app" ? "Mobile App" : "POS Dashboard"} ·{" "}
            {new Date(order.placedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass(order.status)}`}
          >
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </span>
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Cancel"}
            </button>
          )}
          {nextStatus && (
            <button
              onClick={async () => {
                setUpdating(true);
                try {
                  const updated = await updateOrderStatus(order.id, nextStatus);
                  setOrder(updated);
                } catch (e) {
                  alert(e instanceof Error ? e.message : "Update failed");
                } finally {
                  setUpdating(false);
                }
              }}
              disabled={updating}
              className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {updating
                ? "Updating…"
                : `Mark ${ORDER_STATUS_LABELS[nextStatus] ?? nextStatus}`}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Customer</p>
          <p className="mt-1 font-medium text-slate-900">{order.customerName}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {centsToDollars(order.totalCents)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Items</p>
          <p className="mt-1 font-medium text-slate-900">{order.itemCount}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Product</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Qty</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Unit Price</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <tr key={`${item.productId}-${idx}`}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {item.productName}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {centsToDollars(item.unitPriceCents)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                  {centsToDollars(item.lineTotalCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}