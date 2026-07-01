@echo off
REM ============================================
REM Test Automation Script for Spring Boot MCP Servers (Windows)
REM This script runs automated tests for all 16 tools across 3 MCP servers
REM ============================================

setlocal enabledelayedexpansion

REM Configuration
set "TEST_PROJECT_PATH=%~1"
set "REPORT_DIR=test-reports"
set "TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "REPORT_FILE=%REPORT_DIR%\test-report-%TIMESTAMP%.md"

REM Counters
set TOTAL_TESTS=0
set PASSED_TESTS=0
set FAILED_TESTS=0
set SKIPPED_TESTS=0

REM ============================================
REM HEADER
REM ============================================
echo.
echo ========================================
echo Spring Boot MCP Servers - Test Automation
echo ========================================
echo.
echo This script will:
echo   1. Check prerequisites
echo   2. Validate test project
echo   3. Build all packages
echo   4. Run automated tests
echo   5. Generate test report
echo.

REM ============================================
REM CHECK PREREQUISITES
REM ============================================
echo ========================================
echo [Phase 1/5] Checking Prerequisites
echo ========================================
echo.

REM Check Java
where java >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java not found. Please install Java 11+
    exit /b 1
)
for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    set JAVA_VERSION=%%g
    goto :java_found
)
:java_found
echo [INFO] Java version: %JAVA_VERSION%

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    exit /b 1
)
for /f "tokens=*" %%g in ('node --version') do set NODE_VERSION=%%g
echo [INFO] Node.js version: %NODE_VERSION%

REM Check npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found. Please install npm
    exit /b 1
)

REM Check Maven
where mvn >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Maven not found. Please install Maven 3.6+
    exit /b 1
)
for /f "tokens=*" %%g in ('mvn --version ^| findstr /i "Apache Maven"') do (
    set MVN_VERSION=%%g
    goto :mvn_found
)
:mvn_found
echo [INFO] Maven: %MVN_VERSION%

echo.
echo [SUCCESS] All prerequisites satisfied
echo.

REM ============================================
REM VALIDATE TEST PROJECT
REM ============================================
echo ========================================
echo [Phase 2/5] Validating Test Project
echo ========================================
echo.

if "%TEST_PROJECT_PATH%"=="" (
    echo [ERROR] Test project path not provided
    echo.
    echo Usage: run-tests.bat ^<path-to-spring-boot-project^>
    echo.
    echo Example:
    echo   run-tests.bat C:\projects\spring-boot-demo
    echo   run-tests.bat test-spring-project
    echo.
    exit /b 1
)

if not exist "%TEST_PROJECT_PATH%" (
    echo [ERROR] Test project directory does not exist: %TEST_PROJECT_PATH%
    exit /b 1
)

REM Check if it's a valid Spring Boot project
if not exist "%TEST_PROJECT_PATH%\pom.xml" (
    if not exist "%TEST_PROJECT_PATH%\build.gradle" (
        echo [WARNING] No pom.xml or build.gradle found. This may not be a valid Maven/Gradle project
    )
)

REM Check for src/main/java directory
if not exist "%TEST_PROJECT_PATH%\src\main\java" (
    echo [ERROR] src\main\java directory not found in test project
    exit /b 1
)

echo [INFO] Test project path: %TEST_PROJECT_PATH%
echo [SUCCESS] Test project validated
echo.

REM ============================================
REM BUILD ALL PACKAGES
REM ============================================
echo ========================================
echo [Phase 3/5] Building All Packages
echo ========================================
echo.

REM Build Java parser service
echo [INFO] Building Java Parser Service...
cd packages\java-parser-service
call mvn clean package -DskipTests >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to build Java Parser Service
    cd ..\..
    exit /b 1
)
echo [SUCCESS] Java Parser Service built successfully
cd ..\..

REM Build micro-context
echo [INFO] Building Micro Context Server...
cd packages\micro-context
call npm run build >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to build Micro Context Server
    cd ..\..
    exit /b 1
)
echo [SUCCESS] Micro Context Server built successfully
cd ..\..

REM Build macro-context
echo [INFO] Building Macro Context Server...
cd packages\macro-context
call npm run build >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to build Macro Context Server
    cd ..\..
    exit /b 1
)
echo [SUCCESS] Macro Context Server built successfully
cd ..\..

REM Build spring-component
echo [INFO] Building Spring Component Server...
cd packages\spring-component
call npm run build >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to build Spring Component Server
    cd ..\..
    exit /b 1
)
echo [SUCCESS] Spring Component Server built successfully
cd ..\..

echo [SUCCESS] All packages built successfully
echo.

REM ============================================
REM SETUP TEST ENVIRONMENT
REM ============================================
echo ========================================
echo [Phase 4/5] Running Automated Tests
echo ========================================
echo.

REM Create report directory
if not exist "%REPORT_DIR%" mkdir "%REPORT_DIR%"

REM Run Node.js test runner
echo [INFO] Running test suite...
node test-runner.js "%TEST_PROJECT_PATH%"
if errorlevel 1 (
    echo [ERROR] Test execution failed
    exit /b 1
)

echo [SUCCESS] Test execution completed
echo.

REM ============================================
REM GENERATE FINAL REPORT
REM ============================================
echo ========================================
echo [Phase 5/5] Generating Test Report
echo ========================================
echo.

REM The test-runner.js generates the report
if exist "%REPORT_DIR%\test-report-*.md" (
    echo [SUCCESS] Report generation complete

    REM Find the latest report
    for /f "delims=" %%f in ('dir /b /od "%REPORT_DIR%\test-report-*.md"') do set "LATEST_REPORT=%%f"
    set "REPORT_FILE=%REPORT_DIR%\!LATEST_REPORT!"
) else (
    echo [WARNING] Report file not found
)

echo.

REM ============================================
REM DISPLAY SUMMARY
REM ============================================
echo ========================================
echo Test Execution Summary
echo ========================================
echo.
echo Test execution completed!
echo.
if defined REPORT_FILE (
    echo Report location: %REPORT_FILE%
    echo.
    echo To view the report:
    echo   type %REPORT_FILE%
    echo.
)

echo [SUCCESS] Test automation completed successfully!
echo.
pause
