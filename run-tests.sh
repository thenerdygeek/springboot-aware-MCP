#!/bin/bash

#
# Test Automation Script for Spring Boot MCP Servers
# This script runs automated tests for all 16 tools across 3 MCP servers
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_PROJECT_PATH="${1:-}"
REPORT_DIR="test-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/test-report-$TIMESTAMP.md"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Java
    if ! command -v java &> /dev/null; then
        print_error "Java not found. Please install Java 11+"
        exit 1
    fi
    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
    print_info "Java version: $JAVA_VERSION"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    NODE_VERSION=$(node --version)
    print_info "Node.js version: $NODE_VERSION"

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install npm"
        exit 1
    fi

    # Check Maven
    if ! command -v mvn &> /dev/null; then
        print_error "Maven not found. Please install Maven 3.6+"
        exit 1
    fi
    MVN_VERSION=$(mvn --version | head -n 1)
    print_info "Maven: $MVN_VERSION"

    print_success "All prerequisites satisfied"
}

# Function to validate test project
validate_test_project() {
    print_header "Validating Test Project"

    if [ -z "$TEST_PROJECT_PATH" ]; then
        print_error "Test project path not provided"
        echo ""
        echo "Usage: ./run-tests.sh <path-to-spring-boot-project>"
        echo ""
        echo "Example:"
        echo "  ./run-tests.sh /path/to/spring-boot-demo"
        echo ""
        exit 1
    fi

    if [ ! -d "$TEST_PROJECT_PATH" ]; then
        print_error "Test project directory does not exist: $TEST_PROJECT_PATH"
        exit 1
    fi

    # Check if it's a valid Spring Boot project
    if [ ! -f "$TEST_PROJECT_PATH/pom.xml" ] && [ ! -f "$TEST_PROJECT_PATH/build.gradle" ]; then
        print_warning "No pom.xml or build.gradle found. This may not be a valid Maven/Gradle project"
    fi

    # Check for src/main/java directory
    if [ ! -d "$TEST_PROJECT_PATH/src/main/java" ]; then
        print_error "src/main/java directory not found in test project"
        exit 1
    fi

    print_info "Test project path: $TEST_PROJECT_PATH"
    print_success "Test project validated"
}

# Function to build all packages
build_packages() {
    print_header "Building All Packages"

    # Build Java parser service
    print_info "Building Java Parser Service..."
    cd packages/java-parser-service
    if mvn clean package -DskipTests > /dev/null 2>&1; then
        print_success "Java Parser Service built successfully"
    else
        print_error "Failed to build Java Parser Service"
        exit 1
    fi
    cd ../..

    # Build micro-context
    print_info "Building Micro Context Server..."
    cd packages/micro-context
    if npm run build > /dev/null 2>&1; then
        print_success "Micro Context Server built successfully"
    else
        print_error "Failed to build Micro Context Server"
        exit 1
    fi
    cd ../..

    # Build macro-context
    print_info "Building Macro Context Server..."
    cd packages/macro-context
    if npm run build > /dev/null 2>&1; then
        print_success "Macro Context Server built successfully"
    else
        print_error "Failed to build Macro Context Server"
        exit 1
    fi
    cd ../..

    # Build spring-component
    print_info "Building Spring Component Server..."
    cd packages/spring-component
    if npm run build > /dev/null 2>&1; then
        print_success "Spring Component Server built successfully"
    else
        print_error "Failed to build Spring Component Server"
        exit 1
    fi
    cd ../..

    print_success "All packages built successfully"
}

# Function to setup test environment
setup_test_environment() {
    print_header "Setting Up Test Environment"

    # Create report directory
    mkdir -p "$REPORT_DIR"

    # Initialize report file
    cat > "$REPORT_FILE" <<EOF
# Test Execution Report

**Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Test Project:** $TEST_PROJECT_PATH
**Report File:** $REPORT_FILE

---

## Environment

- **Java Version:** $(java -version 2>&1 | head -n 1)
- **Node.js Version:** $(node --version)
- **Maven Version:** $(mvn --version | head -n 1)
- **OS:** $(uname -s)

---

## Test Results Summary

EOF

    print_success "Test environment ready"
}

# Function to run Node.js test script
run_node_tests() {
    print_header "Running Automated Tests"

    print_info "Starting Node.js test runner..."

    # Run the Node.js test automation script
    if node test-runner.js "$TEST_PROJECT_PATH" "$REPORT_FILE"; then
        print_success "Test runner completed successfully"
    else
        print_error "Test runner encountered errors"
    fi
}

# Function to generate final report
generate_final_report() {
    print_header "Generating Final Report"

    # Read results from report file
    if [ -f "$REPORT_FILE" ]; then
        print_info "Test report generated: $REPORT_FILE"

        # Display summary
        echo ""
        echo "=== Test Summary ==="
        grep -A 10 "## Results Summary" "$REPORT_FILE" || echo "Summary not found in report"
        echo ""

        print_success "Report generation complete"
    else
        print_error "Report file not found"
    fi
}

# Function to display final summary
display_summary() {
    print_header "Test Execution Summary"

    echo ""
    echo "Test execution completed!"
    echo ""
    echo "Report location: $REPORT_FILE"
    echo ""
    echo "To view the report:"
    echo "  cat $REPORT_FILE"
    echo ""
    echo "To view in browser (if you have a markdown viewer):"
    echo "  open $REPORT_FILE"
    echo ""
}

# Main execution
main() {
    print_header "Spring Boot MCP Servers - Test Automation"

    echo "This script will:"
    echo "  1. Check prerequisites"
    echo "  2. Validate test project"
    echo "  3. Build all packages"
    echo "  4. Run automated tests"
    echo "  5. Generate test report"
    echo ""

    # Execute test phases
    check_prerequisites
    validate_test_project
    build_packages
    setup_test_environment
    run_node_tests
    generate_final_report
    display_summary

    print_success "Test automation completed successfully!"
}

# Run main function
main
