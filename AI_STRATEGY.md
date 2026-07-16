# 🤖 **استراتژی AI Models - هوشاگر**

## 📊 **جدول استراتژی (Gemini 2.5 — به‌روز 1404)**

| **قابلیت** | **Tier 1 (Google)** | **Tier 2–4 (OpenRouter free)** | **استراتژی** |
|------------|---------------------|--------------------------------|--------------|
| **Student Analyzer** | `gemini-2.5-flash` | `glm-4.7-flash` (Z.ai) → DeepSeek free | Flash + Z.ai thinking |
| **Problem Solver OCR** | `gemini-2.5-flash` | VL free models | Vision First |
| **Study Buddy** | `gemini-2.5-flash` | `deepseek-chat-v3.1:free` | Flash First |
| **Story Wizard** | `gemini-2.5-flash-lite` | `llama-4-maverick:free` | Lite First |
| **Content / Exam** | `gemini-2.5-flash-lite` | `qwen3-coder:free` | Lite First |
| **Future Compass / Konkur** | `gemini-2.5-flash` | `grok-4.1-fast:free` (Tier 3) | Flash + Grok fallback |
| **Talent Analyzer** | `gemini-2.5-flash-lite` | `llama-4-scout:free` | Lite First |

> **Tier 5/6 (paid):** غیرفعال — `tier_e_enabled = false`, `tier_f_enabled = false`

---

## 🎯 **استراتژی کلی: Gemini 2.5 First**

### **Fallback Chain (runtime اصلی — `lib/ai-provider.ts`):**
1. **Tier 1**: Google Gemini 2.5 (10 کلید Round-Robin)
2. **Tier 2**: Z.ai `glm-4.7-flash` (رایگان — `ZAI_API_KEY`)
3. **Tier 3**: OpenRouter Key A — مدل‌های `:free` بزرگ
4. **Tier 4**: OpenRouter Key B — شامل Grok free برای roadmap/compass
5. **Tier 5**: OpenRouter Key C — مدل‌های سبک
6. **Tier 6–7**: غیرفعال (paid — برای آینده)

### **مدل‌های منسوخ (استفاده نکنید):**
- ❌ `gemini-1.5-*` (کاملاً منسوخ)
- ❌ `gemini-2.0-flash`, `gemini-2.0-flash-lite`

---

## 📦 **Environment (پیشنهادی):**

```bash
GOOGLE_API_KEY_1=...   # تا _10 برای Round-Robin
OPENROUTER_API_KEY=... # Tier 3
OPENROUTER_API_KEY_B=... # Tier 4
OPENROUTER_API_KEY_C=... # Tier 5

ZAI_API_KEY=...        # Tier 2 — GLM-4.7-Flash (رایگان)
# ZAI_MODEL=glm-4.7-flash

AI_MODEL_DEFAULT=gemini-2.5-flash
AI_MODEL_FAST=gemini-2.5-flash
AI_MODEL_VISION=gemini-2.5-flash
AI_MODEL_FALLBACK=moonshotai/kimi-k2-thinking
AI_MODEL_EMBEDDING=models/gemini-embedding-001
```

> **نکته:** `gemini-2.5-pro` در free path استفاده نمی‌شود. فقط برای Tierهای paid آینده در معماری نگه داشته می‌شود.

---

## 🔄 **Migration DB**

1. `supabase/migrations/133_gemini_25_model_refresh.sql` — مهاجرت از 1.5/2.0
2. `supabase/migrations/134_free_first_flash_models.sql` — analyzer/pro → Flash

هر دو را در Supabase SQL Editor اجرا کنید.
