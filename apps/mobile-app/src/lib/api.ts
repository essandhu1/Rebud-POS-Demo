import { getApiBaseUrl } from "./config";

export class ApiRequestError extends Error {
  readonly statusCode?: number;
  readonly code?: string;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

type ApiErrorBody = {
  success: false;
  error: { code: string; message: string };
};

function isApiErrorBody(x: unknown): x is ApiErrorBody {
  return (
    typeof x === "object" &&
    x !== null &&
    "success" in x &&
    (x as { success: unknown }).success === false &&
    "error" in x
  );
}

/**
 * GET JSON from the API; parses `{ success: true, data: T }` envelope used by product routes.
 */
export async function apiGetData<T>(path: string): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network request failed";
    throw new ApiRequestError(msg, undefined, "NETWORK_ERROR");
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ApiRequestError(`Invalid JSON (${res.status})`, res.status);
  }

  if (!res.ok || isApiErrorBody(body)) {
    const message =
      isApiErrorBody(body) && body.error?.message
        ? body.error.message
        : `Request failed (${res.status})`;
    const code = isApiErrorBody(body) ? body.error.code : undefined;
    throw new ApiRequestError(message, res.status, code);
  }

  const envelope = body as { success?: boolean; data?: T };
  if (envelope.success !== true || envelope.data === undefined) {
    throw new ApiRequestError("Unexpected API response shape", res.status);
  }

  return envelope.data;
}
