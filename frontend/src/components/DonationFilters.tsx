import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DonationStatus, PaymentMethod } from "@/lib/donations";

export type StatusFilter = DonationStatus | "all";
export type PaymentFilter = PaymentMethod | "all";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  status: StatusFilter;
  onStatus: (v: StatusFilter) => void;
  payment: PaymentFilter;
  onPayment: (v: PaymentFilter) => void;
}

export function DonationFilters({
  search,
  onSearch,
  status,
  onStatus,
  payment,
  onPayment,
}: Props) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="flex-1">
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by UUID, donor, or nonprofit…"
          className="h-11 rounded-full border-border/70 bg-card px-5"
        />
      </div>

      <Select value={status} onValueChange={(v) => onStatus(v as StatusFilter)}>
        <SelectTrigger className="h-11 w-full rounded-full border-border/70 bg-card px-4 md:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="success">Succeeded</SelectItem>
          <SelectItem value="failure">Failed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={payment} onValueChange={(v) => onPayment(v as PaymentFilter)}>
        <SelectTrigger className="h-11 w-full rounded-full border-border/70 bg-card px-4 md:w-[200px]">
          <SelectValue placeholder="Payment method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All methods</SelectItem>
          <SelectItem value="cc">Credit card</SelectItem>
          <SelectItem value="ach">ACH</SelectItem>
          <SelectItem value="crypto">Crypto</SelectItem>
          <SelectItem value="venmo">Venmo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
