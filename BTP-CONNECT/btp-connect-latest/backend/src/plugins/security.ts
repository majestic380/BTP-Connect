import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

export async function registerSecurity(app: FastifyInstance) {
  await app.register(helmet);

  await app.register(cors, {
    origin: (origin, cb) => {
      const allowed = (process.env.CORS_ORIGIN || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      // server-to-server or curl
      if (!origin) return cb(null, true);

      // A3: sensible defaults depending on bind host.
      // - If CORS_ORIGIN is set: strict allow-list.
      // - If backend is bound locally (127.0.0.1): only allow localhost origins.
      // - If backend is exposed on LAN (HOST != 127.0.0.1): allow all unless overridden.
      const bindHost = (process.env.HOST || "127.0.0.1").trim();

      if (allowed.length > 0) {
        if (allowed.includes(origin)) return cb(null, true);
        return cb(new Error("CORS blocked"), false);
      }

      if (bindHost === "127.0.0.1" || bindHost === "localhost") {
        const ok = origin.startsWith("http://localhost") ||
          origin.startsWith("http://127.0.0.1") ||
          origin.startsWith("https://localhost") ||
          origin.startsWith("https://127.0.0.1");
        return ok ? cb(null, true) : cb(new Error("CORS blocked"), false);
      }

      return cb(null, true);
    }
  });

  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: "1 minute"
  });
}
