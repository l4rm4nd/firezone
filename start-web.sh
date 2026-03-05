#!/bin/bash
# Quick start for Firezone web UI (skips VPN components)

cd "$(dirname "$0")"

# Load asdf
source ~/.asdf/asdf.sh

# Export database credentials
export DATABASE_NAME=firezone_dev
export DATABASE_USER=postgres
export DATABASE_PASSWORD=postgres
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
export MIX_ENV=dev

echo "Starting Firezone Web UI..."
cd apps/fz_http

# Setup database if needed
echo "Setting up database..."
mix ecto.create 2>/dev/null || echo "(database may already exist)"
mix ecto.migrate

# Install Node dependencies
echo "Installing frontend dependencies..."
cd assets && npm install && cd ..

# Start server
echo "Starting Phoenix server at http://localhost:13000"
echo "Press Ctrl+C to stop"
mix phx.server
