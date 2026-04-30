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
export type DateRangeFilter =
  | "all"
  | "last_1_month"
  | "last_3_months"
  | "last_6_months"
  | "last_12_months"
  | "custom";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  status: StatusFilter;
  onStatus: (v: StatusFilter) => void;
  payment: PaymentFilter;
  onPayment: (v: PaymentFilter) => void;
  dateRange: DateRangeFilter;
  onDateRange: (v: DateRangeFilter) => void;
  customDateFrom: string;
  onCustomDateFrom: (v: string) => void;
  customDateTo: string;
  onCustomDateTo: (v: string) => void;
  defaultCustomDateTo: string;
}

export function DonationFilters({
  search,
  onSearch,
  status,
  onStatus,
  payment,
  onPayment,
  dateRange,
  onDateRange,
  customDateFrom,
  onCustomDateFrom,
  customDateTo,
  onCustomDateTo,
  defaultCustomDateTo,
}: Props) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center" suppressHydrationWarning>
      <div className="flex-1">
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by UUID, donor, or nonprofit…"
          className="h-11 rounded-full border-border/70 bg-card px-5"
          data-form-type="other"
          suppressHydrationWarning
        />
      </div>

      <Select value={status} onValueChange={(v) => onStatus(v as StatusFilter)}>
        <SelectTrigger
          className="h-11 w-full rounded-full border-border/70 bg-card px-4 md:w-[180px]"
          data-form-type="other"
          suppressHydrationWarning
        >
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
        <SelectTrigger
          className="h-11 w-full rounded-full border-border/70 bg-card px-4 md:w-[200px]"
          data-form-type="other"
          suppressHydrationWarning
        >
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

      <Select value={dateRange} onValueChange={(v) => onDateRange(v as DateRangeFilter)}>
        <SelectTrigger
          className="h-11 w-full rounded-full border-border/70 bg-card px-4 md:w-[200px]"
          data-form-type="other"
          suppressHydrationWarning
        >
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="last_1_month">Past month</SelectItem>
          <SelectItem value="last_3_months">Past 3 months</SelectItem>
          <SelectItem value="last_6_months">Past 6 months</SelectItem>
          <SelectItem value="last_12_months">Past 12 months</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {dateRange === "custom" && (
        <div className="grid gap-3 sm:grid-cols-2 md:flex md:items-start">
          <div className="space-y-1">
            <span className="px-1 text-xs font-medium text-muted-foreground">From</span>
            <Input
              type="date"
              value={customDateFrom}
              onChange={(e) => onCustomDateFrom(e.target.value)}
              className="h-11 rounded-full border-border/70 bg-card px-4 md:w-[160px]"
              aria-label="Custom start date"
              data-form-type="other"
              suppressHydrationWarning
            />
          </div>
          <div className="space-y-1">
            <span className="px-1 text-xs font-medium text-muted-foreground">To</span>
            <Input
              type="date"
              value={customDateTo}
              onChange={(e) => onCustomDateTo(e.target.value)}
              className="h-11 rounded-full border-border/70 bg-card px-4 md:w-[160px]"
              aria-label="Custom end date"
              data-form-type="other"
              suppressHydrationWarning
            />
            {!customDateTo && (
              <p className="px-1 text-xs text-muted-foreground">
                Default date is today, {defaultCustomDateTo}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
