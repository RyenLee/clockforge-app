#!/bin/bash

set -e

MODE="${1:-release}"
TARGET="${2:-default}"

echo "============================================"
echo "  ClockForge Build Script (Shell)"
echo "============================================"
echo ""

test_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "ERROR: $1 is not installed. Please install it first."
        exit 1
    fi
}

echo "[1/5] Checking dependencies..."
test_command "node"
test_command "pnpm"
test_command "cargo"
test_command "tauri"

NODE_VERSION=$(node --version)
PNPM_VERSION=$(pnpm --version)
RUST_VERSION=$(cargo --version | head -n1)
TAURI_VERSION=$(tauri --version)

echo "  Node.js: $NODE_VERSION"
echo "  pnpm: $PNPM_VERSION"
echo "  Cargo: $RUST_VERSION"
echo "  Tauri CLI: $TAURI_VERSION"
echo ""

echo "[2/5] Installing dependencies..."
pnpm install
echo "  Dependencies installed successfully"
echo ""

echo "[3/5] Building frontend..."
pnpm run build
echo "  Frontend built successfully"
echo ""

echo "[4/5] Building Tauri application..."
BUILD_ARGS=()
if [ "$MODE" = "release" ]; then
    BUILD_ARGS+=("--release")
else
    BUILD_ARGS+=("--debug")
fi

if [ "$TARGET" != "default" ]; then
    BUILD_ARGS+=("--target")
    BUILD_ARGS+=("$TARGET")
fi

echo "  Mode: $MODE"
echo "  Target: $TARGET"

pnpm run tauri build "${BUILD_ARGS[@]}"
echo "  Tauri application built successfully"
echo ""

echo "[5/5] Build completed!"
echo "============================================"

if [ "$MODE" = "release" ]; then
    if [ "$(uname -s)" = "Darwin" ]; then
        TARGET_DIR="aarch64-apple-darwin"
    else
        TARGET_DIR="x86_64-unknown-linux-gnu"
    fi
    OUTPUT_PATH="src-tauri/target/$TARGET_DIR/release"
else
    if [ "$(uname -s)" = "Darwin" ]; then
        TARGET_DIR="aarch64-apple-darwin"
    else
        TARGET_DIR="x86_64-unknown-linux-gnu"
    fi
    OUTPUT_PATH="src-tauri/target/$TARGET_DIR/debug"
fi

echo "  Output directory: $OUTPUT_PATH"
echo "============================================"
