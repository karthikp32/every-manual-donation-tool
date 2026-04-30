import { Card } from "@/components/ui/card";
import type { Donation } from "@/lib/donations";
import { formatAmount } from "@/lib/donations";

export function SummaryCards({ donations }: { donations: Donation[] }) {
  const total = donations.length;
  const totalAmount = donations.reduce((s, d) => s + d.amount, 0);
  const counts = {
    new: donations.filter((d) => d.status === "new").length,
    pending: donations.filter((d) => d.status === "pending").length,
    success: donations.filter((d) => d.status === "success").length,
    failure: donations.filter((d) => d.status === "failure").length,
  };
  const completed = counts.success + counts.failure;
  const successRate = completed > 0 ? Math.round((counts.success / completed) * 100) : 0;

  const items = [
    { label: "Total donations", value: total.toLocaleString() },
    { label: "Total amount", value: formatAmount(totalAmount) },
    { label: "New", value: counts.new.toLocaleString(), tint: "text-info" },
    { label: "Pending", value: counts.pending.toLocaleString(), tint: "text-warning-foreground" },
    { label: "Succeeded", value: counts.success.toLocaleString(), tint: "text-success-foreground" },
    { label: "Failed", value: counts.failure.toLocaleString(), tint: "text-destructive" },
    { label: "Success rate", value: completed === 0 ? "—" : `${successRate}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
      {items.map((it) => (
        <Card
          key={it.label}
          className="rounded-2xl border-border/70 bg-card p-4 shadow-none"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {it.label}
          </div>
          <div className={`mt-2 text-2xl font-semibold tabular-nums ${it.tint ?? ""}`}>
            {it.value}
          </div>
        </Card>
      ))}
    </div>
  );
}
