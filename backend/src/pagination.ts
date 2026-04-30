export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMeta extends PaginationParams {
  total: number;
  totalPages: number;
}

const defaultPage = 1;
const defaultPageSize = 25;
const maxPageSize = 100;

export function parsePagination(query: {
  page?: unknown;
  pageSize?: unknown;
}):
  | { ok: true; value: PaginationParams }
  | { ok: false; message: string } {
  const page = query.page ?? String(defaultPage);
  const pageSize = query.pageSize ?? String(defaultPageSize);

  if (typeof page !== "string" || !/^\d+$/.test(page)) {
    return { ok: false, message: "page must be a positive integer." };
  }

  if (typeof pageSize !== "string" || !/^\d+$/.test(pageSize)) {
    return { ok: false, message: "pageSize must be a positive integer." };
  }

  const parsedPage = Number(page);
  const parsedPageSize = Number(pageSize);

  if (parsedPage < 1) {
    return { ok: false, message: "page must be at least 1." };
  }

  if (parsedPageSize < 1 || parsedPageSize > maxPageSize) {
    return {
      ok: false,
      message: `pageSize must be between 1 and ${maxPageSize}.`
    };
  }

  return {
    ok: true,
    value: {
      page: parsedPage,
      pageSize: parsedPageSize
    }
  };
}

export function paginate<T>(
  items: T[],
  { page, pageSize }: PaginationParams
): { items: T[]; pagination: PaginationMeta } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    }
  };
}
