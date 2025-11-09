#!/bin/bash

# ProjectNest Alias Installer
# This script creates a convenient 'projectnest' command for your shell

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get the script's directory (absolute path)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STARTUP_SCRIPT="$SCRIPT_DIR/start-projectnest.sh"

# Detect shell
SHELL_NAME=$(basename "$SHELL")
CONFIG_FILE=""

case "$SHELL_NAME" in
    bash)
        if [ -f "$HOME/.bashrc" ]; then
            CONFIG_FILE="$HOME/.bashrc"
        elif [ -f "$HOME/.bash_profile" ]; then
            CONFIG_FILE="$HOME/.bash_profile"
        fi
        ;;
    zsh)
        CONFIG_FILE="$HOME/.zshrc"
        ;;
    fish)
        CONFIG_FILE="$HOME/.config/fish/config.fish"
        ;;
    *)
        echo -e "${YELLOW}⚠️  Unknown shell: $SHELL_NAME${NC}"
        echo -e "${BLUE}Please manually add this alias to your shell config:${NC}"
        echo "alias run-projectNest='$STARTUP_SCRIPT'"
        exit 1
        ;;
esac

# Check if config file exists
if [ -z "$CONFIG_FILE" ] || [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}⚠️  Shell config file not found: $CONFIG_FILE${NC}"
    echo -e "${BLUE}Please manually add this alias to your shell config:${NC}"
    echo "alias run-projectNest='$STARTUP_SCRIPT'"
    exit 1
fi

# Check if alias already exists
if grep -q "alias run-projectNest=" "$CONFIG_FILE"; then
    echo -e "${YELLOW}⚠️  'run-projectNest' alias already exists in $CONFIG_FILE${NC}"
    echo -e "${BLUE}Updating existing alias...${NC}"
    
    # Remove old alias (platform-independent)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' '/alias run-projectNest=/d' "$CONFIG_FILE"
    else
        # Linux
        sed -i '/alias run-projectNest=/d' "$CONFIG_FILE"
    fi
fi

# Add new alias
echo "" >> "$CONFIG_FILE"
echo "# ProjectNest shortcut - Added by setup-alias.sh" >> "$CONFIG_FILE"
echo "alias run-projectNest='$STARTUP_SCRIPT'" >> "$CONFIG_FILE"

echo -e "${GREEN}✓ Successfully added 'run-projectNest' alias to $CONFIG_FILE${NC}"
echo ""
echo -e "${BLUE}To use the alias immediately, run:${NC}"
echo -e "${YELLOW}  source $CONFIG_FILE${NC}"
echo ""
echo -e "${BLUE}Or simply open a new terminal window.${NC}"
echo ""
echo -e "${GREEN}Usage:${NC}"
echo -e "  ${YELLOW}run-projectNest${NC}  - Start ProjectNest servers"
echo ""

# Offer to reload shell config
read -p "Do you want to reload your shell config now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ "$SHELL_NAME" = "fish" ]; then
        fish -c "source $CONFIG_FILE"
    else
        source "$CONFIG_FILE"
    fi
    echo -e "${GREEN}✓ Shell config reloaded!${NC}"
    echo -e "${BLUE}You can now run: ${YELLOW}run-projectNest${NC}"
else
    echo -e "${BLUE}Run this to enable the alias: ${YELLOW}source $CONFIG_FILE${NC}"
fi
