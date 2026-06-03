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
