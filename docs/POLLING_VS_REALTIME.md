# استراتژی Polling برای Notifications

## 📌 چرا از Polling استفاده می‌کنیم؟

در هوشاگر، به جای Supabase Realtime، از **Polling System** برای notifications استفاده می‌کنیم.

### مشکلات Supabase Realtime

1. **نیاز به تنظیمات پیچیده**: 
   - باید در Dashboard فعال شود
   - باید Replication تنظیم شود
   - باید REPLICA IDENTITY تنظیم شود
   - محدودیت در پلن رایگان

2. **مشکلات Connection**:
   - WebSocket ممکن است block شود
   - مشکلات CSP (Content Security Policy)
   - نیاز به پورت‌های خاص

3. **پیچیدگی Debug**:
   - خطاهای مبهم (CHANNEL_ERROR)
   - سخت‌تر برای troubleshoot

### مزایای Polling System

✅ **سادگی**: فقط از REST API استفاده می‌کند  
✅ **قابل اعتماد**: همیشه کار می‌کند  
✅ **بدون تنظیمات اضافی**: نیازی به Dashboard نیست  
✅ **Debug آسان**: می‌توانید در Network tab ببینید  
✅ **کم‌مصرف**: Polling هوشمند با optimization  

---

## 🔄 چگونه Polling کار می‌کند؟

### تنظیمات Polling

```typescript
const POLLING_INTERVAL = 15000 // 15 ثانیه (عادی)
const POLLING_INTERVAL_WHEN_OPEN = 5000 // 5 ثانیه (وقتی dropdown باز است)
```

### Optimizations

#### 1. Adaptive Polling
- وقتی dropdown بسته است: هر 15 ثانیه
- وقتی dropdown باز است: هر 5 ثانیه (برای تجربه بهتر)

#### 2. Visibility-Aware
- وقتی tab در background است: polling متوقف می‌شود
- وقتی tab دوباره visible می‌شود: بلافاصله چک می‌کند

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      loadNotifications() // چک فوری
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
}, [])
```

#### 3. Smart Comparison
فقط وقتی notification جدید باشد، log می‌کند:

```typescript
const newUnreadCount = data.filter(n => !n.is_read).length
if (newUnreadCount > unreadCount) {
  console.log(`🔔 ${newUnreadCount - unreadCount} new notification(s)!`)
}
```

---

## 📊 محاسبه تعداد Requests

### سناریو 1: کاربر معمولی
- در روز: 8 ساعت کار
- Polling: هر 15 ثانیه
- تعداد requests: `(8 * 60 * 60) / 15 = 1,920 requests/day`

### سناریو 2: کاربر active (dropdown باز)
- در روز: 30 دقیقه dropdown باز
- Polling سریع: هر 5 ثانیه
- تعداد requests: `(30 * 60) / 5 = 360 requests/day`

### سناریو 3: با Visibility Optimization
- 50% زمان tab در background
- واقعی: `1,920 / 2 = 960 requests/day`

**جمع کل**: حدود **1,000 requests/day** در Supabase

این تعداد در پلن رایگان Supabase (500,000 requests/month) **کاملاً OK** است! ✅

---

## 🔮 آینده: Real-time Optional

اگر در آینده Supabase Realtime را فعال کردیم، می‌توانیم:

1. Realtime را به عنوان **primary** استفاده کنیم
2. Polling را به عنوان **fallback** نگه داریم
3. اگر Realtime fail کرد، به Polling برگردیم

```typescript
// ترکیب Realtime + Polling
const useSmartNotifications = () => {
  const [hasRealtime, setHasRealtime] = useState(false)
  
  useEffect(() => {
    // سعی کن Realtime وصل شوی
    const channel = supabase.channel('notifications')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setHasRealtime(true)
          // متوقف کردن polling
        } else {
          setHasRealtime(false)
          // شروع polling
        }
      })
  }, [])
}
```

---

## 🎯 نتیجه‌گیری

برای **هوشاگر**، Polling بهترین راه‌حل است زیرا:

- ✅ ساده و قابل اعتماد
- ✅ بدون نیاز به تنظیمات پیچیده
- ✅ کم‌مصرف با optimizations
- ✅ برای use case ما (notification bell) کافی است

تجربه کاربر: **notification ظرف 5-15 ثانیه به‌روز می‌شود** که برای یک سیستم مدرسه **کاملاً مناسب** است! 🏫

