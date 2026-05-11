# Quick Setup Reference

## Running Setup Scripts

### Windows PowerShell (Recommended)
```powershell
.\setup-auth.ps1
```

### Windows Command Prompt
```cmd
.\setup-auth.bat
```

### Unix/Linux/Mac
```bash
chmod +x setup-auth.sh
./setup-auth.sh
```

## Manual Setup (if scripts fail)

1. **Install dependencies:**
   ```bash
   npm install axios jwt-decode --save
   ```

2. **Setup environment:**
   ```bash
   copy .env.example .env    # Windows
   cp .env.example .env      # Unix/Mac
   ```

3. **Edit .env file** with your OAuth settings

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Troubleshooting

- **"setup-auth.bat is not recognized"**: Use `.\setup-auth.bat` or `.\setup-auth.ps1`
- **PowerShell execution policy**: Run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
- **Dependencies not installing**: Run `npm install` individually
- **Missing files**: Check AUTHENTICATION_SETUP.md for complete file list