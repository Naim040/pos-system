@echo off
REM POS System Windows Installation Script
REM Run this script as Administrator

echo ========================================
echo POS System Windows Installation
echo ========================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Please run this script as Administrator!
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

REM Check if Git is installed
git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Git is not installed. Please install Git first.
    echo Download from: https://git-scm.com
    pause
    exit /b 1
)

echo Node.js and Git are installed.
echo.

REM Set installation directory
set INSTALL_DIR=C:\pos-system
echo Installation directory: %INSTALL_DIR%
echo.

REM Create installation directory
if not exist "%INSTALL_DIR%" (
    echo Creating installation directory...
    mkdir "%INSTALL_DIR%"
)

REM Change to installation directory
cd /d "%INSTALL_DIR%"

REM Check if already installed
if exist "package.json" (
    echo POS System is already installed in this directory.
    echo Do you want to reinstall? (Y/N)
    set /p REINSTALL=
    if /i "%REINSTALL%" neq "Y" (
        echo Installation cancelled.
        pause
        exit /b 0
    )
    echo Cleaning up previous installation...
    rmdir /s /q node_modules
    del package-lock.json
)

REM Download POS System (if not already present)
if not exist "package.json" (
    echo Downloading POS System...
    echo Please enter the repository URL or press Enter to use manual installation:
    set /p REPO_URL=
    
    if "%REPO_URL%" neq "" (
        git clone "%REPO_URL%" .
    ) else (
        echo Please extract the POS System files to %INSTALL_DIR% manually.
        echo Then run this script again.
        pause
        exit /b 1
    )
)

REM Install dependencies
echo Installing dependencies...
npm install
if %errorLevel% neq 0 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

REM Setup database
echo Setting up database...
npm run db:generate
if %errorLevel% neq 0 (
    echo Failed to generate database client.
    pause
    exit /b 1
)

npm run db:push
if %errorLevel% neq 0 (
    echo Failed to push database schema.
    pause
    exit /b 1
)

npx tsx prisma/seed.ts
if %errorLevel% neq 0 (
    echo Failed to seed database.
    pause
    exit /b 1
)

REM Build application
echo Building application...
npm run build
if %errorLevel% neq 0 (
    echo Failed to build application.
    pause
    exit /b 1
)

REM Install as Windows Service
echo Installing as Windows Service...
echo Checking for NSSM...

REM Check if NSSM is installed
nssm version >nul 2>&1
if %errorLevel% neq 0 (
    echo NSSM is not installed. Installing NSSM...
    echo Please download NSSM from: https://nssm.cc
    echo Extract to C:\nssm and add to PATH
    echo Then run this script again.
    pause
    exit /b 1
)

REM Install service
nssm install POSServer "C:\Program Files\nodejs\node.exe" "%INSTALL_DIR%\server.ts"
nssm set POSServer AppDirectory "%INSTALL_DIR%"
nssm set POSServer AppEnvironmentExtra "NODE_ENV=production"
nssm set POSServer DisplayName "POS System Server"
nssm set POSServer Description "Point of Sale System Server"
nssm set POSServer Start SERVICE_AUTO_START

REM Start service
echo Starting POS System service...
nssm start POSSERVER

if %errorLevel% neq 0 (
    echo Failed to start service.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo POS System is now running as a Windows service.
echo.
echo Access the POS System at: http://localhost:3000
echo Default login credentials:
echo   Email: admin@pos.com
echo   Password: password
echo.
echo Service Management:
echo   Start:   nssm start POSServer
echo   Stop:    nssm stop POSServer
echo   Restart: nssm restart POSServer
echo   Status:  nssm status POSServer
echo.
echo Installation directory: %INSTALL_DIR%
echo Database location: %INSTALL_DIR%\db\custom.db
echo.
echo Press any key to exit...
pause >nul