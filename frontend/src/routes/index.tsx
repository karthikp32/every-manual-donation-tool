import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SummaryCards } from "@/components/SummaryCards";
import {
  DonationFilters,
  type DateRangeFilter,
  type PaymentFilter,
  type StatusFilter,
} from "@/components/DonationFilters";
import { DonationTable } from "@/components/DonationTable";
import { CreateDonationDialog } from "@/components/CreateDonationDialog";
import { DonationDetailDrawer } from "@/components/DonationDetailDrawer";
import {
  ApiError,
  listDonations,
  listDonors,
  listNonprofits,
  updateStatus,
  type Donor,
  type Donation,
  type DonationStatus,
  type Nonprofit,
  type PaginationMeta,
} from "@/lib/donations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Manual Donation Processor — Every.org Internal" },
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
  const [nonprofits, setNonprofits] = useState<Nonprofit[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [detailUuid, setDetailUuid] = useState<string | null>(null);

  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const nonprofitNamesById = useMemo(
    () =>
      Object.fromEntries(
        nonprofits.map((nonprofit) => [nonprofit.id, nonprofit.name]),
      ),
    [nonprofits],
  );

  const donorNamesById = useMemo(
    () => Object.fromEntries(donors.map((donor) => [donor.id, donor.name])),
    [donors],
  );

  const dateFilter = useMemo(() => {
    if (dateRange === "all") return {};
    if (dateRange === "custom") {
      return {
        createdAtFrom: customDateFrom || undefined,
        createdAtTo: customDateTo || todayDate,
      };
    }

    const monthsByRange: Record<Exclude<DateRangeFilter, "all" | "custom">, number> = {
      last_1_month: 1,
      last_3_months: 3,
      last_6_months: 6,
      last_12_months: 12,
    };
    const from = new Date();
    from.setMonth(from.getMonth() - monthsByRange[dateRange]);

    return {
      createdAtFrom: from.toISOString().slice(0, 10),
    };
  }, [customDateFrom, customDateTo, dateRange, todayDate]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDonations({
        status: statusFilter,
        paymentMethod: paymentFilter,
        page,
        pageSize: pagination.pageSize,
        ...dateFilter,
      });
      setDonations(data.donations);
      setPagination(data.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load donations");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, page, pagination.pageSize, dateFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, paymentFilter, dateRange, customDateFrom, customDateTo]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listNonprofits(), listDonors()])
      .then(([nextNonprofits, nextDonors]) => {
        if (cancelled) return;
        setNonprofits(nextNonprofits);
        setDonors(nextDonors);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setActionError(
          e instanceof Error ? e.message : "Failed to load nonprofit and donor names",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return donations;
    return donations.filter(
      (d) =>
        d.uuid.toLowerCase().includes(q) ||
        d.donorId.toLowerCase().includes(q) ||
        d.nonprofitId.toLowerCase().includes(q) ||
        (donorNamesById[d.donorId] ?? "").toLowerCase().includes(q) ||
        (nonprofitNamesById[d.nonprofitId] ?? "").toLowerCase().includes(q),
    );
  }, [donations, donorNamesById, nonprofitNamesById, search]);

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
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/brand/every-wordmark.svg"
              alt="Every.org"
              className="h-8 w-auto shrink-0 sm:h-10"
            />
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">
                Manual Donation Processor
              </h1>
            </div>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="w-full rounded-full px-5 sm:w-auto"
          >
            + Record donation
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 sm:py-8">
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
          dateRange={dateRange}
          onDateRange={setDateRange}
          customDateFrom={customDateFrom}
          onCustomDateFrom={setCustomDateFrom}
          customDateTo={customDateTo}
          onCustomDateTo={setCustomDateTo}
          defaultCustomDateTo={todayDate}
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
            nonprofitNamesById={nonprofitNamesById}
            donorNamesById={donorNamesById}
            onAction={handleAction}
            onRowClick={setDetailUuid}
          />
        )}

        {!error && !loading && (
          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} total donations
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1),
                  )
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>

      <CreateDonationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refresh}
      />

      <DonationDetailDrawer
        uuid={detailUuid}
        nonprofitNamesById={nonprofitNamesById}
        donorNamesById={donorNamesById}
        onClose={() => setDetailUuid(null)}
        onChanged={refresh}
      />
    </div>
  );
}
