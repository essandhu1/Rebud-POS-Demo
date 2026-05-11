"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../lib/api";

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  loyaltyPointsBalance: number;
  lifetimePointsEarned: number;
  membershipStatus: string;
  createdAt: string;
};

type LoyaltyEvent = {
  id: string;
  eventType: string;
  pointsDelta: number;
  pointsBalanceAfter: number;
  orderId: string | null;
  description: string | null;
  createdAt: string;
};

type RewardsDetail = {
  customer: CustomerRow;
  events: LoyaltyEvent[];
};

/** Fetch all customers from the backend. */
async function fetchCustomers(): Promise<CustomerRow[]> {
  const res = await fetch("http://localhost:4000/customers");
  const body = await res.json();
  if (body.success && Array.isArray(body.data)) {
    return body.data.map((c: Record<string, unknown>) => ({
      id: String(c.id ?? ""),
      name: String(c.name ?? ""),
      phone: c.phone ? String(c.phone) : null,
      email: c.email ? String(c.email) : null,
      loyaltyPointsBalance: Number(c.loyalty_points_balance ?? 0),
      lifetimePointsEarned: Number(c.lifetime_points_earned ?? 0),
      membershipStatus: String(c.membership_status ?? "active"),
      createdAt: String(c.created_at ?? ""),
    }));
  }
  return [];
}

/** Fetch a single customer's rewards detail. */
async function fetchCustomerRewards(id: string): Promise<RewardsDetail | null> {
  const res = await fetch(`http://localhost:4000/customers/${id}/rewards`);
  const body = await res.json();
  if (body.success && body.data) {
    return {
      customer: {
        id: String(body.data.customer.id ?? ""),
        name: String(body.data.customer.name ?? ""),
        phone: body.data.customer.phone ? String(body.data.customer.phone) : null,
        email: body.data.customer.email ? String(body.data.customer.email) : null,
        loyaltyPointsBalance: Number(body.data.customer.loyalty_points_balance ?? 0),
        lifetimePointsEarned: Number(body.data.customer.lifetime_points_earned ?? 0),
        membershipStatus: String(body.data.customer.membership_status ?? "active"),
        createdAt: String(body.data.customer.created_at ?? ""),
      },
      events: (body.data.events ?? []).map((e: Record<string, unknown>) => ({
        id: String(e.id ?? ""),
        eventType: String(e.event_type ?? ""),
        pointsDelta: Number(e.points_delta ?? 0),
        pointsBalanceAfter: Number(e.points_balance_after ?? 0),
        orderId: e.order_id ? String(e.order_id) : null,
        description: e.description ? String(e.description) : null,
        createdAt: String(e.created_at ?? ""),
      })),
    };
  }
  return null;
}

export default function CustomersRewardsPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [rewards, setRewards] = useState<RewardsDetail | null>(null);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Load all customers
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  // Load rewards for a specific customer
  const loadRewards = useCallback(async (customerId: string) => {
    setRewardsLoading(true);
    setRewards(null);
    try {
      const data = await fetchCustomerRewards(customerId);
      setRewards(data);
    } catch {
      setRewards(null);
    } finally {
      setRewardsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      void loadRewards(selectedCustomer);
    }
  }, [selectedCustomer, loadRewards]);

  const filtered = search.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.phone && c.phone.includes(search)) ||
          c.id === search
      )
    : customers;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Customers / Rewards</h2>
        <button
          onClick={() => void loadCustomers()}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by name, phone, or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="text-slate-500">Loading customers…</p>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Failed to load customers</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={() => void loadCustomers()}
            className="mt-3 rounded-md bg-red-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-900"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">No customers found.</p>
          <p className="mt-1 text-xs text-slate-400">
            Place an order to create a customer.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer list */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={`cursor-pointer hover:bg-slate-50 ${
                      selectedCustomer === c.id ? "bg-slate-100" : ""
                    }`}
                    onClick={() => setSelectedCustomer(c.id)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.phone ?? c.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                      {c.loyaltyPointsBalance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rewards detail panel */}
          <div>
            {!selectedCustomer ? (
              <div className="rounded-lg bg-white p-8 text-center shadow-sm">
                <p className="text-sm text-slate-500">
                  Select a customer to view their rewards detail.
                </p>
              </div>
            ) : rewardsLoading ? (
              <p className="text-slate-500">Loading rewards…</p>
            ) : rewards ? (
              <div className="space-y-4">
                {/* Customer card */}
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">
                    {rewards.customer.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {rewards.customer.phone ?? rewards.customer.email ?? "No contact"}
                  </p>
                  <div className="mt-4 flex gap-6">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {rewards.customer.loyaltyPointsBalance}
                      </p>
                      <p className="text-xs text-slate-500">Points Balance</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {rewards.customer.lifetimePointsEarned}
                      </p>
                      <p className="text-xs text-slate-500">Lifetime Earned</p>
                    </div>
                  </div>
                </div>

                {/* Loyalty events */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h4 className="font-semibold text-slate-900">
                      Points History ({rewards.events.length})
                    </h4>
                  </div>
                  {rewards.events.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">
                      No events yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {rewards.events.map((evt) => (
                        <div
                          key={evt.id}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {evt.eventType === "earn"
                                ? "Points Earned"
                                : evt.eventType === "redeem"
                                  ? "Points Redeemed"
                                  : evt.eventType}
                            </p>
                            <p className="text-xs text-slate-500">
                              {evt.description ?? ""}
                              {evt.orderId && ` (Order #${evt.orderId})`}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(evt.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-bold ${
                                evt.pointsDelta > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {evt.pointsDelta > 0 ? "+" : ""}
                              {evt.pointsDelta}
                            </p>
                            <p className="text-xs text-slate-400">
                              Balance: {evt.pointsBalanceAfter}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
                Could not load rewards for this customer.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
