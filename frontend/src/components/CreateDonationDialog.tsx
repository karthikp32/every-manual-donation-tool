import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ApiError,
  createDonation,
  listDonors,
  listNonprofits,
  type Donor,
  type DonationStatus,
  type Nonprofit,
  type PaymentMethod,
} from "@/lib/donations";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

function newUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface LookupOption {
  id: string;
  name: string;
}

interface LookupComboboxProps {
  label: string;
  value: string;
  options: LookupOption[];
  placeholder: string;
  emptyMessage: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

function LookupCombobox({
  label,
  value,
  options,
  placeholder,
  emptyMessage,
  disabled,
  onChange,
}: LookupComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between rounded-md px-3 text-left font-normal",
            !selected && "text-muted-foreground",
          )}
          data-form-type="other"
          suppressHydrationWarning
        >
          <span className="min-w-0 truncate">
            {selected ? `${selected.name} (${selected.id})` : placeholder}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search by name or ID..."
            data-form-type="other"
            suppressHydrationWarning
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.name} ${option.id}`}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("opacity-0", value === option.id && "opacity-100")}
                  />
                  <span className="min-w-0 flex-1 truncate">{option.name}</span>
                  <span className="text-xs text-muted-foreground">{option.id}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function CreateDonationDialog({ open, onOpenChange, onCreated }: Props) {
  const [uuid, setUuid] = useState(newUuid());
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cc");
  const [nonprofitId, setNonprofitId] = useState("");
  const [donorId, setDonorId] = useState("");
  const [status, setStatus] = useState<DonationStatus>("new");
  const [nonprofits, setNonprofits] = useState<Nonprofit[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupOptions = useMemo(
    () => ({
      nonprofits: nonprofits.map((nonprofit) => ({
        id: nonprofit.id,
        name: nonprofit.name,
      })),
      donors: donors.map((donor) => ({
        id: donor.id,
        name: donor.name,
      })),
    }),
    [donors, nonprofits],
  );

  useEffect(() => {
    if (!open || (nonprofits.length > 0 && donors.length > 0)) return;

    let cancelled = false;
    setLookupsLoading(true);
    setError(null);
    Promise.all([listNonprofits(), listDonors()])
      .then(([nextNonprofits, nextDonors]) => {
        if (cancelled) return;
        setNonprofits(nextNonprofits);
        setDonors(nextDonors);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load nonprofit and donor lists.");
      })
      .finally(() => {
        if (!cancelled) setLookupsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [donors.length, nonprofits.length, open]);

  const reset = () => {
    setUuid(newUuid());
    setAmount("");
    setPaymentMethod("cc");
    setNonprofitId("");
    setDonorId("");
    setStatus("new");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const dollars = Number(amount);
    if (!uuid.trim() || !nonprofitId.trim() || !donorId.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setError("Please enter a valid amount in dollars.");
      return;
    }

    const cents = Math.round(dollars * 100);

    setSubmitting(true);
    try {
      await createDonation({
        uuid: uuid.trim(),
        amount: cents,
        currency: "USD",
        paymentMethod,
        nonprofitId: nonprofitId.trim(),
        donorId: donorId.trim(),
        status,
        createdAt: new Date().toISOString(),
      });
      reset();
      onCreated();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("A donation with this UUID already exists.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setError(null);
        onOpenChange(o);
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Record a donation</DialogTitle>
          <DialogDescription>
            Manually create a donation record for this operations workflow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="uuid">UUID</Label>
            <div className="flex gap-2">
              <Input
                id="uuid"
                value={uuid}
                onChange={(e) => setUuid(e.target.value)}
                className="font-mono text-xs"
                placeholder="354362d8-2080-4ca1-9ede-892e4c6d3a25"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setUuid(newUuid())}
                className="rounded-full"
              >
                New
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="50.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cc">Credit card</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nonprofit</Label>
              <LookupCombobox
                label="Nonprofit"
                value={nonprofitId}
                options={lookupOptions.nonprofits}
                placeholder={lookupsLoading ? "Loading nonprofits..." : "Select nonprofit"}
                emptyMessage="No nonprofits found."
                disabled={lookupsLoading}
                onChange={setNonprofitId}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Donor</Label>
              <LookupCombobox
                label="Donor"
                value={donorId}
                options={lookupOptions.donors}
                placeholder={lookupsLoading ? "Loading donors..." : "Select donor"}
                emptyMessage="No donors found."
                disabled={lookupsLoading}
                onChange={setDonorId}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Initial status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as DonationStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="success">Succeeded</SelectItem>
                <SelectItem value="failure">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-full" disabled={submitting}>
              {submitting ? "Saving…" : "Save donation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
