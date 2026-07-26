# Security Policy & Architecture

## Security Boundaries & Design

Steward V1 implements the following security boundaries:

### 1. API Key Security
- API keys are generated using cryptographically secure random bytes (`crypto.randomBytes(24)`).
- Complete keys are in the format `stwd_live_<24-bytes-hex>` and are displayed **EXACTLY ONCE** upon creation.
- Only SHA-256 hashes (`keyHash`) are stored in the database. Complete keys cannot be recovered by database queries or API responses.
- API key authentication relies exclusively on SHA-256 hash comparison. Revoked keys (`revokedAt !== null`) immediately return HTTP 401.

### 2. User Authentication & Session Security
- User passwords are hashed using `bcryptjs` with salt rounds = 10. Plaintext passwords are never stored or logged.
- Authentication sessions use HTTP-only, `SameSite=Lax`, and `Secure` (in production) cookies (`stwd_session`). Session tokens are never exposed in `localStorage`.
- Generic 401 error messages (`"Invalid email or password"`) are returned for login failures to prevent user account enumeration.

### 3. Multi-Tenant Project Isolation
- Every agent API key, run, event, approval request, and command belongs strictly to a project (`projectId`).
- Agent endpoints derive project identity strictly from the authenticated API key. User payloads or SDK configuration parameters cannot override project ownership.
- Dashboard endpoints require session authentication and check `ProjectMember` records in the database. Access to unauthorized project resources returns `HTTP 404 Not Found`.

### 4. Automatic Payload Redaction
- Telemetry events, tool call arguments, model parameters, and audit log metadata are recursively scanned for sensitive keys (e.g., `apiKey`, `password`, `secret`, `authorization`, `token`, `cookie`).
- Matching keys have their values replaced with `"[REDACTED]"` prior to storage.

---

## Reporting Vulnerabilities

If you discover a security vulnerability in Steward, please report it privately:

- **Email**: `security@steward.dev`
- Please provide detailed reproduction steps and do not publicly disclose vulnerabilities before a fix has been released.
