# TradeConnect — Frontend API Wiring (100% complete)

The frontend is now fully wired to the Flask backend. No mock data
remains in any page.

## Run

```bash
# Backend (port 5001)
cd backend
pip install -r requirements.txt
python app.py

# Frontend (port 3000)
cd frontend
npm install --legacy-peer-deps
npm run dev
```

(`--legacy-peer-deps` works around a pre-existing peer-dep mismatch
between `eslint-config-next@^16` and `eslint@^8` in `package.json`.)

The database schema, triggers, and sample data in `database/` are
unchanged from the original drop.

## What changed

### Backend — 8 new route files + 1 helper module

| File | Endpoints | Purpose |
|---|---|---|
| `routes/_helpers.py` | (utility) | Shared `get_db()`, `login_required`, `role_required`, `get_tradesperson_id_for_user` |
| `routes/auth.py` | rewritten | Adds `GET /api/auth/me`, updates `last_login_at`, auto-creates `tradespeople` row on register so FKs work later |
| `routes/users.py` | new | `PUT /api/users/profile` — whitelist update of editable user fields |
| `routes/tradespeople.py` | new | search, get one, get me, upsert profile, request endorsement |
| `routes/services.py` | new | search, list per tradesperson, create |
| `routes/bookings.py` | new | enriched list (with joins for service name, other party, payment), get one, create, status transitions |
| `routes/payments.py` | new | get for booking, create (employer pays) |
| `routes/reviews.py` | rewritten | list per tradesperson, list pending requests, list submitted, submit |
| `routes/notifications.py` | rewritten | derived feed (no schema change), session-stored read-state |
| `routes/jobs.py` | new | available pending bookings, junior cap, accept |
| `app.py` | rewritten | registers all 9 blueprints, `/api/health` |

Total: 30+ live endpoints. See section "Route map" below.

### Frontend — every page wired

| Page | What was mock | What it uses now |
|---|---|---|
| `app/employer/browse/page.tsx` | hardcoded TP list, no booking | `tradespeopleApi.search` (debounced) + `BookingModal` calling `servicesApi.getForTradesperson` and `bookingsApi.create` |
| `app/employer/dashboard/page.tsx` | hardcoded stats and bookings | `bookingsApi.getAll` + `reviewsApi.getRequests` for stat counts; greets user by first name |
| `app/tradesperson/dashboard/page.tsx` | hardcoded rating, bookings | `tradespeopleApi.getMe` for `avg_rating`, `bookingsApi.getAll`, `reviewsApi.getForTradesperson` |
| `app/tradesperson/jobs/page.tsx` | hardcoded job list | `jobsApi.available` (debounced) + `jobsApi.apply` |
| `app/junior/dashboard/page.tsx` | always 0/4 hardcoded steps | derives 4 step states from `tradespeopleApi.getMe` (profile filled, endorse linked, verified) and `jobsApi.cap` (jobs taken) |
| `app/junior/jobs/page.tsx` | hardcoded jobs + JOB_CAP=5 | `jobsApi.available` + `jobsApi.cap`; cap refreshes after each accept |
| `app/junior/setup/page.tsx` | endorsement just sets local state | `tradespeopleApi.requestEndorsement` (links to supervisor's `tradesperson_id`) |
| `app/bookings/page.tsx` | mock + non-functional buttons | `bookingsApi.getAll`/`updateStatus`; role-aware action buttons (Accept / Start / Complete / Cancel / Pay / Leave review); `paymentsApi.create` for the Pay button |
| `app/notifications/page.tsx` | hardcoded array | `notificationsApi.getAll`/`markRead`/`markAllRead`, optimistic UI |
| `app/reviews/page.tsx` | mock requests, fake submit | `reviewsApi.getRequests`/`getSubmitted`/`submit`; refetches both tabs after submit |
| `app/profile/page.tsx` | save did nothing | `usersApi.updateProfile` for personal info; `tradespeopleApi.getMe`+`upsert` for the trade section; calls `AuthContext.refresh()` after save |

Plus:

- `lib/api.ts` — rewritten from a stub to a complete typed client covering every endpoint.
- `context/AuthContext.tsx` — now rehydrates from `GET /api/auth/me` (instead of relying solely on `localStorage`), with a `refresh()` method exposed.

### Type-checking

```
$ npx tsc --noEmit
(zero errors)

$ npx next build
✓ Compiled successfully — all 15 routes built
```

## Two design notes worth knowing

**Notifications** — the schema has no `notifications` table. Rather than
add one, the feed is *derived* from `bookings` (status changes), pending
`review_requests`, `payments`, and incoming `reviews`. Read state is stored
per-user in the Flask session as a set of namespaced keys
(`booking:42:accepted`, `review_req:7`, `payment:3`). If persistent
read-state across sessions is wanted later, add a tiny
`notification_reads(user_id, key)` table — the keys are already
namespaced for that.

**Available Jobs** — the schema doesn't have a separate "job posting"
table; an employer creates a `booking` with the tradesperson already
chosen (via the browse page). So a tradesperson's "Available Jobs" feed
is interpreted as **bookings assigned to them in `pending` status,
awaiting their acceptance**. The "Apply" button in the UI calls
`POST /api/jobs/<id>/apply`, which moves status from `pending` to
`accepted`. This stays consistent with how the database triggers
(junior-cannot-book-without-supervisor, auto-create-review-request,
recalc-avg-rating) already work.

**Junior document upload** — the schema has no `documents` table or file
storage column. The UI is preserved with a small note telling the user
that document storage is not yet enabled. Adding it is a schema change
and a separate feature.

## Route map

```
GET    /                                 home
GET    /api/health                       health check

POST   /api/auth/register                create user (+ auto tradespeople row)
POST   /api/auth/login                   set session cookie
POST   /api/auth/logout                  clear session
GET    /api/auth/me                      rehydrate user from session

PUT    /api/users/profile                update own user fields

GET    /api/tradespeople                 search ?trade_category & ?city
GET    /api/tradespeople/<id>            single tradesperson + services
GET    /api/tradespeople/me              current user's trade profile
POST   /api/tradespeople/profile         upsert trade profile
POST   /api/tradespeople/endorse         link junior to supervisor by email

GET    /api/services                     search ?trade_type & ?city
GET    /api/services/tradesperson/<id>   services for a TP
POST   /api/services                     create (TP only)

GET    /api/bookings                     list, role-scoped, ?status filter
GET    /api/bookings/<id>                single (with auth check)
POST   /api/bookings                     create (Employer only)
PATCH  /api/bookings/<id>/status         transition (role-aware)

GET    /api/payments/booking/<id>        get payment for booking
POST   /api/payments                     pay (Employer only)

GET    /api/reviews/tradesperson/<id>    public review history
GET    /api/reviews/requests             pending requests for current employer
GET    /api/reviews/submitted            current employer's submitted reviews
POST   /api/reviews                      submit (employer only, completed bookings)

GET    /api/notifications                derived feed
PATCH  /api/notifications/<id>/read?key= mark one read
PATCH  /api/notifications/read-all       mark all read

GET    /api/jobs/available               pending bookings assigned to current TP
GET    /api/jobs/cap                     job_limit / jobs_taken / remaining
POST   /api/jobs/<id>/apply              accept (pending → accepted)
```
