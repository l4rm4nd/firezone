# Firezone Maintenance Guide

Reference notes for building the Docker image and keeping dependencies current.

---

## Table of Contents

- [Build the Docker Image](#build-the-docker-image)
- [Deploy / Run the Stack](#deploy--run-the-stack)
- [Update Elixir / Mix Dependencies](#update-elixir--mix-dependencies)
- [Update Ruby Gems (omnibus)](#update-ruby-gems-omnibus)
- [Update npm Packages (website)](#update-npm-packages-website)
- [Update Frontend Assets (fz_http)](#update-frontend-assets-fz_http)
- [Responding to Dependabot / Security Alerts](#responding-to-dependabot--security-alerts)
- [Known Quirks & Gotchas](#known-quirks--gotchas)

---

## Build the Docker Image

```bash
# Standard build (uses Dockerfile.prod)
docker build -f Dockerfile.prod -t firezone:latest .

# Build with an explicit release version tag
docker build -f Dockerfile.prod \
  --build-arg VERSION=7.2.0 \
  -t firezone:7.2.0 .

# ARM64 cross-build (requires docker buildx)
docker buildx build --platform linux/arm64 \
  -f Dockerfile.prod \
  -t firezone:latest-arm64 \
  --load .
```

### What the build does (Dockerfile.prod stages)

1. **Builder stage** (`elixir:1.17.3-alpine`):
   - Installs `nodejs npm build-base git python3 openssl-dev`
   - `mix deps.get --only prod` → fetches Elixir deps from `mix.lock`
   - Applies `openid_connect` patch: replaces `JSON.decode` → `Jason.decode`
   - `mix deps.compile`
   - `npm ci && npm run deploy` inside `apps/fz_http/assets`
   - `mix phx.digest` (digest + compress static assets)
   - `mix compile`
   - `mix release` → produces OTP release in `_build/prod/rel/firezone/`
2. **Runner stage** (`elixir:1.17.3-alpine`):
   - Installs `nftables openssl openssl-dev`
   - Copies only the compiled release from the builder
   - Entrypoint: `/app/bin/server`

---

## Deploy / Run the Stack

```bash
# First-time or after a schema change: migrate the database
docker compose run --rm firezone bin/migrate

# Create or reset the admin user (reads DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD from .env)
docker compose run --rm firezone bin/create-or-reset-admin

# Start everything in the background
docker compose up -d

# Tail logs
docker compose logs -f firezone

# Stop without removing volumes
docker compose down

# Full teardown including volumes (destroys DB data)
docker compose down -v
```

The web UI is exposed at **http://localhost:13000** (bound to 127.0.0.1).

---

## Update Elixir / Mix Dependencies

All Elixir deps live in `mix.lock` (root) and are declared in each app's `mix.exs`.

```bash
# Update a single package
mix deps.update <package_name>

# Update all packages
mix deps.update --all

# Update only security-sensitive transitive deps without touching everything
mix deps.update <dep1> <dep2>

# Check what is outdated
mix hex.outdated

# After updating, recompile
mix deps.compile

# Rebuild the Docker image to bake in the new lock file
docker build -f Dockerfile.prod -t firezone:latest .
```

> **Tip:** After any `mix deps.update`, commit both `mix.lock` and any changed `mix.exs` files together.

---

## Update Ruby Gems (omnibus)

The omnibus package builder lives in `omnibus/`. Its dependencies are managed by Bundler.

**Files to know:**
- `omnibus/Gemfile` — direct deps + minimum version pins for security patches
- `omnibus/Gemfile.lock` — full resolved lockfile (commit this)

```bash
cd omnibus

# Update specific vulnerable gems
bundle update concurrent-ruby faraday

# Update everything (risky — omnibus/chef tooling is version-sensitive)
bundle update

# After updating, verify the resolved versions
grep -E "concurrent-ruby|faraday|rack" Gemfile.lock
```

### Security pin pattern

When a transitive dep has a CVE but we can't change the parent gem, add a
minimum-version pin in `Gemfile`:

```ruby
# Security patches for transitive dependencies
gem 'rack', '>= 2.2.22'
gem 'faraday', '>= 2.12.2'
gem 'concurrent-ruby', '>= 1.3.5'
```

Then run `bundle update <gem>` to regenerate the lockfile.

### Version reference (last updated 2026-06-24)

| Gem | Pinned to | Reason |
|---|---|---|
| `rack` | `>= 2.2.22` | CVE multipart parsing |
| `faraday` | `>= 2.12.2` | NestedParamsEncoder DoS |
| `concurrent-ruby` | `>= 1.3.5` | AtomicReference NaN livelock + RWLock bugs |

---

## Update npm Packages (website)

The marketing/docs website lives in `website/` and is a Next.js app.

```bash
cd website

# Check for vulnerabilities
npm audit

# Update a specific package
npm install <package>@<version>

# Update all non-breaking
npm update

# Check what is outdated
npm outdated
```

### Override pattern for transitive deps

When a transitive dep has a CVE, use the `overrides` field in `website/package.json`:

```json
"overrides": {
  "vulnerable-package": "^x.y.z"
}
```

Then run `npm install` to regenerate `package-lock.json`.

### Version reference (last updated 2026-06-24)

| Package | Version | Notes |
|---|---|---|
| `postcss` | `^8.5.15` | XSS via unescaped `</style>` |
| `dompurify` | `^3.4.11` (override) | ALLOWED_ATTR pollution via `setConfig()` |
| `next` | `^15.5.19` | Latest 15.x stable |

> **Known limitation:** `next@15.x` bundles its own `postcss@8.4.31` internally
> (used for its CSS compiler, not user code). npm audit flags this as
> "No fix available" on the 15.x branch — the fix only lands in `next@16.3.0+`.
> The top-level `postcss` (8.5.15) used by Tailwind/your pipeline is patched.
> Monitor <https://github.com/advisories/GHSA-qx2v-qp2m-jg93> for a 15.x backport.

---

## Update Frontend Assets (fz_http)

The Phoenix LiveView frontend assets live in `apps/fz_http/assets/`.

```bash
cd apps/fz_http/assets

# Install / update packages
npm install

# Build for production (also called by mix phx.digest in Dockerfile)
npm run deploy

# Dev watch mode (use with mix phx.server for local dev)
npm run watch
```

---

## Responding to Dependabot / Security Alerts

### Triage order

1. **Critical / High** in direct deps → update immediately, rebuild image
2. **High** in transitive deps → add a minimum-version pin, run `bundle update` or `npm install`
3. **Moderate** in transitive deps → add override/pin; note if "No fix available"
4. **Low** → batch-fix in the next maintenance window

### Checklist

```
[ ] Identify the affected file: omnibus/Gemfile.lock, website/package-lock.json, mix.lock
[ ] Check latest patched version on RubyGems / npm / Hex
[ ] Add pin / override in the manifest (Gemfile, package.json, mix.exs)
[ ] Run: bundle update <gem>  OR  npm install  OR  mix deps.update <dep>
[ ] Verify new version in lock file
[ ] Rebuild Docker image: docker build -f Dockerfile.prod -t firezone:latest .
[ ] Run migrations if needed: docker compose run --rm firezone bin/migrate
[ ] Smoke test: docker compose up -d && curl -s -o /dev/null -w "%{http_code}" http://localhost:13000/
[ ] Commit: Gemfile + Gemfile.lock, package.json + package-lock.json, mix.lock
[ ] Push and confirm Dependabot alerts are resolved
```

### Useful commands

```bash
# Check installed Ruby gem version
grep "<gemname>" omnibus/Gemfile.lock

# Check latest gem version on RubyGems
gem search <gemname> --exact

# Check installed npm version
node -e "const d=require('./website/node_modules/<pkg>/package.json'); console.log(d.version)"

# Check latest npm version
npm show <package> version

# Full npm vulnerability report
cd website && npm audit

# Check Elixir dep version
grep "<dep>" mix.lock
mix hex.info <dep>
```

---

## Known Quirks & Gotchas

- **`openid_connect` patch** — `Dockerfile.prod` patches `JSON.decode` → `Jason.decode`
  at build time via `sed`. If `openid_connect` is updated, verify the patch still applies
  correctly (or that the upstream has fixed the `JSON` module reference).

- **`wireguardex` / WireGuard native deps** — The `fz_vpn` and `fz_wall` umbrella apps
  depend on `wireguardex` (Rust NIF). For web-UI-only work, run from `apps/fz_http`
  directly (`mix phx.server`) to avoid NIF download failures.

- **Bundler version mismatch** — `omnibus/Gemfile.lock` was generated with Bundler 2.3.14
  but the system may have 2.6.x. Bundler is backwards-compatible for the lock format;
  running `bundle update` will update the `BUNDLED WITH` footer automatically.

- **`next@15.x` internal postcss** — Documented above; cannot be overridden via npm
  `overrides` because it is bundled inside the next package itself, not a hoisted dep.

- **Version env var** — The Docker image reads `VERSION` from a build arg
  (`--build-arg VERSION=x.y.z`). Locally it defaults to `0.0.0+git.0.deadbeef`.
  The `docker-compose.yml` image tag is `firezone:latest`; set the `VERSION` label
  consistently when tagging release images.
