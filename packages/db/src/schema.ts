import { relations } from "drizzle-orm/_relations";
import { pgTable, text, timestamp, boolean, integer, numeric, index } from "drizzle-orm/pg-core";

// ==========================================
// BETTER AUTH CORE TABLES
// ==========================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// ==========================================
// BETTER AUTH ORGANIZATION PLUGIN TABLES
// ==========================================

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    metadata: text("metadata"),
  },
  (table) => [index("organization_slug_idx").on(table.slug)]
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ]
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ]
);

// ==========================================
// MEDCREDIT BUSINESS DOMAIN TABLES
// ==========================================

export const distributor = pgTable(
  "distributor",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("distributor_organizationId_idx").on(table.organizationId)]
);

export const product = pgTable(
  "product",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sku: text("sku"),
    barcode: text("barcode"),
    unit: text("unit"),
    category: text("category"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("product_organizationId_idx").on(table.organizationId)]
);

export const batch = pgTable(
  "batch",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    batchNumber: text("batch_number").notNull(),
    expiryDate: timestamp("expiry_date").notNull(),
    quantityRemaining: integer("quantity_remaining").notNull().default(0),
    purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("batch_organizationId_idx").on(table.organizationId),
    index("batch_productId_idx").on(table.productId),
    index("batch_expiryDate_idx").on(table.expiryDate),
  ]
);

export const receipt = pgTable(
  "receipt",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    distributorId: text("distributor_id").references(() => distributor.id, {
      onDelete: "set null",
    }),
    invoiceNumber: text("invoice_number"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
    status: text("status").notNull().default("completed"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("receipt_organizationId_idx").on(table.organizationId),
    index("receipt_distributorId_idx").on(table.distributorId),
  ]
);

export const receipt_item = pgTable(
  "receipt_item",
  {
    id: text("id").primaryKey(),
    receiptId: text("receipt_id")
      .notNull()
      .references(() => receipt.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => product.id, {
      onDelete: "set null",
    }),
    batchId: text("batch_id").references(() => batch.id, {
      onDelete: "set null",
    }),
    quantity: integer("quantity").notNull().default(1),
    unitCost: numeric("unit_cost", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("receipt_item_receiptId_idx").on(table.receiptId),
    index("receipt_item_organizationId_idx").on(table.organizationId),
  ]
);

export const notification = pgTable(
  "notification",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull().default("expiry"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_organizationId_idx").on(table.organizationId),
    index("notification_isRead_idx").on(table.isRead),
  ]
);

// ==========================================
// DRIZZLE RELATIONS
// ==========================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  distributors: many(distributor),
  products: many(product),
  batches: many(batch),
  receipts: many(receipt),
  receiptItems: many(receipt_item),
  notifications: many(notification),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const distributorRelations = relations(distributor, ({ one, many }) => ({
  organization: one(organization, {
    fields: [distributor.organizationId],
    references: [organization.id],
  }),
  receipts: many(receipt),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  organization: one(organization, {
    fields: [product.organizationId],
    references: [organization.id],
  }),
  batches: many(batch),
  receiptItems: many(receipt_item),
}));

export const batchRelations = relations(batch, ({ one, many }) => ({
  organization: one(organization, {
    fields: [batch.organizationId],
    references: [organization.id],
  }),
  product: one(product, {
    fields: [batch.productId],
    references: [product.id],
  }),
  receiptItems: many(receipt_item),
}));

export const receiptRelations = relations(receipt, ({ one, many }) => ({
  organization: one(organization, {
    fields: [receipt.organizationId],
    references: [organization.id],
  }),
  distributor: one(distributor, {
    fields: [receipt.distributorId],
    references: [distributor.id],
  }),
  items: many(receipt_item),
}));

export const receiptItemRelations = relations(receipt_item, ({ one }) => ({
  receipt: one(receipt, {
    fields: [receipt_item.receiptId],
    references: [receipt.id],
  }),
  organization: one(organization, {
    fields: [receipt_item.organizationId],
    references: [organization.id],
  }),
  product: one(product, {
    fields: [receipt_item.productId],
    references: [product.id],
  }),
  batch: one(batch, {
    fields: [receipt_item.batchId],
    references: [batch.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  organization: one(organization, {
    fields: [notification.organizationId],
    references: [organization.id],
  }),
}));

// ==========================================
// TYPE INFERENCE
// ==========================================

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;
export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;

export type Distributor = typeof distributor.$inferSelect;
export type NewDistributor = typeof distributor.$inferInsert;
export type Product = typeof product.$inferSelect;
export type NewProduct = typeof product.$inferInsert;
export type Batch = typeof batch.$inferSelect;
export type NewBatch = typeof batch.$inferInsert;
export type Receipt = typeof receipt.$inferSelect;
export type NewReceipt = typeof receipt.$inferInsert;
export type ReceiptItem = typeof receipt_item.$inferSelect;
export type NewReceiptItem = typeof receipt_item.$inferInsert;
export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;
