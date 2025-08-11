#!/bin/bash
set -e

echo "🔨 Building Hyv AI Engine..."

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Ensure wasm32-wasi target is installed
rustup target add wasm32-wasi

# Navigate to the AI engine directory
cd src/hyv_ai_engine

# Clean previous builds
cargo clean

# Build the Rust canister with verbose output
echo "📦 Building Rust canister..."
CARGO_TARGET_DIR=target cargo build --target wasm32-wasi --release --lib

# Check if the build was successful
if [ $? -ne 0 ]; then
    echo "❌ Cargo build failed"
    exit 1
fi

# Look for the WASM file
WASM_FILE="target/wasm32-wasi/release/hyv_ai_engine.wasm"

if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found at expected location: $WASM_FILE"
    echo "📁 Contents of target/wasm32-wasi/release/:"
    ls -la target/wasm32-wasi/release/ || echo "Directory does not exist"
    
    # Try to find any .wasm files
    echo "🔍 Searching for any .wasm files:"
    find target -name "*.wasm" -type f || echo "No .wasm files found"
    exit 1
fi

echo "✅ Found WASM file: $WASM_FILE"

# Create IC-compatible WASM file
if command -v wasi2ic >/dev/null 2>&1; then
    echo "🔄 Converting to IC-compatible WASM..."
    wasi2ic "$WASM_FILE" "${WASM_FILE%.wasm}-ic.wasm"
    
    if [ -f "${WASM_FILE%.wasm}-ic.wasm" ]; then
        echo "✅ IC WASM file created: ${WASM_FILE%.wasm}-ic.wasm"
    else
        echo "❌ Failed to create IC WASM file"
        exit 1
    fi
else
    echo "⚠️  wasi2ic not found, copying original WASM file"
    cp "$WASM_FILE" "${WASM_FILE%.wasm}-ic.wasm"
fi

echo "🎉 Build completed successfully!"