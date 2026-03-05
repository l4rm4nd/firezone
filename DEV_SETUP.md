# Firezone Local Development Setup

## Prerequisites
- Docker and Docker Compose
- asdf-vm with Elixir 1.17.3-otp-27 and Node.js

## Quick Start

1. **Start Database:**
```bash
# Make sure .env file exists with DATABASE_PASSWORD=postgres
echo "DATABASE_PASSWORD=postgres" >> .env

# Start PostgreSQL (create fresh if needed)
docker compose down -v
docker compose  up -d postgres
```

2. **Setup and Run Web App:**
```bash
# Load asdf
source ~/.asdf/asdf.sh

# Navigate to HTTP app
cd apps/fz_http

# Set environment
export DATABASE_PASSWORD=postgres
export MIX_ENV=dev

# Setup database
mix ecto.create
mix ecto.migrate

# Install frontend deps (may need sudo for node_modules permissions)
cd assets && npm install && cd ..

# Start Phoenix server
mix phx.server
```

3. **Access the app** at http://localhost:13000

## Testing Package Upgrades

To test package upgrades:
1. Update `mix.exs` or run `mix deps.update <package>`
2. Run `mix deps.compile`
3. Restart Phoenix server with `mix phx.server`

Changes to .ex files hot-reload automatically.

## Notes
- VPN components (wireguardex) have download issues but aren't needed for web UI testing
- Running from apps/fz_http avoids umbrella app wireguardex dependency
