import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import {
  ApiError,
  formatAmount,
  formatDate,
  getDonation,
  nextStatuses,
  paymentMethodLabel,
  updateStatus,
  type Donation,
  type DonationStatus,
} from "@/lib/donations";

interface Props {
  uuid: string | null;
  nonprofitNamesById: Record<string, string>;
  donorNamesById: Record<string, string>;
  onClose: () => void;
  onChanged: () => void;
}

const statusActionLabel: Record<DonationStatus, string> = {
  new: "Mark New",
  pending: "Mark Pending",
  success: "Mark Success",
  failure: "Mark Failure",
};

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 py-3 last:border-b-0">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={mono ? "font-mono text-sm break-all" : "text-sm"}>{value}</div>
    </div>
  );
}

export function DonationDetailDrawer({
  uuid,
  nonprofitNamesById,
  donorNamesById,
  onClose,
  onChanged,
}: Props) {
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    if (!uuid) {
      setDonation(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDonation(uuid)
      .then((d) => {
        if (!cancelled) setDonation(d);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load donation");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uuid]);

  const handleAction = async (target: DonationStatus) => {
    if (!donation) return;
    setActionPending(true);
    setError(null);
    try {
      const updated = await updateStatus(donation.uuid, target);
      setDonation(updated);
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Update failed");
    } finally {
      setActionPending(false);
    }
  };

  return (
    <Sheet open={!!uuid} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>Donation details</SheetTitle>
          <SheetDescription>Full record and available status actions.</SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="mt-6 text-sm text-muted-foreground">Loading donation…</div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {donation && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-semibold tabular-nums">
                {formatAmount(donation.amount)}
              </div>
              <StatusPill status={donation.status} />
            </div>

            <div className="mt-6">
              <Field label="UUID" value={donation.uuid} mono />
              <Field label="Currency" value={donation.currency} />
              <Field
                label="Payment method"
                value={paymentMethodLabel(donation.paymentMethod)}
              />
              <Field
                label="Nonprofit"
                value={nonprofitNamesById[donation.nonprofitId] ?? donation.nonprofitId}
              />
              <Field
                label="Donor"
                value={donorNamesById[donation.donorId] ?? donation.donorId}
              />
              <Field label="Created" value={formatDate(donation.createdAt)} />
              <Field label="Last updated" value={formatDate(donation.updatedAt)} />
            </div>

            {nextStatuses(donation.status).length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {nextStatuses(donation.status).map((s) => (
                  <Button
                    key={s}
                    onClick={() => handleAction(s)}
                    disabled={actionPending}
                    variant={s === "failure" ? "outline" : "default"}
                    className="rounded-full"
                  >
                    {statusActionLabel[s]}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                This donation is in a final state. No further actions available.
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
