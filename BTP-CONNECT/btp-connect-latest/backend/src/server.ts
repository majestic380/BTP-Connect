import "dotenv/config";
import Fastify from "fastify";
import { registerSecurity } from "./plugins/security.js";
import { registerJwt } from "./plugins/jwt.js";
import { registerSwagger } from "./plugins/swagger.js";
import { registerMultipart } from "./plugins/multipart.js";
import { authRoutes } from "./routes/auth.js";
import { stRoutes } from "./routes/st.js";
import { chantiersRoutes } from "./routes/chantiers.js";
import { adminRoutes } from "./routes/admin.js";
import { requireAuth } from "./guards/auth.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const app = Fastify({ logger: true });

app.decorate("authenticate", requireAuth);

await registerSecurity(app);
await registerJwt(app);
await registerSwagger(app);
await registerMultipart(app);

app.get("/health", async () => ({ ok: true }));

// Serve Admin UI (no framework)
app.get("/admin-ui", async (_req, reply) => {
  const html = readFileSync(join(process.cwd(), "src", "static", "admin-ui.html"), "utf-8");
  reply.header("Content-Type", "text/html; charset=utf-8");
  return reply.send(html);
});

// LOT B (PWA) - Serve the mobile/web UI for LAN/CLOUD deployment.
// NOTE: Electron app loads its UI from file:// (src/index.html) and is not impacted.
const pwaRoot = join(process.cwd(), "src", "static", "pwa");

function sendFile(path: string, contentType: string) {
  const buf = readFileSync(path);
  return { buf, contentType };
}

app.get("/", async (_req, reply) => {
  const { buf, contentType } = sendFile(join(pwaRoot, "index.html"), "text/html; charset=utf-8");
  reply.header("Content-Type", contentType);
  // PWA requires HTTPS in production; headers are handled by registerSecurity/helmet.
  return reply.send(buf);
});

app.get("/manifest.webmanifest", async (_req, reply) => {
  const { buf, contentType } = sendFile(join(pwaRoot, "manifest.webmanifest"), "application/manifest+json; charset=utf-8");
  reply.header("Content-Type", contentType);
  return reply.send(buf);
});

app.get("/sw.js", async (_req, reply) => {
  const { buf, contentType } = sendFile(join(pwaRoot, "sw.js"), "application/javascript; charset=utf-8");
  // Service workers require this header to avoid caching issues.
  reply.header("Cache-Control", "no-cache");
  reply.header("Content-Type", contentType);
  return reply.send(buf);
});

app.get("/icons/:name", async (req, reply) => {
  const name = (req.params as any).name as string;
  if (!/^icon-(192|512)(-maskable)?\.png$/.test(name)) {
    return reply.code(404).send({ error: "not_found" });
  }
  const { buf, contentType } = sendFile(join(pwaRoot, "icons", name), "image/png");
  reply.header("Content-Type", contentType);
  reply.header("Cache-Control", "public, max-age=86400");
  return reply.send(buf);
});

await app.register(authRoutes);
await app.register(stRoutes);
await app.register(chantiersRoutes);
await app.register(adminRoutes);

const port = Number(process.env.PORT || 3000);
// A3: network binding is controlled by HOST.
// - local mode: HOST=127.0.0.1 (default)
// - lan mode (explicit): HOST=0.0.0.0
const host = (process.env.HOST && process.env.HOST.trim()) || "127.0.0.1";

app.log.info({ host, port }, "Starting backend");
await app.listen({ port, host });
