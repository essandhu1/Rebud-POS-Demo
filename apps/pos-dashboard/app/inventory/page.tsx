"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../lib/api";
import { fetchInventory, type InventoryRow } from "../lib/inventory";

function stockBadgeClass(status: string): string {
  switch (status) {
    case "in_stock":
      return "bg-green-100 text-green-800";
    case "low_stock":
      return "bg-amber-100 text-amber-800";
    case "out_of_stock":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function InventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInventory();
      setRows(data);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load inventory.";
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && rows.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">Inventory</h2>
        <p className="text-slate-500">Loading inventory data…</p>
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">Inventory</h2>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Failed to load inventory</p>
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
        <h2 className="text-3xl font-bold">Inventory</h2>
        <span className="text-sm text-slate-500">
          {rows.length} product{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Product Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                SKU
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Category
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">
                Total Qty
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">
                Reserved
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">
                Available
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.inventoryId} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {row.productName}
                </td>
                <td className="px-4 py-3 font-mono text-slate-600">
                  {row.sku}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {row.category ?? "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                  {row.quantityOnHand}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {row.quantityReserved}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                  {row.stockQuantity}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${stockBadgeClass(row.stockStatus)}`}
                  >
                    {row.stockStatus.replace(/_/g, " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}