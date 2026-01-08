import type { FastifyRequest, FastifyReply } from "fastify";
import type { Role } from "@prisma/client";

export function requireRole(roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user;
    if (!user) return reply.status(401).send({ error: "Unauthorized" });
    if (!roles.includes(user.role)) return reply.status(403).send({ error: "Forbidden" });
  };
}
