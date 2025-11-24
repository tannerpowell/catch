# Quick Start: Multi-Location Cart Setup

This is the **TL;DR** version. For complete details, see:
- `/docs/stripe-connect-multi-location.md` - Full technical docs
- `/docs/IMPLEMENTATION-SUMMARY.md` - What was implemented
- `/scripts/README.md` - Script usage guide

---

## The Problem You Had

**"I have 7 restaurants with potentially 2-7 different Stripe accounts. How does cart logic work?"**

## The Solution

**One cart = One location = One Stripe account**

Customer can't mix items from different locations. If they try, they see:

```
┌─────────────────────────────────────────────┐
│  Switch Location?                           │
│                                             │
│  Your cart has items from Catch DFW.       │
│  Switching to Catch HTX will clear cart.   │
│                                             │
│  [Cancel]  [Switch to Catch HTX]           │
└─────────────────────────────────────────────┘
```

**Payment automatically routes to correct location via Stripe Connect.**

---

## How It Works

```
Customer adds item from DFW
         ↓
Cart locks to DFW
         ↓
Customer checks out
         ↓
Payment Intent created with: transfer_data.destination = acct_DFW
         ↓
Stripe automatically sends money to DFW's account
         ↓
Order saved in Sanity (linked to DFW)
         ↓
Order sent to DFW's Revel POS
```

---

## What Changed in Your Code

### 1. Sanity Schemas
- **Updated**: `location.ts` - Added Stripe & ordering fields
- **New**: `order.ts` - Complete order tracking

### 2. TypeScript Types
- **Updated**: `lib/types.ts` - Added Cart, Order interfaces

### 3. Scripts (NEW)
- `migrate-locations.ts` - Add fields to existing locations
- `setup-stripe-locations.ts` - Create Stripe accounts
- `check-stripe-status.ts` - Verify account status

---

## Setup: 30 Minutes

### Step 1: Add Environment Variables (2 min)

Add to `.env.local`:

```bash
# Stripe Platform Account
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Sanity (you already have these)
NEXT_PUBLIC_SANITY_PROJECT_ID=xxxxx
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=skxxxxx  # Needs WRITE permission

# Your site URL
NEXT_PUBLIC_BASE_URL=https://thecatch.com
```

#### Security Notes

**Protect your sensitive keys:**

- **Never commit `.env.local`** - Add it to `.gitignore` immediately:
  ```
  .env.local
  .env.*.local
  ```
- **Use test keys for development** - Stripe provides separate test and live keys. Use `sk_test_` and `pk_test_` locally.
- **Use live keys only in production** - Live keys (`sk_live_`, `pk_live_`) should only be in production environment.
- **Store production secrets in your hosting provider:**
  - **Vercel**: Use Settings → Environment Variables (not `.env.local`)
  - **Other hosts**: Use their secret management system
- **Rotate keys if exposed** - If a key is ever committed or leaked:
  1. Immediately deactivate it in Stripe/Sanity dashboard
  2. Create a new key
  3. Update all environments
  4. Check git history for accidental commits: `git log --all --full-history -- .env.local`

### Step 2: Install Dependencies (1 min)

```bash
npm install stripe @sanity/client tsx
```

### Step 2.5: Verify SANITY_API_TOKEN Write Permissions (2 min)

Before deploying, verify your token has write permissions by testing a Sanity mutation:

```bash
curl -X POST https://api.sanity.io/v2021-03-25/data/mutate/YOUR_PROJECT_ID?dataset=production \
  -H "Authorization: Bearer YOUR_SANITY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mutations": [
      {
        "createIfNotExists": {
          "_id": "test-permission-check",
          "_type": "test",
          "value": "test"
        }
      }
    ]
  }'
```

Replace:
- `YOUR_PROJECT_ID` - Your project ID from `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `YOUR_SANITY_API_TOKEN` - Your token from `SANITY_API_TOKEN`

**Expected Response (success):**
```json
{
  "transactionid": "xyz123",
  "results": [{"id": "test-permission-check", "operation": "create"}]
}
```

**If you get a permissions error:**
```json
{
  "error": {
    "description": "This token does not have permission to perform this operation"
  }
}
```

**Fix:**
1. Go to Sanity Dashboard → Settings → API → Tokens
2. Create a new token with **Editor** or **Admin** role
3. Copy it to `.env.local` as `SANITY_API_TOKEN`
4. Re-run this verification command

After successful verification, you can continue to Step 3.

### Step 3: Deploy Schemas (2 min)

```bash
cd sanity
npm run build
npx sanity deploy
```

### Step 4: Migrate Locations (1 min)

```bash
npx tsx scripts/migrate-locations.ts
```

### Step 5: Update Location Data (5 min)

Open Sanity Studio, for each location add:
- **Email** - Manager's email
- **Tax Rate** - e.g., `0.0825` for 8.25%
- **Revel Establishment ID** (if known)

### Step 6: Create Stripe Accounts (5 min)

```bash
npx tsx scripts/setup-stripe-locations.ts
```

Copy the onboarding links it outputs.

### Step 7: Send Onboarding Links (5 min)

Email each location manager their link. They need:
- Tax ID (EIN or SSN)
- Bank account details
- 5-10 minutes

### Step 8: Verify Ready (2 min)

After managers complete onboarding:

```bash
npx tsx scripts/check-stripe-status.ts
```

Look for "✅ Ready for orders"

### Step 9: Enable Online Ordering (2 min)

In Sanity, set `onlineOrderingEnabled: true` for each ready location.

### Step 10: Test (5 min)

1. Visit your site
2. Add item from Location A
3. Try to add from Location B → see modal
4. Complete checkout with test card: `4242 4242 4242 4242`
5. Verify order in Sanity

---

## What's NOT Built Yet

You have the backend structure, but still need to build:

### Frontend (Week 1-2)
- [ ] Cart context with location-locking
- [ ] Cart drawer UI
- [ ] Location switch modal
- [ ] Checkout form
- [ ] Stripe Elements integration

### API Routes (Week 2)
- [ ] `/api/stripe/create-payment-intent`
- [ ] `/api/stripe/webhook`
- [ ] `/api/orders/create`

### Integration (Week 3)
- [ ] Revel POS order submission
- [ ] Email/SMS notifications

See `/online-ordering-implementation-plan.md` for complete specifications.

---

## Key Files to Read

| File | Purpose | When to Read |
|------|---------|--------------|
| `QUICK-START.md` (this) | Get started quickly | First |
| `IMPLEMENTATION-SUMMARY.md` | Understand what changed | After setup |
| `stripe-connect-multi-location.md` | Deep technical details | When implementing |
| `scripts/README.md` | Script usage | When running scripts |

---

## Testing

### Test Mode
Use test keys and test cards:

```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

---

## Common Questions

**Q: Can customers order from multiple locations at once?**
A: No, cart locks to one location.

**Q: What if I have 7 different Stripe accounts already?**
A: That works! You'd add each existing account as a Connected Account to your platform account.

**Q: What about platform fees?**
A: Optional. You can take a % of each transaction (e.g., 2% for marketing).

**Q: How do refunds work?**
A: Refunds come from the location's account. You can issue them via API.

**Q: What if Revel is down?**
A: Order still completes. Retry later or manual entry.

---

## Support

- **Documentation**: `/docs/` directory
- **Stripe Connect**: https://stripe.com/docs/connect
- **Stripe Support**: support@stripe.com
- **Sanity Support**: support@sanity.io

---

## Summary

✅ **Schemas ready** - Sanity can track orders and location Stripe accounts
✅ **Types defined** - TypeScript knows your data structures
✅ **Scripts ready** - Automate Stripe Connect setup
✅ **Architecture clear** - One cart → One location → One Stripe account

**Next:** Run the setup steps above (30 min), then start building the frontend cart and checkout following the implementation plan.

The complex multi-location payment routing is handled automatically by Stripe Connect. Your frontend just needs to enforce the location-locked cart rule. Simple!
