#!/bin/bash

echo "=== Migration Verification Script ==="
echo "Verifying all files have been moved correctly..."
echo ""

# Dynamically resolve repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Counters
total_found=0
total_missing=0
total_duplicates=0

# 1. Verify shared database package
echo "1. Verifying shared database package..."
if [ -d control/shared/packages/database ]; then
    if [ -f "control/shared/packages/database/package.json" ]; then
        echo "   ✓ package.json found"
        ((total_found++))
    else
        echo "   ✗ package.json missing"
        ((total_missing++))
    fi
    if [ -d "control/shared/packages/database/prisma" ]; then
        echo "   ✓ prisma/ directory found"
        ((total_found++))
    else
        echo "   ✗ prisma/ directory missing"
        ((total_missing++))
    fi
else
    echo "   ✗ database package directory missing"
    ((total_missing++))
fi

# 2. Verify AI dev environment
echo ""
echo "2. Verifying AI dev environment..."
if [ -d control/tooling/ai-dev-environment ]; then
    if [ -f "control/tooling/ai-dev-environment/README.md" ]; then
        echo "   ✓ README.md found"
        ((total_found++))
    else
        echo "   ✗ README.md missing"
        ((total_missing++))
    fi
    if [ -f "control/tooling/ai-dev-environment/setup.sh" ]; then
        echo "   ✓ setup.sh found"
        ((total_found++))
    else
        echo "   ✗ setup.sh missing"
        ((total_missing++))
    fi
else
    echo "   ✗ ai-dev-environment directory missing"
    ((total_missing++))
fi

# 3. Verify docker configs
echo ""
echo "3. Verifying docker configs..."
if [ -d control/environment/docker ]; then
    if [ -f "control/environment/docker/compose.dev.yml" ]; then
        echo "   ✓ compose.dev.yml found"
        ((total_found++))
    else
        echo "   ✗ compose.dev.yml missing"
        ((total_missing++))
    fi
    if [ -d "control/environment/docker/ai-dev" ]; then
        echo "   ✓ ai-dev docker config found"
        ((total_found++))
    else
        echo "   ✗ ai-dev docker config missing"
        ((total_missing++))
    fi
else
    echo "   ✗ docker directory missing"
    ((total_missing++))
fi

# 4. Verify apps
echo ""
echo "4. Verifying apps..."
if [ -d interfaces/apps ]; then
    if [ -d "interfaces/apps/api" ]; then
        echo "   ✓ api app found"
        ((total_found++))
    else
        echo "   ✗ api app missing"
        ((total_missing++))
    fi
    if [ -d "interfaces/apps/web" ]; then
        echo "   ✓ web app found"
        ((total_found++))
    else
        echo "   ✗ web app missing"
        ((total_missing++))
    fi
else
    echo "   ✗ apps directory missing"
    ((total_missing++))
fi

# 5. Verify scripts
echo ""
echo "5. Verifying scripts..."
if [ -d control/tooling/scripts ]; then
    if [ -d "control/tooling/scripts/setup" ]; then
        echo "   ✓ setup/ directory found"
        ((total_found++))
    else
        echo "   ✗ setup/ directory missing"
        ((total_missing++))
    fi
else
    echo "   ✗ scripts directory missing"
    ((total_missing++))
fi

# 6. Verify governance scripts
echo ""
echo "6. Verifying governance scripts..."
if [ -d control/governance/scripts ]; then
    if [ -f "control/governance/scripts/opa-policy-check.sh" ]; then
        echo "   ✓ opa-policy-check.sh found"
        ((total_found++))
    else
        echo "   ✗ opa-policy-check.sh missing"
        ((total_missing++))
    fi
    if [ -f "control/governance/scripts/seal-ai-change.sh" ]; then
        echo "   ✓ seal-ai-change.sh found"
        ((total_found++))
    else
        echo "   ✗ seal-ai-change.sh missing"
        ((total_missing++))
    fi
else
    echo "✗ governance scripts directory missing"
    ((total_missing++))
fi

# 7. Verify documentation
echo ""
echo "7. Verifying documentation..."
if [ -d docs ]; then
    if [ -d "docs/architecture" ]; then
        echo "   ✓ docs/architecture/ found"
        ((total_found++))
    else
        echo "   ✗ docs/architecture/ missing"
        ((total_missing++))
    fi
    if [ -d "docs/configuration" ]; then
        echo "   ✓ docs/configuration/ found"
        ((total_found++))
    else
        echo "   ✗ docs/configuration/ missing"
        ((total_missing++))
    fi
    if [ -d "docs/quickstart" ]; then
        echo "   ✓ docs/quickstart/ found"
        ((total_found++))
    else
        echo "   ✗ docs/quickstart/ missing"
        ((total_missing++))
    fi
else
    echo "   ✗ docs/ directory missing"
    ((total_missing++))
fi

# 8. Verify platform-1
echo ""
echo "8. Verifying platform-1..."
if [ -d platforms/platform-1 ]; then
    if [ -d "platforms/platform-1/apps" ]; then
        echo "   ✓ apps/ found"
        ((total_found++))
    else
        echo "   ✗ apps/ missing"
        ((total_missing++))
    fi
    if [ -d "platforms/platform-1/config" ]; then
        echo "   ✓ config/ found"
        ((total_found++))
    else
        echo "   ✗ config/ missing"
        ((total_missing++))
    fi
    if [ -d "platforms/platform-1/packages" ]; then
        echo "   ✓ packages/ found"
        ((total_found++))
    else
        echo "   ✗ packages/ missing"
        ((total_missing++))
    fi
else
    echo "   ✗ platform-1/ missing"
    ((total_missing++))
fi

# 9. Check for duplicates
echo ""
echo "9. Checking for duplicate directories..."
if [ -d contracts-l1-config ]; then
    echo "   ✗ contracts-l1-config/ still exists (should be deleted)"
    ((total_duplicates++))
fi
if [ -d packages/config ]; then
    echo "   ✗ packages/config/ still exists (should be deleted)"
    ((total_duplicates++))
fi
if [ -d ai-dev-environment ]; then
    echo "   ✗ ai-dev-environment/ still exists (should be deleted)"
    ((total_duplicates++))
fi
if [ -d docker ]; then
    echo "   ✗ docker/ still exists (should be deleted)"
    ((total_duplicates++))
fi
if [ -d scripts ]; then
    echo "   ✗ scripts/ still exists (should be deleted)"
    ((total_duplicates++))
fi
if [ -d apps ]; then
    echo "   ✗ apps/ still exists (should be deleted)"
    ((total_duplicates++))
fi
if [ -d packages/database ]; then
    echo "   ✗ packages/database/ still exists (should be deleted)"
    ((total_duplicates++))
fi

# 10. File count comparison
echo ""
echo "10. File count comparison..."
current_files=$(find . -type f | wc -l)
echo "   Current file count: $current_files"
echo "   Expected: ~130 (from previous migration)"
if [ $current_files -gt 120 ] && [ $current_files -lt 140 ]; then
    echo "   ✓ File count looks reasonable"
else
    echo "   ✗ File count abnormal"
fi

# Summary
echo ""
echo "=== Verification Summary ==="
echo "✓ Total components found: $total_found"
echo "✗ Total components missing: $total_missing"
echo "⚠ Total duplicates remaining: $total_duplicates"
echo ""
if [ $total_missing -eq 0 ] && [ $total_duplicates -eq 0 ]; then
    echo "✓ Migration verification PASSED"
    exit 0
else
    echo "✗ Migration verification FAILED"
    echo "   Missing components: $total_missing"
    echo "   Duplicates remaining: $total_duplicates"
    exit 1
fi