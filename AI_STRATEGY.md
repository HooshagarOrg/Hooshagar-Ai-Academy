# 🤖 **استراتژی AI Models - هوشاگر**

## 📊 **جدول استراتژی استفاده از مدل‌های هوش مصنوعی**

| **قابلیت** | **لایه** | **مدل اصلی** | **مدل Fallback** | **استراتژی** | **دلیل انتخاب** |
|------------|---------|--------------|------------------|--------------|-----------------|
| **Student Analyzer** | Backend API | `gemini-1.5-pro` | `kimi-k2-thinking` | Gemini First | تحلیل عمیق + رایگان |
| **Problem Solver OCR** | Backend API | `gemini-1.5-pro-vision` | `claude-3.5-sonnet` | Vision First | OCR قوی + چند زبانه |
| **Study Buddy RAG** | Backend API | `gemini-1.5-flash` | `gemini-1.5-pro` | Flash First | سرعت بالا + پاسخ سریع |
| **Story Wizard** | Backend API | `gemini-1.5-pro` | `gpt-4o-mini` | Creative First | خلاقیت + قصه‌نویسی |
| **Embedding Generation** | Backend Service | `text-embedding-004` | `OpenAI ada-002` | Google First | رایگان + کیفیت عالی |
| **Report Generation** | Backend Cron | `gemini-1.5-flash` | `gemini-1.5-pro` | Fast First | گزارش ساده + سریع |
| **Notification Smart** | Backend Trigger | `gemini-1.5-flash` | `-` | Single Model | متن کوتاه + cache |
| **Behavioral Analysis** | Backend API | `gemini-1.5-pro` | `claude-3-haiku` | Deep First | تحلیل پیچیده |

---

## 🎯 **استراتژی کلی: Gemini First**

### **مزایا:**
✅ **رایگان تا 15 RPM** (Google AI Studio)  
✅ **1M token context window**  
✅ **پشتیبانی از فارسی**  
✅ **Vision capabilities**  
✅ **Fast inference**  

### **Fallback Strategy:**
1. **سطح 1**: Gemini Flash (سریع‌تر)
2. **سطح 2**: Gemini Pro (قوی‌تر)
3. **سطح 3**: OpenRouter (kimi-k2, claude)
4. **سطح 4**: Cached Response (24h)

---

## 📦 **تنظیمات Environment:**

```bash
# Google AI (رایگان)
GOOGLE_API_KEY=AIzaSy...

# OpenRouter (Fallback - پولی)
OPENROUTER_API_KEY=sk-or-...

# Fallback Models
AI_MODEL_DEFAULT=gemini-1.5-pro
AI_MODEL_FAST=gemini-1.5-flash
AI_MODEL_VISION=gemini-1.5-pro-vision
AI_MODEL_FALLBACK=moonshotai/kimi-k2-thinking
AI_MODEL_EMBEDDING=models/text-embedding-004
```

---

## 🔄 **Error Handling Pattern:**

```typescript
async function callAIWithStrategy(prompt: string, type: 'analysis' | 'vision' | 'embedding') {
  try {
    // Try Gemini (Free)
    return await callGemini(prompt, getModelForType(type))
  } catch (error) {
    // Fallback to OpenRouter (Paid)
    return await callOpenRouter(prompt, getFallbackModel(type))
  }
}
```

---

## 💰 **هزینه تخمینی (ماهانه):**

| **سناریو** | **Gemini (رایگان)** | **OpenRouter (پولی)** | **کل** |
|------------|---------------------|----------------------|--------|
| **100 کاربر** | 80% | 20% | ~$5 |
| **500 کاربر** | 70% | 30% | ~$25 |
| **1000 کاربر** | 60% | 40% | ~$60 |

**نتیجه:** با استراتژی Gemini First، هزینه تا **80% کاهش** می‌یابد.

---

## 📝 **Implementation Checklist:**

- [x] Google AI SDK نصب شده
- [x] OpenRouter SDK نصب شده
- [x] Fallback logic پیاده‌سازی شده
- [x] Error handling با retry
- [x] Cost tracking در هر request
- [x] Cache برای پاسخ‌های تکراری
- [ ] Rate limiting per user
- [ ] Usage analytics dashboard

---

**نویسنده:** تیم هوشاگر  
**تاریخ:** 18 دسامبر 2024  
**نسخه:** 1.0

