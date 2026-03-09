#!/bin/bash
# Setup script for Montana Fishing Reports deployment

echo "🎣 Montana Fishing Reports - Deployment Setup"
echo "================================================"
echo ""

# Check if logged into Expo
if ! npx expo whoami > /dev/null 2>&1; then
    echo "❌ Not logged into Expo"
    echo "👉 Please run: npx expo login"
    echo "   Or create an account at https://expo.dev/signup"
    exit 1
fi

echo "✅ Logged into Expo as: $(npx expo whoami)"
echo ""

# Check EAS CLI
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

echo "✅ EAS CLI installed"
echo ""

# Navigate to mobile app
cd mobile-app

# Check if EAS project is initialized
if ! eas project:info > /dev/null 2>&1; then
    echo "🚀 Initializing EAS project..."
    eas init
else
    echo "✅ EAS project already initialized"
fi

echo ""
echo "================================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo ""
echo "1. Build for internal testing (Preview):"
echo "   eas build --profile preview --platform ios"
echo "   eas build --profile preview --platform android"
echo ""
echo "2. Build for production:"
echo "   eas build --profile production --platform ios"
echo "   eas build --profile production --platform android"
echo ""
echo "3. Submit to app stores:"
echo "   eas submit --platform ios"
echo "   eas submit --platform android"
echo ""
echo "📖 Full guide: DEPLOYMENT_GUIDE.md"
echo ""
