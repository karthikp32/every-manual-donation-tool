import type { DonationCreateInput, DonationStatus, PaymentMethod } from "./types.js";

export const paymentMethods = ["cc", "ach", "crypto", "venmo"] as const;
export const donationStatuses = ["new", "pending", "success", "failure"] as const;

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && paymentMethods.includes(value as PaymentMethod);
}

export function isDonationStatus(value: unknown): value is DonationStatus {
  return typeof value === "string" && donationStatuses.includes(value as DonationStatus);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function validateDonationCreatePayload(body: unknown):
  | { ok: true; value: DonationCreateInput }
  | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  const candidate = body as Record<string, unknown>;

  if (!isNonEmptyString(candidate.uuid)) {
    return { ok: false, message: "uuid is required." };
  }

  const uuid = candidate.uuid.trim();
  if (!isUuid(uuid)) {
    return { ok: false, message: "uuid must be a valid UUID." };
  }

  const amount = candidate.amount;
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    return { ok: false, message: "amount must be a positive integer in cents." };
  }

  if (candidate.currency !== "USD") {
    return { ok: false, message: "currency must be USD." };
  }

  if (!isPaymentMethod(candidate.paymentMethod)) {
    return { ok: false, message: "paymentMethod is invalid." };
  }

  if (!isNonEmptyString(candidate.nonprofitId)) {
    return { ok: false, message: "nonprofitId is required." };
  }

  if (!isNonEmptyString(candidate.donorId)) {
    return { ok: false, message: "donorId is required." };
  }

  if (!isDonationStatus(candidate.status)) {
    return { ok: false, message: "status is invalid." };
  }

  if (!isIsoDate(candidate.createdAt)) {
    return { ok: false, message: "createdAt must be a valid ISO datetime string." };
  }

  if (candidate.updatedAt !== undefined && !isIsoDate(candidate.updatedAt)) {
    return { ok: false, message: "updatedAt must be a valid ISO datetime string." };
  }

  return {
    ok: true,
    value: {
      uuid,
      amount,
      currency: "USD",
      paymentMethod: candidate.paymentMethod,
      nonprofitId: candidate.nonprofitId.trim(),
      donorId: candidate.donorId.trim(),
      status: candidate.status,
      createdAt: new Date(candidate.createdAt).toISOString(),
      updatedAt:
        typeof candidate.updatedAt === "string"
          ? new Date(candidate.updatedAt).toISOString()
          : undefined
    }
  };
}
