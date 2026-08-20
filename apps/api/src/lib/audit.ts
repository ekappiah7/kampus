import { prisma } from "@kampus/db";
import type { AuthTokenPayload } from "./auth";

/**
 * Append-only trail for actions that move money or change a pupil's record.
 * Deliberately fire-and-forget: an audit write must never fail the request it
 * describes, but it should be loud in the logs if it breaks.
 */
export function audit(
  actor: AuthTokenPayload | null,
  action: string,
  opts: { schoolId: string; entity?: string; detail?: string },
): void {
  prisma.auditLog
    .create({
      data: {
        schoolId: opts.schoolId,
        actorType: actor ? (actor.role === "parent" ? "parent" : "staff") : "system",
        actorId: actor?.id,
        actorName: actor?.name,
        action,
        entity: opts.entity,
        detail: opts.detail,
      },
    })
    .catch((err) => console.error("audit write failed", action, err));
}
