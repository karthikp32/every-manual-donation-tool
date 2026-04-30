import type { DonationStatus } from "./types.js";

const validTransitions: Record<DonationStatus, DonationStatus[]> = {
  new: ["pending"],
  pending: ["success", "failure"],
  success: [],
  failure: []
};

export function isValidStatusTransition(
  from: DonationStatus,
  to: DonationStatus
): boolean {
  return validTransitions[from].includes(to);
}

export function getValidNextStatuses(from: DonationStatus): DonationStatus[] {
  return [...validTransitions[from]];
}
