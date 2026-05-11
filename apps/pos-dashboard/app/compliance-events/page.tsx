"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../lib/api";

type ComplianceEvent = {
  id: string;
  orderId: string | null;
  inventoryId: string | null;
  eventType: string;
  severity: string;
  description: string | null;
  occurredAt: string;
};

function severityBadgeClass(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800";
    case "warning":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}

function eventTypeLabel(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ComplianceEventsPage() {
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/compliance-events");
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        setEvents(
          body.data.map((e: Record<string, unknown>) => ({
            id: String(e.id ?? ""),
            orderId: e.order_id ? String(e.order_id) : null,
            inventoryId: e.inventory_id ? String(e.inventory_id) : null,
            eventType: String(e.event_type ?? ""),
            severity: String(e.severity ?? "info"),
            description: e.description ? String(e.description) : null,
            occurredAt: String(e.occurred_at ?? ""),
          }))
        );
      } else {
        setEvents([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load compliance events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const eventTypes = [...new Set(events.map((e) => e.eventType))];
  const filtered =
    filter === "all"
      ? events
      : events.filter((e) => e.eventType === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Compliance Events</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => void load()}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter chips */}
      {eventTypes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          {eventTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                filter === type
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {eventTypeLabel(type)}
            </button>
          ))}
        </div>
      )}

      {/* Mock compliance notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <span className="font-medium">Mock Compliance Log.</span> This is a demo
        abstraction showing where compliance-related events would be recorded. No
        real Metrc integration is present.
      </div>

      {loading && filtered.length === 0 ? (
        <p className="text-slate-500">Loading compliance events…</p>
      ) : error && filtered.length === 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Failed to load events</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={() => void load()}
            className="mt-3 rounded-md bg-red-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-900"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            No compliance events recorded yet.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Events are auto-logged during the order lifecycle (created, reserved,
            completed, cancelled).
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Event Type
                </th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">
                  Severity
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Description
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">
                  Order
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {eventTypeLabel(evt.eventType)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${severityBadgeClass(evt.severity)}`}
                    >
                      {evt.severity}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                    {evt.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {evt.orderId ? `#${evt.orderId}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {new Date(evt.occurredAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
