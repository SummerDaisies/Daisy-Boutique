# ✦ Leo Boutique — Setup Guide
## Deploy to Vercel + Supabase (free, ~15 minutes)

---

## STEP 1 — Create your free Supabase database

1. Go to https://supabase.com and click **Start your project**
2. Sign up (free) and click **New project**
3. Name it `leo-boutique`, choose a region close to you, set a password
4. Wait ~2 minutes for it to set up
5. Go to **SQL Editor** (left sidebar) → **New Query**
6. Copy the contents of `supabase_schema.sql` and paste it in, then click **Run**
7. You should see "Success. No rows returned."

**Get your API keys:**
- Go to **Settings** (gear icon) → **API**
- Copy your **Project URL** (looks like `https://abcxyz.supabase.co`)
- Copy your **anon public** key (long string starting with `eyJ...`)

---

## STEP 2 — Connect your app to Supabase

1. In the `leo-boutique` folder, copy `.env.example` to a new file called `.env.local`
2. Open `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

---

## STEP 3 — Deploy to Vercel (free hosting)

1. Go to https://github.com and create a free account if you don't have one
2. Create a new repository called `leo-boutique`
3. Upload all the files in this folder to that repository
4. Go to https://vercel.com → **Sign up** (use your GitHub account)
5. Click **New Project** → Import your `leo-boutique` repo
6. Before clicking Deploy, click **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
7. Click **Deploy** — done!

Vercel will give you a URL like `leo-boutique.vercel.app` that works on
**any device, anywhere** — phone, tablet, computer.

---

## STEP 4 — (Optional) Custom domain

In Vercel → your project → **Settings → Domains**, you can add your own
domain like `orders.leoboutique.com` if you have one.

---

## Running locally (on your own computer)

If you want to run it on your own machine first:

```bash
# Install Node.js from https://nodejs.org if you haven't already
# Then in the leo-boutique folder:

npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## File Overview

```
leo-boutique/
├── index.html              ← App entry point
├── vite.config.js          ← Build config
├── package.json            ← Dependencies
├── .env.example            ← Copy to .env.local and fill in keys
├── supabase_schema.sql     ← Run this in Supabase SQL Editor
├── SETUP.md                ← This file
└── src/
    ├── main.jsx            ← React entry
    ├── App.jsx             ← Main app (all UI + logic)
    └── supabase.js         ← Database connection
```

---

## Need help?

If you get stuck on any step, screenshot the error and bring it back —
happy to help you troubleshoot!
