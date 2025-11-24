# Branch Consolidation Plan

**Date**: 2025-11-24
**Current Branch**: `feat/location-based-menu`
**Target**: Consolidate all feature branches into `main`

## Branch Status Overview

### Active Local Branches
1. **feat/location-based-menu** (current) - Latest work
2. **feat/image-preloading-optimization** - Needs review
3. **feat/security-hardening** - Needs review
4. **feat/smart-preloading-denton-default** - Already merged to main
5. **security-fixes** - Needs consolidation
6. **main** - Production branch

### Remote Branches
- `origin/feat/location-based-menu` - Synced
- `origin/feat/security-hardening` - Needs review
- `origin/feat/smart-preloading-denton-default` - Merged
- `origin/security-fixes` - Needs consolidation
- `origin/security-fixes-integration` - Orphaned branch

## Strategy

### Phase 1: Review & Update Current Branch
**Branch**: `feat/location-based-menu`

**Status**: ✅ All CodeRabbit nitpicks addressed

**Recent Commits**:
- `6e9b78f3` - Improved check-vercel-config.ts robustness and README
- `425b978b` - Optimized observer lifecycle and removed production logging
- `5663ffe2` - Fixed zero coordinates and geolocation override issues
- `760b6e7d` - Added automated Vercel configuration checker
- `ff1ca5c9` - Added geolocation-based auto-selection

**Action Items**:
1. ✅ All nitpicks addressed
2. Wait for final CodeRabbit review
3. Create PR to `main`
4. Merge after approval

---

### Phase 2: Consolidate Security Fixes
**Branch**: `security-fixes`

**Commits Ahead of Main**:
- `f2bdf9c7` - Trigger Vercel redeploy with vercel.json fix
- `aaf4a3b4` - Add VERCEL.md to .gitignore
- `b1676812` - Add vercel.json with --legacy-peer-deps flag

**Overlap with Main**:
- Main already has similar commits (2b829aa7, f1642d92)
- Likely merge conflicts or duplicate work

**Action Items**:
1. Switch to `security-fixes` branch
2. Review diff against `main`: `git diff main...security-fixes`
3. If duplicate work:
   - Delete branch locally and remotely
4. If unique commits exist:
   - Cherry-pick unique commits to `main`
   - Delete branch after cherry-pick

**Commands**:
```bash
git checkout security-fixes
git diff main...security-fixes
# If no unique changes:
git checkout main
git branch -d security-fixes
git push origin --delete security-fixes
```

---

### Phase 3: Review Image Preloading Optimization
**Branch**: `feat/image-preloading-optimization`

**Status**: Unknown - needs inspection

**Action Items**:
1. Switch to branch: `git checkout feat/image-preloading-optimization`
2. Review commits: `git log main..feat/image-preloading-optimization`
3. Check if work is superseded by `feat/location-based-menu`
4. If superseded:
   - Delete branch
5. If contains unique work:
   - Merge into `feat/location-based-menu` or create separate PR

**Commands**:
```bash
git checkout feat/image-preloading-optimization
git log --oneline main..feat/image-preloading-optimization
git diff main...feat/image-preloading-optimization
```

---

### Phase 4: Review Security Hardening
**Branch**: `feat/security-hardening`

**Status**: Unknown - needs inspection

**Action Items**:
1. Switch to branch: `git checkout feat/security-hardening`
2. Review commits: `git log main..feat/security-hardening`
3. Check for security-critical changes
4. If contains important fixes:
   - Create separate PR to `main` with high priority
   - Request security review
5. If superseded:
   - Delete branch

**Commands**:
```bash
git checkout feat/security-hardening
git log --oneline main..feat/security-hardening
git diff main...feat/security-hardening
```

---

### Phase 5: Clean Up Merged Branches
**Branch**: `feat/smart-preloading-denton-default`

**Status**: Already merged to main (commit ccd19e03)

**Action Items**:
1. Verify merge: `git log main --grep="smart-preloading"`
2. Delete local branch: `git branch -d feat/smart-preloading-denton-default`
3. Delete remote branch: `git push origin --delete feat/smart-preloading-denton-default`

---

### Phase 6: Clean Up Orphaned Remote Branches
**Branch**: `origin/security-fixes-integration`

**Status**: Orphaned - no local branch

**Action Items**:
1. Check if branch exists: `git ls-remote --heads origin security-fixes-integration`
2. Review commits: `git log origin/main..origin/security-fixes-integration`
3. If no unique work:
   - Delete remote branch: `git push origin --delete security-fixes-integration`
4. If contains unique work:
   - Create local tracking branch
   - Cherry-pick unique commits to `main`
   - Delete branch

---

## Consolidation Order

Execute in this sequence:

1. **Complete `feat/location-based-menu`** (Phase 1)
   - Wait for final review
   - Create PR → `main`
   - Merge

2. **Inspect and consolidate `security-fixes`** (Phase 2)
   - Review unique commits
   - Cherry-pick or delete

3. **Inspect `feat/image-preloading-optimization`** (Phase 3)
   - Check for unique work
   - Merge or delete

4. **Inspect `feat/security-hardening`** (Phase 4)
   - Priority: HIGH (security)
   - Review and create PR if needed

5. **Clean up merged branches** (Phase 5)
   - Delete `feat/smart-preloading-denton-default`

6. **Clean up orphaned branches** (Phase 6)
   - Delete `origin/security-fixes-integration`

---

## Post-Consolidation Verification

After consolidation, verify:

```bash
# 1. All local branches cleaned up
git branch

# 2. All remote branches cleaned up
git branch -r

# 3. Main branch has all important changes
git log --oneline main -20

# 4. No uncommitted changes
git status

# 5. All tests pass
npm test
npm run build
npm run lint

# 6. Vercel config check passes
npx tsx scripts/check-vercel-config.ts
```

---

## Expected Final State

### Local Branches
- `main` (up to date with all features)
- `feat/location-based-menu` (can be deleted after merge)

### Remote Branches
- `origin/main` (production)
- No feature branches (all merged or deleted)

### Tags (Optional)
Consider tagging major milestones:
```bash
git tag -a v1.0.0-location-menu -m "Add location-based menu with geolocation"
git push origin v1.0.0-location-menu
```

---

## Rollback Plan

If issues occur during consolidation:

1. **Backup current state**:
   ```bash
   git checkout main
   git branch backup-main-$(date +%Y%m%d)
   ```

2. **Reset to known good state**:
   ```bash
   git reset --hard origin/main
   ```

3. **Restore deleted branches**:
   ```bash
   # Find deleted branch commit
   git reflog
   # Restore branch
   git checkout -b recovered-branch <commit-hash>
   ```

---

## Notes

- All branches should pass `npx tsx scripts/check-vercel-config.ts` before merging
- Consider squashing commits when creating PRs for cleaner history
- Update VERCEL.md with any deployment-related changes
- Notify team before deleting remote branches
- Run full test suite after each merge to `main`
