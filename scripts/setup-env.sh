#!/bin/bash

# AutoEcoOps Environment Setup Script
# This script initializes the .env file and configures local Git settings.

set -e

echo "🚀 Initializing AutoEcoOps Environment..."

# 1. Configure Git Local Settings
echo "📝 Configuring local Git settings..."
git config user.email "evolution@autoecoops.io"
git config user.name "AutoEcoOps Bot"
echo "✅ Git configured: $(git config user.name) <$(git config user.email)>"

# 2. Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cat <<EOF > .env
# AutoEcoOps Ecosystem Environment Variables
# DO NOT COMMIT THIS FILE TO GIT

GITHUB_TOKEN=your_pat_here
GITHUB_CI_TOKEN=your_ci_token_here
ANTHROPIC_API_KEY=your_api_key_here
EOF
    echo "✅ .env file created. Please update it with your actual tokens."
else
    echo "ℹ️ .env file already exists, skipping creation."
fi

# 3. Verify .gitignore
if ! grep -q "^\.env$" .gitignore; then
    echo "⚠️ .env is not in .gitignore! Adding it now..."
    echo -e "\n# AutoEcoOps Custom\n.env" >> .gitignore
    echo "✅ Added .env to .gitignore"
fi

echo "🎉 Setup complete! You are ready to develop for AutoEcoOps."
