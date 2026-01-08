import type { Role } from "@prisma/client";

export type AccessTokenPayload = {
  sub: string;           // userId
  entrepriseId: string;
  role: Role;
  email: string;
};

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}
