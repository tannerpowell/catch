# Multi-Location Online Ordering Setup Checklist

Complete these steps in order to set up Stripe Connect for all 7 locations.

---

## Phase 1: Install Dependencies

### Step 1.1: Install Required Packages

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
npm install -D tsx
```

**What these do:**
- `stripe` - Backend Stripe SDK for Node.js
- `@stripe/stripe-js` - Frontend Stripe SDK
- `@stripe/react-stripe-js` - React components for Stripe
- `tsx` - TypeScript execution for scripts

**Time:** 2 minutes

---

## Phase 2: Environment Setup

### Step 2.1: Get Stripe API Keys

1. Go to https://dashboard.stripe.com
2. Create account or log in
3. Click "Developers" → "API keys"
4. Copy your keys

**For testing:**
- Use keys that start with `sk_test_` and `pk_test_`

**For production:**
- Use keys that start with `sk_live_` and `pk_live_`

### Step 2.2: Update Environment Variables

Add to `.env.local`:

```bash
# Stripe Platform Account
STRIPE_SECRET_KEY=sk_test_xxxxx  # Replace with your secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Replace with your publishable key
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # You'll get this later when setting up webhooks

# Sanity (you should already have these)
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=skxxxxx  # Make sure this has WRITE permission

# Your Site URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Change to https://thecatch.com in production
```

### Step 2.3: Verify Sanity Token Permissions

1. Go to https://sanity.io → Your Project → API
2. Find your token (or create new one)
3. Make sure it has "Editor" or "Administrator" permissions
4. Copy token to `SANITY_API_TOKEN` in `.env.local`

**Time:** 5 minutes

---

## Phase 3: Deploy Sanity Schemas

### Step 3.1: Build and Deploy Schemas

```bash
# Make sure you're in the root directory
cd /Users/tp/Projects/Catch

# Deploy schemas
cd sanity
npm run build
npx sanity deploy

# Return to root
cd ..
```

### Step 3.2: Verify in Sanity Studio

1. Open Sanity Studio (http://localhost:3333 or your studio URL)
2. Check sidebar - you should see "Location" and "Order" types
3. Click on a Location
4. Scroll down - you should see new fields:
   - Email
   - Stripe Account ID
   - Online Ordering Enabled
   - Tax Rate
   - etc.

**Time:** 3 minutes

---

## Phase 4: Migrate Existing Locations

### Step 4.1: Run Migration Script

```bash
npm run locations:migrate
```

**What this does:**
- Adds default values to all existing locations
- Sets `onlineOrderingEnabled: false` (disabled until ready)
- Sets `taxRate: 0.0825` (8.25% for Texas)
- Initializes all Stripe fields

### Step 4.2: Update Location Data in Sanity

Open Sanity Studio and for EACH location:

#### Required Fields:
- [ ] **Email**: Add location manager's email
- [ ] **Tax Rate**: Verify/adjust (format: `0.0825` for 8.25%)

#### Optional Fields:
- [ ] **Revel Establishment ID**: If you know it
- [ ] **Delivery Fee**: If offering delivery
- [ ] **Minimum Order Amount**: If requiring minimum

**Time:** 10 minutes (7 locations × ~90 seconds each)

---

## Phase 5: Create Stripe Connected Accounts

### Step 5.1: Run Setup Script

```bash
npm run stripe:setup
```

**What this does:**
- Creates Stripe Express Connected Account for each location
- Generates onboarding link (expires in 24 hours)
- Updates Sanity with account IDs

**Expected output:**
```
🚀 Starting Stripe Connect setup for The Catch locations...

📍 Found 7 locations

============================================================
Processing: Catch DFW
============================================================
✅ Created account: acct_1234567890
✅ Onboarding link created
✅ Sanity updated

📧 ONBOARDING LINK for Catch DFW:
   https://connect.stripe.com/setup/e/acct_1234567890/...

   ⚠️  This link expires in 24 hours!
   Send to: manager-dfw@thecatch.com
```

### Step 5.2: Save Onboarding Links

Copy the onboarding links from the script output to a document. You'll send these to location managers.

**Time:** 5 minutes

---

## Phase 6: Location Manager Onboarding

### Step 6.1: Send Onboarding Emails

For each location, send this email:

```
Subject: Set Up Online Ordering for [Location Name]

Hi [Manager Name],

We're setting up online ordering for [Location Name]!

Please complete your Stripe account setup by clicking this link:
[PASTE ONBOARDING LINK HERE]

You'll need:
• Your Tax ID (EIN or SSN)
• Bank account details (for daily payouts)
• About 5-10 minutes

This link expires in 24 hours. If it expires, let me know and I'll
generate a new one.

Questions? Reply to this email or call me.

Thanks!
[Your Name]
```

### Step 6.2: What Managers Need to Provide

Each location manager will:
1. Click onboarding link
2. Verify email address
3. Provide business details:
   - Business name (pre-filled)
   - Address (pre-filled)
   - Tax ID (EIN or SSN)
4. Add bank account for payouts
5. Accept Stripe Terms of Service
6. Complete verification (may take 1-2 business days)

**Time:** 5-10 minutes per location (manager's time, not yours)

---

## Phase 7: Verify Account Status

### Step 7.1: Check Status (Next Day)

After managers complete onboarding:

```bash
npm run stripe:check
```

**What this does:**
- Checks each Stripe account
- Shows which are ready for orders
- Shows which need more info
- Updates Sanity with current status

**Expected output:**
```
============================================================
SUMMARY
============================================================

✅ Ready for orders (5):
   - Catch DFW
   - Catch HTX Downtown
   - Catch AUS
   - Catch SA
   - Catch Woodlands

⏳ Onboarding incomplete (2):
   - Catch HTX (needs bank account)
   - Catch FW (needs tax ID)
```

### Step 7.2: Follow Up on Incomplete

For any location showing "Onboarding incomplete":
1. The script will show what's missing
2. The script will generate a new onboarding link
3. Send new link to that manager

### Step 7.3: Wait for Stripe Verification

Even after onboarding is "complete", Stripe may need 1-2 business days to verify:
- Tax ID
- Bank account
- Business details

Run `npm run stripe:check` daily until all show "Ready for orders".

**Time:** 2 minutes initially, then 1 minute/day for follow-ups

---

## Phase 8: Enable Online Ordering

### Step 8.1: Enable in Sanity

Once a location shows "✅ Ready for orders":

1. Open Sanity Studio
2. Go to Locations
3. Find the ready location
4. Set `onlineOrderingEnabled: true`
5. Verify other settings:
   - `acceptingOrders: true`
   - `orderTypes: ["pickup"]` (or add "delivery")
   - `taxRate` is correct
6. Click Publish

**Do this for each ready location.**

### Step 8.2: Verify in Sanity

Location should now show in preview:
```
Catch DFW
Dallas 🛒 💳
```

Icons mean:
- 🛒 = Online ordering enabled
- 💳 = Stripe charges enabled

**Time:** 10 minutes (7 locations)

---

## Phase 9: Test Payment Flow

### Step 9.1: Test with One Location

1. Visit your website
2. Navigate to menu for a ready location
3. Add item to cart
4. Go to checkout
5. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/30)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)

### Step 9.2: Verify Order Created

1. Open Sanity Studio
2. Click "Orders" in sidebar
3. Find your test order
4. Verify:
   - [ ] Status is "confirmed"
   - [ ] Payment status is "paid"
   - [ ] Correct location
   - [ ] Correct items
   - [ ] Correct total

### Step 9.3: Verify Payment in Stripe

1. Go to Stripe Dashboard
2. Click "Payments"
3. Find your test payment
4. Verify it shows the correct Connected Account

### Step 9.4: Test Location Lock

1. Add item from Location A
2. Try to add item from Location B
3. Verify modal appears:
   ```
   Switch Location?
   Your cart contains items from Catch DFW.
   Switching to Catch HTX will clear your cart.
   ```
4. Click "Cancel" - cart stays with Location A
5. Click "Switch" - cart clears, Location B item added

**Time:** 15 minutes

---

## Phase 10: Production Launch

### Step 10.1: Switch to Live Keys

In `.env.local`, replace test keys with live keys:

```bash
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

### Step 10.2: Update Base URL

```bash
NEXT_PUBLIC_BASE_URL=https://thecatch.com
```

### Step 10.3: Re-run Setup (If Needed)

If you set up Connected Accounts in test mode, you'll need to create them again in live mode:

```bash
npm run stripe:setup
```

Send new onboarding links to managers.

### Step 10.4: Set Up Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://thecatch.com/api/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy webhook signing secret
6. Add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### Step 10.5: Deploy

```bash
npm run build
# Then deploy to Vercel/hosting
```

**Time:** 30 minutes

---

## Completion Checklist

Use this to verify everything is set up:

### Backend
- [ ] Sanity schemas deployed
- [ ] All locations have email addresses
- [ ] All locations have correct tax rates
- [ ] All locations migrated with new fields

### Stripe
- [ ] Platform account created
- [ ] Live API keys in production .env
- [ ] All 7 Connected Accounts created
- [ ] All managers completed onboarding
- [ ] All accounts show "charges_enabled: true"
- [ ] Webhook endpoint configured

### Sanity
- [ ] All locations have `stripeAccountId`
- [ ] All locations show 💳 icon (Stripe enabled)
- [ ] Ready locations have `onlineOrderingEnabled: true`
- [ ] Ready locations show 🛒 icon (orders enabled)

### Testing
- [ ] Test order completed successfully
- [ ] Order appears in Sanity
- [ ] Payment appears in Stripe
- [ ] Location lock modal works
- [ ] Can switch locations by clearing cart

### Production
- [ ] Live Stripe keys configured
- [ ] Webhooks configured
- [ ] Base URL set to production domain
- [ ] Deployed to production
- [ ] Real order tested (small amount)

---

## Troubleshooting

### "npm command not found: stripe:setup"

**Solution:** Install tsx:
```bash
npm install -D tsx
```

### "Missing environment variable: STRIPE_SECRET_KEY"

**Solution:** Add to `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### "Unauthorized" error from Sanity

**Solution:** Check `SANITY_API_TOKEN` has write permissions

### "Account does not have charges enabled"

**Solution:**
1. Run `npm run stripe:check`
2. Look for pending requirements
3. Location manager needs to complete onboarding

### Manager's onboarding link expired

**Solution:**
1. Run `npm run stripe:check`
2. Script generates new link
3. Send new link to manager

### Payment not routing to correct location

**Solution:**
1. Verify location has `stripeAccountId` in Sanity
2. Check `stripeChargesEnabled: true`
3. Verify API is using correct `stripeAccountId`

---

## Next Steps After Setup

Once all locations are enabled:

1. **Monitor orders** - Check Sanity daily for new orders
2. **Train staff** - Show kitchen how to view/manage orders
3. **Customer support** - Set up process for order issues
4. **Marketing** - Announce online ordering is live
5. **Iterate** - Gather feedback and improve

---

## Support

- **Documentation**: `/docs/ecommerce/` directory
- **Scripts Help**: `/scripts/ecommerce/README.md`
- **Quick Start**: `/docs/ecommerce/STRIPE-CONNECT-QUICK-START-GUIDE.md`
- **Full Details**: `/docs/ecommerce/STRIPE-CONNECT-MULTI-LOCATION-ARCHITECTURE.md`
- **POC Strategy**: `/docs/ecommerce/E-COMMERCE-PROOF-OF-CONCEPT-STRATEGY.md`

---

## Estimated Total Time

- **Initial Setup**: 30 minutes (your time)
- **Manager Onboarding**: 10 minutes per location (their time)
- **Verification**: 5 minutes per day for 2-3 days
- **Testing**: 15 minutes
- **Production Launch**: 30 minutes

**Total: ~2 hours of your time spread over 3-4 days**

---

Good luck! 🚀
