# Prosumate — Multi-Tenant Sales & Marketing SaaS Platform

Prosumate is an enterprise-grade multi-tenant SaaS platform engineered for marketing agencies, client locations, and growing businesses.

---

## 1. Multi-Tenant Architecture

Prosumate implements a strict 4-tier hierarchical tenancy model:

```
PLATFORM (System Superadmins)
  └── AGENCY (Agencies, White-label roots)
        └── LOCATION (Client sub-accounts / Locations)
              └── USERS (Assigned to Agency and/or specific Locations)
```

### Security & Isolation Guarantees:
- **Backend-Enforced**: Every API endpoint verifying location or agency context passes through `TenantGuard`. Manipulated IDs trigger immediate `403 Forbidden` errors.
- **Cross-Tenant Violation Logging**: All unauthorized attempts across tenant boundaries produce immutable audit records (`CROSS_TENANT_ACCESS_DENIED`) for forensics.
- **Granular RBAC**: Role permissions (`AGENCY_OWNER`, `LOCATION_ADMIN`, `LOCATION_USER`, `LOCATION_READONLY`) control endpoint access using explicit permission tokens.

---

## 2. Monorepo Structure

```
Prosumate/
├── apps/
│   ├── api/                     # Fastify + TypeScript backend REST API
│   └── web/                     # Next.js 14 App Router dashboard & onboarding
├── packages/
│   ├── types/                   # Shared TypeScript models, enums, & API contracts
│   ├── validation/              # Zod validation schemas for forms & request payloads
│   ├── database/                # Drizzle ORM schemas, repository, & seeders
│   └── logger/                  # Structured JSON logger with request context
├── docker-compose.yml           # Local PostgreSQL 16 & Redis 7 services
└── README.md
```

---

## 3. Quick Start & Setup

### Prerequisites
- Node.js >= 20
- npm >= 10

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd Prosumate

# Install all workspace dependencies
npm install
```

### Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

Keep `.env` private. The example credentials are for local development only; replace `JWT_SECRET` before deploying. Run the commands below from the repository root so the API loads the root `.env` file.

### Optional Local Database Services & Free Cloud Architecture

Prosumate supports **two 100% free deployment modes** for local development and internal beta testing:

1. **Free Cloud Tier ($0 / month)**:
   - **Database**: Free Supabase PostgreSQL instance (`DATABASE_URL` with transaction pooling).
   - **Cache / Ephemeral**: Upstash Redis free tier or built-in in-memory fallback.
   - **Automation**: Self-hosted n8n Community Edition or internal webhook dispatcher.
   - **Providers**: Mock Email / Resend Free, Mock SMS (`[SIMULATED]`), Mock Payments ($0 charged), Mock AI (deterministic scoring and copy).

2. **Local Docker Services ($0 / month)**:
   ```bash
   docker compose up -d
   ```
   Starts local PostgreSQL 16, Redis 7, and self-hosted n8n without any external cloud dependencies.

### Database Migrations & Drizzle ORM

Run Drizzle schema migrations to initialize or update the 38 multi-tenant database tables:
```bash
npm run db:generate   # Generates SQL migration scripts in packages/database/drizzle
npm run db:push       # Pushes schema directly to Supabase or local PostgreSQL
```

For complete setup guides and environment documentation, consult:
- [TEST_ENVIRONMENT.md](file:///c:/Users/HP/Documents/codes/Prosumate/TEST_ENVIRONMENT.md) — Comprehensive operational & test guide for the 2 internal testers.
- [ENVIRONMENT_VARIABLES.md](file:///c:/Users/HP/Documents/codes/Prosumate/ENVIRONMENT_VARIABLES.md) — Complete environment variable reference with free-tier values.
- [PROSUMATE_FREE_TEST_PHASE_AUDIT.md](file:///c:/Users/HP/Documents/codes/Prosumate/PROSUMATE_FREE_TEST_PHASE_AUDIT.md) — 15-section technical audit and provider abstraction design.

### Starting the Applications

Start both applications:
```bash
npm run dev
```
The development commands build shared packages first. API source changes are compiled automatically and restart the API; changes to shared packages require rebuilding them.

**Run Backend API**:
```bash
npm run dev:api
# API server running on http://localhost:4000
```

**Run Frontend Dashboard**:
```bash
npm run dev:web
# Web application accessible on http://localhost:3000
```

---

## 4. Pre-configured Demo Accounts

The API seeds the following in-memory/database demo accounts at startup:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Platform Superadmin** | `admin@prosumate.local` | `SuperAdmin2026!` | Global / All Agencies |
| **Agency Owner** | `sarah.owner@apex.agency` | `AgencyOwner2026!` | Apex Growth Agency + All Locations |
| **Location Admin** | `marcus.admin@apex.agency` | `LocationAdmin2026!` | Austin HQ Location Sub-account |
| **Sales Representative** | `chloe.sales@apex.agency` | `SalesUser2026!` | Austin HQ Limited User |

---

## 5. Automated Testing & Verification

Build the API and shared packages, then run the test suite covering authentication, RBAC, cross-tenant security, and test providers:

```bash
npm run test
```

### Critical Test Suites:
- `apps/api/test/cross-tenant-isolation.spec.ts`: Asserts that Agency B credentials cannot read, update, or provision records under Agency A.
- `apps/api/test/rbac-permissions.spec.ts`: Asserts that users with restricted roles (e.g. read-only) are blocked from mutating location data.
- `apps/api/test/providers-and-integrations.spec.ts`: Asserts Mock Email, Mock SMS, Mock Payments, Mock AI, Upstash/Memory Redis, and HMAC-SHA256 Webhooks.
- `apps/api/test/auth.spec.ts`: Asserts registration, password hashing, token validation, and session management.

---

## 6. Build Sequence & Phase Roadmap

- [x] **Phase 1**: Foundation, Multi-Tenancy, Authentication, RBAC & Audit Logging
- [x] **Free Test Phase Adaptation**: 38 Drizzle tables, Supabase compatibility, Mock/Real Provider Abstraction, Upstash/Memory Cache, n8n webhook integration, Test Mode UI banner.
- [x] **Phase 2**: CRM, Contacts, Companies, Tags, Pipelines & Opportunities
- [x] **Phase 3**: Calendars, Appointments, Booking Pages & Forms
- [x] **Phase 4**: Unified Inbox (Email, SMS) & Provider Webhooks
- [x] **Phase 5**: Durable Workflow Engine & Automation Builder
- [x] **Phase 6**: Stripe Billing, Invoicing & Usage Subscriptions (with Mock Provider for $0 testing)
- [x] **Phase 7**: Landing Pages & Site Builder
- [x] **Phase 8**: Analytics, Attribution & Reputation Management
- [x] **Phase 9**: AI Assistant & Conversation Intelligence (with Mock Provider for $0 testing)
- [x] **Phase 10**: Marketplace & Enterprise Controls

