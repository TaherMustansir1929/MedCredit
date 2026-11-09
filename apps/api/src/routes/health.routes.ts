import { Hono } from "hono";

/**
 * Health & service metadata endpoints.
 */
export const healthRoutes = new Hono();

healthRoutes.get("/", (c) => {
  return c.json({ status: "ok", service: "MedCredit API", version: "1.0.0" });
});

healthRoutes.get("/health", (c) => {
  return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});
