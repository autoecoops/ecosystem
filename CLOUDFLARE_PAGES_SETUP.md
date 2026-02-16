# Cloudflare Pages Deployment Setup

## Changes Made

### 1. Updated `frontend/project-01/package.json`

The `build:cf` command has been updated to:
```json
"build:cf": "NEXT_PUBLIC_SUPABASE_URL=https://yrfxijooswpvdpdseswy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_rhTyBa4IqqV14nV_B87S7g_zKzDSYTd npx @opennextjs/cloudflare@1.16.5 build && mv .open-next/worker.js .open-next/_worker.js && if [ -d .open-next/assets ] && [ \"$(ls -A .open-next/assets 2>/dev/null)\" ]; then cp -r .open-next/assets/* .open-next/; else echo 'Warning: .open-next/assets is missing or empty; skipping asset copy.' >&2; fi && node -e 'require(\"fs\").writeFileSync(\".open-next/_routes.json\", JSON.stringify({version:1,include:[\"/*\"],exclude:[\"/_next/static/*\",\"/favicon.ico\",\"/robots.txt\",\"/sitemap.xml\",\"/404.html\",\"/BUILD_ID\"]},null,2))'"
```

> **Note:** This is a long command that could be refactored into a separate script file for better maintainability. However, it's kept inline as requested to ensure compatibility with Cloudflare Pages direct GitHub deployment.

**What this does:**
- Uses `@opennextjs/cloudflare@1.16.5` (pinned version for reproducible builds)
- Keeps Supabase environment variables (public anonymous keys safe for client-side use)
- **Post-processing steps:**
  1. Renames `worker.js` to `_worker.js` (required by Cloudflare Pages)
  2. Copies assets from `.open-next/assets/*` to `.open-next/` root with error checking
  3. Generates `_routes.json` with routing rules for static assets (excludes routes that should be served by Cloudflare Pages directly)

### 2. Removed `wrangler.toml`

The root `wrangler.toml` file has been removed to prevent Cloudflare Pages from showing warnings about a Wrangler configuration file in a Pages-only project. If you see references to `wrangler.toml` in older documentation (such as `docs/deployment/CLOUDFLARE_PAGES_DEPLOYMENT.md`) or commits, those are now obsolete and no longer required for this setup.

**Note:** There is still a `frontend/project-01/wrangler.toml` file for local development with `wrangler pages dev`, but the root-level file that was causing warnings has been removed. The local `wrangler.toml` will be updated to match the production configuration (`pages_build_output_dir = ".open-next"` instead of `".open-next/assets"`) so that local testing behavior matches production deployment exactly.

---

## Required Cloudflare Pages Settings

Go to your Cloudflare Pages project:
**Pages → [Your Project] → Settings → Build & deployments → Build configuration**

### Settings to Update:

1. **Framework preset:**
   - Select: `Next.js (Static HTML Export)` or `None`

2. **Build command:**
   ```bash
   pnpm --filter="./frontend/project-01..." run build:cf
   ```
   
   > **Important:** This repository uses a pnpm monorepo with workspace configuration. Always use the `--filter` command above when building for Cloudflare Pages. `cd`-based commands (for example, running `cd frontend/project-01 && pnpm run build:cf`) can cause pnpm to ignore the workspace root and break dependency resolution in this setup.

3. **Build output directory:**
   ```
   frontend/project-01/.open-next
   ```
   
   > **Note:** The output directory is `.open-next` (not `.open-next/assets`). The build:cf command copies assets from `.open-next/assets/*` to the `.open-next/` root as part of post-processing. This change ensures all required files (worker, routes config, and assets) are at the correct locations for Cloudflare Pages.

4. **Root directory (Project root path):**
   ```
   /
   ```
   Keep this as root, not `frontend/project-01`

5. **Environment variables (if not already set):**
   These are already in the build command as inline environment variables.
   
   **Note:** The Supabase keys shown are public anonymous keys (indicated by `NEXT_PUBLIC_` and `sb_publishable_` prefixes) that are meant to be exposed in client-side code. For better security practices in production, consider setting these as Cloudflare Pages environment variables instead of inline in the build command.
   
   If you want to move them to Cloudflare Pages environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://yrfxijooswpvdpdseswy.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_rhTyBa4IqqV14nV_B87S7g_zKzDSYTd`
   
   Then update the build:cf command to remove the inline variables.

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

**Changes made to fix this:**
- ✅ Pinned `@opennextjs/cloudflare@1.16.5` for reproducible builds
- ✅ Added proper error handling for asset copying
- ✅ Cleaned up `_routes.json` to exclude only relevant static assets
- ✅ Output directory changed from `.open-next/assets` to `.open-next` root
