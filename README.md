# Every.org Manual Donation Processor

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
- `nonprofitId` and `donorId` must be non-empty strings, but they are not required to exist in the seeded lookup tables.
- Duplicate UUIDs return `409`.
- `updatedAt` is set to provided `updatedAt`, otherwise `createdAt`.

### `GET /donations`

Returns:

```json
{
  "donations": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 0,
    "totalPages": 1
  }
}
```

Optional filters:

- `?status=new|pending|success|failure`
- `?paymentMethod=cc|ach|crypto|venmo`
- `?createdAtFrom=YYYY-MM-DD`
- `?createdAtTo=YYYY-MM-DD`
- `?createdAtDate=YYYY-MM-DD` for exact-day filtering
- `?page=1&pageSize=10`

### `GET /nonprofits`

Returns the seeded nonprofit lookup table:

```json
{
  "nonprofits": [{ "id": "org1", "name": "Every Shelter" }],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

Supports `?page=1&pageSize=10`.

### `GET /donors`

Returns the seeded donor lookup table:

```json
{
  "donors": [{ "id": "donor_01", "name": "Avery Johnson" }],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 8,
    "totalPages": 1
  }
}
```

Supports `?page=1&pageSize=10`.

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

- Duplicate UUID `POST /donations` returns `409` when no matching idempotency record is found.
- Same-status `PATCH /donations/:uuid/status` returns `409`, as required.
- `POST /donations` and `PATCH /donations/:uuid/status` support an optional `Idempotency-Key` header. The frontend sends a fresh UUID key for each create/status action.
- The in-memory API scopes idempotency records by HTTP method, path, and key, then stores the request fingerprint plus the JSON response. Retrying the same method/path/key/body returns the originally stored status code and response body.
- Reusing the same idempotency key for the same method/path with a different request body returns `409`. This mirrors the production pattern where a key protects retries of one logical operation, not unrelated mutations.
- Idempotency records live only in memory, matching the rest of this assessment store. A production version would persist records with TTL cleanup.

## Design Decisions

- Invalid transitions are hidden from users.
- Amounts are entered and displayed in dollars, then converted to cents for the API.
- The create form exposes UUID because the assessment contract requires clients to provide one.
- The dashboard includes status, payment method, and date-range filters plus summary cards for total amount, total count, success rate, and failure rate.
- The date filter uses common operational presets: all time, past month, past 3 months, past 6 months, past 12 months, and custom. Presets make routine queue review faster, while custom from/to dates keep investigation workflows flexible. If custom `To` is left blank, the UI clearly defaults it to today.
- Nonprofits and donors are modeled as separate in-memory lookup tables and exposed through lookup endpoints. The API accepts non-empty `nonprofitId` and `donorId` values even if they are not present in those lookup tables, which keeps the manual intake path flexible for newly onboarded or externally sourced ids.
- The dashboard table and donation detail summary show nonprofit and donor names instead of ids. Operators work from recognizable names, while the API still sends and stores ids for stable references.
- The create dialog lets users search/select nonprofits and donors by name, then sends `nonprofitId` and `donorId` to the API under the hood. This reduces typing mistakes while preserving the backend contract and making the form friendlier for internal operators.
- Group list endpoints support `page` and `pageSize` pagination. This keeps the API/UI shape ready for larger donation volumes and prevents internal dashboards from assuming every list can be loaded at once.
- UUIDs are truncated in the table and can be copied by clicking them.

## Tradeoffs

- In-memory storage was chosen for speed, simplicity, and reliable local setup.
- No auth, persistence, audit trail, or real payment processor are included.
- Validation is intentionally lightweight and local to the API.
