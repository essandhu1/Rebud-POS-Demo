/**
 * Base URL for the API server (no trailing slash).
 * Set EXPO_PUBLIC_API_BASE_URL in `.env` or app env; restart Expo after changes.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  // Dev default for iOS Simulator only; physical devices need LAN IP in env.
  return "http://localhost:4000";
}
