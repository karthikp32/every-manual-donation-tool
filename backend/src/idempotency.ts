interface IdempotencyRecord {
  fingerprint: string;
  response: {
    statusCode: number;
    body: unknown;
  };
}

type IdempotencyStart =
  | { kind: "none" }
  | { kind: "fresh"; storageKey: string; fingerprint: string }
  | { kind: "replay"; statusCode: number; body: unknown }
  | { kind: "conflict" };

const idempotencyRecords = new Map<string, IdempotencyRecord>();

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function beginIdempotentRequest(input: {
  method: string;
  path: string;
  idempotencyKey?: string;
  body: unknown;
}): IdempotencyStart {
  const idempotencyKey = input.idempotencyKey?.trim();
  if (!idempotencyKey) {
    return { kind: "none" };
  }

  const storageKey = `${input.method.toUpperCase()} ${input.path} ${idempotencyKey}`;
  const fingerprint = stableStringify(input.body);
  const existing = idempotencyRecords.get(storageKey);

  if (!existing) {
    return { kind: "fresh", storageKey, fingerprint };
  }

  if (existing.fingerprint !== fingerprint) {
    return { kind: "conflict" };
  }

  return {
    kind: "replay",
    statusCode: existing.response.statusCode,
    body: existing.response.body
  };
}

export function storeIdempotentResponse(
  idempotency: IdempotencyStart,
  statusCode: number,
  body: unknown
): void {
  if (idempotency.kind !== "fresh") {
    return;
  }

  idempotencyRecords.set(idempotency.storageKey, {
    fingerprint: idempotency.fingerprint,
    response: {
      statusCode,
      body
    }
  });
}
