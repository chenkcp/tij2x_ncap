#!/bin/bash

# NextCap Web Authentication Setup Script

echo "🚀 Setting up NextCap Web Authentication System..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Copy environment variables
if [ ! -f .env ]; then
    echo "📋 Setting up environment variables..."
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please edit .env with your OAuth provider details"
else
    echo "ℹ️  .env file already exists"
fi

# 3. Check critical files exist
echo "🔍 Verifying authentication system files..."

critical_files=(
    "src/contexts/AuthContext.jsx"
    "src/services/auth.js" 
    "src/services/apiClient.js"
    "src/components/auth/AuthenticatedRoute.jsx"
    "src/pages/AuthenticationPage.jsx"
    "src/utils/jwtUtils.js"
)

all_files_exist=true
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (MISSING)"
        all_files_exist=false
    fi
done

# 4. Summary
echo ""
echo "📊 Setup Summary:"
if [ "$all_files_exist" = true ]; then
    echo "✅ All authentication system files are present"
else
    echo "❌ Some authentication files are missing - check output above"
fi

echo ""
echo "📝 Next Steps:"
echo "1. Edit .env file with your OAuth provider configuration:"
echo "   - REACT_APP_OAUTH_CLIENT_ID"
echo "   - REACT_APP_LOGIN_URL (company OneUID URL)"
echo "   - REACT_APP_REDIRECT_URI (callback URL)"
echo ""
echo "2. Configure your backend OAuth endpoints:"
echo "   - POST /api/auth/token (exchange code for token)"
echo "   - GET /api/auth/verify (verify token)"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Test the authentication flow:"
echo "   - Visit any protected route"
echo "   - Should redirect to /auth"
echo "   - Click 'Sign In with OneUID'"
echo "   - Complete OAuth flow"
echo ""
echo "📖 For detailed setup instructions, see AUTHENTICATION_SETUP.md"
echo ""
echo "🎉 Authentication setup complete!"