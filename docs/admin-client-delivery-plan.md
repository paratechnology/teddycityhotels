# Admin Client Delivery Plan (Planning Draft)

## 1) Objective and sequencing

This plan aligns with your requested execution order:

1. Identify all features intended for the **admin-client**.
2. Verify and enforce backend/frontend sync between **admin-client**, **website**, and **server API**.
3. Identify missing or inconsistent items.
4. Analyze the existing **client app** (legacy app) to mirror its architecture/style (including Ionic patterns) where useful.
5. Propose an implementation roadmap for approval before build work starts.

---

## 2) Current-state inventory (from repository)

### 2.1 Admin-client currently wired features

The admin-client routes/sidebar indicate these modules:

- Dashboard
- Bookings
- Rooms (list/add/edit)
- Snooker
- Financials

However, implementation maturity differs:

- **Dashboard**: static placeholder text.
- **Bookings**: table + cancel action in UI; assumes list/update APIs exist.
- **Rooms**: list/edit/delete/create UI flows; assumes full CRUD APIs exist.
- **Snooker**: list players only; no create/update/delete UI.
- **Financials**: placeholder text only.

### 2.2 Website-facing functional scope already active

Website routes/services indicate active public-facing domains:

- Public room listing and room details access.
- Booking creation and booking lookup by id.
- Payment verification flow.
- Snooker public page exists (service currently not implemented in one file).
- Swimming page exists.

### 2.3 Server API currently exposed

Server router registration includes:

- `/api/auth`, `/api/app`, `/api/rooms`, `/api/snooker`, `/api/users`, `/api/bookings`, `/api/payments`, `/api/notifications`, `/api/attachments`, `/api/tenants`.

But route-level depth is uneven for admin needs:

- **Rooms**: GET list, GET by id only.
- **Bookings**: POST create, GET by id only.
- **Snooker**: GET league, GET players, GET player by id, PUT player, GET matches, PUT match.
- **Attachments**: only upload-url generation endpoint under task-scoped path.

---

## 3) Sync and mismatch matrix (admin-client vs website/server)

## Legend
- ✅ aligned
- ⚠️ partially aligned
- ❌ missing/misaligned

### 3.1 Rooms

- Website uses `/api/rooms` GET + GET by id. ✅
- Server supports GET + GET by id. ✅
- Admin UI expects add/update/delete endpoints through service methods, but server has no POST/PUT/DELETE rooms routes. ❌

**Implication:** admin room management cannot function fully until server room mutation routes + authorization are implemented.

### 3.2 Bookings

- Website uses POST `/api/bookings` and GET `/api/bookings/:id`. ✅
- Server supports those same endpoints. ✅
- Admin UI expects GET all bookings and PUT update booking status/cancel. Server does not expose those routes. ❌

**Implication:** admin bookings page cannot load list or cancel using current backend contract.

### 3.3 Snooker

- Admin service expects players CRUD-ish endpoints including POST `/snooker/players` and DELETE `/snooker/players/:id`.
- Server currently exposes GET players/player, PUT player, but no POST player or DELETE player. ⚠️
- Admin UI only reads list currently, so present behavior is partially functional. ⚠️

### 3.4 Financials

- Admin has placeholder page only; no service integration.
- Shared interfaces already include invoice/transaction models, and legacy client has extensive financials pages.
- Server currently exposes payments endpoints but no clear hotel-admin financial reporting routes in current map.

Status: ❌ not yet designed for hotel admin context.

### 3.5 Attachments/media

- Admin has a generic upload service using `/api/attachments`.
- Server route is task-scoped upload-url generation route, not a direct `/attachments` upload endpoint.

Status: ❌ API contract mismatch.

### 3.6 Base URL / environment strategy

- Website predominantly uses relative `/api/...` for local/proxy compatibility.
- Admin uses shared `baseURL` constant that is currently hardcoded to production URL.

Status: ⚠️ risky divergence for environment parity and local development.

---

## 4) Missing capability list (prioritized)

## P0 (must-have before meaningful admin rollout)

1. **Admin auth + role guard policy**
   - Define admin roles/claims and route-level protection in admin-client + server middleware.
2. **Rooms admin CRUD backend**
   - POST/PUT/DELETE room endpoints + validation + audit metadata.
3. **Bookings admin list/update backend**
   - GET bookings (filter/pagination), PATCH/PUT booking status.
4. **Contract alignment pass**
   - Ensure admin services reflect actual server routes and DTOs.
5. **Environment config normalization**
   - Replace hardcoded production API usage with environment-based endpoints.

## P1 (high-value after core CRUD)

1. **Snooker admin completion**
   - Add player create/delete + match management views.
2. **Dashboard metrics**
   - Occupancy, active bookings, revenue summary, pending actions.
3. **Upload/media consistency**
   - Decide upload strategy (signed URL vs direct upload), unify endpoints.

## P2 (expansion)

1. Financial reporting workflows (hotel-specific).
2. Audit logs and activity feeds.
3. Export/reporting tools.

---

## 5) Legacy client app architecture patterns to mirror

The legacy `apps/client` already demonstrates a robust Ionic + Angular architecture we can borrow:

1. **Route segmentation**
   - Public vs authenticated route groups, guard layering, profile-complete flow gates.
2. **Core module pattern**
   - `core/services`, `core/guards`, `core/interceptors` separation.
3. **Standalone component + lazy loading**
   - Route-level `loadComponent` pattern and focused page modules.
4. **Ionic shell**
   - Consistent app shell with Ion components and platform-aware UX behaviors.
5. **State/auth orchestration**
   - App bootstrap logic that coordinates auth lifecycle and downstream services.

### Recommended adaptation for admin-client

- Keep standalone component strategy, but migrate admin shell to **Ionic-compatible layout** (header/menu/content).
- Introduce `core/` in admin-client mirroring legacy structure:
  - `core/auth`, `core/guards`, `core/interceptors`, `core/services`.
- Introduce explicit **feature folders**:
  - `features/dashboard`, `features/bookings`, `features/rooms`, `features/snooker`, `features/financials`.
- Add shared UI primitives (cards/tables/forms) in `shared/ui` to avoid inconsistent styling.

---

## 6) Proposed implementation roadmap (approval gate before coding)

## Phase 0 — Contract discovery + freeze (1-2 days)

- Produce endpoint contract document per domain (rooms/bookings/snooker/financials/uploads).
- Mark source of truth (server first), then align website/admin expectations.
- Define admin role model and auth flow expectations.

**Deliverable:** approved API + DTO contract matrix.

## Phase 1 — Foundation refactor in admin-client (2-4 days)

- Introduce Ionic shell + route structure inspired by legacy client.
- Create `core` + `features` folder architecture.
- Add central HTTP API service/config with environment-aware base URL.
- Add error handling and loading state conventions.

**Deliverable:** stable skeleton ready for feature work.

## Phase 2 — P0 feature completion (4-8 days)

- Implement rooms CRUD end-to-end (server + admin).
- Implement bookings list/filter/status updates end-to-end.
- Wire dashboard to real metrics endpoints.
- Add auth guard enforcement for admin pages.

**Deliverable:** minimum viable admin panel supporting live hotel operations.

## Phase 3 — P1 modules (3-6 days)

- Complete snooker management.
- Complete attachment/media flow with final API contract.
- Improve UX consistency and reusable components.

## Phase 4 — Financial module design + build (time-box separately)

- Clarify hotel-specific financial requirements before coding.
- Build only after domain model sign-off.

---

## 7) Definition of done (for admin-client v1)

- All admin navigation pages are functional (no placeholders).
- Every admin action maps to an existing, tested backend route.
- API contract docs and request/response typing are in sync across apps.
- Auth/authorization prevents unauthorized access to admin routes/actions.
- Build/lint pass for admin-client and server; critical user journeys manually verified.

---


## 8) Resolved directives from stakeholder feedback

The following are now treated as confirmed launch requirements:

1. **Multi-admin model is required.**
   - One super admin can create/manage other admin users and assign controlled module access.
2. **Financial module is in launch scope.**
   - Include daily revenue, reconciliation, expense logging, invoices, payroll oversight, and monthly exports.
3. **Snooker is core for launch.**
   - Implement full operational flows, not placeholder/status-only views.
4. **Rooms require full edit capability.**
   - Admin can update complete room data model, not a subset.
5. **Manual booking creation is required.**
   - Admin-created bookings must make room inventory unavailable on website in real time.
6. **Parallel delivery + premium responsive UX is required.**
   - Feature work and UX refinement proceed together; mobile + web parity is mandatory.
7. **Push notifications are required for admin booking awareness.**
   - Admin devices must receive booking-triggered notifications.
8. **UI stack direction:**
   - Prioritize Ionic-first implementation for cross-platform consistency unless a specific gap justifies non-Ionic use.

---

## 9) Updated implementation steps (execution order)

1. **Access control foundation (super admin + delegated module access)**
   - Finalize role matrix and implement user-access management endpoints + admin UI.
2. **Rooms full CRUD + website availability sync**
   - Ensure all room updates reflect instantly for website room browsing/booking eligibility.
3. **Manual/admin booking + booking lifecycle controls**
   - Support admin-created bookings, status updates, and website inventory lock.
4. **Snooker full launch implementation**
   - Complete player/match management and operational controls for launch readiness.
5. **Financials full launch implementation**
   - Build dashboards, logging workflows, and export/reporting tooling.
6. **Push notification integration**
   - Register admin device tokens and deliver booking notifications end-to-end.
7. **Responsive premium UX pass (parallel stream, with hard gate before release)**
   - Apply Ionic design system consistently and validate mobile/web experiences.
8. **Hardening + sync verification**
   - API contract checks across admin-client, website, and server; regression checks for booking/room sync.

---

## 10) Clarifications (remaining)

Most original clarification items are now resolved. Remaining implementation-level choices are:

1. Preferred invitation flow for creating new admin users (email invite only vs direct create + temporary password).
2. Notification channels at launch (push only vs push + email/SMS fallback).
3. Financial export formats required beyond CSV (e.g., PDF summary).

---

## 11) Suggested immediate next step after approval

- Convert the confirmed scope into an execution backlog with ticket-level API + UI tasks and begin implementation starting with access control, then rooms/bookings sync-critical flows.
