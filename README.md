<div align="center" width="100%">
    <h1>🔥 Firezone 🔥</h1>
    <p>Enterprise-ready zero-trust access platform built on WireGuard®.</p><p>
    <p>Fork of <a href="https://github.com/firezone/firezone/tree/legacy">Firezone 0.7</a>.<br>
</div>

## 💡 Description

Firezone is a self-hosted VPN server and Linux firewall:

- Manage remote access through an intuitive web interface and CLI utility.
- [Deploy on your own infrastructure](https://docs.firezone.dev/deploy?utm_source=readme)
  to keep control of your network traffic.
- Built on [WireGuard®](https://www.wireguard.com/) to be stable, performant,
  and lightweight.

> [!TIP]
> Firezone `legacy` branch (v0.7) hit EoL on January 31st 2024.
>
> This fork tries to keep the dependencies up-to-date via GitHub Dependabot to fix CVEs. It starts with a new v7.0.0 version tag.

![Firezone Architecture](https://user-images.githubusercontent.com/52545545/183804397-ae81ca4e-6972-41f9-80d4-b431a077119d.png)

## 💎 Features

- **Fast:** Uses WireGuard® to be
  [3-4 times](https://wireguard.com/performance/) faster than OpenVPN.
- **SSO Integration:** Authenticate using any identity provider with an OpenID
  Connect (OIDC) connector.
- **Containerized:** All dependencies are bundled via Docker.
- **Simple:** Takes minutes to set up. Manage via a simple CLI.
- **Secure:** Runs unprivileged. HTTPS enforced. Encrypted cookies.
- **Firewall included:** Uses Linux [nftables](https://netfilter.org) to block
  unwanted egress traffic.

### 🚫 Anti-features

Firezone is **not:**

- An inbound firewall
- A tool for creating mesh networks
- A full-featured router
- An IPSec or OpenVPN server

## 🐳 Installation

Firezone can be installed via Docker and Docker Compose.

A public Docker image is provided on [DockerHub](https://hub.docker.com/r/l4rm4nd/firezone).

````bash
# download compose file
wget https://raw.githubusercontent.com/l4rm4nd/firezone/legacy/docker-compose.yml

# generate an .env file
docker run --rm l4rm4nd/firezone:latest bin/gen-env > .env

# adjust .env file to your needs
# define EXTERNAL_URL + DEFAULT_ADMIN_EMAIL + DEFAULT_ADMIN_PASSWORD

# disable telemetry via .env
echo -e "\nTELEMETRY_ENABLED=false" >> .env

# enable local auth
echo -e "\nLOCAL_AUTH_ENABLED=true" >> .env

# migrate database and create admin user
docker compose run --rm firezone bin/migrate
docker compose run --rm firezone bin/create-or-reset-admin

# spawn the container stack
docker compose up -d
````

Afterwards, the admin MGMT UI is accessible at http://127.0.0.1:13000.

It is recommended to combine Firezone with a TLS reverse proxy (e.g. Traefik) and with an Identity Provider (IdP) such as Keycloak or Authentik for Single-Sign-On (SSO) via OAuth/OIDC. Once SSO is enabled, you should disable local authentication via the `.env` file.

## 🔒 Security

This fork focuses on security and fixing outdated dependencies only. There will be no new features or breaking changes.

The ultimate goal is to mitigate security vulnerabilities, so called CVEs. Typically introduced by the use of outdated libraries and packages. Basically to keep the selfhosted Firezone project alive.

We are actively relying on GitHub Dependabot to identify and fix outdated packages. Furthermore, Docker images are scanned by Scout on Dockerhub automatically.

Note that not all CVEs can be fixed or do receive a patch by the vendor. Moreover, there may be packages that cannot be upraded due to dependencies to other packages.

## ✏️ Documentation

Additional documentation on general usage, troubleshooting, and configuration
can be found at [https://docs.firezone.dev](https://docs.firezone.dev).

## License

See [LICENSE](LICENSE).

WireGuard® is a registered trademark of Jason A. Donenfeld.
