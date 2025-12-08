# API Documentation

## Table of Contents
- [Health Check](#health-check)
- [GDPR Endpoints](#gdpr-endpoints)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)

---

## Health Check

**Endpoint:** `GET /api/health`

**Description:** Check API and database health status

**Response:**
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

**Status Codes:**
- `200` - Healthy
- `503` - Unhealthy

---

## GDPR Endpoints

### Export User Data

**Endpoint:** `POST /api/gdpr/export`

**Description:** Export all user data (GDPR Right to Data Portability)

**Authentication:** Required

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "...",
      "email": "...",
      "name": "..."
    },
    "students": [...],
    "attendance": [...],
    "exams": [...],
    "ai_usage": [...],
    "exported_at": "2025-01-15T10:00:00Z"
  },
  "requestId": "uuid"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Server Error

---

### Delete User Data

**Endpoint:** `POST /api/gdpr/delete`

**Description:** Delete all user data (GDPR Right to Erasure)

**Authentication:** Required

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "confirmation": "DELETE_MY_DATA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تمام داده‌های شما حذف شد",
  "requestId": "uuid"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid confirmation
- `401` - Unauthorized
- `500` - Server Error

---

## Authentication

All authenticated endpoints require:
```
Authorization: Bearer {access_token}
```

Get token from Supabase auth.

---

## Rate Limiting

**Limits:**
- Per User: 50 requests/hour (AI features)
- Per IP: 100 requests/hour (general)

**Headers:**
```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642262400000
```

**Error Response (429):**
```json
{
  "error": "محدودیت استفاده رسیده است",
  "remaining": 0,
  "resetAt": "2025-01-15T11:00:00Z"
}
```
