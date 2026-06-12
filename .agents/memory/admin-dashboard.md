---
name: Admin dashboard
description: How admin auth works and what the /admin page provides.
---

# Admin Dashboard

**Auth:** PIN stored in `ADMIN_PIN` env var (Render/Vercel). User enters PIN at `/admin` PIN gate → POST `/api/admin/verify` → stored in `sessionStorage` → sent as `X-Admin-Pin` header on every admin API call. Stateless (no JWT, no sessions).

**Why PIN not Neon Auth:** Neon Auth is DB-level RLS, not an application auth system. PIN in env var is zero-dependency and perfect for a single-admin personal tool.

**Routes:**
- `POST /api/admin/verify` — verifies PIN
- `GET/POST /api/admin/keys` — list / create ApiKey
- `PUT/DELETE /api/admin/keys/[id]` — update / delete ApiKey
- `GET /api/admin/dashboard` — returns stats + logs + keys

**ApiKey model fields:** id, service, label, key, enabled, priority, req_count, createdAt, updatedAt. Table created in Neon via `prisma db push`.
