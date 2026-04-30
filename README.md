# Every.org Donation Processor

A small full-stack TypeScript app for manually processing donations. It uses an Express API in `backend/`, the provided React dashboard in `frontend/`, and an in-memory store seeded with the assessment data.

## Run

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

The root install also installs `frontend/` dependencies. You can override the frontend API target with `VITE_API_BASE_URL`.

## API

### `POST /donations`

Creates a donation and returns `201` with the created donation.

Required request shape:

```json
{
  "uuid": "354362d8-2080-4ca1-9ede-892e4c6d3a25",
  "amount": 5000,
  "currency": "USD",
  "paymentMethod": "cc",
  "nonprofitId": "org1",
  "donorId": "donor_01",
  "status": "new",
  "createdAt": "2026-01-15T10:00:00Z"
}
```

- Invalid payloads return `400`.
- `uuid` is required and must be a valid UUID.
- Duplicate UUIDs return `409`.
- `updatedAt` is set to provided `updatedAt`, otherwise `createdAt`.

### `GET /donations`

Returns:

```json
{
  "donations": []
}
```

Optional filters:

- `?status=new|pending|success|failure`
- `?paymentMethod=cc|ach|crypto|venmo`
- `?createdAtDate=YYYY-MM-DD`

### `GET /nonprofits`

Returns the seeded nonprofit lookup table:

```json
{
  "nonprofits": [{ "id": "org1", "name": "Every Shelter" }]
}
```

### `GET /donors`

Returns the seeded donor lookup table:

```json
{
  "donors": [{ "id": "donor_01", "name": "Avery Johnson" }]
}
```

### `GET /donations/:uuid`

- `200` with the donation when found.
- `404` when not found.

### `PATCH /donations/:uuid/status`

Request:

```json
{
  "status": "pending"
}
```

Valid transitions:

- `new -> pending`
- `pending -> success`
- `pending -> failure`

Rules:

- Missing donation returns `404`.
- Invalid status returns `400`.
- Same-status update returns `409`.
- Invalid transition returns `422` with:

```json
{
  "error": "Invalid status transition",
  "message": "Cannot transition donation from success to failure."
}
```

## Idempotency and Conflict Decisions

- Duplicate UUID `POST /donations` returns `409`.
- Same-status `PATCH /donations/:uuid/status` returns `409`.
- Other duplicate status update interpretations are intentionally scoped to same-status updates for this timebox.

## UI Decisions

- Invalid transitions are hidden from users.
- Amounts are entered and displayed in dollars, then converted to cents for the API.
- The create form exposes UUID because the assessment contract requires clients to provide one.
- The dashboard includes status, payment method, and created-at date filters plus summary cards for total amount, total count, success rate, and failure rate. The created-at date filter lets operations staff isolate the manual processing queue for a specific business day without scanning timestamps.
- Nonprofits and donors are modeled as separate in-memory tables and exposed through lookup endpoints. This keeps donation rows tied to stable ids while allowing the UI to show human-readable names.
- The create dialog lets users search/select nonprofits and donors by name, then sends `nonprofitId` and `donorId` to the API under the hood. This reduces typing mistakes while preserving the backend contract and making the form friendlier for internal operators.
- UUIDs are truncated in the table and can be copied by clicking them.

## Tradeoffs

- In-memory storage was chosen for speed, simplicity, and reliable local setup.
- No auth, persistence, audit trail, or real payment processor are included.
- Validation is intentionally lightweight and local to the API.

## AI Usage

AI was used for scaffolding and implementation, but transition logic and product decisions were reviewed manually.
