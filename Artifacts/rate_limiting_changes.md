# Rate Limiting Changes (Backend Security Update)

## Objective
Protect backend APIs from brute-force attempts and abusive request bursts by introducing request throttling with `slowapi`.

## What Was Changed

### 1. Dependency Added
- File: `backend/requirements.txt`
- Change: Added `slowapi==0.1.9`
- Why: Enables FastAPI-compatible rate limiting middleware and route decorators.

### 2. New Limiter Module
- File: `backend/app/limiter.py`
- Added:
  - Shared `Limiter` instance
  - Client identity extraction helper (`get_client_ip`)
  - Global default limit (`120/minute`)
  - Standardized `429` response handler (`rate_limit_exceeded_handler`)
- Why:
  - Centralizes all rate-limiting logic in one module.
  - Handles reverse-proxy headers safely (`X-Forwarded-For`, then `X-Real-IP`, then remote address fallback).
  - Provides consistent JSON output for throttled requests.

### 3. App-Level Wiring
- File: `backend/app/main.py`
- Added:
  - `app.state.limiter = limiter`
  - `SlowAPIMiddleware`
  - Global exception mapping for `RateLimitExceeded`
- Why:
  - Activates rate limiting across the application.
  - Ensures exceeding limits returns HTTP `429` in a predictable format.

### 4. Strict Limits on Sensitive Endpoints

#### Authentication
- File: `backend/app/auth/router.py`
- Endpoint: `POST /auth/login`
- Limit: `5/minute`
- Why: Reduces password brute-force attempts.

#### Doubt Creation
- File: `backend/app/doubts/router.py`
- Endpoint: `POST /courses/{course_id}/doubts`
- Limit: `3/minute`
- Why: Prevents rapid spam/duplicate question submissions.

#### Payment Flow
- File: `backend/app/courses/router.py`
- Endpoint: `POST /courses/{course_id}/payment/create-order`
- Limit: `5/minute`
- Endpoint: `POST /courses/{course_id}/payment/verify`
- Limit: `5/minute`
- Why: Mitigates abusive payment-order creation and repeated verification attempts.

### 5. Function Signature Compatibility
- Files:
  - `backend/app/auth/router.py`
  - `backend/app/doubts/router.py`
  - `backend/app/courses/router.py`
- Change: Added `request: Request` parameter on limited endpoints.
- Why: `slowapi` decorators require access to the request object for key extraction and throttling.

## Storage Behavior (Important)
The limiter storage now supports two modes without code changes:

- Redis mode (recommended for multi-worker or multi-instance deployments):
  - Automatically used when `UPSTASH_REDIS_URL` is configured.
- In-memory mode:
  - Used as fallback when Redis URL is not set.

## 429 Response Format
When limits are exceeded, the API returns:

```json
{
  "detail": "Too Many Requests",
  "error": "rate_limit_exceeded"
}
```

Status code: `429`

## Quick Verification Checklist
1. Install backend dependencies.
2. Start backend server.
3. Trigger `POST /auth/login` more than 5 times within one minute from same client/IP.
4. Confirm API returns HTTP `429`.
5. Repeat similarly for doubt creation and payment endpoints.

## Impact Summary
- No expected breaking API contract changes for normal usage.
- Security posture improved against burst abuse and brute-force style traffic.
- Limits are now enforceable globally and can be shared across workers when Redis is enabled.
