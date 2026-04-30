import { useState } from "react";
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
  ApiError,
  createDonation,
  type DonationStatus,
  type PaymentMethod,
} from "@/lib/donations";

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

export function CreateDonationDialog({ open, onOpenChange, onCreated }: Props) {
  const [uuid, setUuid] = useState(newUuid());
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cc");
  const [nonprofitId, setNonprofitId] = useState("");
  const [donorId, setDonorId] = useState("");
  const [status, setStatus] = useState<DonationStatus>("new");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nonprofit">Nonprofit ID</Label>
              <Input
                id="nonprofit"
                value={nonprofitId}
                onChange={(e) => setNonprofitId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="donor">Donor ID</Label>
              <Input
                id="donor"
                value={donorId}
                onChange={(e) => setDonorId(e.target.value)}
                required
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
