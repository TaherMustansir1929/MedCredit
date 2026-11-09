import type { Context } from "hono";
import { auth } from "@workspace/auth";

type ResolvedUser = { id: string; email?: string };

/**
 * Resolve the current user from a Better Auth session, falling back to the
 * `x-user-id` header when the auth cookie is not shared across ports.
 */
export async function resolveUser(c: Context): Promise<ResolvedUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (session?.user) {
      return { id: session.user.id, email: session.user.email };
    }
  } catch (err) {
    console.warn("Session retrieval failed:", err);
  }

  const userIdHeader = c.req.header("x-user-id");
  if (userIdHeader) {
    return { id: userIdHeader };
  }

  return null;
}
