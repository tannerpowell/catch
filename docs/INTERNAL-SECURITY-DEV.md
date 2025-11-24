# Internal Security Documentation - Development Tools

⚠️ **INTERNAL USE ONLY - DO NOT SHARE PUBLICLY**

This document describes development-only security mechanisms that should never be exposed in public documentation or enabled in production environments.

---

## Development Authentication Bypass

### Purpose

For **local development only**, there is a mechanism to bypass authentication checks to allow testing without setting up a full authentication system. This is strictly controlled and has multiple safeguards.

### ⚠️ CRITICAL WARNINGS

- **NEVER enable this in production**
- **NEVER commit `.env.local` with this flag set**
- **NEVER share this flag with external parties**
- **NEVER use on public/staging servers**
- This is an **emergency development tool only**

---

## Runtime Safeguards

The auth bypass is protected by **multiple layers** of runtime checks:

### Layer 1: Environment Check
```
NODE_ENV must be 'development' or 'test'
```
- Production/staging environments are **automatically rejected**
- Build fails if bypass attempted outside dev/test

### Layer 2: Network Location Check
```
Must be running on localhost (127.0.0.1 or localhost)
```
- Checks for absence of `VERCEL_URL` or `NEXT_PUBLIC_VERCEL_URL`
- Checks that `NEXT_PUBLIC_SITE_URL` contains 'localhost' or '127.0.0.1'
- Any public IP address is **automatically rejected**

### Layer 3: Explicit Consent
```
ALLOW_AUTH_BYPASS_IN_DEV must be set to 'true'
```
- Requires developer to explicitly enable bypass
- Prevents accidental bypass from leftover env vars

### Layer 4: Additional Flag
```
DISABLE_AUTH_CHECK must be set to 'true'
```
- Double confirmation required
- Both flags must be present

### All 4 Layers Must Pass

If **ANY** safeguard fails, the bypass is rejected and:
- In production: Application throws error and terminates
- In development: Returns 401 Unauthorized
- All attempts are logged for security audit

---

## How to Use (Development Only)

### Prerequisites

1. You must be developing locally
2. You must not have authentication implemented yet
3. You need to test order updates without auth

### Setup

Add to your **local** `.env.local` file (NEVER `.env.example` or version control):

```bash
# Development-only auth bypass (INTERNAL USE ONLY)
# Remove these immediately when auth is implemented
ALLOW_AUTH_BYPASS_IN_DEV=true
DISABLE_AUTH_CHECK=true
```

### Verification

When starting your dev server, you should see:

```
⚠️  [SECURITY] Authentication BYPASSED in verified development environment.
This is ONLY safe for local development. NEVER deploy with this enabled.
```

### Removal

**BEFORE deploying or implementing auth:**

1. Remove both flags from `.env.local`
2. Verify they're not in any other env files
3. Test that auth is properly enforced
4. Deploy with confidence

---

## Build-Time Checks

### Production Build Validation

Add this check to your CI/CD pipeline or build script:

```bash
# scripts/check-production-safety.sh
#!/bin/bash

echo "🔒 Checking production safety..."

# Check if dangerous flags are present
if grep -q "DISABLE_AUTH_CHECK=true" .env.production 2>/dev/null; then
  echo "❌ CRITICAL: DISABLE_AUTH_CHECK found in production env"
  exit 1
fi

if grep -q "ALLOW_AUTH_BYPASS_IN_DEV=true" .env.production 2>/dev/null; then
  echo "❌ CRITICAL: ALLOW_AUTH_BYPASS_IN_DEV found in production env"
  exit 1
fi

# Check if running on Vercel and flags are set
if [ ! -z "$VERCEL" ]; then
  if [ "$DISABLE_AUTH_CHECK" = "true" ]; then
    echo "❌ CRITICAL: Auth bypass attempted on Vercel"
    exit 1
  fi
fi

echo "✅ Production safety checks passed"
```

### Package.json Integration

Add to your build script:

```json
{
  "scripts": {
    "prebuild": "bash scripts/check-production-safety.sh",
    "build": "next build"
  }
}
```

### Vercel Configuration

Add to `vercel.json`:

```json
{
  "build": {
    "env": {
      "DISABLE_AUTH_CHECK": "",
      "ALLOW_AUTH_BYPASS_IN_DEV": ""
    }
  }
}
```

This ensures these vars are **never** set in Vercel builds.

---

## Security Monitoring

### Logging

All bypass attempts are logged with full context:

```javascript
{
  action: 'auth_bypass_requested',
  NODE_ENV: process.env.NODE_ENV,
  isDevelopmentEnv: boolean,
  isLocalhost: boolean,
  bypassExplicitlyAllowed: boolean,
  isVerifiedDevEnvironment: boolean,
  result: 'allowed' | 'rejected',
  timestamp: ISO8601
}
```

### Alerts

Set up alerts for:
1. Any bypass attempt in production (should never happen)
2. Repeated bypass rejections (potential attack)
3. Bypass enabled for extended periods (forgotten flag)

---

## Alternative: Feature Flags

For more sophisticated control, use feature flag services:

### LaunchDarkly Example

```typescript
import { LDClient } from 'launchdarkly-node-server-sdk';

const ldClient = LDClient.init(process.env.LAUNCHDARKLY_SDK_KEY);

async function validateAuth() {
  const context = {
    kind: 'environment',
    key: process.env.NODE_ENV || 'unknown'
  };
  
  const bypassEnabled = await ldClient.variation(
    'auth-bypass-for-dev',
    context,
    false // default to disabled
  );
  
  if (bypassEnabled && process.env.NODE_ENV === 'development') {
    return { authorized: true, userId: 'dev-bypass' };
  }
  
  // ... normal auth logic
}
```

Benefits:
- Centralized control
- Immediate remote disable
- Audit trail
- No env vars needed

---

## When to Remove This Mechanism

Remove the bypass mechanism entirely when:

1. ✅ Authentication is fully implemented
2. ✅ All developers have auth credentials
3. ✅ Testing infrastructure supports auth
4. ✅ No legitimate need for bypass remains

To remove:

1. Delete bypass logic from `lib/api/orders.ts`
2. Remove this documentation file
3. Add to git history note: "Removed dev auth bypass"
4. Update security audit checklist

---

## Security Audit Checklist

Before each deployment, verify:

- [ ] `DISABLE_AUTH_CHECK` not in production env vars
- [ ] `ALLOW_AUTH_BYPASS_IN_DEV` not in production env vars  
- [ ] Build script includes production safety checks
- [ ] Vercel config blocks these env vars
- [ ] No `.env.local` files committed to git
- [ ] Logs show no bypass attempts in production
- [ ] Auth is properly implemented and tested
- [ ] This mechanism is removed if auth is complete

---

## Incident Response

If bypass is accidentally enabled in production:

### Immediate Actions (Within 5 minutes)

1. **Stop all deployments** immediately
2. **Revoke/rotate** all API keys and secrets
3. **Deploy** emergency fix removing bypass
4. **Notify** security team and stakeholders

### Investigation (Within 1 hour)

1. **Review logs** for unauthorized access
2. **Identify** all orders modified during bypass period
3. **Document** timeline of exposure
4. **Assess** data integrity and breach scope

### Remediation (Within 24 hours)

1. **Implement** proper authentication
2. **Audit** all order changes during exposure
3. **Notify** affected customers if required
4. **Update** security procedures
5. **Post-mortem** and lessons learned

---

## FAQ

### Q: Why not just delete this mechanism?

**A:** It's useful for rapid local development and testing before auth is implemented. The safeguards make it safe for this purpose.

### Q: Can I use this on a staging server?

**A:** **NO.** Staging should mirror production. Implement auth or use test credentials.

### Q: What if I forget to remove the flags?

**A:** The build-time checks will catch this and fail the build. Runtime safeguards also prevent it from working in production.

### Q: Is there a legitimate production use case?

**A:** **NO.** There is never a legitimate reason to bypass authentication in production. If you think you need this, you need a different solution.

### Q: Can I share this with external developers?

**A:** **NO.** This is internal documentation only. External developers should use proper auth credentials.

---

## Contact

Security concerns or questions:
- **Do not** post in public channels
- **Do not** discuss in customer-facing docs
- Contact: Internal security team only

---

**Remember:** This bypass is a development convenience, not a feature. Use sparingly, protect carefully, remove when possible.
