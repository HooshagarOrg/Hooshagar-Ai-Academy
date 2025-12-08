# API Documentation - Hooshagar Platform

**Version:** 1.0.0  
**Last Updated:** December 2024

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Health Check](#health-check)
- [GDPR Endpoints](#gdpr-endpoints)
- [AI Endpoints](#ai-endpoints)
- [Error Handling](#error-handling)

---

## Overview

Base URL: `https://hooshagar.com` (Production)  
Base URL: `http://localhost:3000` (Development)

All API endpoints return JSON responses.

---

## Authentication

Most endpoints require authentication using Supabase JWT token.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Getting a token:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
const token = data.session?.access_token;
```

---

## Rate Limiting

**Limits:**
- General API: 100 requests/hour per IP
- AI Features: 50 requests/hour per user
- GDPR Export: 5 requests/day per user
- GDPR Delete: 1 request/week per user

**Response Headers:**
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642262400000
```

**Error Response (429 Too Many Requests):**
```json
{
  "error": "محدودیت استفاده رسیده است",
  "remaining": 0,
  "resetAt": "2025-01-15T11:00:00Z"
}
```

---

## Health Check

### Check System Health

**Endpoint:** `GET /api/health`

**Description:** Check API and database connectivity status.

**Authentication:** Not required

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "services": {
    "database": "up",
    "api": "up"
  },
  "responseTime": "45ms",
  "version": "1.0.0"
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "error": "Database connection failed",
  "services": {
    "database": "down",
    "api": "up"
  }
}
```

---

## GDPR Endpoints

### Export User Data

**Endpoint:** `POST /api/gdpr/export`

**Description:** Export all user data (GDPR Right to Data Portability - Article 20).

**Authentication:** Required

**Rate Limit:** 5 requests/day

**Request:**
```bash
curl -X POST https://hooshagar.com/api/gdpr/export \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "profile": {
      "id": "...",
      "email": "...",
      "full_name": "..."
    },
    "students": [...],
    "attendance": [...],
    "exam_sessions": [...],
    "ai_request_logs": [...],
    "counseling_sessions": [...],
    "audit_logs": [...],
    "exported_at": "2025-01-15T10:00:00Z",
    "format_version": "1.0"
  },
  "requestId": "uuid",
  "message": "داده‌های شما با موفقیت استخراج شد"
}
```

**Error Responses:**
- `401 Unauthorized`: No valid authentication
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Export failed

---

### Delete User Data

**Endpoint:** `POST /api/gdpr/delete`

**Description:** Permanently delete all user data (GDPR Right to Erasure - Article 17).

**Authentication:** Required

**Rate Limit:** 1 request/week

**⚠️ WARNING:** This action is irreversible!

**Request:**
```bash
curl -X POST https://hooshagar.com/api/gdpr/delete \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"confirmation": "DELETE_MY_DATA"}'
```

**Request Body:**
```json
{
  "confirmation": "DELETE_MY_DATA"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تمام داده‌های شما با موفقیت حذف شد",
  "requestId": "uuid",
  "deletedRecords": {
    "ai_request_logs": 150,
    "exam_sessions": 20,
    "attendance": 300,
    "counseling_sessions": 5,
    "students": 2,
    "audit_logs": 500
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid confirmation code
- `401 Unauthorized`: No valid authentication
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Deletion failed

---

## AI Endpoints

### Universal AI Call

**Endpoint:** `POST /api/ai/universal`

**Description:** Universal endpoint for all AI features with 6-tier fallback system.

**Authentication:** Required

**Rate Limit:** 50 requests/hour per user

**Request:**
```json
{
  "feature": "student_analyzer",
  "prompt": "تحلیل عملکرد دانش‌آموز",
  "image": "base64_encoded_image_optional"
}
```

**Available Features:**
- `student_analyzer`: تحلیل عملکرد دانش‌آموز
- `ocr`: تشخیص نوشته و حل تمرین
- `rag`: پرسش و پاسخ هوشمند
- `story_wizard`: تولید داستان آموزشی
- `lesson_planner`: برنامه‌ریز درس

**Response (200 OK):**
```json
{
  "success": true,
  "content": "نتیجه تحلیل...",
  "metadata": {
    "tier": "A",
    "model": "gemini-2.0-flash-thinking-exp",
    "cost": 0.00,
    "responseTime": 1234
  }
}
```

**Error Responses:**
- `401 Unauthorized`: No authentication
- `429 Too Many Requests`: Rate limit exceeded
- `503 Service Unavailable`: All AI tiers failed

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message in Persian",
  "details": "Technical details (optional)",
  "code": "ERROR_CODE (optional)"
}
```

**Common Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

---

## Support

- **Documentation:** https://docs.hooshagar.com
- **GitHub Issues:** https://github.com/hooshagar/platform/issues
- **Email:** support@hooshagar.com
- **Telegram:** @hooshagar_support

---

## Changelog

### Version 1.0.0 (December 2024)
- Initial API documentation
- Health check endpoint
- GDPR compliance endpoints
- AI universal endpoint
- Rate limiting implementation

