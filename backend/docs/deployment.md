# SharpKode Workforce Backend Deployment

Target:

- Ubuntu VPS
- Node.js LTS
- PM2
- Nginx reverse proxy
- MongoDB Atlas
- Let's Encrypt SSL
- API subdomain: `api.sharpkode.com`
- Frontend origins: `https://admin.sharpkode.com`, `https://portal.sharpkode.com`

## Environment

Create `/var/www/sharpkode-workforce/backend/.env` from `.env.example`.

Required production values:

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=<64+ random chars>
JWT_REFRESH_SECRET=<different 64+ random chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_ORIGINS=https://admin.sharpkode.com,https://portal.sharpkode.com
```

## PM2

```bash
cd /var/www/sharpkode-workforce/backend
npm ci --omit=dev
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

If your PM2 version does not load ESM ecosystem files, use the CommonJS fallback:

```bash
pm2 start ecosystem.config.cjs
```

Useful commands:

```bash
pm2 status
pm2 logs sharpkode-workforce-api
pm2 reload sharpkode-workforce-api
pm2 monit
```

## Nginx

Copy `deploy/nginx-api.sharpkode.com.conf` to:

```bash
/etc/nginx/sites-available/api.sharpkode.com
```

Enable it:

```bash
ln -s /etc/nginx/sites-available/api.sharpkode.com /etc/nginx/sites-enabled/api.sharpkode.com
nginx -t
systemctl reload nginx
```

## SSL

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d api.sharpkode.com
certbot renew --dry-run
```

## Health Checks

Liveness:

```http
GET https://api.sharpkode.com/health
```

Readiness:

```http
GET https://api.sharpkode.com/ready
```

## Logging Strategy

The API emits one-line JSON logs to stdout/stderr. PM2 captures those logs into:

- `logs/pm2-out.log`
- `logs/pm2-error.log`

Recommended production additions:

- Enable PM2 log rotation: `pm2 install pm2-logrotate`
- Ship logs to a central store when usage grows
- Alert on 5xx spikes and readiness failures

## Backups

MongoDB Atlas:

- Enable scheduled cloud backups
- Keep point-in-time restore enabled for production clusters
- Test restore quarterly into a staging database

Server:

- Back up `.env`, Nginx configs, PM2 ecosystem file, and deployment scripts
- Do not back up `node_modules`; rebuild with `npm ci`

## Security Checklist

- Use MongoDB Atlas IP allowlist for the VPS public IP
- Use strong unique JWT secrets
- Keep `CLIENT_ORIGINS` restricted to real frontend domains
- Confirm development bootstrap accounts are not present in production
- Confirm `backend/bootstrap-credentials.json` is not deployed
- Run the app as a non-root Linux user
- Keep UFW open only for `22`, `80`, and `443`
- Keep Node.js and Ubuntu packages patched
- Never commit production `.env`
