# Cloudflare Pages Deployment Setup

## Changes Made

### 1. Updated `frontend/project-01/package.json`

The `build:cf` command has been updated to:
```json
"build:cf": "NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_URL> NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY> npx @opennextjs/cloudflare@1.16.5 build && mv .open-next/worker.js .open-next/_worker.js && if [ -d .open-next/assets ] && [ \"$(ls -A .open-next/assets 2>/dev/null)\" ]; then cp -r .open-next/assets/* .open-next/; else echo 'Warning: .open-next/assets is missing or empty; skipping asset copy.' >&2; fi && node -e 'require(\"fs\").writeFileSync(\".open-next/_routes.json\", JSON.stringify({version:1,include:[\"/*\"],exclude:[\"/_next/static/*\",\"/favicon.ico\",\"/robots.txt\",\"/sitemap.xml\",\"/404.html\",\"/BUILD_ID\"]},null,2))' && printf 'compatibility_date = \"2026-02-01\"\\ncompatibility_flags = [\"nodejs_compat\"]\\n' > .open-next/wrangler.toml"
```

> **Note:** Replace `<YOUR_SUPABASE_URL>` and `<YOUR_SUPABASE_ANON_KEY>` with your actual Supabase project values from your Supabase dashboard (e.g., `https://<your-project-ref>.supabase.co` and your public anon key). These are public values (indicated by `NEXT_PUBLIC_` prefix) that are safe for client-side use.

> **Note:** This is a long command that could be refactored into a separate script file for better maintainability. However, it's kept inline as requested to ensure compatibility with Cloudflare Pages direct GitHub deployment.

**What this does:**
- Uses `@opennextjs/cloudflare@1.16.5` (pinned version for reproducible builds)
- Includes Supabase environment variables inline (public anonymous keys safe for client-side use)
- **Post-processing steps:**
  1. Renames `worker.js` to `_worker.js` (required by Cloudflare Pages)
  2. Copies assets from `.open-next/assets/*` to `.open-next/` root with error checking
  3. Generates `_routes.json` with routing rules for static assets (excludes routes that should be served by Cloudflare Pages directly)
  4. Generates `wrangler.toml` in `.open-next/` with `nodejs_compat` flag to resolve Node.js module imports

### 2. Removed `wrangler.toml`

The root `wrangler.toml` file has been removed to prevent Cloudflare Pages from showing warnings about a Wrangler configuration file in a Pages-only project. If you see references to `wrangler.toml` in older documentation (such as `docs/deployment/CLOUDFLARE_PAGES_DEPLOYMENT.md`) or commits, those are now obsolete and no longer required for this setup.

**Note:** There is still a `frontend/project-01/wrangler.toml` file for local development with `wrangler pages dev`, but the root-level file that was causing warnings has been removed. The local `wrangler.toml` has been updated in this PR to match the production configuration (`pages_build_output_dir = ".open-next"` instead of `".open-next/assets"`) so that local testing behavior matches production deployment exactly.

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
   
   > **Important:** This repository uses a pnpm monorepo with workspace configuration. Always use the `--filter` command above when building for Cloudflare Pages. The `...` suffix includes the package and all its workspace dependencies. `cd`-based commands (for example, running `cd frontend/project-01 && pnpm run build:cf`) can cause pnpm to ignore the workspace root and break dependency resolution in this setup.

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

5. **Environment variables (optional - alternative approach):**
   The current `build:cf` command includes environment variables inline. 
   
   **Alternative:** For better security practices and environment separation, you can set these as Cloudflare Pages environment variables instead:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (from Supabase dashboard, format: `https://<your-project-ref>.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public/anon key (from Supabase dashboard under "Project Settings → API")
   
   If you choose this approach, update the `build:cf` command in `frontend/project-01/package.json` to remove the inline `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` assignments (they will be automatically available as environment variables during the build).
   
   **Note:** The Supabase keys are public anonymous keys (indicated by `NEXT_PUBLIC_` prefix) that are safe for client-side use, but using Cloudflare Pages environment variables provides better separation between environments (production, staging, preview).

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
