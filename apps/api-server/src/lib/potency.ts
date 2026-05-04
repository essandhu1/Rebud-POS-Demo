export type PotencyJson = {
  thcPercent?: number | null;
  cbdPercent?: number | null;
  thcMg?: number | null;
  cbdMg?: number | null;
  display?: string;
};

export function extractPotencyPercentages(raw: unknown): {
  thcPercent: number | null;
  cbdPercent: number | null;
} {
  if (!raw || typeof raw !== "object") {
    return { thcPercent: null, cbdPercent: null };
  }
  const p = raw as PotencyJson;
  const thc =
    p.thcPercent === undefined || p.thcPercent === null
      ? null
      : Number(p.thcPercent);
  const cbd =
    p.cbdPercent === undefined || p.cbdPercent === null
      ? null
      : Number(p.cbdPercent);
  return {
    thcPercent: Number.isFinite(thc) ? thc : null,
    cbdPercent: Number.isFinite(cbd) ? cbd : null,
  };
}
