# 🧪 Testing Documentation - هوشاگر

## 📋 **فهرست**

1. [نصب و راه‌اندازی](#setup)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [E2E Tests](#e2e-tests)
5. [Coverage](#coverage)
6. [CI/CD Integration](#cicd)

---

## 🚀 **Setup**

### **نصب Dependencies:**

```bash
npm install
```

### **دستورات تست:**

```bash
# Unit & Integration Tests
npm run test          # Watch mode
npm run test:ci       # CI mode (no watch)
npm run test:coverage # با گزارش coverage

# E2E Tests
npm run test:e2e          # اجرای تست‌های E2E
npm run test:e2e:ui       # UI mode (interactive)
npm run test:e2e:report   # نمایش گزارش

# همه تست‌ها
npm run test:all      # Unit + Integration + E2E
```

---

## 🧩 **Unit Tests**

### **فریم‌ورک:**
- **Jest** برای test runner
- **React Testing Library** برای component testing
- **@testing-library/jest-dom** برای matchers

### **تست‌های نوشته شده:**

#### 1. **NotificationBell Component**
```typescript
__tests__/components/NotificationBell.test.tsx
```

**تست‌ها:**
- ✅ نمایش آیکون bell
- ✅ نمایش badge با تعداد خوانده‌نشده
- ✅ باز شدن dropdown با کلیک
- ✅ نمایش لیست notifications
- ✅ حالت خالی (no notifications)
- ✅ Mark as read functionality
- ✅ Polling هر 30 ثانیه
- ✅ مدیریت خطاهای API

#### 2. **PWAInstallPrompt Component**
```typescript
__tests__/components/PWAInstallPrompt.test.tsx
```

**تست‌ها:**
- ✅ عدم نمایش اولیه
- ✅ نمایش بعد از beforeinstallprompt
- ✅ Delay 3 ثانیه‌ای
- ✅ عدم نمایش اگر dismissed (7 روز)
- ✅ بستن با دکمه dismiss
- ✅ ذخیره در localStorage
- ✅ عدم نمایش در حالت installed

#### 3. **Logger**
```typescript
__tests__/lib/logger.test.ts
```

**تست‌ها:**
- ✅ logInfo
- ✅ logError
- ✅ logWarn
- ✅ logDebug
- ✅ مدیریت circular references
- ✅ مدیریت null/undefined

### **اجرا:**

```bash
npm run test -- NotificationBell
```

---

## 🔗 **Integration Tests**

### **تست‌های API:**

#### **Notifications API**
```typescript
__tests__/api/notifications.test.ts
```

**تست‌ها:**
- ✅ GET /api/notifications
  - دریافت لیست برای کاربر احراز شده
  - 401 برای unauthenticated
  - Pagination (limit, offset)
  - فیلتر unreadOnly
  
- ✅ POST /api/notifications
  - ایجاد notification (admin only)
  - 403 برای non-admin
  - Validation با Zod

### **Mock Strategy:**

```typescript
// Mock Supabase Client
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock Next.js APIs
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({})),
}))
```

---

## 🎭 **E2E Tests با Playwright**

### **تست‌های نوشته شده:**

#### 1. **Login Flow**
```typescript
e2e/login.spec.ts
```

**Scenarios:**
- ✅ نمایش فرم login
- ✅ Validation errors
- ✅ خطا برای credentials نامعتبر
- ✅ ناوبری به صفحه register
- ✅ Remember me checkbox
- ✅ لاگین موفق

#### 2. **Dashboard**
```typescript
e2e/dashboard.spec.ts
```

**Scenarios:**
- ✅ نمایش stats
- ✅ ناوبری به XP page
- ✅ ناوبری به Leaderboard
- ✅ ناوبری به Badges
- ✅ باز کردن notification bell
- ✅ Logout
- ✅ Mobile responsiveness

#### 3. **PWA Features**
```typescript
e2e/pwa.spec.ts
```

**Scenarios:**
- ✅ Valid manifest.json
- ✅ Service Worker registration
- ✅ PWA meta tags
- ✅ Install prompt
- ✅ Offline page
- ✅ Asset caching

### **اجرا:**

```bash
# همه تست‌ها
npm run test:e2e

# تست خاص
npm run test:e2e -- login.spec.ts

# UI Mode (recommended)
npm run test:e2e:ui

# فقط Chrome
npm run test:e2e -- --project=chromium
```

### **Browsers:**
- ✅ Chrome Desktop
- ✅ Firefox Desktop
- ✅ Safari Desktop
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

---

## 📊 **Coverage**

### **دستور:**

```bash
npm run test:coverage
```

### **هدف Coverage:**

```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
}
```

### **گزارش:**

```
coverage/
├── lcov-report/
│   └── index.html      ← گزارش HTML
├── lcov.info
└── coverage-final.json
```

**مشاهده گزارش:**
```bash
open coverage/lcov-report/index.html
```

---

## 🔧 **Mock Data & Fixtures**

### **Fixtures:**

```typescript
__tests__/setup/fixtures.ts
```

**موارد موجود:**
- ✅ mockStudent
- ✅ mockTeacher
- ✅ mockProfile
- ✅ mockXPProfile
- ✅ mockBadge
- ✅ mockNotification
- ✅ mockLeaderboardEntry
- ✅ mockParentReport
- ✅ mockAPIResponse
- ✅ createMockSupabaseClient()

**استفاده:**

```typescript
import { mockStudent, mockAPIResponse } from '../setup/fixtures'

test('should work', async () => {
  global.fetch = jest.fn().mockResolvedValue(
    mockAPIResponse.success({ student: mockStudent })
  )
  // ...
})
```

---

## 🤖 **CI/CD Integration**

### **GitHub Actions:**

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:ci
      - run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 📝 **Writing New Tests**

### **Unit Test Template:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle click', () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### **API Test Template:**

```typescript
import { GET } from '@/app/api/my-endpoint/route'
import { NextRequest } from 'next/server'

describe('API: /api/my-endpoint', () => {
  it('should return data', async () => {
    const request = new NextRequest('http://localhost/api/my-endpoint')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('result')
  })
})
```

### **E2E Test Template:**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-page')
  })

  test('should do something', async ({ page }) => {
    await page.getByRole('button', { name: 'Click' }).click()
    await expect(page.getByText('Success')).toBeVisible()
  })
})
```

---

## 🎯 **Best Practices**

1. **Write tests first (TDD)** - در صورت امکان
2. **Test behavior, not implementation** - رفتار را تست کن، نه پیاده‌سازی
3. **Use descriptive test names** - نام‌های توصیفی
4. **Keep tests isolated** - تست‌ها مستقل باشند
5. **Mock external dependencies** - وابستگی‌های خارجی را mock کن
6. **Test edge cases** - حالت‌های لبه‌ای را تست کن
7. **Clean up after tests** - بعد از تست cleanup کن

---

## 📚 **Resources**

- [Jest Docs](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## ✅ **Current Status**

**Test Coverage:**
- ✅ Unit Tests: 3 suites, 25+ tests
- ✅ Integration Tests: 1 suite, 8+ tests
- ✅ E2E Tests: 3 suites, 20+ tests

**Total:** ~50+ tests آماده و قابل اجرا!

---

**نویسنده:** تیم هوشاگر  
**تاریخ:** 18 دسامبر 2024  
**نسخه:** 1.0.0

