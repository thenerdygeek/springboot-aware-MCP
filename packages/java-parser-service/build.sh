#!/bin/bash

# Build script for Java Parser Service

echo "🔨 Building Java Parser Service..."
echo ""

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Error: Maven is not installed"
    echo "Please install Maven: https://maven.apache.org/install.html"
    exit 1
fi

# Clean and package
mvn clean package

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Java Parser Service built successfully!"
    echo "📦 JAR location: target/java-parser-service-1.0.0.jar"
    echo ""
    echo "To test the JAR:"
    echo "  java -jar target/java-parser-service-1.0.0.jar /path/to/workspace"
else
    echo ""
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
