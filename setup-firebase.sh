#!/bin/bash

# Battle Pong - Firebase Setup Script

echo "Welcome to Battle Pong Firebase Setup!"
echo ""

# Check if Firebase config already exists
if [ -f "src/config/firebase.config.js" ]; then
    echo "Firebase config already exists at src/config/firebase.config.js"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "Setting up Firebase configuration..."

# Copy template
if [ -f "src/config/firebase.config.template.js" ]; then
    cp src/config/firebase.config.template.js src/config/firebase.config.js
    echo "Template copied to src/config/firebase.config.js"
else
    echo "Template file not found!"
    exit 1
fi

echo ""
echo "Next steps:"
echo "1. Go to https://console.firebase.google.com/"
echo "2. Create a new Firebase project"
echo "3. Enable Firestore Database"
echo "4. Enable Analytics"
echo "5. Get your config from Project Settings > General"
echo "6. Edit src/config/firebase.config.js with your credentials"
echo ""
echo "Your credentials will be safe - firebase.config.js is gitignored!"
echo ""
echo "Optional: Run 'firebase init' to set up deployment"

# Make script executable
chmod +x setup-firebase.sh

echo "Setup complete! Edit src/config/firebase.config.js with your Firebase credentials."