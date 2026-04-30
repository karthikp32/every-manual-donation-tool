import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SummaryCards } from "@/components/SummaryCards";
import {
  DonationFilters,
  type PaymentFilter,
  type StatusFilter,
} from "@/components/DonationFilters";
import { DonationTable } from "@/components/DonationTable";
import { CreateDonationDialog } from "@/components/CreateDonationDialog";
import { DonationDetailDrawer } from "@/components/DonationDetailDrawer";
import {
  ApiError,
  listDonations,
  updateStatus,
  type Donation,
  type DonationStatus,
} from "@/lib/donations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Donation Processor — Every.org Internal" },
      {
        name: "description",
        content:
          "Internal operations dashboard for processing manual donations on Every.org.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [detailUuid, setDetailUuid] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDonations({
        status: statusFilter,
        paymentMethod: paymentFilter,
      });
      setDonations(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load donations");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return donations;
    return donations.filter(
      (d) =>
        d.uuid.toLowerCase().includes(q) ||
        d.donorId.toLowerCase().includes(q) ||
        d.nonprofitId.toLowerCase().includes(q),
    );
  }, [donations, search]);

  const handleAction = async (uuid: string, target: DonationStatus) => {
    setActionError(null);
    try {
      await updateStatus(uuid, target);
      await refresh();
    } catch (e) {
      setActionError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Failed to update donation",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Every.org</div>
              <h1 className="text-lg font-semibold leading-tight">Donation Processor</h1>
            </div>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-full px-5"
          >
            + Record donation
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Donations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, search, and manually advance the status of donations being processed.
          </p>
        </div>

        <SummaryCards donations={donations} />

        <DonationFilters
          search={search}
          onSearch={setSearch}
          status={statusFilter}
          onStatus={setStatusFilter}
          payment={paymentFilter}
          onPayment={setPaymentFilter}
        />

        {actionError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {actionError}
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <h3 className="font-semibold text-destructive">Couldn't load donations</h3>
            <p className="mt-1 text-sm text-destructive/90">{error}</p>
            <Button
              onClick={refresh}
              variant="outline"
              className="mt-4 rounded-full"
            >
              Try again
            </Button>
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-border/70 bg-card p-12 text-center text-sm text-muted-foreground">
            Loading donations…
          </div>
        ) : (
          <DonationTable
            donations={filtered}
            onAction={handleAction}
            onRowClick={setDetailUuid}
          />
        )}
      </main>

      <CreateDonationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refresh}
      />

      <DonationDetailDrawer
        uuid={detailUuid}
        onClose={() => setDetailUuid(null)}
        onChanged={refresh}
      />
    </div>
  );
}
