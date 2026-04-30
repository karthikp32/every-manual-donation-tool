import { seedDonations, seedDonors, seedNonprofits } from "./seed.js";
import type { Donation } from "./types.js";

const donations = new Map<string, Donation>(
  seedDonations.map((donation) => [donation.uuid, { ...donation }])
);
const nonprofits = new Map(seedNonprofits.map((nonprofit) => [nonprofit.id, { ...nonprofit }]));
const donors = new Map(seedDonors.map((donor) => [donor.id, { ...donor }]));

export function listDonations(filters: {
  status?: Donation["status"];
  paymentMethod?: Donation["paymentMethod"];
  createdAtDate?: string;
}): Donation[] {
  return Array.from(donations.values())
    .filter((donation) => !filters.status || donation.status === filters.status)
    .filter(
      (donation) =>
        !filters.paymentMethod || donation.paymentMethod === filters.paymentMethod
    )
    .filter(
      (donation) =>
        !filters.createdAtDate || donation.createdAt.slice(0, 10) === filters.createdAtDate
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function listNonprofits() {
  return Array.from(nonprofits.values()).map((nonprofit) => ({ ...nonprofit }));
}

export function listDonors() {
  return Array.from(donors.values()).map((donor) => ({ ...donor }));
}

export function getDonation(uuid: string): Donation | undefined {
  const donation = donations.get(uuid);
  return donation ? { ...donation } : undefined;
}

export function hasNonprofit(id: string): boolean {
  return nonprofits.has(id);
}

export function hasDonor(id: string): boolean {
  return donors.has(id);
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
