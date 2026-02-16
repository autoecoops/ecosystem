# Cloudflare Pages Deployment Guide

> **⚠️ DEPRECATED:** This documentation is outdated and kept for historical reference only.
> 
> **The root `wrangler.toml` file has been removed** and is no longer used for Cloudflare Pages deployment.
> 
> **Please refer to:** [`CLOUDFLARE_PAGES_SETUP.md`](../../CLOUDFLARE_PAGES_SETUP.md) in the repository root for current deployment instructions.

---

## Historical Information (Obsolete)

The information below describes the old configuration approach and is **no longer applicable**. It is kept only for historical reference.

### Previous Repository Configuration (No Longer Used)

Previously, a root `wrangler.toml` file was used at the repository root with build settings for Cloudflare Pages:

```toml
# Cloudflare Pages build configuration (OBSOLETE - NO LONGER USED)
[build]
pages_build_output_dir = "frontend/project-01/.open-next/assets"
command = "pnpm install --no-frozen-lockfile && pnpm --filter \"./frontend/project-01...\" run build:cf"
cwd = "."
watch_paths = ["frontend/project-01/**/*.{ts,tsx,js,jsx,json,css}"]
```

This file has been removed. The current deployment configuration is managed through:
1. The `build:cf` script in `frontend/project-01/package.json`
2. Cloudflare Pages dashboard settings

### Current Approach

See [`CLOUDFLARE_PAGES_SETUP.md`](../../CLOUDFLARE_PAGES_SETUP.md) for:

| Setting | Value | Notes |
|---------|-------|-------|
| **Root directory** | Leave empty | Uses the entire repository root |
| **Build command** | `pnpm install --no-frozen-lockfile && pnpm --filter "./frontend/project-01..." run build:cf` | Same as wrangler.toml |
| **Build output directory** | `frontend/project-01/.open-next/assets` | Matches wrangler.toml |

## Workspace Configuration

The `frontend/project-01` package is included in the pnpm workspace via `pnpm-workspace.yaml`:

```yaml
packages:
  - 'frontend/*'
  # ... other packages
```

This enables pnpm to use path-based filtering to locate and build the frontend project.

## Why Path-Based Filtering?

Previously, the build command used `cd frontend/project-01 && pnpm build:cf`. While this works, the new approach using pnpm filters has several advantages:

1. **Name-independent**: Won't break if the package name changes (e.g., during rebranding from `autoecoops` to `machops`)
2. **Monorepo-aware**: pnpm can properly resolve workspace dependencies
3. **Consistent**: Same filter syntax works across different pnpm commands
4. **Explicit**: The `...` suffix makes it clear we want the package and its dependencies

## Build Process

When Cloudflare Pages triggers a build:

1. `pnpm install --no-frozen-lockfile` installs all dependencies
2. `pnpm --filter "./frontend/project-01..."` selects the frontend package by path
3. `run build:cf` executes the `build:cf` script from `frontend/project-01/package.json`
4. The `build:cf` script runs: `npx @opennextjs/cloudflare@latest build`
5. OpenNext generates the Cloudflare-compatible output in `frontend/project-01/.open-next/assets`
6. Cloudflare Pages deploys the contents of this directory

## Troubleshooting

### "No projects matched the filters"

This error occurs when:
- The package is not in the pnpm workspace (`pnpm-workspace.yaml`)
- The filter path is incorrect
- Dependencies haven't been installed yet

**Solution**: Ensure `frontend/*` is listed in `pnpm-workspace.yaml` and the filter path matches the actual directory structure.

### "Output directory not found"

This error occurs when:
- `pages_build_output_dir` doesn't match the actual OpenNext output location
- The build command failed before generating output
- The path is relative instead of from the repository root

**Solution**: Both `wrangler.toml` and Cloudflare Pages dashboard must point to `frontend/project-01/.open-next/assets` (relative to repository root).

### Build command differences between wrangler.toml and dashboard

If the dashboard settings differ from `wrangler.toml`, Cloudflare Pages may use the dashboard settings. To avoid confusion:

- Keep both configurations synchronized
- Use the same path-based filter command in both places
- Verify the output directory matches exactly

## Related Files

- `/wrangler.toml` - Main Cloudflare Pages configuration
- `/pnpm-workspace.yaml` - Workspace package definitions
- `/frontend/project-01/package.json` - Frontend package with build scripts
- `/frontend/project-01/open-next.config.ts` - OpenNext Cloudflare adapter configuration
- `/frontend/project-01/wrangler.toml` - Frontend-specific Cloudflare configuration

## References

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [OpenNext Cloudflare Adapter](https://github.com/opennextjs/opennextjs-cloudflare)
- [pnpm Filtering Documentation](https://pnpm.io/filtering)
