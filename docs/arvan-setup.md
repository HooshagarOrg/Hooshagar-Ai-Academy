# 🌥️ راهنمای تنظیم Arvan Cloud Storage

## 📋 مراحل ایجاد باکت در آروان

### 1. ورود به پنل آروان

```
https://panel.arvancloud.ir
```

### 2. ایجاد باکت جدید

1. از منوی چپ → **"ذخیره‌سازی ابری"** (Cloud Storage)
2. کلیک روی **"+ ایجاد باکت جدید"**
3. تنظیمات:
   - **نام باکت:** `hooshagar-prod`
   - **موقعیت:** تهران (`ir-thr-at1`) ✅ توصیه شده
   - **سطح دسترسی:** عمومی (Public)
4. کلیک روی **"ایجاد"**

### 3. دریافت کلیدهای API

1. در صفحه باکت → **"تنظیمات"**
2. تب **"API Keys"**
3. کلیک روی **"+ ایجاد کلید دسترسی"**
4. یادداشت کنید:
   - **Access Key:** `AKXXXXXXXXXXXXXXXXX`
   - **Secret Key:** `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

> ⚠️ **مهم:** Secret Key فقط یکبار نمایش داده می‌شود!

### 4. فعال‌سازی CDN (اختیاری ولی توصیه شده)

1. تب **"CDN"**
2. کلیک روی **"فعال‌سازی CDN"**
3. کپی کنید **CDN URL** مثل:
   ```
   https://hooshagar-prod.cdn.arvanstorage.ir
   ```

---

## ⚙️ تنظیم Environment Variables

### در فایل `.env.local` اضافه کنید:

```env
# ============================================
# Arvan Cloud Storage
# ============================================

# کلید دسترسی از پنل آروان
ARVAN_ACCESS_KEY=your-access-key-here

# کلید مخفی از پنل آروان
ARVAN_SECRET_KEY=your-secret-key-here

# نام باکت
ARVAN_BUCKET=hooshagar-prod

# آدرس endpoint (تهران)
ARVAN_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir

# آدرس CDN (اگر فعال کردید)
ARVAN_CDN=https://hooshagar-prod.cdn.arvanstorage.ir
```

### مقادیر واقعی را جایگزین کنید:

| متغیر | مثال |
|-------|------|
| `ARVAN_ACCESS_KEY` | `AK1234567890abcdef` |
| `ARVAN_SECRET_KEY` | `sk1234567890abcdefghijklmnop` |
| `ARVAN_BUCKET` | `hooshagar-prod` |
| `ARVAN_ENDPOINT` | `https://s3.ir-thr-at1.arvanstorage.ir` |
| `ARVAN_CDN` | `https://hooshagar-prod.cdn.arvanstorage.ir` |

---

## 🌍 Endpoints موجود

| موقعیت | Endpoint |
|--------|----------|
| **تهران** ✅ | `https://s3.ir-thr-at1.arvanstorage.ir` |
| تبریز | `https://s3.ir-tbz-sh1.arvanstorage.ir` |
| مشهد | `https://s3.ir-msh-h1.arvanstorage.ir` |
| اصفهان | `https://s3.ir-isf-c1.arvanstorage.ir` |

> 💡 **توصیه:** endpoint تهران (`ir-thr-at1`) برای اکثر کاربران بهتر است.

---

## 🔄 راه‌اندازی مجدد سرور

بعد از اضافه کردن متغیرها:

```bash
# متوقف کردن سرور
Ctrl+C

# شروع مجدد
npx next dev -H 0.0.0.0 -p 3002
```

یا با pnpm:

```bash
pnpm dev
```

---

## ✅ تست اتصال

### روش 1: آپلود تست در صفحه OCR

1. به آدرس `/test-ocr` بروید
2. یک تصویر آپلود کنید
3. باید URL آروان برگردد

### روش 2: تست با API

```bash
curl -X POST http://localhost:3002/api/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.jpg" \
  -F "type=avatar"
```

### روش 3: بررسی در کنسول

در console مرورگر باید ببینید:

```
📤 Uploading file: photo.jpg (125000 bytes) to uploads/avatars/...
✅ File uploaded successfully: https://hooshagar-prod.cdn.arvanstorage.ir/...
```

---

## 🐛 رفع مشکلات رایج

### خطا: `Arvan S3 credentials not configured`

```
✅ راه‌حل: مطمئن شوید ARVAN_ACCESS_KEY و ARVAN_SECRET_KEY در .env.local هستند
✅ سرور را restart کنید
```

### خطا: `Access Denied`

```
✅ راه‌حل: بررسی کنید باکت public باشد
✅ کلیدهای API صحیح باشند
```

### خطا: `Bucket not found`

```
✅ راه‌حل: نام باکت در ARVAN_BUCKET صحیح باشد
✅ endpoint با موقعیت باکت مطابقت داشته باشد
```

### فایل آپلود شده اما URL کار نمی‌کند

```
✅ راه‌حل: CDN فعال کنید یا ARVAN_CDN را حذف کنید
✅ از endpoint مستقیم استفاده شود
```

---

## 📁 ساختار پوشه‌ها در باکت

```
hooshagar-prod/
├── uploads/
│   ├── avatars/
│   │   └── {userId}/
│   │       └── {timestamp}_{random}.jpg
│   ├── ocr/
│   │   └── {schoolId}/
│   │       └── {timestamp}_{random}.jpg
│   ├── attachments/
│   ├── documents/
│   ├── reports/
│   ├── art/
│   ├── stories/
│   └── misc/
└── static/
    └── logos/
        └── schools/
```

---

## 💰 هزینه‌ها

| آیتم | قیمت تقریبی |
|------|-------------|
| ذخیره‌سازی | ~۳۰۰ تومان/GB/ماه |
| ترافیک خروجی | ~۵۰۰ تومان/GB |
| CDN | رایگان (تا حدی) |

> 💡 برای پروژه‌های کوچک، هزینه ناچیز است.

---

## 🔗 لینک‌های مفید

- [داکیومنت آروان S3](https://www.arvancloud.ir/fa/dev/storage-api)
- [پنل آروان](https://panel.arvancloud.ir)
- [پشتیبانی آروان](https://www.arvancloud.ir/fa/support)

---

**آخرین بروزرسانی:** آذر 1403
















