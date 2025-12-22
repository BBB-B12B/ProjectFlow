#!/bin/bash

# Enable job control
set -m

# -----------------------------------------------------------------------------
# 1. Prerequisite Checks & Setup
# -----------------------------------------------------------------------------
echo "🔍 Checking System Prerequisites..."

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js is not installed."
  echo "👉 Please install Node.js (v18+) from https://nodejs.org/"
  exit 1
fi
echo "✅ Node.js $(node -v) is installed."

# Check for npm
if ! command -v npm &> /dev/null; then
  echo "❌ Error: npm is not installed."
  exit 1
fi

# Auto-install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
  echo "📦 Dependencies not found. Installing now... (This may take a moment)"
  npm install
  if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies."
    exit 1
  fi
  echo "✅ Dependencies installed successfully."
else
  echo "✅ Dependencies (node_modules) found."
  # Optional: You can uncomment the line below to force update every time
  # npm install
fi

# -----------------------------------------------------------------------------
# 2. Cleanup Function (Zombie Process Prevention)
# -----------------------------------------------------------------------------
cleanup() {
  echo ""
  echo "🛑 Shutting down services..."
  
  # Kill all child processes in the current process group
  kill 0
  
  # Ensure ports are freed (double safety)
  npx kill-port 9003 4000 > /dev/null 2>&1
  
  echo "✅ Cleanup complete."
  exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# -----------------------------------------------------------------------------
# 3. Helper Functions
# -----------------------------------------------------------------------------
wait_for_url() {
  local url=$1
  local name=$2
  local max_retries=60 # 60 seconds timeout
  local attempts=0

  echo -n "⏳ Waiting for $name to be ready..."
  
  while ! curl --output /dev/null --silent --head --fail "$url"; do
    attempts=$((attempts+1))
    if [ $attempts -ge $max_retries ]; then
      echo "❌ Error: Timed out waiting for $name."
      return 1
    fi
    echo -n "."
    sleep 1
  done
  
  echo " ✅ Ready!"
  return 0
}

# -----------------------------------------------------------------------------
# 4. Application Start
# -----------------------------------------------------------------------------
echo "🧹 Pre-flight check: Cleaning ports..."
npx kill-port 9003 4000 > /dev/null 2>&1

echo "----------------------------------------"
echo "🚀 Starting ProjectManagement System..."
echo "----------------------------------------"

# Start Genkit in background
echo "👉 Launching Genkit Backend..."
# CI=true and GENKIT_ANALYTICS_OPT_OUT=true prevent interactive prompts (like analytics consent)
# that cause EIO errors when running in the background.
CI=true GENKIT_ANALYTICS_OPT_OUT=true npm run genkit:dev &
GENKIT_PID=$!

# Start Next.js in background
echo "👉 Launching Next.js Frontend..."
# NOTE: Next.js output can be verbose, so we just run it. 
# You might want to pipe output if it's too much, but for dev it's usually good.
npm run dev &
NEXT_PID=$!

# -----------------------------------------------------------------------------
# 5. Wait for Readiness & Open Browser
# -----------------------------------------------------------------------------

# Wait for Genkit UI (Port 4000)
wait_for_url "http://localhost:4000" "Genkit Backend"

# Wait for Next.js App (Port 9003)
wait_for_url "http://localhost:9003" "Next.js Frontend"

echo "----------------------------------------"
echo "🎉 System is fully UP and RUNNING!"
echo "----------------------------------------"
echo "🌐 Frontend: http://localhost:9003"
echo "🧠 Genkit UI: http://localhost:4000"
echo "----------------------------------------"
echo "🚀 Opening browser..."

# Open browser on Mac (or Linux/Windows compatible way if needed, but assuming Mac per user env)
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "http://localhost:9003"
elif command -v xdg-open &> /dev/null; then
  xdg-open "http://localhost:9003"
fi

# Wait for all background processes to finish
wait
