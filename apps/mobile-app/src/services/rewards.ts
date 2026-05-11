import { apiGetData } from "../lib/api";

export type CustomerRewards = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  loyaltyPointsBalance: number;
  lifetimePointsEarned: number;
  membershipStatus: string;
  createdAt: string;
};

export type LoyaltyEvent = {
  id: string;
  eventType: string;
  pointsDelta: number;
  pointsBalanceAfter: number;
  orderId: string | null;
  description: string | null;
  createdAt: string;
};

export type RewardsDetail = {
  customer: CustomerRewards;
  events: LoyaltyEvent[];
};

/** Fetch a single customer by ID. */
export async function fetchCustomerById(id: string): Promise<CustomerRewards> {
  return apiGetData<CustomerRewards>(`/customers/${id}`);
}

/** Fetch rewards detail (customer + events) by customer ID. */
export async function fetchCustomerRewards(id: string): Promise<RewardsDetail> {
  return apiGetData<RewardsDetail>(`/customers/${id}/rewards`);
}
