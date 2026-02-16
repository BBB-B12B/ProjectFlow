#!/bin/bash

# Enable job control
set -e

echo "🚀 Starting Deployment Process..."

# -----------------------------------------------------------------------------
# 1. Pre-flight Checks & Cleanup
# -----------------------------------------------------------------------------

echo "🧹 Cleaning up..."

# Kill Localhost if running (release file locks on .next)
echo "   - Stopping local server (port 9003)..."
npx kill-port 9003 > /dev/null 2>&1 || true

# Remove macOS metadata files (prevent build errors)
echo "   - Removing '._' metadata files..."
find . -type f -name "._*" -delete

# -----------------------------------------------------------------------------
# 2. Build
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# 2. Build (Root Strategy with Metadata Suppression)
# -----------------------------------------------------------------------------
# Challenge: Running `vercel build` on exFAT/Network drive creates `._` files which cause "Ma" JSON error.
# Workaround: Run a background process to aggressively delete these files during the build.

# -----------------------------------------------------------------------------
# 2. Build (Standard with Metadata Suppression)
# -----------------------------------------------------------------------------
# Challenge: Running builds on exFAT/Network drive creates `._` files which cause "Ma" JSON error.
# Workaround: Run a background process to aggressively delete these files during the build.

# -----------------------------------------------------------------------------
# 2. Build (Temp Directory Strategy)
# -----------------------------------------------------------------------------
# Workaround: Build in /tmp (APFS) to avoid exFAT `._` metadata files causing JSON errors.

PROJECT_DIR=$(pwd)
TEMP_DIR=$(mktemp -d)
echo "🔨 Preparing temp build environment (Full Copy)..."
echo "   Source: $PROJECT_DIR"
echo "   Dest:   $TEMP_DIR"

# Clean source first
find . -type f -name "._*" -delete

# Full copy including .git (required for project context) but exclude potential heavy build artifacts
# We rely on next-on-pages to build from scratch in the temp dir
rsync -a --exclude '.next' --exclude '.vercel' --exclude 'node_modules' "$PROJECT_DIR/" "$TEMP_DIR/"

# Symlink node_modules to save time/space (APFS handles symlinks fine)
# If symlink fails (cross-device), we might need to copy, but let's try symlink first for speed.
# NOTE: If /tmp is on a different volume than Project, symlink works but relative paths might be tricky.
# Safest is to use absolute path for source.
ln -s "$PROJECT_DIR/node_modules" "$TEMP_DIR/node_modules"

# Copy env files explicitly to ensure they are picked up
cp "$PROJECT_DIR/.env" "$TEMP_DIR/" 2>/dev/null || true
cp "$PROJECT_DIR/.env.local" "$TEMP_DIR/" 2>/dev/null || true
echo "   - Environment variables copied."


cd $TEMP_DIR
echo "🏗️  Running Cloudflare Next-on-Pages Build (in temp)..."
# This runs 'vercel build' internally but configured for static output
if npx @cloudflare/next-on-pages; then
    echo "✅ Build Success!"
    
    # -------------------------------------------------------------------------
    # SAFETY FIX: Incident 10 - Explicitly copy static assets
    # Sometimes next-on-pages misses copying .next/static to .vercel/output/static
    # -------------------------------------------------------------------------
    echo "🛡️  Verifying and Copying Static Assets..."
    mkdir -p .vercel/output/static/_next/static
    

    # Copy static assets if they exist in .next/static
    if [ -d ".next/static" ]; then
        echo "   - Copying .next/static to .vercel/output/static/_next/static..."
        # Use rsync to avoid "identical" errors and handle updates gracefully
        rsync -a .next/static/ .vercel/output/static/_next/static/
    else
        echo "⚠️  Warning: .next/static not found in build directory!"
    fi

    # Copy public folder content if exists
    if [ -d "public" ]; then
        echo "   - Copying public/ to .vercel/output/static/..."
        rsync -a public/ .vercel/output/static/
    fi

else
    echo "❌ Build Failed!"
    # Cleanup
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "📦 Syncing artifacts back to workspace..."
cd "$PROJECT_DIR"
rm -rf .vercel
# Copy the output back
rsync -a "$TEMP_DIR/.vercel/" .vercel/

# Cleanup
rm -rf "$TEMP_DIR"

echo "🧹 Final cleanup of output..."
# Remove metadata files that cause "Invalid Token" errors in Worker Bundle
find .vercel -type f -name "._*" -delete

# -----------------------------------------------------------------------------
# 3. Deploy
# -----------------------------------------------------------------------------

echo "----------------------------------------"
echo "✅ Build Complete!"
echo "----------------------------------------"
echo "🚀 To deploy, run the following command (requires login):"
echo ""
echo "   npx wrangler pages deploy .vercel/output/static"
echo ""
echo "----------------------------------------"

# Optional: Uncomment to auto-deploy if you have CLOUDFLARE_API_TOKEN set or are logged in
npx wrangler pages deploy .vercel/output/static --project-name project-management-system
