#!/bin/bash
PROJECT_NAME="project-management-system"
ENV_FILE=".env.final"

echo "🔐 Uploading secrets from $ENV_FILE to Cloudflare Pages ($PROJECT_NAME)..."

while IFS='=' read -r key value; do
  # Skip comments and empty lines
  if [[ -z "$key" || "$key" == \#* ]]; then
    continue
  fi

  # Remove quotes from value if present
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')

  echo "👉 Setting $key..."
  echo "$value" | npx wrangler pages secret put "$key" --project-name "$PROJECT_NAME"

done < "$ENV_FILE"

echo "✅ All secrets uploaded!"
