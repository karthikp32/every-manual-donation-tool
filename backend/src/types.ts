export type PaymentMethod = "cc" | "ach" | "crypto" | "venmo";
export type DonationStatus = "new" | "pending" | "success" | "failure";

export interface Donation {
  uuid: string;
  amount: number;
  currency: "USD";
  paymentMethod: PaymentMethod;
  nonprofitId: string;
  donorId: string;
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
}

export type DonationCreateInput = Omit<Donation, "updatedAt"> & {
  updatedAt?: string;
};

export interface Nonprofit {
  id: string;
  name: string;
}

export interface Donor {
  id: string;
  name: string;
}
