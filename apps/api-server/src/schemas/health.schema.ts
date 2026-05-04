import { HealthStatus } from "../services/health.service";

type HealthResponse = {
  status: "ok";
  service: "api-server";
  posConnection: "connected" | "degraded";
  timestamp: string;
};

export function toHealthResponse(input: HealthStatus): HealthResponse {
  if (
    input.status !== "ok" ||
    input.service !== "api-server" ||
    (input.posConnection !== "connected" && input.posConnection !== "degraded") ||
    Number.isNaN(Date.parse(input.timestamp))
  ) {
    throw new Error("Invalid health response payload");
  }

  return input;
}
