import type { DonationStatus } from "@/lib/donations";
import { cn } from "@/lib/utils";

const styles: Record<DonationStatus, string> = {
  new: "bg-info/20 text-info-foreground ring-info/30",
  pending: "bg-warning/25 text-warning-foreground ring-warning/40",
  success: "bg-success/25 text-success-foreground ring-success/40",
  failure: "bg-destructive/15 text-destructive ring-destructive/30",
};

const labels: Record<DonationStatus, string> = {
  new: "New",
  pending: "Pending",
  success: "Succeeded",
  failure: "Failed",
};

export function StatusPill({ status }: { status: DonationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status],
      )}
    >
      <span
        className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          status === "new" && "bg-info",
          status === "pending" && "bg-warning",
          status === "success" && "bg-success",
          status === "failure" && "bg-destructive",
        )}
      />
      {labels[status]}
    </span>
  );
}
