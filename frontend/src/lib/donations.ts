export type PaymentMethod = "cc" | "ach" | "crypto" | "venmo";
export type DonationStatus = "new" | "pending" | "success" | "failure";

export interface Donation {
  uuid: string;
  amount: number; // cents
  currency: "USD";
  paymentMethod: PaymentMethod;
  nonprofitId: string;
  donorId: string;
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Nonprofit {
  id: string;
  name: string;
}

export interface Donor {
  id: string;
  name: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedDonations {
  donations: Donation[];
  pagination: PaginationMeta;
}

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export interface ApiErrorShape {
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as ApiErrorShape;
      msg = body.message || body.error || msg;
    } catch {
      // ignore
    }
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function listDonations(params?: {
  status?: DonationStatus | "all";
  paymentMethod?: PaymentMethod | "all";
  createdAtDate?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedDonations> {
  const qs = new URLSearchParams();
  if (params?.status && params.status !== "all") qs.set("status", params.status);
  if (params?.paymentMethod && params.paymentMethod !== "all")
    qs.set("paymentMethod", params.paymentMethod);
  if (params?.createdAtDate) qs.set("createdAtDate", params.createdAtDate);
  if (params?.createdAtFrom) qs.set("createdAtFrom", params.createdAtFrom);
  if (params?.createdAtTo) qs.set("createdAtTo", params.createdAtTo);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetch(`${API_BASE}/donations${suffix}`).then(handle<PaginatedDonations>);
}

export function listNonprofits(): Promise<Nonprofit[]> {
  return fetch(`${API_BASE}/nonprofits?page=1&pageSize=100`)
    .then(handle<{ nonprofits: Nonprofit[]; pagination: PaginationMeta }>)
    .then((body) => body.nonprofits);
}

export function listDonors(): Promise<Donor[]> {
  return fetch(`${API_BASE}/donors?page=1&pageSize=100`)
    .then(handle<{ donors: Donor[]; pagination: PaginationMeta }>)
    .then((body) => body.donors);
}

export function getDonation(uuid: string): Promise<Donation> {
  return fetch(`${API_BASE}/donations/${uuid}`).then(handle<Donation>);
}

export type DonationCreateInput = Omit<Donation, "updatedAt">;

export function createDonation(input: DonationCreateInput): Promise<Donation> {
  return fetch(`${API_BASE}/donations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": newIdempotencyKey(),
    },
    body: JSON.stringify(input),
  }).then(handle<Donation>);
}

export function updateStatus(uuid: string, status: DonationStatus): Promise<Donation> {
  return fetch(`${API_BASE}/donations/${uuid}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": newIdempotencyKey(),
    },
    body: JSON.stringify({ status }),
  }).then(handle<Donation>);
}

export function formatAmount(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function nextStatuses(status: DonationStatus): DonationStatus[] {
  if (status === "new") return ["pending"];
  if (status === "pending") return ["success", "failure"];
  return [];
}

export function paymentMethodLabel(m: PaymentMethod): string {
  switch (m) {
    case "cc":
      return "Credit Card";
    case "ach":
      return "ACH";
    case "crypto":
      return "Crypto";
    case "venmo":
      return "Venmo";
  }
}
