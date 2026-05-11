@echo off
setlocal enabledelayedexpansion

echo 🚀 Setting up NextCap Web Authentication System...
echo.

REM 1. Install dependencies
echo 📦 Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM 2. Copy environment variables
if not exist .env (
    echo 📋 Setting up environment variables...
    copy .env.example .env >nul
    echo ✅ Created .env file from .env.example
    echo ⚠️  Please edit .env with your OAuth provider details
) else (
    echo ℹ️  .env file already exists
)

REM 3. Check critical files exist
echo.
echo 🔍 Verifying authentication system files...

set all_files_exist=true

set files=src\contexts\AuthContext.jsx src\services\auth.js src\services\apiClient.js src\components\auth\AuthenticatedRoute.jsx src\pages\AuthenticationPage.jsx src\utils\jwtUtils.js

for %%f in (%files%) do (
    if exist "%%f" (
        echo ✅ %%f
    ) else (
        echo ❌ %%f ^(MISSING^)
        set all_files_exist=false
    )
)

REM 4. Summary
echo.
echo 📊 Setup Summary:
if "!all_files_exist!"=="true" (
    echo ✅ All authentication system files are present
) else (
    echo ❌ Some authentication files are missing - check output above
)

echo.
echo 📝 Next Steps:
echo 1. Edit .env file with your OAuth provider configuration:
echo    - REACT_APP_OAUTH_CLIENT_ID
echo    - REACT_APP_LOGIN_URL ^(company OneUID URL^)
echo    - REACT_APP_REDIRECT_URI ^(callback URL^)
echo.
echo 2. Configure your backend OAuth endpoints:
echo    - POST /api/auth/token ^(exchange code for token^)
echo    - GET /api/auth/verify ^(verify token^)
echo.
echo 3. Start the development server:
echo    npm run dev
echo.
echo 4. Test the authentication flow:
echo    - Visit any protected route
echo    - Should redirect to /auth
echo    - Click 'Sign In with OneUID'
echo    - Complete OAuth flow
echo.
echo 📖 For detailed setup instructions, see AUTHENTICATION_SETUP.md
echo.
echo 🎉 Authentication setup complete!
echo.
pause