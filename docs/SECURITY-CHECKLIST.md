# Pre-Deployment Security Checklist

Use this checklist before every production deployment to ensure security measures are properly configured.

## 🔒 Authentication & Authorization

- [ ] Authentication provider is fully implemented (NextAuth/Clerk/Custom)
- [ ] `KITCHEN_JWT_SECRET` is set in production environment (min 32 bytes)
- [ ] JWT tokens have reasonable expiration (recommended: 24h)
- [ ] User roles are properly validated (kitchen_staff, admin)
- [ ] Location-based authorization is enforced
- [ ] Session validation is working correctly

## ⚠️ Development Bypass Safeguards

- [ ] `DISABLE_AUTH_CHECK` is **NOT** set in production environment
- [ ] `ALLOW_AUTH_BYPASS_IN_DEV` is **NOT** set in production environment
- [ ] `DISABLE_AUTH_CHECK` is **NOT** in `.env.example` (moved to internal docs)
- [ ] `.env.local` is in `.gitignore` and **NOT** committed
- [ ] No bypass flags in any `.env` files tracked by git
- [ ] `vercel.json` explicitly blocks bypass environment variables
- [ ] Build script includes production safety checks
- [ ] Security check script is executable (`chmod +x scripts/check-production-safety.sh`)

## 🔑 Environment Variables & Secrets

- [ ] All secrets use secure random generation (min 32 bytes)
- [ ] No secrets use `NEXT_PUBLIC_` prefix (client-exposed)
- [ ] `KITCHEN_JWT_SECRET` is different from other secrets
- [ ] `SANITY_WRITE_TOKEN` has minimum required permissions
- [ ] All required env vars are set in production:
  - [ ] `KITCHEN_JWT_SECRET`
  - [ ] `SANITY_WRITE_TOKEN`
  - [ ] `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - [ ] `NEXT_PUBLIC_SANITY_DATASET`
- [ ] Secrets are stored in secure secrets manager (not plain text files)
- [ ] Secrets are rotated on a regular schedule (recommended: 90 days)

## 🏗️ Build & Deployment

- [ ] Build includes security check: `npm run security-check`
- [ ] Build fails if bypass flags are present in production
- [ ] CI/CD pipeline runs security checks before deployment
- [ ] Deployment platform config blocks bypass env vars
- [ ] `NODE_ENV=production` is set correctly
- [ ] No development dependencies in production build
- [ ] Source maps are disabled or restricted in production

## 🛡️ API Security

- [ ] Rate limiting is enabled and configured
- [ ] JWT verification uses `HS256` algorithm only
- [ ] Token expiration is enforced (not just validated)
- [ ] State machine transitions are enforced
- [ ] Input validation is comprehensive:
  - [ ] Order IDs (format, length)
  - [ ] Status values (allowlist)
  - [ ] JWT claims (all required fields)
- [ ] Error messages don't leak sensitive information
- [ ] Audit logging captures all security events

## 📝 Documentation

- [ ] `docs/INTERNAL-SECURITY-DEV.md` is marked as internal-only
- [ ] Public documentation doesn't mention bypass mechanism
- [ ] `.env.example` doesn't contain bypass flags
- [ ] Team is trained on security procedures
- [ ] Incident response plan is documented
- [ ] Security contact information is current

## 🔍 Testing

- [ ] Authentication is tested with valid credentials
- [ ] Authentication correctly rejects invalid credentials
- [ ] Unauthenticated requests are blocked (401)
- [ ] Unauthorized requests are blocked (403 - wrong role/location)
- [ ] Token expiration is handled correctly
- [ ] JWT signature verification works
- [ ] Rate limiting is effective
- [ ] State machine prevents invalid transitions
- [ ] All security-critical paths are covered by tests

## 📊 Monitoring & Logging

- [ ] All authentication attempts are logged
- [ ] Failed auth attempts are monitored
- [ ] Bypass attempts trigger alerts (should never happen in production)
- [ ] JWT verification failures are logged with context
- [ ] Rate limit violations are tracked
- [ ] Suspicious patterns trigger alerts
- [ ] Log aggregation is configured (DataDog, Sentry, etc.)
- [ ] Security dashboard is set up

## 🚨 Incident Response

- [ ] Security team contact information is documented
- [ ] Incident response playbook exists
- [ ] Procedure for rotating compromised secrets is documented
- [ ] Emergency deployment process is defined
- [ ] Communication plan for security incidents exists
- [ ] Post-mortem template is ready

## ✅ Final Verification

Before deploying, verify:

1. **Run Security Check Locally:**
   ```bash
   NODE_ENV=production npm run security-check
   ```
   Expected: All checks pass

2. **Test Authentication:**
   ```bash
   # Should fail without valid JWT
   curl -X POST https://your-site.com/api/orders/update-status \
     -H "Content-Type: application/json" \
     -d '{"orderId": "test", "newStatus": "preparing"}'
   ```
   Expected: 401 Unauthorized

3. **Verify Build:**
   ```bash
   npm run build
   ```
   Expected: Build succeeds with security checks passing

4. **Check Environment:**
   ```bash
   # In production shell/logs
   echo $DISABLE_AUTH_CHECK
   echo $ALLOW_AUTH_BYPASS_IN_DEV
   ```
   Expected: Both should be empty

5. **Review Logs:**
   - No bypass warnings in production logs
   - Authentication is enforced
   - All requests show proper auth validation

## 🎯 Deployment Go/No-Go Decision

**GO** if:
- ✅ All checkboxes above are checked
- ✅ Security check script passes
- ✅ Build succeeds without warnings
- ✅ Tests pass
- ✅ No bypass flags in production environment
- ✅ Team has been briefed

**NO-GO** if:
- ❌ Any bypass flags present in production
- ❌ Required secrets missing
- ❌ Security checks fail
- ❌ Authentication not fully implemented
- ❌ Critical tests failing
- ❌ Unresolved security issues

## 📅 Regular Security Maintenance

Schedule these recurring tasks:

### Weekly
- [ ] Review failed authentication attempts
- [ ] Check for unusual activity patterns
- [ ] Verify monitoring/alerting is working

### Monthly
- [ ] Review and rotate JWT tokens for staff who left
- [ ] Audit user permissions and locations
- [ ] Review security logs for patterns
- [ ] Test incident response procedures

### Quarterly
- [ ] Rotate `KITCHEN_JWT_SECRET`
- [ ] Rotate all API tokens and secrets
- [ ] Review and update security documentation
- [ ] Conduct security training refresher
- [ ] Penetration testing or security audit

### Annually
- [ ] Comprehensive security audit
- [ ] Update dependencies for security patches
- [ ] Review and update incident response plan
- [ ] Update security compliance documentation

---

## Sign-Off

**Deployment Date:** _______________

**Deployed By:** _______________

**Reviewed By:** _______________

**Security Approval:** _______________

**Notes:**
_________________________________________
_________________________________________
_________________________________________

---

**Remember:** Security is not a one-time setup. Maintain vigilance and keep this checklist updated as your security posture evolves.
