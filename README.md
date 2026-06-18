# Uno's First 🏎

Birthday + christening website for Juancho Jozel Santos "Uno" — September 6, 2026.

**Theme:** Blue Race Car / "Fast One" / "First Lap Around the Track"

---

## Stack

- **Nuxt 3** + Vue 3 + Tailwind CSS
- **Supabase** — RSVPs, fund contributions, time capsule, activity log
- **RustFS / S3-compatible storage** — disposable camera photo uploads
- Deployed on **Cloudflare** (Nitro `cloudflare-module` preset)

---

## Setup

### Requirements

- Node v20.19.5+ (v20.10.0 breaks nuxi — missing `styleText`)
- Supabase CLI (`npm i -g supabase`)

### Install

```bash
npm install
```

### Environment variables

Create a `.env` file at the project root:

```env
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Admin auth
ADMIN_PASSWORD=
ADMIN_JWT_SECRET=

# S3-compatible storage (RustFS / MinIO)
RUSTFS_ENDPOINT=
RUSTFS_BUCKET=
RUSTFS_ACCESS_KEY=
RUSTFS_SECRET_KEY=
RUSTFS_REGION=us-east-1
```

### Dev server

```bash
npm run dev
```

Runs on port 3000 (use 3002 if occupied).

---

## Database migrations

Migrations live in `supabase/migrations/`. To apply all pending migrations to the remote Supabase project:

```bash
npx supabase db push
```

To create a new migration:

```bash
npx supabase migration new <name>
```

Then edit the generated file in `supabase/migrations/` and run `db push`.

---

## Pages

| Route | Description |
|---|---|
| `/` | Main site — hero, event details, who's coming, RSVP, gifts |
| `/activities` | Disposable camera + time capsule |
| `/fund` | Uno's college fund |
| `/admin` | Admin dashboard (password protected) |
| `/admin/login` | Admin login |

## Admin sections

- **Overview** — RSVP counts, fund progress, recent activity feed
- **RSVPs** — manage, confirm, bulk actions, export
- **Photos** — bucket viewer (requires RustFS env vars)
- **Time Capsule** — approve/hide submissions
- **Fund** — track contributions, set goal
