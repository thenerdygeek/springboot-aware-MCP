@echo off
REM Update @modelcontextprotocol/sdk to fix security vulnerability
REM From: 0.5.0 → To: 1.24.3

echo.
echo ===========================================
echo MCP SDK Security Update Script (Windows)
echo ===========================================
echo.
echo Current version: @modelcontextprotocol/sdk@0.5.0
echo Target version:  @modelcontextprotocol/sdk^^1.24.3
echo.
echo This will:
echo   1. Update package.json files
echo   2. Clean node_modules
echo   3. Reinstall dependencies
echo   4. Rebuild all packages
echo   5. Run tests
echo.

set /p CONFIRM="Do you want to proceed? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo.
    echo Update cancelled.
    exit /b 0
)

echo.
echo [Step 1/6] Updating package.json files...
echo.

REM Update micro-context/package.json
powershell -Command "(gc packages\micro-context\package.json) -replace '@modelcontextprotocol/sdk\": \"\^0\.5\.0\"', '@modelcontextprotocol/sdk\": \"^1.24.3\"' | Out-File -encoding ASCII packages\micro-context\package.json"
echo   - Updated packages/micro-context/package.json

REM Update macro-context/package.json
powershell -Command "(gc packages\macro-context\package.json) -replace '@modelcontextprotocol/sdk\": \"\^0\.5\.0\"', '@modelcontextprotocol/sdk\": \"^1.24.3\"' | Out-File -encoding ASCII packages\macro-context\package.json"
echo   - Updated packages/macro-context/package.json

REM Update spring-component/package.json
powershell -Command "(gc packages\spring-component\package.json) -replace '@modelcontextprotocol/sdk\": \"\^0\.5\.0\"', '@modelcontextprotocol/sdk\": \"^1.24.3\"' | Out-File -encoding ASCII packages\spring-component\package.json"
echo   - Updated packages/spring-component/package.json

echo.
echo [Step 2/6] Cleaning node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /q package-lock.json
echo   - Cleaned successfully
echo.

echo [Step 3/6] Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed!
    echo See error messages above.
    exit /b 1
)
echo   - Dependencies installed
echo.

echo [Step 4/6] Building packages...
call npm run build
if errorlevel 1 (
    echo.
    echo ERROR: Build failed!
    echo See error messages above.
    exit /b 1
)
echo   - Build complete
echo.

echo [Step 5/6] Running tests...
if exist run-tests.sh (
    bash run-tests.sh test-spring-project
) else (
    echo   - Test script not found, skipping
)
echo.

echo [Step 6/6] Verifying security audit...
call npm audit
echo.

echo ============================================
echo Update Complete!
echo ============================================
echo.
echo Verification Checklist:
echo   [ ] All packages built successfully
echo   [ ] Tests passing (if run)
echo   [ ] No npm audit warnings
echo.
echo Next Steps:
echo   1. Test the servers manually
echo   2. Verify all tools work correctly
echo   3. Check logs are created properly
echo.
echo If you encounter issues, see: docs\SECURITY_UPDATE_GUIDE.md
echo.
pause
