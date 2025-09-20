# Security Guide

## Supported Versions
This is an early-stage prototype. Security fixes are applied only to the `backn` (active) branch.

## Reporting Vulnerabilities
Please open a private issue or contact the maintainer directly (do not post exploit details publicly). Provide:
- Affected endpoint / component
- Reproduction steps
- Impact assessment (data exposure, privilege escalation, DoS)

## Key Controls Implemented
- JWT-based authentication (HS256) with expiration.
- Password hashing via bcrypt with per-hash salt.
- Request correlation: `X-Request-ID` middleware.
- Health separation: `/healthz` (liveness) vs `/readyz` (readiness + seed check).
- SQLite fallback with explicit `fallback` flag in health responses.
- Basic in-memory rate limiting (prototype) returning 429 on abuse.
- In-memory metrics (`/metrics`) for request volume, errors, latency.
- Coverage gate (>=80%) to reduce untested logic risk.

## Secrets Management
Current prototype uses environment variables (`.env.example`). Do NOT commit real secrets.
Recommended production improvements:
- Use a secret manager (AWS Secrets Manager, Vault, SSM Parameter Store).
- Rotate JWT `SECRET_KEY` regularly; never reuse across environments.
- Enforce strong password policy & add password complexity validator.

## Threat Model (Initial)
| Threat | Mitigation (Current) | Planned/Upgrade |
|--------|----------------------|-----------------|
| Credential stuffing | bcrypt hashing | Add rate limit on auth, lockouts |
| JWT theft / replay | Expiration | Add token blacklist / rotation |
| SQL Injection | SQLAlchemy ORM parameterization | Add input validation on all raw queries |
| DoS (burst traffic) | Basic in-memory rate limiting | External WAF + distributed limiter |
| Sensitive data leak | Minimal PII stored | Field-level encryption where needed |

## Rate Limiting Notes
The current limiter is in-memory and per-process. In horizontally scaled deployments this is ineffective across replicas. Upgrade path:
1. Replace with Redis token bucket / leaky bucket.
2. Centralize counters with expiration.
3. Add differentiated buckets (auth vs read-only endpoints).

## Logging & PII
Structured JSON logs omit secrets. Avoid logging:
- JWT tokens
- Passwords
- API keys
Add scrubber middleware before production.

## Dependency Hygiene
Run (in CI) periodically:
```bash
pip install pip-audit
pip-audit
```
Add a scheduled workflow to flag CVEs.

## Future Hardening Roadmap
- CSRF defense for future browser POST forms (if session-based auth introduced).
- mTLS between internal services when architecture expands.
- Content Security Policy headers for frontend integration.
- SAST/DAST (e.g., Semgrep + OWASP ZAP baseline scan).
- Security headers middleware (X-Frame-Options, X-Content-Type-Options, Referrer-Policy).

## Incident Response (Prototype Scope)
1. Capture request ID from logs for correlation.
2. Snapshot `/metrics` & `/healthz` state.
3. If compromised secret: rotate immediately, invalidate old JWTs by changing `SECRET_KEY`.
4. Review fallback indicator—ensure no unintended divergence persisted.

## Acknowledgements
This document will evolve; contributions welcome via PR.
