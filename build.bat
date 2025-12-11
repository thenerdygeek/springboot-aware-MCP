@echo off
REM Build script for Spring Boot MCP Servers (Windows)

echo ========================================
echo Building Spring Boot MCP Servers
echo ========================================
echo.

REM Check Node.js
echo [1/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)
echo Node.js found:
node --version

REM Check Java
echo.
echo [2/4] Checking Java...
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java 11+ from https://adoptium.net/
    exit /b 1
)
echo Java found:
java -version 2>&1 | findstr "version"

REM Check Maven
echo.
echo [3/4] Checking Maven...
mvn --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Maven is not installed or not in PATH
    echo Please install Maven from https://maven.apache.org/
    exit /b 1
)
echo Maven found:
mvn --version | findstr "Apache Maven"

echo.
echo ========================================
echo Installing Node.js dependencies...
echo ========================================
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    exit /b 1
)

echo.
echo ========================================
echo Building TypeScript packages...
echo ========================================
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build TypeScript packages
    exit /b 1
)

echo.
echo ========================================
echo Building Java Parser Service...
echo ========================================
cd packages\java-parser-service
call mvn clean package -DskipTests
if errorlevel 1 (
    echo ERROR: Failed to build Java Parser Service
    cd ..\..
    exit /b 1
)
cd ..\..

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Copy cody_settings.example.json to your Cody settings location
echo 2. Edit the paths in cody_settings.json to match your installation
echo 3. Restart IntelliJ IDEA
echo.
echo Cody settings location on Windows:
echo %%APPDATA%%\JetBrains\^<IDE_VERSION^>\options\cody_settings.json
echo.
echo Example:
echo C:\Users\%USERNAME%\AppData\Roaming\JetBrains\IntelliJIdea2024.1\options\cody_settings.json
echo.

pause
