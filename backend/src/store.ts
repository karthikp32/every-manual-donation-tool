import { seedDonations } from "./seed.js";
import type { Donation } from "./types.js";

const donations = new Map<string, Donation>(
  seedDonations.map((donation) => [donation.uuid, { ...donation }])
);

export function listDonations(filters: {
  status?: Donation["status"];
  paymentMethod?: Donation["paymentMethod"];
}): Donation[] {
  return Array.from(donations.values())
    .filter((donation) => !filters.status || donation.status === filters.status)
    .filter(
      (donation) =>
        !filters.paymentMethod || donation.paymentMethod === filters.paymentMethod
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getDonation(uuid: string): Donation | undefined {
  const donation = donations.get(uuid);
  return donation ? { ...donation } : undefined;
}

export function hasDonation(uuid: string): boolean {
  return donations.has(uuid);
}

export function createDonation(donation: Donation): Donation {
  donations.set(donation.uuid, { ...donation });
  return { ...donation };
}

export function updateDonationStatus(
  uuid: string,
  status: Donation["status"]
): Donation | undefined {
  const existing = donations.get(uuid);
  if (!existing) {
    return undefined;
  }

  const updated = {
    ...existing,
    status,
    updatedAt: new Date().toISOString()
  };

  donations.set(uuid, updated);
  return { ...updated };
}
