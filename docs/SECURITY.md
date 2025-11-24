# Security Documentation

## Overview

This document outlines the security measures implemented in The Catch application and requirements for production deployment.

## Critical Security Configuration

### Required Environment Variables

The following environment variables **MUST** be configured before deploying to production:

#### Kitchen Display System (KDS)

```bash
# REQUIRED: JWT secret for signing kitchen staff authentication tokens
# Generate with: openssl rand -base64 32
# ⚠️ Must be at least 256 bits (32 bytes) for HS256
# ⚠️ NEVER use NEXT_PUBLIC_ prefix - this must stay server-side only
KITCHEN_JWT_SECRET=your-secure-random-secret-here

# DEPRECATED: Old token format - insecure, to be removed
# KITCHEN_API_TOKEN=<old-format-deprecated>
# NEXT_PUBLIC_KITCHEN_API_TOKEN=<do-not-use>
```

**Important:** See [JWT Migration Guide](./JWT-MIGRATION-GUIDE.md) for upgrading from the old insecure token format.

#### Sanity CMS

```bash
# REQUIRED: Write token for order updates
SANITY_WRITE_TOKEN=your-sanity-write-token

# REQUIRED: API token for read/write operations in scripts
SANITY_API_TOKEN=your-sanity-api-token
```

#### Stripe (if using payment processing)

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## API Endpoint Security

### POST /api/orders/update-status

**Status: PROTECTED**

This endpoint updates order status in Sanity and is used by the Kitchen Display System.

**🔒 SECURITY ARCHITECTURE:**
- Client components call Server Actions (via `lib/api/orders.ts`)
- Server Actions use `KITCHEN_API_TOKEN` from server environment
- **Token never exposed to client JavaScript bundle**
- No `NEXT_PUBLIC_` prefix needed or used

**✅ Migration from Client-side Token:**
If you previously used `NEXT_PUBLIC_KITCHEN_API_TOKEN`:
1. Remove it from environment variables
2. Keep only `KITCHEN_API_TOKEN` (server-side)
3. Update client code to import from `@/lib/api/orders`
4. Call `updateOrderStatus()` directly - no token parameter needed

#### Security Measures Implemented:

1. **Authentication** (REQUIRED)
   - Bearer token authentication via `Authorization` header
   - Endpoint returns 503 if `KITCHEN_API_TOKEN` is not configured
   - This prevents accidental deployment without authentication

2. **Rate Limiting**
   - 30 requests per minute per IP address
   - In-memory rate limiting (use Redis for production)

3. **Input Validation**
   - Order ID existence verification
   - Status value whitelist: `confirmed`, `preparing`, `ready`, `completed`, `cancelled`

4. **Error Handling**
   - Generic error messages to prevent information disclosure
   - Detailed logging for debugging (server-side only)

#### Example Request:

```bash
curl -X POST https://your-domain.com/api/orders/update-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-kitchen-api-token" \
  -d '{"orderId": "order-123", "newStatus": "preparing"}'
```

#### Response Codes:

- `200` - Success
- `400` - Invalid request (missing orderId/status or invalid status value)
- `401` - Unauthorized (missing or invalid token)
- `404` - Order not found
- `429` - Rate limit exceeded
- `503` - Service unavailable (authentication not configured)

## Security Gaps & Production Recommendations

### Current Limitations

The current implementation is suitable for **POC/demo only**. The following must be addressed for production:

1. **Authentication**
   - ❌ Simple bearer token (no expiration, no rotation)
   - ✅ Recommendation: Implement JWT with short expiration (15-30 min) and refresh tokens

2. **Authorization**
   - ❌ No role-based access control
   - ✅ Recommendation: Implement RBAC - kitchen staff can only update orders at their assigned location

3. **Rate Limiting**
   - ❌ In-memory (doesn't work across multiple server instances)
   - ✅ Recommendation: Use Redis for distributed rate limiting

4. **Audit Logging**
   - ❌ No audit trail of status changes
   - ✅ Recommendation: Log all status changes with user ID, timestamp, and IP address

5. **Token Storage**
   - ❌ Token in environment variables (visible to all server code)
   - ✅ Recommendation: Use secret management service (AWS Secrets Manager, HashiCorp Vault)

## Setup Instructions

### Development

1. Copy `.env.example` to `.env.local`
2. Generate tokens:
   ```bash
   # Generate a secure random token
   openssl rand -base64 32
   ```
3. Add token to `.env.local`:
   ```bash
   KITCHEN_API_TOKEN=<generated-token>
   # Note: No client-side token needed - using Server Actions
   ```

### Production

1. **Never** commit tokens to version control
2. Configure tokens in your hosting provider's environment variable settings:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Build & Deploy → Environment
   - AWS: Systems Manager Parameter Store or Secrets Manager

3. Use different tokens for each environment (development, staging, production)

4. Rotate tokens regularly (recommended: every 90 days)

## Incident Response

If you suspect a token has been compromised:

1. **Immediately** rotate the token:
   ```bash
   # Generate new token
   NEW_TOKEN=$(openssl rand -base64 32)

   # Update environment variable in hosting provider
   # Update all KDS clients
   ```

2. Review audit logs for suspicious activity

3. Check for unauthorized order status changes in Sanity

4. Document the incident and response actions

## Security Checklist for Production

Before deploying to production, ensure:

- [ ] `KITCHEN_API_TOKEN` is configured and at least 32 characters
- [ ] Tokens are different in production vs. development/staging
- [ ] HTTPS is enforced (no HTTP traffic)
- [ ] Rate limiting is enabled and tested
- [ ] Error messages don't leak sensitive information
- [ ] Audit logging is implemented
- [ ] Tokens are stored in secure secret management service
- [ ] Regular token rotation schedule is established
- [ ] Incident response plan is documented
- [ ] Staff are trained on security best practices

## Compliance Notes

### PCI DSS

If processing payment cards:
- This endpoint does **not** handle payment card data directly
- Stripe handles all PCI-sensitive operations
- Ensure order records don't store full card numbers

### GDPR / Privacy

- Order records may contain PII (customer name, phone, address)
- Ensure proper data retention policies
- Implement data deletion procedures
- Log access to customer data

## Contact

For security concerns or to report vulnerabilities:
- Email: security@thecatchusa.com (if configured)
- GitHub Security Advisories: https://github.com/your-org/catch/security/advisories

---

**Last Updated**: 2024-01-XX
**Next Review**: 2024-XX-XX (90 days)
