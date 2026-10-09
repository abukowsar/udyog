# উদ্যোগ (UDYOG) — Web Application

Next.js 16 (App Router, TypeScript) + MongoDB app for Bangladesh Bank's *Upazila-Driven Youth Opportunity for Growth* programme.

## Setup

```bash
npm install
# .env.local (git-ignored) — see .env.example
#   MONGODB_URI=...        required
#   MONGODB_DB=udyog       optional (default "udyog")
#   ADMIN_KEY=...          required for the /admin dashboard
npm run dev        # http://localhost:3000
npm run build && npm start
```

Check the database connection: `GET /api/health`.

## Pages

| Route    | Purpose |
|----------|---------|
| `/`      | Programme landing page (leaflet + circular content), financing calculator, eligibility quiz, district/upazila explorer, application tracking |
| `/apply` | 8-step online application mirroring the official paper form (Parts 1–5); draft autosaves in the browser, submission goes to MongoDB; prints in the official form layout |
| `/admin` | Bank-branch dashboard (login with `ADMIN_KEY`): filter/search applications, view full record, update status, print |

## API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST   | `/api/applications` | – | Submit; validated server-side with the same schema as the form; one application per NID |
| GET    | `/api/applications` | `x-admin-key` | List with `district`, `upazila`, `status`, `q`, `page` |
| GET    | `/api/applications/:trackingId` | – / `x-admin-key` | Public status (area + timeline only) or full record for admins |
| PATCH  | `/api/applications/:trackingId` | `x-admin-key` | `{ status, note }` — status note is shown to the applicant |
| GET    | `/api/health` | – | MongoDB ping |

## Structure

- `lib/schema.ts` — form definition + validators, shared by client and server
- `lib/constants.ts` — programme rules, districts/upazilas, status workflow
- `lib/mongodb.ts`, `lib/applications.ts` — server-only DB access (collection `applications`, indexes created automatically)
- `components/` — landing, form, print and admin UI
- `public/docs/` — original leaflet, circular and paper form PDFs
- `legacy-static/` — the earlier plain-HTML prototype (not used by the app)

## Notes

- Uploaded documents other than the photo are recorded by file name only; originals are submitted at the branch.
- Before going live, add rate limiting on `POST /api/applications` and verify the upazila lists in `lib/constants.ts` against the official list.
