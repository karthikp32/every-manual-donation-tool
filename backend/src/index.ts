import cors from "cors";
import express from "express";
import { isValidStatusTransition } from "./transitions.js";
import {
  createDonation,
  hasDonor,
  getDonation,
  hasDonation,
  hasNonprofit,
  listDonors,
  listDonations,
  listNonprofits,
  updateDonationStatus
} from "./store.js";
import {
  isDonationStatus,
  isPaymentMethod,
  validateDonationCreatePayload
} from "./validation.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError) {
    return res.status(400).json({
      error: "Invalid JSON",
      message: "Request body must be valid JSON."
    });
  }

  return next(err);
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/nonprofits", (_req, res) => {
  res.json({ nonprofits: listNonprofits() });
});

app.get("/donors", (_req, res) => {
  res.json({ donors: listDonors() });
});

app.post("/donations", (req, res) => {
  const validation = validateDonationCreatePayload(req.body);
  if (!validation.ok) {
    return res.status(400).json({
      error: "Invalid donation payload",
      message: validation.message
    });
  }

  if (hasDonation(validation.value.uuid)) {
    return res.status(409).json({
      error: "Donation already exists",
      message: `Donation ${validation.value.uuid} already exists.`
    });
  }

  if (!hasNonprofit(validation.value.nonprofitId)) {
    return res.status(400).json({
      error: "Invalid donation payload",
      message: `nonprofitId ${validation.value.nonprofitId} does not exist.`
    });
  }

  if (!hasDonor(validation.value.donorId)) {
    return res.status(400).json({
      error: "Invalid donation payload",
      message: `donorId ${validation.value.donorId} does not exist.`
    });
  }

  const created = createDonation({
    ...validation.value,
    updatedAt: validation.value.updatedAt ?? validation.value.createdAt ?? new Date().toISOString()
  });

  return res.status(201).json(created);
});

app.get("/donations", (req, res) => {
  const status = req.query.status;
  const paymentMethod = req.query.paymentMethod;
  const createdAtDate = req.query.createdAtDate;

  if (status !== undefined && !isDonationStatus(status)) {
    return res.status(400).json({
      error: "Invalid filter",
      message: "status filter is invalid."
    });
  }

  if (paymentMethod !== undefined && !isPaymentMethod(paymentMethod)) {
    return res.status(400).json({
      error: "Invalid filter",
      message: "paymentMethod filter is invalid."
    });
  }

  if (
    createdAtDate !== undefined &&
    (typeof createdAtDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(createdAtDate) ||
      Number.isNaN(Date.parse(`${createdAtDate}T00:00:00Z`)))
  ) {
    return res.status(400).json({
      error: "Invalid filter",
      message: "createdAtDate filter must be YYYY-MM-DD."
    });
  }

  return res.json({
    donations: listDonations({ status, paymentMethod, createdAtDate })
  });
});

app.get("/donations/:uuid", (req, res) => {
  const donation = getDonation(req.params.uuid);
  if (!donation) {
    return res.status(404).json({
      error: "Donation not found",
      message: `Donation ${req.params.uuid} was not found.`
    });
  }

  return res.json(donation);
});

app.patch("/donations/:uuid/status", (req, res) => {
  const donation = getDonation(req.params.uuid);
  if (!donation) {
    return res.status(404).json({
      error: "Donation not found",
      message: `Donation ${req.params.uuid} was not found.`
    });
  }

  const targetStatus = req.body?.status;
  if (!isDonationStatus(targetStatus)) {
    return res.status(400).json({
      error: "Invalid status",
      message: "status must be one of new, pending, success, or failure."
    });
  }

  if (targetStatus === donation.status) {
    return res.status(409).json({
      error: "Status already set",
      message: `Donation is already ${targetStatus}.`
    });
  }

  if (!isValidStatusTransition(donation.status, targetStatus)) {
    return res.status(422).json({
      error: "Invalid status transition",
      message: `Cannot transition donation from ${donation.status} to ${targetStatus}.`
    });
  }

  const updated = updateDonationStatus(req.params.uuid, targetStatus);
  return res.json(updated);
});

app.listen(port, () => {
  console.log(`Donation API listening on http://localhost:${port}`);
});
