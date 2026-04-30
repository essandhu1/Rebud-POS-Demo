import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "api-server",
    timestamp: new Date().toISOString(),
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal Server Error";
  res.status(500).json({ error: message });
});

app.listen(port, () => {
  // Keeping this log explicit helps quickly confirm local startup port.
  console.log(`API server listening on http://localhost:${port}`);
});
