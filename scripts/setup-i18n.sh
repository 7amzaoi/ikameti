#!/bin/bash
# IKAMETI i18n - Quick Setup Script for Remaining Pages
# This script helps apply i18n changes to remaining HTML pages

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}IKAMETI Multi-Language System - Setup Helper${NC}\n"

# Function to add i18n CSS link
add_i18n_css() {
    local file=$1
    echo -e "${YELLOW}Adding i18n CSS to $file...${NC}"
    
    # Add i18n.css after style.css (if not already present)
    if ! grep -q "i18n.css" "$file"; then
        sed -i 's|<link rel="stylesheet" href="css/style.css">|<link rel="stylesheet" href="css/style.css">\n    <link rel="stylesheet" href="assets/css/i18n.css">|' "$file"
        echo -e "${GREEN}✓ i18n.css added${NC}"
    fi
}

# Function to add i18n.js script
add_i18n_js() {
    local file=$1
    echo -e "${YELLOW}Adding i18n.js to $file...${NC}"
    
    # Add i18n.js before closing body tag (if not already present)
    if ! grep -q "i18n.js" "$file"; then
        sed -i 's|</body>|<script src="assets/js/i18n.js"></script>\n</body>|' "$file"
        echo -e "${GREEN}✓ i18n.js added${NC}"
    fi
}

# Function to add language switcher
add_language_switcher() {
    local file=$1
    echo -e "${YELLOW}Adding language switcher to $file...${NC}"
    
    # Check if already present
    if ! grep -q "language-switcher" "$file"; then
        # This would require more complex logic to find the right insertion point
        echo -e "${YELLOW}⚠ Please manually add language switcher to $file${NC}"
        echo -e "  Suggested location: After nav-menu div, before mobile-menu-btn"
    else
        echo -e "${GREEN}✓ Language switcher already present${NC}"
    fi
}

# Main script
main() {
    local files=(
        "contact.html"
        "faq.html"
        "blog-details.html"
        "landing.html"
    )
    
    echo -e "${BLUE}Processing files...${NC}\n"
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "\n${BLUE}Processing: $file${NC}"
            add_i18n_css "$file"
            add_i18n_js "$file"
            add_language_switcher "$file"
        else
            echo -e "${YELLOW}⚠ File not found: $file${NC}"
        fi
    done
    
    echo -e "\n${GREEN}Setup complete!${NC}"
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Manually add data-i18n attributes to content elements"
    echo -e "  2. Test language switching on each page"
    echo -e "  3. Verify RTL support for Arabic, Persian, and Dari"
}

# Run main function
main
