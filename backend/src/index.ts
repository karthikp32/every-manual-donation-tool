import cors from "cors";
import express from "express";
import {
  beginIdempotentRequest,
  storeIdempotentResponse
} from "./idempotency.js";
import { paginate, parsePagination } from "./pagination.js";
import { isValidStatusTransition } from "./transitions.js";
import {
  createDonation,
  getDonation,
  hasDonation,
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

app.get("/nonprofits", (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination.ok) {
    return res.status(400).json({
      error: "Invalid pagination",
      message: pagination.message
    });
  }

  const result = paginate(listNonprofits(), pagination.value);
  res.json({ nonprofits: result.items, pagination: result.pagination });
});

app.get("/donors", (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination.ok) {
    return res.status(400).json({
      error: "Invalid pagination",
      message: pagination.message
    });
  }

  const result = paginate(listDonors(), pagination.value);
  res.json({ donors: result.items, pagination: result.pagination });
});

app.post("/donations", (req, res) => {
  const idempotency = beginIdempotentRequest({
    method: req.method,
    path: req.path,
    idempotencyKey: req.get("Idempotency-Key"),
    body: req.body
  });

  if (idempotency.kind === "replay") {
    return res.status(idempotency.statusCode).json(idempotency.body);
  }

  if (idempotency.kind === "conflict") {
    return res.status(409).json({
      error: "Idempotency key conflict",
      message: "Idempotency-Key was already used with a different request body."
    });
  }

  const validation = validateDonationCreatePayload(req.body);
  if (!validation.ok) {
    const body = {
      error: "Invalid donation payload",
      message: validation.message
    };
    storeIdempotentResponse(idempotency, 400, body);
    return res.status(400).json(body);
  }

  if (hasDonation(validation.value.uuid)) {
    const body = {
      error: "Donation already exists",
      message: `Donation ${validation.value.uuid} already exists.`
    };
    storeIdempotentResponse(idempotency, 409, body);
    return res.status(409).json(body);
  }

  const created = createDonation({
    ...validation.value,
    updatedAt: validation.value.updatedAt ?? validation.value.createdAt ?? new Date().toISOString()
  });

  storeIdempotentResponse(idempotency, 201, created);
  return res.status(201).json(created);
});

app.get("/donations", (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination.ok) {
    return res.status(400).json({
      error: "Invalid pagination",
      message: pagination.message
    });
  }

  const status = req.query.status;
  const paymentMethod = req.query.paymentMethod;
  const createdAtDate = req.query.createdAtDate;
  const createdAtFrom = req.query.createdAtFrom;
  const createdAtTo = req.query.createdAtTo;

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

  for (const [name, value] of [
    ["createdAtFrom", createdAtFrom],
    ["createdAtTo", createdAtTo]
  ] as const) {
    if (
      value !== undefined &&
      (typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(Date.parse(`${value}T00:00:00Z`)))
    ) {
      return res.status(400).json({
        error: "Invalid filter",
        message: `${name} filter must be YYYY-MM-DD.`
      });
    }
  }

  if (
    typeof createdAtFrom === "string" &&
    typeof createdAtTo === "string" &&
    createdAtFrom > createdAtTo
  ) {
    return res.status(400).json({
      error: "Invalid filter",
      message: "createdAtFrom must be before or equal to createdAtTo."
    });
  }

  const createdAtFromFilter =
    typeof createdAtFrom === "string" ? createdAtFrom : undefined;
  const createdAtToFilter = typeof createdAtTo === "string" ? createdAtTo : undefined;

  const result = paginate(
    listDonations({
      status,
      paymentMethod,
      createdAtDate,
      createdAtFrom: createdAtFromFilter,
      createdAtTo: createdAtToFilter
    }),
    pagination.value
  );

  return res.json({
    donations: result.items,
    pagination: result.pagination
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
  const idempotency = beginIdempotentRequest({
    method: req.method,
    path: req.path,
    idempotencyKey: req.get("Idempotency-Key"),
    body: req.body
  });

  if (idempotency.kind === "replay") {
    return res.status(idempotency.statusCode).json(idempotency.body);
  }

  if (idempotency.kind === "conflict") {
    return res.status(409).json({
      error: "Idempotency key conflict",
      message: "Idempotency-Key was already used with a different request body."
    });
  }

  const donation = getDonation(req.params.uuid);
  if (!donation) {
    const body = {
      error: "Donation not found",
      message: `Donation ${req.params.uuid} was not found.`
    };
    storeIdempotentResponse(idempotency, 404, body);
    return res.status(404).json(body);
  }

  const targetStatus = req.body?.status;
  if (!isDonationStatus(targetStatus)) {
    const body = {
      error: "Invalid status",
      message: "status must be one of new, pending, success, or failure."
    };
    storeIdempotentResponse(idempotency, 400, body);
    return res.status(400).json(body);
  }

  if (targetStatus === donation.status) {
    const body = {
      error: "Status already set",
      message: `Donation is already ${targetStatus}.`
    };
    storeIdempotentResponse(idempotency, 409, body);
    return res.status(409).json(body);
  }

  if (!isValidStatusTransition(donation.status, targetStatus)) {
    const body = {
      error: "Invalid status transition",
      message: `Cannot transition donation from ${donation.status} to ${targetStatus}.`
    };
    storeIdempotentResponse(idempotency, 422, body);
    return res.status(422).json(body);
  }

  const updated = updateDonationStatus(req.params.uuid, targetStatus);
  storeIdempotentResponse(idempotency, 200, updated);
  return res.json(updated);
});

app.listen(port, () => {
  console.log(`Donation API listening on http://localhost:${port}`);
});
