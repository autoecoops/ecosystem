#!/bin/bash

echo "=== Phase 3 Migration Script ==="
echo "This script completes the migration to 3-layer architecture"

# Set workspace directory
cd /workspace/autoecosystem-main

# 1. Move root documentation files
echo "Moving root documentation files..."
mkdir -p docs/{architecture,configuration,quickstart}
[ -f ARCHITECTURE_COMPLETENESS_CHECKLIST.md ] && mv ARCHITECTURE_COMPLETENESS_CHECKLIST.md docs/architecture/COMPLETENESS_CHECKLIST.md
[ -f CONFIGURATION_VERIFICATION_REPORT.md ] && mv CONFIGURATION_VERIFICATION_REPORT.md docs/configuration/VERIFICATION_REPORT.md
[ -f QUICKSTART.md ] && mv QUICKSTART.md docs/quickstart/QUICKSTART.md

# 2. Move migrate script
echo "Moving migrate.sh..."
[ -f migrate.sh ] && mv migrate.sh control/tooling/scripts/migrate.sh

# 3. Update platform-1 docker-compose file
echo "Updating platform-1 docker-compose files..."
if [ -f platforms/platform-1/docker/docker-compose.dev.yml ]; then
    mv platforms/platform-1/docker/docker-compose.dev.yml platforms/platform-1/docker/compose.dev.yml
fi

if [ -f control/environment/docker/docker-compose.dev.yml ]; then
    mv control/environment/docker/docker-compose.dev.yml control/environment/docker/compose.dev.yml
fi

# 4. Move shared database package
echo "Verifying shared database package..."
if [ -d control/shared/packages/database ] && [ -d packages/database ]; then
    echo "Shared database package already moved"
else
    echo "WARNING: Check database package migration"
fi

# 5. Move governance scripts
echo "Verifying governance scripts..."
if [ -d control/governance/scripts ]; then
    echo "Governance scripts already moved"
else
    mkdir -p control/governance/scripts
    mv control/tooling/ai-dev-environment/scripts/governance-integration/* control/governance/scripts/
fi

# 6. Move AI dev environment
echo "Verifying AI dev environment..."
if [ -d control/tooling/ai-dev-environment ]; then
    echo "AI dev environment already moved"
else
    echo "WARNING: Check AI dev environment migration"
fi

# 7. Move docker configs
echo "Verifying docker configs..."
if [ -d control/environment/docker ]; then
    echo "Docker configs already moved"
else
    echo "WARNING: Check docker config migration"
fi

# 8. Move apps to interfaces
echo "Verifying apps migration..."
if [ -d interfaces/apps ]; then
    echo "Apps already moved"
else
    echo "WARNING: Check apps migration"
fi

# 9. Move scripts to tooling
echo "Verifying scripts migration..."
if [ -d control/tooling/scripts ]; then
    echo "Scripts already moved"
else
    echo "WARNING: Check scripts migration"
fi

# 10. Move environment config
echo "Verifying environment config..."
if [ -f control/environment/configs/.env.example ]; then
    echo "Environment config already moved"
else
    mkdir -p control/environment/configs
    [ -f .env.example ] && cp .env.example control/environment/configs/.env.example
    echo "WARNING: Check environment config migration"
fi

echo ""
echo "=== Migration Phase 3 Complete ==="
echo "Next step: Delete duplicate directories"