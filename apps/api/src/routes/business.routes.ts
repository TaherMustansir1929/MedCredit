import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { organization, member } from "@workspace/db/schema";
import { resolveUser } from "../lib/resolve-user";

/**
 * Business (organization) registration & listing endpoints.
 * Mounted at `/api/business` from the app entry point.
 */
export const businessRoutes = new Hono();

/**
 * Register a new business (organization) and make the authenticated user the owner.
 */
businessRoutes.post("/register", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const user = await resolveUser(c);

    const userId = user?.id || (body as { userId?: string }).userId;
    if (!userId) {
      return c.json(
        {
          success: false,
          error: "Unauthorized. You must be logged in to register a business.",
        },
        401
      );
    }

    const { name, category, phone, address } = body as {
      name?: string;
      category?: string;
      phone?: string;
      address?: string;
    };
    if (!name || typeof name !== "string" || !name.trim()) {
      return c.json(
        {
          success: false,
          error: "Business name is required.",
        },
        400
      );
    }

    // Generate slug
    const cleanName = name.trim();
    let slug = ((body as { slug?: string }).slug || "")
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      const baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      slug = `${baseSlug || "biz"}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Ensure slug uniqueness
    const [existing] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.slug, slug))
      .limit(1);

    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const orgId = crypto.randomUUID();
    const metadataObj = {
      category: category || "General Retail",
      phone: phone || null,
      address: address || null,
    };

    // Insert Organization
    const [newOrg] = await db
      .insert(organization)
      .values({
        id: orgId,
        name: cleanName,
        slug,
        metadata: JSON.stringify(metadataObj),
        createdAt: new Date(),
      })
      .returning();

    if (!newOrg) {
      throw new Error("Failed to create organization record.");
    }

    // Insert Member as Owner
    const memberId = crypto.randomUUID();
    const [newMember] = await db
      .insert(member)
      .values({
        id: memberId,
        organizationId: newOrg.id,
        userId: userId,
        role: "owner",
        createdAt: new Date(),
      })
      .returning();

    if (!newMember) {
      throw new Error("Failed to create membership record.");
    }

    return c.json(
      {
        success: true,
        business: {
          id: newOrg.id,
          name: newOrg.name,
          slug: newOrg.slug,
          role: newMember.role,
          metadata: metadataObj,
          createdAt: newOrg.createdAt,
        },
      },
      201
    );
  } catch (err) {
    console.error("Failed to register business:", err);
    return c.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to register business.",
      },
      500
    );
  }
});

/**
 * List businesses that the authenticated user belongs to.
 */
businessRoutes.get("/list", async (c) => {
  try {
    const user = await resolveUser(c);
    const queryUserId = c.req.query("userId");
    const userId = user?.id || queryUserId;

    if (!userId) {
      return c.json(
        {
          success: false,
          error: "Unauthorized. Please sign in to view your businesses.",
        },
        401
      );
    }

    const memberships = await db
      .select({
        memberId: member.id,
        role: member.role,
        joinedAt: member.createdAt,
        organizationId: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        metadata: organization.metadata,
        createdAt: organization.createdAt,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, userId));

    const businesses = memberships.map((item) => {
      let parsedMetadata: Record<string, unknown> = {};
      if (item.metadata) {
        try {
          parsedMetadata = JSON.parse(item.metadata);
        } catch {
          parsedMetadata = {};
        }
      }
      return {
        id: item.organizationId,
        name: item.name,
        slug: item.slug,
        logo: item.logo,
        role: item.role,
        metadata: parsedMetadata,
        createdAt: item.createdAt,
      };
    });

    return c.json({
      success: true,
      businesses,
    });
  } catch (err) {
    console.error("Failed to fetch user businesses:", err);
    return c.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to fetch businesses.",
      },
      500
    );
  }
});
