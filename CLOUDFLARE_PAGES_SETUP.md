# Cloudflare Pages Deployment Setup

## Changes Made

### 1. Updated `frontend/project-01/package.json`

The `build:cf` command has been updated to:
```json
"build:cf": "NEXT_PUBLIC_SUPABASE_URL=https://yrfxijooswpvdpdseswy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_rhTyBa4IqqV14nV_B87S7g_zKzDSYTd npx @opennextjs/cloudflare@latest build && mv .open-next/worker.js .open-next/_worker.js && cp -r .open-next/assets/* .open-next/ 2>/dev/null || true && node -e 'require(\"fs\").writeFileSync(\".open-next/_routes.json\", JSON.stringify({version:1,include:[\"/*\"],exclude:[\"/_next/static/*\",\"/favicon.ico\",\"/robots.txt\",\"/sitemap.xml\",\"/feed.xml\",\"/404.html\",\"/BUILD_ID\",\"/search.json\",\"/tags/*\"]},null,2))'"
```

**What this does:**
- Uses `@opennextjs/cloudflare@latest` for the most up-to-date adapter
- Keeps Supabase environment variables
- **Post-processing steps:**
  1. Renames `worker.js` to `_worker.js` (required by Cloudflare Pages)
  2. Copies assets from `.open-next/assets/*` to `.open-next/` root
  3. Generates `_routes.json` with proper routing rules to avoid 404s

### 2. Renamed `wrangler.toml` to `wrangler.toml.bak`

This prevents Cloudflare Pages from showing warnings about the wrangler.toml file. The file is now renamed but kept for reference if needed.

---

## Required Cloudflare Pages Settings

Go to your Cloudflare Pages project:
**Pages → [Your Project] → Settings → Build & deployments → Build configuration**

### Settings to Update:

1. **Framework preset:**
   - Select: `Next.js (Static HTML Export)` or `None`

2. **Build command:**
   ```bash
   pnpm run build:cf --filter=./frontend/project-01...
   ```
   
   Alternative if above doesn't work:
   ```bash
   cd frontend/project-01 && pnpm run build:cf
   ```

3. **Build output directory:**
   ```
   frontend/project-01/.open-next
   ```

4. **Root directory (Project root path):**
   ```
   /
   ```
   Keep this as root, not `frontend/project-01`

5. **Environment variables (if not already set):**
   These are already in the build command, but you can also set them in Cloudflare Pages:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://yrfxijooswpvdpdseswy.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_rhTyBa4IqqV14nV_B87S7g_zKzDSYTd`

---

## Next Steps

1. ✅ Merge this PR to your main branch
2. Go to Cloudflare Pages → Settings → Build & deployments
3. Update the settings as shown above
4. Click **Save** on the settings page
5. Go to **Deployments** tab
6. Click **Retry deployment** on the latest deployment
7. Wait for the build to complete
8. Your site should now deploy successfully with all files!

---

## Troubleshooting

### If deployment still fails:

1. **Check build logs** in Cloudflare Pages to see if the build:cf command runs successfully
2. **Verify pnpm is available** - Cloudflare Pages should auto-detect it from `pnpm-lock.yaml`
3. **Check output directory** - After build, the `.open-next` folder should contain:
   - `_worker.js` (not `worker.js`)
   - `_routes.json`
   - All static assets
   - Other Next.js build files

### Expected file structure after build:

```
frontend/project-01/.open-next/
├── _worker.js          (Cloudflare Worker entry point)
├── _routes.json        (Routing configuration)
├── _next/              (Next.js static files)
├── cache/
└── [other build files]
```

The previous issue (only 52 files uploaded) was likely because:
- `worker.js` wasn't renamed to `_worker.js` (Cloudflare Pages requirement)
- Assets weren't copied to the correct location
- `_routes.json` was missing, causing routing issues
