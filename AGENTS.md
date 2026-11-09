<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MedCredit — AI Agent Guide & Repository Instructions

## 1. Project Overview
**MedCredit** is a multi-tenant business inventory management and expiry date tracking system designed for retail shop owners (e.g., pharmacies, grocery stores, clinics). It streamlines stock intake, tracks batch-level expiry dates, and accelerates receipt logging through either manual entry or automated photo extraction.

### Core Architectural Principles
- **Ephemeral Receipt Processing**: Receipt photos uploaded for data extraction must **never** be permanently saved on the server or storage bucket. The image is processed in memory / ephemeral storage to extract line items, batches, and dates, populate the receipt form for human review, and is **immediately deleted**.
- **Multi-Tenant Isolation**: Every business entity is managed as an organization. Users belong to organizations with role-based access control (RBAC). All inventory, distributors, products, batches, and receipts are strictly isolated by `organizationId`.
- **Proactive Expiry Tracking**: The system monitors inventory at the batch level to trigger alerts for upcoming expiration dates.

---

## 2. Tech Stack
MedCredit is structured as a Turborepo monorepo using Bun as the package manager:

- **Frontend (`apps/web`)**: Next.js (App Router, React 19), Tailwind CSS v4, `@workspace/ui` (shadcn-compatible UI package), `@hugeicons/react`.
- **Backend API (`apps/api`)**: Hono on Bun for high-performance microservices and receipt extraction endpoints.
- **Database & ORM (`packages/shared`)**: PostgreSQL (via Neon serverless) with Drizzle ORM. Houses all table schemas, migrations, relations, and the shared database client.
- **Authentication & RBAC (`packages/shared`, `apps/web`)**: Better Auth with Drizzle adapter and the `organization` plugin for business entity and role management.
- **Tooling & Workspaces**: Turborepo, Bun workspaces, TypeScript, ESLint, Prettier.

---

## 3. Application Flow
1. **Landing & Onboarding**:
   - User lands on `/`.
   - User signs up or signs in via `/sign-in` or `/sign-up` (Better Auth email/password, username).
2. **Business Registration (Organization)**:
   - User registers a new business (created as an `organization` in Better Auth).
   - The creator receives the `owner` role. Multiple team members can be invited with specific roles (e.g., admin, manager, cashier).
3. **Distributor Management**:
   - Shop owners configure suppliers/distributors per business.
4. **Receipt Logging & Stock Ingestion**:
   - **Manual Mode**: User enters distributor, invoice number, items, quantities, costs, batch numbers, and expiry dates manually.
   - **Photo Extraction Mode**: User captures or uploads a photo of a physical receipt:
     1. Image is sent to the extraction endpoint (Hono).
     2. OCR / LLM extracts metadata (distributor, items, batch numbers, expiry dates, amounts).
     3. The extracted data pre-fills the manual receipt form for shop-owner review and validation.
     4. **Receipt image is immediately deleted** — no persistence on disk or cloud storage.
   - Upon form submission, inventory batches are recorded under the business.
5. **Inventory & Expiry Monitoring**:
   - Stock is tracked per product and per batch (`batchNumber`, `expiryDate`, `quantityRemaining`).
   - Automated checks trigger notifications when batch expiry dates are approaching (e.g., 30/60/90 days).

---

## 4. Repository Structure
```
medcredit/
├── apps/
│   ├── api/                   # Hono API service (receipt processing & extraction)
│   │   └── src/index.ts       # Hono application entry point
│   └── web/                   # Next.js web application
│       └── src/
│           ├── app/           # App router (landing, auth, dashboard, inventory)
│           │   ├── api/auth/  # Better Auth route handler [[...all]]
│           │   └── ...        # Page routes
│           ├── components/    # Web-specific components & providers
│           ├── hooks/         # Client hooks
│           └── proxy.ts       # Route protection & session validation
├── packages/
│   ├── shared/                # Core domain: DB schema, Drizzle client, Better Auth
│   │   ├── src/
│   │   │   ├── index.ts       # DB client export (@workspace/shared/db)
│   │   │   ├── schema.ts      # Drizzle schema definitions (@workspace/shared/schema)
│   │   │   ├── auth.ts        # Better Auth server instance (@workspace/shared/auth)
│   │   │   └── auth-client.ts # Better Auth client instance
│   │   └── package.json
│   ├── ui/                    # Shared UI component library (shadcn / Tailwind)
│   ├── eslint-config/         # Shared ESLint configuration
│   └── typescript-config/     # Shared TypeScript configurations
├── .agents/skills/            # Agent skills library
└── AGENTS.md                  # This file (Agent instructions & guidelines)
```

---

## 5. Database Schema & Architecture Guidelines
All database models reside in `packages/shared/src/schema.ts`:
- **Auth Tables (Better Auth)**:
  - `user`, `session`, `account`, `verification`
  - `organization`, `member`, `invitation` (Better Auth organization plugin)
- **Business Domain Tables**:
  - `distributor`: Suppliers tied to `organizationId`.
  - `product`: Items tied to `organizationId` (name, SKU, unit, category).
  - `batch`: Batch-specific stock tied to `productId` and `organizationId` (`batchNumber`, `expiryDate`, `quantityRemaining`, `purchasePrice`).
  - `receipt`: Ingestion records tied to `organizationId` and `distributorId` (`invoiceNumber`, `totalAmount`, `status`).
  - `receipt_item`: Items within a receipt linking `productId`, `batchId`, `quantity`, `unitCost`.
  - `notification`: Expiry and inventory alerts tied to `organizationId`.

**Rules**:
- Every domain table must include `organizationId` with an index and foreign key referencing `organization.id`.
- Always query data scoped to the active session's `organizationId` to ensure strict tenant boundaries.

---

## 6. AI Agent Role & Guardrails
- **Role**: Act as a senior full-stack engineer building production-grade, maintainable code for MedCredit.
- **Ephemeral Rule**: Under NO circumstances should receipt image files be permanently persisted to the filesystem, database, or external bucket (e.g. S3). Processing must be strictly ephemeral.
- **Tenant Security**: Never execute queries or mutations without verifying `organizationId` and user permissions.
- **Type Safety**: Use inferred types from Drizzle schema (`typeof table.$inferSelect`, `typeof table.$inferInsert`) and typed Better Auth client sessions.
- **Next.js Conventions**: App Router conventions only; consult `node_modules/next/dist/docs/` for breaking changes in modern Next.js.

---

## 7. Agent Skills & Precise Invocation Rules
Skills reside in `.agents/skills/`. To conserve context and maintain efficiency, **invoke ONLY the single skill required for the immediate task**. Do NOT trigger skills speculatively, pre-emptively, or redundantly.

### Skill Directory & Invocation Triggers

| Skill Name | Purpose | When to Invoke | When NOT to Invoke |
|---|---|---|---|
| `architect` | System & architecture planning | Planning new multi-package features or large architectural refactors before writing code. | Routine bug fixes, UI adjustments, or standard endpoint implementation. |
| `grill-me` | Design stress-testing | When explicitly requested by the user (`/grill-me`) to challenge a plan or design proposal. | Normal task implementation or bug fixing. |
| `drizzle` | Schema & database operations | Creating or modifying Drizzle schemas, migrations, relations, indexes, or complex SQL queries. | Pure frontend work, auth client setup, or non-database tasks. |
| `organization-best-practices` | Multi-tenant orgs & RBAC | Configuring Better Auth `organization` plugin, custom roles, permissions, member invitations, or tenant switching. | Single-user authentication or non-organizational features. |
| `better-auth-best-practices` | Better Auth server/client config | Configuring plugins, session management, client hooks, adapter setup, or auth environment variables. | Drizzle schema creation (use `drizzle`) or org-specific RBAC (use `organization-best-practices`). |
| `better-auth-security-best-practices` | Auth security hardening | Configuring rate limiting, CSRF protection, trusted origins, cookie security, or token encryption. | General app logic or basic styling. |
| `create-auth` | Auth scaffolding | Initial setup or scaffolding of auth handlers, OAuth providers, or sign-in/up routes from scratch. | When auth is already scaffolded and only needs minor adjustments. |
| `email-and-password-best-practices` | Email verification & password flows | Setting up password reset, email verification flows, or password security policies. | When working on organization roles, inventory, or UI layout. |
| `two-factor-authentication-best-practices` | 2FA / MFA setup | Implementing TOTP, SMS/email OTP, or backup codes via the `twoFactor` plugin. | Non-2FA authentication flows or normal business logic. |
| `review` | Post-implementation audit | Verifying a completed feature matches requirements, architecture standards, and code quality before finalization. | Mid-task coding, minor typo fixes, or early planning stages. |
| `recover` | Error diagnosis & recovery | Diagnosing broken builds, severe runtime failures, or deadlocked package dependencies. | Normal debugging of simple syntax errors or expected test failures. |
| `remember` | Session context persistence | Saving handoff notes at the end of a session or restoring context at the start of a session. | Standard single-session prompt responses. |

### Skill Invocation Guardrails
1. **Strictly One Skill at a Time**: Never invoke multiple overlapping skills in a single step.
2. **No Unnecessary Invocations**: If a task can be solved directly using standard knowledge (e.g., editing a React component, updating a simple CSS class, running a known Bun command), **do not invoke any skill**.
3. **Domain Separation**: Use `drizzle` for database schemas, `organization-best-practices` for business tenant management, and `better-auth-best-practices` for general auth configuration.

---

## 8. Communication Style & Reporting Rules
- **Concise & Direct**: Keep all responses brief, dense with information, and devoid of conversational filler, pleasantries, or preamble.
- **Structured Outputs**: Use bullet points, code diffs, and clickable file links (`[filename.ts](file:///path/to/filename.ts)`).
- **Action-Focused**: State what was implemented, the files modified, and verify the outcome. Avoid lengthy narrative explanations of standard programming concepts.
