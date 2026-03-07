#!/bin/bash
# Deploy script for Montana Fishing Reports

export PATH="$HOME/.npm-global/bin:$PATH"

echo "🚀 Deploying Montana Fishing Reports to Railway..."
echo ""

# Check if logged in
railway status > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "🔑 Please login to Railway:"
    railway login
fi

# Check if project is linked
if [ ! -d ".railway" ]; then
    echo ""
    echo "📋 No Railway project linked."
    echo "Choose an option:"
    echo "1) Link to existing project"
    echo "2) Create new project"
    read -p "Enter choice (1 or 2): " choice
    
    if [ "$choice" = "1" ]; then
        railway link
    else
        railway init
    fi
fi

# Deploy
echo ""
echo "📦 Deploying..."
railway up

# Show status
echo ""
echo "✅ Deployment complete!"
railway status
