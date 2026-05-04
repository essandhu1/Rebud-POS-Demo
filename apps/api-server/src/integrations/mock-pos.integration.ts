export async function getPosConnectionStatus(): Promise<"connected" | "degraded"> {
  // POC mock integration point where LogicKit/POS calls will eventually live.
  return "connected";
}
