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

Create `.env` in repo root (see `.env.example`):

```
PUBLIC_ASSETS_BASE=https://<your-cdn-url>
ORIGIN=https://<your-domain>
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY=<your-access-key-id>
R2_SECRET_KEY=<your-secret-access-key>
R2_BUCKET=<your-bucket-name>
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

### Updating Audio Assets

Static assets are served by nginx with `Cache-Control: public, immutable` and a 1-year expiry. Cloudflare and browsers will cache files indefinitely at their current URL.

If you reprocess an audio file (resample, normalise) and redeploy it at the same path, **manually purge the Cloudflare cache** after deploying:

1. Cloudflare Dashboard → your domain → **Caching → Purge Cache**
2. Choose **Custom Purge** and enter the affected file URL(s), e.g. `https://grove.paracosm-vtt.com/ambiences/02-precipitation/rain.webm`
3. Or choose **Purge Everything** to clear all cached assets at once

Players will then fetch the updated file on their next request.
