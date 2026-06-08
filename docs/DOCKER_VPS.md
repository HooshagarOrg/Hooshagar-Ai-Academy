# استقرار هوشاگر با Docker روی VPS اوبونتو

راهنمای قدم‌به‌قدم برای اجرای اپ Next.js روی VPS با Docker. دیتابیس و Auth روی **Supabase Cloud** می‌مانند.

## پیش‌نیاز

- VPS اوبونتو با Docker و Docker Compose
- حداقل ۴GB RAM (۶GB توصیه می‌شود برای build)
- دسترسی SSH به سرور
- کلیدهای Supabase و AI از [`env.example`](../env.example)

---

## فاز ۱ — آماده‌سازی سرور

روی VPS اجرا کنید:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl

# بررسی Docker
docker --version
docker compose version

# فایروال
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
# بعد از Nginx:
# sudo ufw allow 80/tcp
# sudo ufw allow 443/tcp
sudo ufw enable
```

یا اسکریپت آماده:

```bash
bash scripts/vps-setup.sh
```

---

## فاز ۲ — دریافت کد

**GitHub (SSH):**

```bash
cd ~
git clone git@github.com:HooshagarOrg/Hooshagar-Ai-Academy.git hooshagar
cd hooshagar
```

**از لپ‌تاپ (بدون Git):** پوشه پروژه را بدون `node_modules` و `.next` zip کنید و با SCP بفرستید:

```bash
# روی لپ‌تاپ (PowerShell)
scp hooshagar.zip user@YOUR_SERVER_IP:~/
# روی VPS
unzip hooshagar.zip -d ~/hooshagar && cd ~/hooshagar
```

---

## فاز ۳ — تنظیم `.env`

```bash
cd ~/hooshagar
cp env.example .env
nano .env
```

**حداقل اجباری:**

| متغیر | توضیح |
|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | آدرس Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | کلید anon |
| `SUPABASE_SERVICE_ROLE_KEY` | کلید service role |
| `GOOGLE_API_KEY` | AI اصلی |

**برای VPS (IP موقت):**

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://YOUR_SERVER_IP:3000
NEXTAUTH_URL=http://YOUR_SERVER_IP:3000
NEXT_TELEMETRY_DISABLED=1
```

> `NEXT_PUBLIC_*` در زمان **build** داخل image می‌روند؛ بعد از تغییر آن‌ها حتماً rebuild کنید.

**Sentry:** اگر `SENTRY_AUTH_TOKEN`، `SENTRY_ORG` و `SENTRY_PROJECT` ندارید، خالی بگذارید (build بدون Sentry plugin).

---

## فاز ۴ — Build و اجرا

```bash
cd ~/hooshagar

docker compose build --no-cache
docker compose up -d

# مشاهده لاگ
docker compose logs -f app
```

تست: `http://YOUR_SERVER_IP:3000`

**به‌روزرسانی:**

```bash
git pull
docker compose build
docker compose up -d
```

---

## فاز ۵ — Supabase (اجباری برای لاگین)

[Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **URL Configuration**:

| فیلد | مقدار |
|------|--------|
| Site URL | `http://YOUR_SERVER_IP:3000` |
| Redirect URLs | `http://YOUR_SERVER_IP:3000/**` |

با دامنه: `https://yourdomain.com` و `https://yourdomain.com/**`

---

## فاز ۶ (اختیاری) — دامنه + HTTPS با Nginx

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

فایل نمونه: [`deploy/nginx/hooshagar.conf`](../deploy/nginx/hooshagar.conf)

```bash
sudo cp deploy/nginx/hooshagar.conf /etc/nginx/sites-available/hooshagar
sudo ln -s /etc/nginx/sites-available/hooshagar /etc/nginx/sites-enabled/
# دامنه را در فایل ویرایش کنید
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com
```

سپس در `.env`:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
```

و rebuild:

```bash
docker compose up -d --build
```

Supabase redirect URLs را هم به HTTPS به‌روز کنید.

---

## عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| `pnpm build` روی ویندوز: `EPERM symlink` | محدودیت ویندوز است؛ build را روی VPS/Linux داخل Docker انجام دهید (یا Developer Mode ویندوز را فعال کنید) |
| Build: `supabaseKey is required` | `.env` را با کلیدهای واقعی Supabase پر کنید؛ سپس `docker compose up -d --build` |
| پورت 3000 در دسترس نیست | `ufw allow 3000` + Security Group پنل VPS |
| Build با OOM | `docker system prune -a` یا swap موقت |
| لاگین redirect اشتباه | Supabase URLs + `NEXT_PUBLIC_APP_URL` |
| تغییر env بدون اثر | `docker compose up -d --build` |
| Container مدام restart | `docker compose logs app` |

---

## ساختار فایل‌های Docker

| فایل | نقش |
|------|-----|
| [`Dockerfile`](../Dockerfile) | Multi-stage build با pnpm + standalone |
| [`docker-compose.yml`](../docker-compose.yml) | سرویس app روی پورت 3000 |
| [`.dockerignore`](../.dockerignore) | حذف node_modules و secrets از context |
