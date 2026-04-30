# Deploying Phantom to EC2

A single-node deployment of the Phantom food-cost app on an Ubuntu or Amazon Linux 2023 EC2 instance. Aimed at one restaurant group; a t3.small is plenty for the seeded workload.

## Prerequisites on the instance

Install Node 20+, the C/C++ toolchain (needed because `better-sqlite3` is a native module), and git.

**Amazon Linux 2023**

```bash
sudo dnf install -y nodejs gcc-c++ make python3 git
```

**Ubuntu / Debian**

```bash
sudo apt update
sudo apt install -y nodejs npm build-essential python3 git
```

Verify Node is ≥ 20:

```bash
node --version
```

If it's older, install via [NodeSource](https://github.com/nodesource/distributions) or `nvm`.

## Clone and build

The repo is public, so no auth needed for the clone.

```bash
sudo mkdir -p /opt/phantom
sudo chown $USER /opt/phantom
git clone https://github.com/joshphoenix1/Phantom.git /opt/phantom
cd /opt/phantom

# Production build
npm ci
npm run build
```

## Configure environment

```bash
cat > .env.local <<'EOF'
ANTHROPIC_API_KEY=sk-ant-...
EOF
chmod 600 .env.local
```

Without an Anthropic key the app still runs — paste-to-cost falls back to a regex parser, and supplier invoice import refuses to run (no sensible fallback for PDF extraction).

## First start (smoke test)

```bash
npm start
```

This binds to `0.0.0.0:3000`. Open the EC2's security group to port 3000 from your IP and visit `http://<public-ip>:3000`. The first request triggers DB initialisation + seed (~2 seconds), then everything is fast.

When you're satisfied, kill the foreground process and move on to a supervised setup.

## Process supervision

### Option A — pm2 (easiest)

```bash
sudo npm i -g pm2
cd /opt/phantom
pm2 start npm --name phantom -- start
pm2 save
pm2 startup        # follow the printed sudo command — survives reboots
```

Useful day-to-day commands:

```bash
pm2 status
pm2 logs phantom
pm2 restart phantom
pm2 reload phantom    # zero-downtime when on cluster mode
```

### Option B — systemd (cleaner for production)

Create `/etc/systemd/system/phantom.service`:

```ini
[Unit]
Description=Phantom food-cost app
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/phantom
EnvironmentFile=/opt/phantom/.env.local
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only
ReadWritePaths=/opt/phantom/.data /opt/phantom/.next

[Install]
WantedBy=multi-user.target
```

Adjust `User=` to match your distro (`ec2-user` on Amazon Linux, `ubuntu` on Ubuntu).

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable phantom
sudo systemctl start phantom
sudo systemctl status phantom
journalctl -u phantom -f         # tail logs
```

## HTTPS + a real domain — Caddy

Caddy fetches Let's Encrypt certificates automatically, so this is the lowest-friction path to TLS.

Install:

```bash
# Amazon Linux 2023
sudo dnf install -y 'dnf-command(copr)'
sudo dnf copr enable -y @caddy/caddy
sudo dnf install -y caddy

# Ubuntu — see https://caddyserver.com/docs/install for current keys
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Replace `/etc/caddy/Caddyfile` with:

```
phantom.yourdomain.nz {
    reverse_proxy localhost:3000

    encode zstd gzip

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
    }
}
```

```bash
sudo systemctl reload caddy
```

DNS: point `phantom.yourdomain.nz` A-record at the EC2 public IP (or use an Elastic IP so it doesn't drift on reboot).

Security group: open **80** and **443** inbound from `0.0.0.0/0`, **close 3000** (Caddy proxies it locally — it shouldn't be public).

## Common gotchas

| Symptom | Cause | Fix |
|---|---|---|
| `npm ci` fails with `node-gyp` errors | Missing C++ toolchain | `dnf install gcc-c++ make python3` (or `apt install build-essential python3`) |
| App throws on first request: `ENOENT mkdir '.data'` | App can't write to working dir | `chown $USER /opt/phantom` and run as that user; check `WorkingDirectory` in systemd unit |
| First page-load is slow (~2s) on every request | `npm run dev` mode, not built | Run `npm run build` then `npm start` — never run `dev` in production |
| Invoice import returns 503 | `ANTHROPIC_API_KEY` not set | Add to `.env.local`, restart the service |
| Recipes don't survive instance restart | DB is on the instance store volume | Mount an EBS volume at `/opt/phantom/.data`, or back it up |
| `pm2` / `systemd` doesn't see your env vars | Service started before `.env.local` existed | `pm2 restart phantom --update-env` or `systemctl restart phantom` |
| Port 3000 timeouts from your laptop | EC2 security group doesn't allow it | Either open 3000, or (better) put Caddy in front and open 443 only |

## Updating the deployment

```bash
cd /opt/phantom
git pull
npm ci             # re-run if package.json changed; safe to skip if not
npm run build
sudo systemctl restart phantom    # or: pm2 restart phantom
```

The SQLite database persists across deploys — migrations are applied automatically on the first request after restart, but only those that haven't been applied yet (tracked in a `__migrations` table inside the DB).

## Backups

The whole app's persistent state is one SQLite file:

```bash
# Snapshot
sqlite3 /opt/phantom/.data/food.db ".backup '/tmp/phantom-$(date +%F).db'"

# Or just copy — better-sqlite3 uses WAL, so .db + .db-wal + .db-shm should
# all be copied together for a hot backup. The .backup command above is safer.
```

Cron a daily backup to S3:

```bash
# /etc/cron.daily/phantom-backup (chmod +x)
#!/bin/bash
set -e
TS=$(date +%F)
sqlite3 /opt/phantom/.data/food.db ".backup '/tmp/phantom-$TS.db'"
aws s3 cp /tmp/phantom-$TS.db s3://your-bucket/phantom/
rm /tmp/phantom-$TS.db
```

## Sizing notes

The seed loads 85 ingredients and 20 recipes. A real menu (full Cafe Hanoi + Ghost Street + a third venue) is in the same order of magnitude — say 200 ingredients and 60 recipes per venue.

- **t3.nano (0.5GB RAM)**: too small. Build will OOM.
- **t3.micro (1GB)**: works for runtime, OOMs during `npm run build` unless you swap.
- **t3.small (2GB)**: comfortable.
- **t3.medium (4GB)**: overkill for a single org, but cheap headroom.

If you're tight on RAM, build locally / in CI, then upload only the built artefacts (`/opt/phantom` minus `node_modules` rebuilt with `npm ci --production`).

## What this guide does NOT cover

- High-availability / multi-AZ — you're running one node with one SQLite file. Single-instance is fine for one restaurant group; horizontal scaling needs a real Postgres swap (`drizzle.config.ts` + driver change).
- CI/CD — push triggers nothing. For auto-deploy, wire a GitHub Action that SSHes in and runs the update sequence above.
- Auth — Phantom currently has no login. Anyone who can reach the URL can edit recipes. Add Clerk/Auth.js (or at minimum HTTP basic auth in Caddy) before exposing publicly.
