import { getPosConnectionStatus } from "../integrations/mock-pos.integration";

export type HealthStatus = {
  status: "ok";
  service: "api-server";
  posConnection: "connected" | "degraded";
  timestamp: string;
};

export async function getHealth(): Promise<HealthStatus> {
  const posConnection = await getPosConnectionStatus();

  return {
    status: "ok",
    service: "api-server",
    posConnection,
    timestamp: new Date().toISOString(),
  };
}
