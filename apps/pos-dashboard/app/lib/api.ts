/** Base URL for the backend API. */
const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:4000";

export class ApiError extends Error {
  readonly statusCode?: number;
  readonly code?: string;
  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

type ApiSuccessBody<T> = {
  success: true;
  data: T;
};

type ApiListBody<T> = {
  success: true;
  count: number;
  data: T;
};

function isApiSuccessBody<T>(x: unknown): x is ApiSuccessBody<T> {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as Record<string, unknown>).success === true &&
    "data" in x
  );
}

/**
 * GET JSON from the API and unwrap the `{ success: true, data: T }` envelope.
 */
export async function apiGetData<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network request failed";
    throw new ApiError(msg, undefined, "NETWORK_ERROR");
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ApiError(`Invalid JSON (${res.status})`, res.status);
  }

  if (!res.ok || !isApiSuccessBody(body)) {
    const message =
      isApiSuccessBody(body)
        ? "Unexpected API error"
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body.data as T;
}

/**
 * POST JSON to the API and unwrap the `{ success: true, data: T }` envelope.
 */
export async function apiPostData<T>(path: string, payload: unknown): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network request failed";
    throw new ApiError(msg, undefined, "NETWORK_ERROR");
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ApiError(`Invalid JSON (${res.status})`, res.status);
  }

  if (!res.ok || !isApiSuccessBody(body)) {
    const message =
      isApiSuccessBody(body)
        ? "Unexpected API error"
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body.data as T;
}

/**
 * GET JSON from the API and unwrap the `{ success: true, count: number, data: T }` list envelope.
 */
export async function apiGetList<T>(path: string): Promise<{ count: number; data: T }> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network request failed";
    throw new ApiError(msg, undefined, "NETWORK_ERROR");
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ApiError(`Invalid JSON (${res.status})`, res.status);
  }

  if (!res.ok) {
    throw new ApiError(`Request failed (${res.status})`, res.status);
  }

  const envelope = body as ApiListBody<T> | ApiSuccessBody<T>;
  if (envelope.success !== true || !("data" in envelope)) {
    throw new ApiError("Unexpected API response shape", res.status);
  }

  const listEnv = envelope as ApiListBody<T>;
  return { count: listEnv.count ?? 0, data: listEnv.data };
}