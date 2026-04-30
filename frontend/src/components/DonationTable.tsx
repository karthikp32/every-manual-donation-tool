import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import {
  formatAmount,
  formatDate,
  nextStatuses,
  paymentMethodLabel,
  type Donation,
  type DonationStatus,
} from "@/lib/donations";

interface Props {
  donations: Donation[];
  onAction: (uuid: string, target: DonationStatus) => Promise<void>;
  onRowClick: (uuid: string) => void;
}

const actionLabels: Record<DonationStatus, string> = {
  new: "Mark New",
  pending: "Mark Pending",
  success: "Mark Success",
  failure: "Mark Failure",
};

function shortUuid(u: string) {
  return u.length > 12 ? `${u.slice(0, 8)}…${u.slice(-4)}` : u;
}

export function DonationTable({ donations, onAction, onRowClick }: Props) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const handle = async (
    e: React.MouseEvent,
    uuid: string,
    target: DonationStatus,
  ) => {
    e.stopPropagation();
    const key = `${uuid}:${target}`;
    setPendingKey(key);
    try {
      await onAction(uuid, target);
    } finally {
      setPendingKey(null);
    }
  };

  if (donations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-card p-12 text-center">
        <h3 className="text-base font-semibold">No donations yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Donations matching your filters will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              UUID
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Amount
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Method
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Nonprofit
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Donor
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Created
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
              Updated
            </TableHead>
            <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.map((d) => {
            const next = nextStatuses(d.status);
            return (
              <TableRow
                key={d.uuid}
                onClick={() => onRowClick(d.uuid)}
                className="cursor-pointer border-border/60 transition-colors hover:bg-muted/40"
              >
                <TableCell className="py-4 font-mono text-xs" title={d.uuid}>
                  {shortUuid(d.uuid)}
                </TableCell>
                <TableCell className="py-4 font-medium tabular-nums">
                  {formatAmount(d.amount)}
                </TableCell>
                <TableCell className="py-4">
                  <StatusPill status={d.status} />
                </TableCell>
                <TableCell className="py-4 text-sm text-muted-foreground">
                  {paymentMethodLabel(d.paymentMethod)}
                </TableCell>
                <TableCell className="py-4 font-mono text-xs text-muted-foreground">
                  {d.nonprofitId}
                </TableCell>
                <TableCell className="py-4 font-mono text-xs text-muted-foreground">
                  {d.donorId}
                </TableCell>
                <TableCell className="py-4 text-sm text-muted-foreground">
                  {formatDate(d.createdAt)}
                </TableCell>
                <TableCell className="py-4 text-sm text-muted-foreground">
                  {formatDate(d.updatedAt)}
                </TableCell>
                <TableCell className="py-4 text-right">
                  {next.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className="flex justify-end gap-2">
                      {next.map((s) => {
                        const key = `${d.uuid}:${s}`;
                        return (
                          <Button
                            key={s}
                            size="sm"
                            variant={s === "failure" ? "outline" : "default"}
                            className="h-8 rounded-full px-3 text-xs"
                            disabled={pendingKey === key}
                            onClick={(e) => handle(e, d.uuid, s)}
                          >
                            {pendingKey === key ? "…" : actionLabels[s]}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
