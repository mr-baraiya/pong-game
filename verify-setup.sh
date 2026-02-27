#!/bin/bash

# Battle Pong - Setup Verification Script

echo "Verifying Battle Pong Setup..."
echo ""

# Check project structure
echo "Checking project structure..."

required_files=(
    "index.html"
    "package.json"
    "src/css/styles.css"
    "src/js/game.js"
    "src/config/firebase.js"
    "src/config/firebase.config.template.js"
    "src/config/environment.js"
    ".gitignore"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "$file"
    else
        echo "$file (missing)"
        missing_files+=("$file")
    fi
done

echo ""

# Check Firebase configuration
echo "Checking Firebase configuration..."

if [ -f "src/config/firebase.config.js" ]; then
    echo "Firebase credentials configured"
    
    # Check if it's still the template
    if grep -q "your-api-key-here" src/config/firebase.config.js; then
        echo "Warning: Firebase config appears to still be using template values"
        echo "   Please update src/config/firebase.config.js with your actual credentials"
    else
        echo "Firebase configuration appears to be customized"
    fi
else
    echo "Firebase config not found - game will run in demo mode"
    echo "   Run './setup-firebase.sh' to configure Firebase"
fi

echo ""

# Check .gitignore
echo "Checking security..."

if grep -q "src/config/firebase.config.js" .gitignore; then
    echo "Firebase config is properly gitignored"
else
    echo "Firebase config is NOT gitignored - SECURITY RISK!"
    echo "   Add 'src/config/firebase.config.js' to your .gitignore immediately!"
fi

echo ""

# Summary
if [ ${#missing_files[@]} -eq 0 ]; then
    echo "All required files are present!"
    echo ""
    echo "Ready to play!"
    echo "   Start with: python3 -m http.server 8080"
    echo "   Then open: http://localhost:8080"
else
    echo "Missing files detected:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Please ensure all required files are present before running the game."
fi

echo ""
echo "For help, check the README.md file!"
