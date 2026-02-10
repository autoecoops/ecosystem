#!/bin/bash

echo "=== Cleanup Duplicates Script ==="
echo "This script removes duplicate directories and files"
echo ""
echo "⚠️  WARNING: This will DELETE duplicate files!"
echo "Please verify backup exists before proceeding..."
echo ""
echo "Backup location: /workspace/autoecosystem-backup-20260210_105709.tar.gz"
echo ""

read -p "Continue with cleanup? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Cleanup aborted"
    exit 0
fi

cd /workspace/autoecosystem-main

echo "=== Phase 1: Remove contracts-l1-config directory (duplicate of platform-1/config) ==="
if [ -d contracts-l1-config ]; then
    echo "Removing contracts-l1-config/..."
    rm -rf contracts-l1-config
    echo "✓ contracts-l1-config/ removed"
else
    echo "⊘ contracts-l1-config/ already removed or does not exist"
fi

echo ""
echo "=== Phase 2: Remove packages/config/ directory (deeply nested duplicates) ==="
if [ -d packages/config ]; then
    echo "Removing packages/config/..."
    rm -rf packages/config
    echo "✓ packages/config/ removed"
else
    echo "⊘ packages/config/ already removed or does not exist"
fi

echo ""
echo "=== Phase 3: Remove old directories that have been moved ==="

# Remove old AI dev environment
if [ -d ai-dev-environment ] && [ -d control/tooling/ai-dev-environment ]; then
    echo "Removing old ai-dev-environment/..."
    rm -rf ai-dev-environment
    echo "✓ ai-dev-environment/ removed"
else
    echo "⊘ ai-dev-environment/ check needed"
fi

# Remove old docker
if [ -d docker ] && [ -d control/environment/docker ]; then
    echo "Removing old docker/..."
    rm -rf docker
    echo "✓ docker/ removed"
else
    echo "⊘ docker/ check needed"
fi

# Remove old scripts
if [ -d scripts ] && [ -d control/tooling/scripts ]; then
    echo "Removing old scripts/..."
    rm -rf scripts
    echo "✓ scripts/ removed"
else
    echo "⊘ scripts/ check needed"
fi

# Remove old apps
if [ -d apps ] && [ -d interfaces/apps ]; then
    echo "Removing old apps/..."
    rm -rf apps
    echo "✓ apps/ removed"
else
    echo "⊘ apps/ check needed"
fi

# Remove old packages/database
if [ -d packages/database ] && [ -d control/shared/packages/database ]; then
    echo "Removing old packages/database/..."
    rm -rf packages/database
    echo "✓ packages/database/ removed"
else
    echo "⊘ packages/database/ check needed"
fi

echo ""
echo "=== Phase 4: Remove root files that have been moved ==="

# Remove QUICKSTART.md (moved to docs/quickstart/)
if [ -f QUICKSTART.md ]; then
    rm -f QUICKSTART.md
    echo "✓ QUICKSTART.md removed"
else
    echo "⊘ QUICKSTART.md already removed"
fi

# Remove ARCHITECTURE_COMPLETENESS_CHECKLIST.md (moved to docs/architecture/)
if [ -f ARCHITECTURE_COMPLETENESS_CHECKLIST.md ]; then
    rm -f ARCHITECTURE_COMPLETENESS_CHECKLIST.md
    echo "✓ ARCHITECTURE_COMPLETENESS_CHECKLIST.md removed"
else
    echo "⊘ ARCHITECTUREIVENESS_CHECKLIST.md already removed"
fi

# Remove CONFIGURATION_VERIFICATION_REPORT.md (moved to docs/configuration/)
if [ -f CONFIGURATION_VERIFICATION_REPORT.md ]; then
    rm -f CONFIGURATION_VERIFICATION_REPORT.md
    echo "✓ CONFIGURATION_VERIFICATION_REPORT.md removed"
else
    echo "⊘ CONFIGURATION_VERIFICATION_REPORT.md already removed"
fi

# Remove migrate.sh (moved to control/tooling/scripts/)
if [ -f migrate.sh ]; then
    rm -f migrate.sh
    echo "✓ migrate.sh removed"
else
    echo "⊘ migrate.sh already removed"
fi

echo ""
echo "=== Cleanup Complete ==="
echo "Checking new directory structure..."
tree -L 3 -d --charset ascii --dirsfirst