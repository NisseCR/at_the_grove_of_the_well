# Hosting

## VPS Deployment

The app runs on a VPS via Docker Compose behind Cloudflare (Full Strict SSL).

### Server Setup (one-time)

```bash
# Update system
apt update && apt upgrade -y

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Docker
curl -fsSL https://get.docker.com | sh

# Non-root user
adduser <user>
usermod -aG sudo <user>
usermod -aG docker <user>
cp -R /root/.ssh /home/<user>/
chown -R <user>:<user> /home/<user>/.ssh

# Disable root + password SSH (in /etc/ssh/sshd_config)
# PermitRootLogin no
# PasswordAuthentication no
systemctl restart ssh

# Brute-force protection
apt install fail2ban
```

### App Setup

```bash
git clone https://github.com/NisseCR/at_the_grove_of_the_well
cd at_the_grove_of_the_well
```

Create `.env` in repo root:
```
ASSETS_DIR=<path to assets on server>
ALLOWED_ORIGINS=https://<your-domain>
VITE_PROJECT_NAME=At the Grove of the Well
```

Add Cloudflare Origin Certificate files to the server:
- `/etc/ssl/certs/<cert>.pem`
- `/etc/ssl/private/<cert>.key`

Transfer assets from local machine, then start:
```bash
docker compose up -d --build
```

### Deploying Updates

```bash
git pull
docker compose up -d --build
```

### SSL

Cloudflare Full Strict mode — origin certificate mounted into the nginx container via `docker-compose.yml`. nginx redirects port 80 → 443.

## Running Without VS Code

Double-click `run.bat` in the project root to start both servers in separate terminal windows. No VS Code needed — closing it frees up meaningful CPU and memory during sessions.

## Streaming the Player View (Discord)

To share the player view via Discord without the browser pausing when minimised:

1. **OBS** — create a new scene with a Browser source pointing to the player view URL. In the Browser source settings, enable **"Control audio via OBS"**. Interact with the page once to unlock audio.
2. **OBS preview** — right-click the OBS preview → **Open Preview Projector**. This opens the player view in a dedicated window that keeps rendering regardless of browser state.
3. **Discord** — start a stream, go to the **Applications** tab, select **Projector - Preview**. Application audio is included automatically.

VoiceMeeter and OBS Virtual Camera are not needed.

## Remote Players (Tailscale)

Install [Tailscale](https://tailscale.com) on your PC and invite each player to your network. They install Tailscale once, accept the invite, then open the player view via your Tailscale IP in their browser. No port forwarding needed — works behind CGNAT and 5G internet.

### Instructions for Players

> **Requirements:** Discord + Tailscale
>
> Tailscale is a free app that creates a private, encrypted connection directly between your device and my PC — similar to how self-hosted Foundry VTT works when connecting to a GM's server, except Tailscale handles the networking automatically without any port forwarding.
>
> Your traffic goes directly to my machine and nowhere else. Tailscale's servers only help your device find mine — they never see your data. Only people I explicitly invite can connect, and I can revoke access at any time.
>
> Setup is a one-time install and a Google/GitHub/Microsoft login. After that you just open a link in your browser.
