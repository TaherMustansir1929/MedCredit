import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./routes/health.routes";
import { businessRoutes } from "./routes/business.routes";

const app = new Hono();

// Enable CORS for web frontend
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow localhost frontend development origins
      if (
        !origin ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return origin || "*";
      }
      return origin;
    },
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "Cookie", "x-user-id"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Mount routers
app.route("/", healthRoutes);
app.route("/api/business", businessRoutes);

export default {
  port: process.env.PORT || 8000,
  fetch: app.fetch,
};
