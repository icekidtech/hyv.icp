#!/bin/bash
set -e

echo "🔨 Building Hyv AI Engine..."

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Ensure wasm32-wasi target is installed
rustup target add wasm32-wasip1

# Navigate to the AI engine directory
cd src/hyv_ai_engine

# Clean previous builds
cargo clean

# Build the Rust canister with verbose output
echo "📦 Building Rust canister..."
CARGO_TARGET_DIR=target cargo build --target wasm32-wasip1 --release --lib

# Check if the build was successful
if [ $? -ne 0 ]; then
    echo "❌ Cargo build failed"
    exit 1
fi

# Look for the WASM file
WASM_FILE="target/wasm32-wasip1/release/hyv_ai_engine.wasm"

if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found at expected location: $WASM_FILE"
    exit 1
fi

echo "✅ Found WASM file: $WASM_FILE"

# Go back to project root
cd ../..

# Create target directory structure if it doesn't exist
mkdir -p target/wasm32-wasip1/release/

# Copy WASM file to the location dfx expects
cp "src/hyv_ai_engine/$WASM_FILE" "target/wasm32-wasip1/release/hyv_ai_engine.wasm"

# Create IC-compatible WASM file
if command -v wasi2ic >/dev/null 2>&1; then
    echo "🔄 Converting to IC-compatible WASM..."
    wasi2ic "target/wasm32-wasip1/release/hyv_ai_engine.wasm" "target/wasm32-wasip1/release/hyv_ai_engine-ic.wasm"
    
    if [ -f "target/wasm32-wasip1/release/hyv_ai_engine-ic.wasm" ]; then
        echo "✅ IC WASM file created: target/wasm32-wasip1/release/hyv_ai_engine-ic.wasm"
    else
        echo "❌ Failed to create IC WASM file"
        exit 1
    fi
else
    echo "⚠️  wasi2ic not found, using original WASM file"
fi

echo "🎉 Build completed successfully!"
echo "📁 WASM file available at: target/wasm32-wasip1/release/hyv_ai_engine.wasm"