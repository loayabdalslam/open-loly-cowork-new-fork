#!/bin/bash

# Open Loly Cowork Setup Script
# This script helps you get started with Composio and configure the project

set -e

echo "Open Loly Cowork Setup"
echo "================================"
echo ""




# Check if Opencode CLI is installed and working
if ! command -v opencode &> /dev/null; then
    echo "Opencode CLI not found. Attempting to install it globally..."
    npm install -g opencode-ai
    echo ""
else
    # Try running the command to ensure it's not broken (like the MODULE_NOT_FOUND error)
    if ! opencode --version &> /dev/null; then
        echo "Opencode CLI seems to be installed but is broken (path issue)."
        echo "Attempting to fix by reinstalling..."
        npm uninstall -g opencode-ai
        npm install -g opencode-ai
        echo ""
    else
        echo "Opencode CLI is installed and working correctly."
        echo ""
    fi
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ".env file created"
    echo ""
else
    echo ".env file already exists"
    echo ""
fi





# Install dependencies
echo "Installing project dependencies..."
echo ""
npm install @composio/core @composio/claude-agent-sdk @anthropic-ai/claude-agent-sdk
cd server && npm install && cd ..
echo ""
echo "Dependencies installed"
echo ""

# Final instructions
echo "================================"
echo "Setup complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Make sure your .env file has both API keys configured"
echo "2. Start the backend server:"
echo "   cd server && npm start"
echo ""
echo "3. In a new terminal, start the Electron app:"
echo "   npm start"
echo ""
echo "For more info, check out:"
echo "   - Composio Dashboard: https://platform.composio.dev"
echo "   - Composio Docs: https://docs.composio.dev"
echo "   - Claude Agent SDK: https://docs.anthropic.com/en/docs/claude-agent-sdk"
echo ""
echo "Need help? Open an issue on GitHub!"
echo ""
