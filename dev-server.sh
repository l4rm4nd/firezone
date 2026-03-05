#!/bin/bash
# Quick dev server startup script - skips VPN components

set -e

# Load asdf
source ~/.asdf/asdf.sh

# Set environment variables
export DATABASE_NAME=firezone_dev
export DATABASE_USER=postgres
export DATABASE_PASSWORD=postgres
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
export MIX_ENV=dev

# Compile just the HTTP app
cd "$(dirname "$0")"
echo "==> Compiling web application..."
cd apps/fz_http && mix compile && cd ../..

# Setup database if needed
echo "==> Setting up database..."
mix ecto.create --quiet  2>/dev/null || echo "Database already exists"
mix ecto.migrate

# Install frontend assets 
echo "==> Installing JavaScript dependencies..."
cd apps/fz_http/assets && npm install && cd ../../..

# Start Phoenix server (web UI only)
echo "==> Starting Phoenix server on http://localhost:13000..."
cd apps/fz_http && iex -S mix phx.server
