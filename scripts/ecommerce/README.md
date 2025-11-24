# Stripe Connect Setup Scripts

This directory contains scripts for setting up and managing Stripe Connect for multi-location online ordering.

## Prerequisites

1. **Environment Variables** - Create or update `.env.local`:

```bash
# Stripe (Platform Account)
STRIPE_SECRET_KEY=sk_live_xxxxx  # or sk_test_xxxxx for testing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=skxxxxx  # Need write permissions

# Base URL (for onboarding redirects)
NEXT_PUBLIC_BASE_URL=https://thecatch.com  # or http://localhost:3000 for dev
```

2. **Dependencies** - Install required packages:

```bash
npm install stripe @sanity/client tsx
```

3. **Sanity Schemas** - Ensure you've deployed the updated location and order schemas:

```bash
cd sanity
npm run build
npx sanity deploy
```

## Scripts Overview

### 1. migrate-locations.ts

**Purpose:** Add online ordering fields to existing location documents

**When to run:** Once, before setting up Stripe accounts

**What it does:**
- Adds default values for new fields (onlineOrderingEnabled, taxRate, etc.)
- Sets reasonable defaults (online ordering disabled, pickup only)
- Configures tax rates by state

**Usage:**
```bash
npx tsx scripts/migrate-locations.ts
```

**Output:**
```
🔄 Starting location migration...

📍 Found 7 locations to migrate

Migrating: Catch DFW (Dallas, TX)
  ✅ Migrated (tax rate: 8.25%)
Migrating: Catch HTX (Houston, TX)
  ✅ Migrated (tax rate: 8.25%)
...

✅ Migration complete!
```

**After running:**
1. Open Sanity Studio
2. Review each location
3. Adjust tax rates if needed
4. Add email addresses for location managers

---

### 2. setup-stripe-locations.ts

**Purpose:** Create Stripe Connected Accounts for all locations

**When to run:** After migration, once per location

**What it does:**
- Fetches all locations from Sanity
- Creates Stripe Express Connected Account for each
- Generates onboarding links (expire in 24 hours)
- Updates Sanity with account IDs and links

**Usage:**
```bash
npx tsx scripts/setup-stripe-locations.ts
```

**Output:**
```
🚀 Starting Stripe Connect setup for The Catch locations...

📍 Found 7 locations

============================================================
Processing: Catch DFW
============================================================
📝 Creating Stripe Express account...
✅ Created account: acct_1234567890
🔗 Generating onboarding link...
✅ Onboarding link created
💾 Updating Sanity...
✅ Sanity updated

📧 ONBOARDING LINK for Catch DFW:
   https://connect.stripe.com/setup/e/acct_1234567890/...

   ⚠️  This link expires in 24 hours!
   Send to: manager-dfw@thecatch.com

...

✅ Setup complete!

Next steps:
1. Send onboarding links to location managers
2. Wait for them to complete onboarding (usually 5-10 minutes)
3. Run check-stripe-status.ts to verify accounts are ready
4. Enable onlineOrderingEnabled in Sanity for each location
```

**Notes:**
- Skips locations that already have `stripeAccountId`
- To recreate an account, delete `stripeAccountId` in Sanity first
- Onboarding links expire after 24 hours (regenerate with check-stripe-status.ts)

**What location managers need to provide:**
- Tax ID (EIN or SSN)
- Bank account details for payouts
- Verify email address
- Accept Stripe Terms of Service

---

### 3. check-stripe-status.ts

**Purpose:** Verify account status and update Sanity

**When to run:**
- After location managers complete onboarding
- Periodically to check account health
- Anytime you need to troubleshoot

**What it does:**
- Checks each Stripe account's capabilities
- Shows pending requirements
- Generates new onboarding links if needed
- Updates Sanity with current status

**Usage:**
```bash
npx tsx scripts/check-stripe-status.ts
```

**Output:**
```
🔍 Checking Stripe account status for all locations...

📍 Found 7 locations with Stripe accounts

────────────────────────────────────────────────────────────
Catch DFW
────────────────────────────────────────────────────────────
Account ID: acct_1234567890
Type: express
Country: US
Email: manager-dfw@thecatch.com

Capabilities:
  Charges: ✅ Enabled
  Payouts: ✅ Enabled

✅ No pending requirements

🎉 READY FOR ORDERS

💾 Sanity updated with current status

────────────────────────────────────────────────────────────
Catch HTX
────────────────────────────────────────────────────────────
Account ID: acct_0987654321
Type: express
Country: US
Email: manager-htx@thecatch.com

Capabilities:
  Charges: ❌ Disabled
  Payouts: ❌ Disabled

⚠️  Requirements pending:
     - business_profile.mcc
     - business_profile.url
     - external_account

⏳ Onboarding incomplete

🔗 New onboarding link:
   https://connect.stripe.com/setup/e/acct_0987654321/...

💾 Sanity updated with current status

...

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
   - Catch HTX
   - Catch FW

Next steps:
- Complete onboarding for pending locations
- Run this script again to verify
```

**Interpreting results:**

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ Ready for orders | Account fully set up | Enable online ordering in Sanity |
| ⏳ Onboarding incomplete | Manager hasn't finished | Send them the new onboarding link |
| ⚠️  Issues | Something's wrong | Check Stripe dashboard or contact support |

---

## Complete Setup Workflow

### Step 1: Prepare Locations (5 minutes)

```bash
# 1. Migrate existing locations
npx tsx scripts/migrate-locations.ts

# 2. Open Sanity Studio
npm run dev  # in sanity directory

# 3. For each location:
#    - Set correct tax rate (e.g., 0.0825 for 8.25%)
#    - Add location manager email
#    - Set Revel Establishment ID (if known)
```

### Step 2: Create Stripe Accounts (10 minutes)

```bash
# 1. Ensure Stripe API key is in .env.local
# 2. Run setup script
npx tsx scripts/setup-stripe-locations.ts

# 3. Copy onboarding links for each location
# 4. Send links to location managers via email
```

**Email template for location managers:**

```
Subject: Set Up Online Ordering for [Location Name]

Hi [Manager Name],

We're setting up online ordering for [Location Name]!

Please click the link below to complete your Stripe account setup.
This will enable us to accept online payments.

[ONBOARDING LINK]

You'll need:
- Tax ID (EIN or SSN)
- Bank account details for daily payouts
- 5-10 minutes to complete

This link expires in 24 hours. Let me know if you have any questions!

Thanks,
[Your Name]
```

### Step 3: Monitor Onboarding (1-2 days)

```bash
# Check status regularly
npx tsx scripts/check-stripe-status.ts

# When all show "Ready for orders", proceed to Step 4
```

### Step 4: Enable Online Ordering

1. Open Sanity Studio
2. For each ready location:
   - Set `onlineOrderingEnabled` to `true`
   - Verify `acceptingOrders` is `true`
   - Confirm `orderTypes` includes desired options
   - Test with a small order

### Step 5: Test End-to-End

1. Visit your website
2. Select a location
3. Add items to cart
4. Complete checkout with test card: `4242 4242 4242 4242`
5. Verify order appears in Sanity
6. Check Stripe dashboard for payment

---

## Troubleshooting

### Issue: "No Stripe account ID"

**Cause:** Location hasn't been processed by setup script

**Solution:**
```bash
npx tsx scripts/setup-stripe-locations.ts
```

### Issue: "Onboarding incomplete"

**Cause:** Location manager hasn't finished onboarding or there are pending requirements

**Solution:**
1. Run `check-stripe-status.ts` to get new onboarding link
2. Send link to location manager
3. They complete the missing requirements

### Issue: "Account does not have charges enabled"

**Cause:** Stripe is still verifying the account (usually 1-2 business days)

**Solution:**
- Wait for Stripe verification email
- Check Stripe dashboard for status
- If it's been >3 days, contact Stripe support

### Issue: Script fails with "Missing environment variable"

**Cause:** Environment variables not set

**Solution:**
```bash
# Check .env.local has these values:
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_SANITY_PROJECT_ID=...
SANITY_API_TOKEN=sk...
NEXT_PUBLIC_BASE_URL=https://...
```

### Issue: "Unauthorized" error from Sanity

**Cause:** SANITY_API_TOKEN doesn't have write permissions

**Solution:**
1. Go to sanity.io → Project → API
2. Create new token with "Write" permissions
3. Update SANITY_API_TOKEN in .env.local

---

## Maintenance

### Regenerate Onboarding Links

Onboarding links expire after 24 hours. To regenerate:

```bash
npx tsx scripts/check-stripe-status.ts
```

The script will automatically generate new links for accounts with pending requirements.

### Add New Location

1. Create location in Sanity Studio
2. Add all required fields (name, address, email, etc.)
3. Run setup script:
```bash
npx tsx scripts/setup-stripe-locations.ts
```
4. Send onboarding link to new location's manager
5. Verify with check-stripe-status.ts

### Update Location Tax Rate

Tax rates are stored in Sanity. To update:

1. Open Sanity Studio
2. Navigate to Locations
3. Find location
4. Update "Tax Rate" field
5. Changes apply immediately to new orders

---

## Testing Mode

To test without affecting production:

1. Use Stripe test keys:
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

2. Use Sanity development dataset:
```bash
NEXT_PUBLIC_SANITY_DATASET=development
```

3. Run scripts as normal
4. Test with Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

---

## Additional Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Sanity Client API](https://www.sanity.io/docs/js-client)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the main documentation: `/docs/stripe-connect-multi-location.md`
3. Check Stripe dashboard for account details
4. Contact Stripe support: https://support.stripe.com
