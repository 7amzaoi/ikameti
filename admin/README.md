# IKAMETI Admin Dashboard

A self-contained admin panel (plain HTML/CSS/JS, no build step) backed by
**Supabase**. It lets you manage the blog and read every form submission from
the website.

## What it does

| Page | What you can do |
|------|-----------------|
| **Blogs** | Add / edit / delete blog articles and categories. Articles you publish here appear instantly on `/blog/` and on each article page. Drafts stay hidden from the public. |
| **Residency Form** | View every submission of the homepage *“Get Your Residency in Turkey in Minutes”* wizard. Search, mark status (New → Contacted → In progress → Closed), add internal notes, WhatsApp/call the lead, or delete. |
| **Remind Me** | View every *“Remind Me”* request. Each card shows the student's details and a **colour-coded countdown** to their permit expiry: 🔴 red `< 7 days` / expired, 🟠 orange `< 30 days`, 🟡 yellow `< 60 days`, 🟢 green otherwise. Filter by urgency, sort, set status, add notes, contact, delete. |

Everything reads from and writes to the Supabase database, so the website and
the dashboard always stay in sync.

---

## One-time setup (≈ 3 minutes)

### 1. Create the database tables
1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the **entire** contents of [`../supabase/schema.sql`](../supabase/schema.sql).
3. Click **Run**. This creates all tables, security rules, and seeds the blog
   with the 7 existing articles + categories. (It's safe to run more than once.)

### 2. Create your admin login
1. Supabase project → **Authentication** → **Users** → **Add user**.
2. Enter the email + password you want to log in with (e.g. `info@ikameti.com`).
   > Tick **“Auto Confirm User”** so you can log in immediately.
3. That's it — any user you create here can sign in to the dashboard.

### 3. Lock the dashboard to one admin email
Run [`../supabase/restrict-admin.sql`](../supabase/restrict-admin.sql) in the SQL
Editor. This ties all admin access to **`hmzaaslan77@gmail.com`** at the
database level — no other Supabase user can read submissions or edit blogs, even
if one is created later. To hand access to a different email, change it inside
`is_admin()` in that file (and in `admin/js/config.js → ADMIN_EMAIL`) and re-run.

### 4. Log in
Open **`/admin/login.html`** in the browser and sign in with
`hmzaaslan77@gmail.com`. You'll land on the dashboard. Your session is
remembered until you click **Sign out**. Any other account is rejected.

---

## How the website is connected

- **Blog** — `/blog/` and the article pages load published articles from
  Supabase first, and automatically fall back to the bundled
  `blog/data/articles.json` if the database is ever unreachable.
- **Forms** — `js/supabase-public.js` is included on every homepage and quietly
  saves each submission of the residency wizard and the *Remind Me* modal into
  the database (in addition to whatever else they already did).

The credentials live in:
- `admin/js/config.js` — for the dashboard
- `js/supabase-public.js` — for the public website

Both use the **publishable / anon key**, which is safe to expose in the browser.
Row Level Security (configured by `schema.sql`) is what actually protects your
data: anonymous visitors can only read published blogs and *submit* forms — they
can never read other people's submissions or edit blogs. Only a logged-in admin
can do that.

---

## Notes & tips

- **Article content** is written as HTML in the editor (`<h2>`, `<p>`,
  `<ul><li>`, `<strong>`, `<a href>` …) — the same format the blog already used.
- **Slugs** auto-generate from the title; edit them if you like. They must be
  unique (they form the article URL: `/blog/article.html?slug=...`).
- Deleting a **category** doesn't delete its articles — they just become
  uncategorised.
- To rotate keys later, update the two files listed above.
