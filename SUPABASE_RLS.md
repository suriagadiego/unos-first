# Supabase Row Level Security (RLS)

## Overview

All server routes use `SUPABASE_SERVICE_ROLE_KEY` via `server/utils/supabase.ts`, which bypasses RLS entirely.
The policies below protect the **anon** role from direct PostgREST/client access if the anon key were ever exposed.
The `authenticated` role is unused — this project has no Supabase Auth users.

## ⚠️ Deny-by-Default

When RLS is ENABLED on a table, **all access is denied by default** unless a policy explicitly permits it.
`service_role` is permanently exempt from RLS regardless of policies.

---

## Step 1 — Enable RLS on all tables

Run these in the Supabase SQL editor:

```sql
ALTER TABLE rsvps                ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log         ENABLE ROW LEVEL SECURITY;
```

---

## Step 2 — Create anon policies

### rsvps

```sql
-- Public guest list: only confirmed + visible rows
CREATE POLICY "anon select rsvps"
  ON rsvps FOR SELECT TO anon
  USING (show_on_public = true AND status = 'confirmed');

-- Public RSVP form submissions
CREATE POLICY "anon insert rsvps"
  ON rsvps FOR INSERT TO anon
  WITH CHECK (true);
```

### activities

```sql
-- Schedule page: visible activities only
CREATE POLICY "anon select activities"
  ON activities FOR SELECT TO anon
  USING (is_visible = true);
```

### photos

No anon access — deny-by-default applies, no policy needed.

### time_capsule_entries

```sql
-- Time capsule submission form
CREATE POLICY "anon insert capsule"
  ON time_capsule_entries FOR INSERT TO anon
  WITH CHECK (true);
```

### contributions

```sql
-- Fund page: show only public contributions
CREATE POLICY "anon select contributions"
  ON contributions FOR SELECT TO anon
  USING (show_on_public = true);
```

### fund_settings

```sql
-- Fund page needs the goal amount
CREATE POLICY "anon select fund_settings"
  ON fund_settings FOR SELECT TO anon
  USING (true);
```

### activity_log

No anon access — deny-by-default applies, no policy needed.

---

## Checklist

| Table                  | RLS Enabled | anon SELECT            | anon INSERT          | anon UPDATE | anon DELETE |
|------------------------|:-----------:|------------------------|----------------------|:-----------:|:-----------:|
| rsvps                  | ✅          | confirmed+public only  | ✅ (form submission) | ❌          | ❌          |
| activities             | ✅          | is_visible=true only   | ❌                   | ❌          | ❌          |
| photos                 | ✅          | ❌ (deny-by-default)   | ❌                   | ❌          | ❌          |
| time_capsule_entries   | ✅          | ❌ (deny-by-default)   | ✅ (form submission) | ❌          | ❌          |
| contributions          | ✅          | show_on_public=true    | ❌                   | ❌          | ❌          |
| fund_settings          | ✅          | ✅ (all rows)          | ❌                   | ❌          | ❌          |
| activity_log           | ✅          | ❌ (deny-by-default)   | ❌                   | ❌          | ❌          |

---

## Notes

- `service_role` key lives **only** in `server/utils/supabase.ts` and is never exposed to the client.
- `anon` key is not used anywhere in this project — these policies are defense-in-depth.
- `authenticated` role (Supabase Auth) is not used in this project.
- To check which policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
