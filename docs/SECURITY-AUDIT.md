# Security Audit Report

## Current Status

**Last Audit**: 2024-01-XX
**Tool**: npm audit
**Total Vulnerabilities**: 7 high severity

## Executive Summary

After running `npm audit fix`, most vulnerabilities were resolved. The remaining vulnerabilities are all related to the `glob` package in Sanity's dependency chain.

### ✅ Fixed Automatically (Non-Breaking)
- `js-yaml` - Prototype pollution (moderate) → Fixed
- `min-document` - Prototype pollution (moderate) → Fixed
- `tar` - Race condition (moderate) → Fixed
- `vite` - File system bypass (moderate) → Fixed

### ⚠️ Remaining Vulnerabilities

#### glob CLI Command Injection (High Severity)
- **Affected Package**: `glob@10.2.0 - 10.4.5`
- **CVE**: GHSA-5j98-mcp5-4vw2
- **Severity**: High
- **Issue**: Command injection via `-c/--cmd` flag executes matches with `shell:true`

**Dependency Chain**:
```
sanity@^4.10.2
  └─ @sanity/cli
      └─ @sanity/runtime-cli
          └─ @architect/inventory
              └─ @architect/utils
                  └─ glob@10.2.0-10.4.5 (vulnerable)
```

**Fix Available**: Upgrade to `sanity@3.95.0` (breaking change)

## Risk Assessment

### Actual Risk: LOW to MEDIUM

**Why this vulnerability has low real-world impact in our application**:

1. **CLI Tool, Not Runtime**
   - The vulnerable `glob` package is only used by Sanity CLI tools
   - It's NOT used in the Next.js application runtime
   - Users of your website are not exposed to this vulnerability

2. **Developer-Only Exposure**
   - Only affects developers running Sanity Studio locally
   - Requires access to your local development environment
   - Not exploitable via web requests

3. **Specific Attack Vector Required**
   - Attacker would need to:
     - Have access to your development machine
     - Run specific Sanity CLI commands with malicious input
     - Use the `-c/--cmd` flag specifically

4. **No Known Exploits in the Wild**
   - This is a theoretical vulnerability in the CLI
   - No reported active exploitation

### When This Becomes a Problem

This vulnerability would be concerning if:
- ❌ You're building a CLI tool that users will download and run
- ❌ You're running Sanity CLI in a CI/CD pipeline with untrusted input
- ❌ Multiple untrusted developers have access to your codebase
- ✅ None of these apply to a typical restaurant website

## Recommendations

### Option 1: Accept the Risk (Recommended for Now)
**Status**: ✅ Acceptable for production

Since this is a dev-only CLI vulnerability with low real-world impact:

1. Document the vulnerability (this file)
2. Monitor for updates to Sanity
3. Apply the fix when Sanity releases a stable patch
4. Review again in 30-60 days

**Action Items**:
- [ ] Set calendar reminder to check for Sanity updates (30 days)
- [ ] Subscribe to Sanity security advisories
- [ ] Add to security review checklist

### Option 2: Force Upgrade (Breaking Change)
**Status**: ⚠️ Not recommended without testing

```bash
npm audit fix --force
```

**Impact**:
- Will install `sanity@3.95.0` (potentially breaking)
- May require code changes in Sanity Studio setup
- Could break existing Sanity queries or schema
- Requires thorough testing before production

**If you choose this option**:
1. Create a new branch: `git checkout -b fix/sanity-security-upgrade`
2. Run: `npm audit fix --force`
3. Test Sanity Studio: `npm run dev` → visit `/studio`
4. Test all CMS operations: create, edit, delete content
5. Test GROQ queries in your app
6. Review Sanity changelog for breaking changes
7. Only merge if all tests pass

### Option 3: Use npm Overrides (Temporary Fix)
**Status**: 🔧 Advanced workaround

Add to `package.json`:
```json
{
  "overrides": {
    "glob": "^11.0.0"
  }
}
```

Then run:
```bash
npm install
```

**Risks**:
- May cause compatibility issues with Sanity CLI
- Overrides the dependency tree (can cause unexpected behavior)
- Should only be temporary until Sanity updates

## Mitigation Strategies (Current Setup)

Even without fixing the vulnerability, you can reduce risk:

### 1. Developer Environment Security ✅
- [ ] Ensure all developer machines have up-to-date antivirus
- [ ] Use strong passwords and 2FA on developer accounts
- [ ] Keep development machines patched and updated
- [ ] Don't run untrusted code in development environment

### 2. CI/CD Pipeline Security ✅
- [ ] Use trusted CI/CD environments (GitHub Actions, Vercel, etc.)
- [ ] Don't accept untrusted input in build scripts
- [ ] Use read-only tokens where possible
- [ ] Audit CI/CD logs regularly

### 3. Sanity Access Controls ✅
- [ ] Limit Sanity admin access to trusted team members
- [ ] Use role-based access control in Sanity
- [ ] Enable audit logging in Sanity
- [ ] Review Sanity access logs monthly

### 4. Monitoring ✅
- [ ] Subscribe to: https://github.com/isaacs/node-glob/security/advisories
- [ ] Subscribe to: https://github.com/sanity-io/sanity/security/advisories
- [ ] Check `npm audit` weekly
- [ ] Review security advisories monthly

## Action Plan

### Immediate (This Week)
- [x] Run `npm audit fix` to fix non-breaking vulnerabilities
- [ ] Document remaining vulnerability (this file)
- [ ] Share with development team
- [ ] Add to project README

### Short Term (Next 30 Days)
- [ ] Monitor for Sanity security updates
- [ ] Test application with latest Sanity version in dev environment
- [ ] Review Sanity changelog for security fixes

### Medium Term (60-90 Days)
- [ ] Evaluate upgrade to Sanity 3.95.0+ when stable
- [ ] Plan breaking change migration if needed
- [ ] Update this document with findings

## Testing Checklist

If you decide to upgrade Sanity, test:

### Sanity Studio
- [ ] Studio loads at `/studio`
- [ ] Can create new documents
- [ ] Can edit existing documents
- [ ] Can delete documents
- [ ] Schema validation works
- [ ] Image uploads work
- [ ] Custom input components work

### Frontend Application
- [ ] All GROQ queries return data
- [ ] Menu items display correctly
- [ ] Location data loads
- [ ] Images load from Sanity CDN
- [ ] Order schema works
- [ ] No console errors

### Scripts
- [ ] `npm run stripe:setup` works
- [ ] `npm run locations:migrate` works
- [ ] All `tsx` scripts execute

## Additional Resources

- [npm glob vulnerability details](https://github.com/advisories/GHSA-5j98-mcp5-4vw2)
- [Sanity security advisories](https://github.com/sanity-io/sanity/security/advisories)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)

## Sign-Off

**Decision**: Accept risk for now, monitor for updates

**Rationale**:
1. Vulnerability is in dev-only CLI tool, not runtime
2. Low real-world exploitability
3. No active exploits known
4. Breaking changes in fix require careful testing
5. Risk is manageable with proper dev environment security

**Reviewer**: ________________
**Date**: ________________
**Next Review**: ________________ (30 days)

---

**Note**: This decision should be reviewed whenever:
- A new version of Sanity is released
- A security patch for glob is released
- The application architecture changes (e.g., adding CLI tools for users)
- A security incident occurs
