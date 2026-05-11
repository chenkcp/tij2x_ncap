# NextCap Web Authentication Setup Script - PowerShell

Write-Host "🚀 Setting up NextCap Web Authentication System..." -ForegroundColor Green
Write-Host ""

# 1. Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  npm install completed with warnings" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# 2. Copy environment variables
if (!(Test-Path .env)) {
    Write-Host "📋 Setting up environment variables..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env with your OAuth provider details" -ForegroundColor Red
} else {
    Write-Host "ℹ️  .env file already exists" -ForegroundColor Blue
}

# 3. Check critical files exist
Write-Host ""
Write-Host "🔍 Verifying authentication system files..." -ForegroundColor Yellow

$files = @(
    "src\contexts\AuthContext.jsx",
    "src\services\auth.js", 
    "src\services\apiClient.js",
    "src\components\auth\AuthenticatedRoute.jsx",
    "src\pages\AuthenticationPage.jsx",
    "src\utils\jwtUtils.js"
)

$allFilesExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (MISSING)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# 4. Summary
Write-Host ""
Write-Host "📊 Setup Summary:" -ForegroundColor Cyan
if ($allFilesExist) {
    Write-Host "✅ All authentication system files are present" -ForegroundColor Green
} else {
    Write-Host "❌ Some authentication files are missing - check output above" -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your OAuth provider configuration:" -ForegroundColor White
Write-Host "   - REACT_APP_OAUTH_CLIENT_ID" -ForegroundColor Gray
Write-Host "   - REACT_APP_LOGIN_URL (company OneUID URL)" -ForegroundColor Gray
Write-Host "   - REACT_APP_REDIRECT_URI (callback URL)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure your backend OAuth endpoints:" -ForegroundColor White
Write-Host "   - POST /api/auth/token (exchange code for token)" -ForegroundColor Gray
Write-Host "   - GET /api/auth/verify (verify token)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Test the authentication flow:" -ForegroundColor White
Write-Host "   - Visit any protected route" -ForegroundColor Gray
Write-Host "   - Should redirect to /auth" -ForegroundColor Gray
Write-Host "   - Click 'Sign In with OneUID'" -ForegroundColor Gray
Write-Host "   - Complete OAuth flow" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 For detailed setup instructions, see AUTHENTICATION_SETUP.md" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Authentication setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To run this script again, use: .\setup-auth.ps1" -ForegroundColor Cyan