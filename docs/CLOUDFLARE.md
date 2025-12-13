# Cloudflare CDN Setup for Image Performance

This guide explains how to use Cloudflare to dramatically speed up image loading on your site, with specific focus on your Sanity CMS images.

## The Problem

Right now, when someone opens a menu item modal:
1. Browser requests image from Sanity CDN (`cdn.sanity.io`)
2. Sanity's CDN serves the image from their servers
3. This can take 200-500ms+ depending on user location
4. Every user experiences this delay on first load

## The Solution: Cloudflare CDN

Cloudflare sits between your users and your website, caching images globally. Instead of every user hitting Sanity's CDN, they hit Cloudflare's edge server near them.

```
WITHOUT Cloudflare:
User → Your Site → Sanity CDN (500ms delay)

WITH Cloudflare:
User → Cloudflare Edge (50ms) → Your Site → Sanity CDN (first time only)
User → Cloudflare Edge (50ms) ← cached! (subsequent visits)
```

---

## Option 1: Cloudflare CDN Proxy (FREE) ⭐ **Recommended for Quick Win**

**What it does:** Cloudflare automatically caches your images with zero code changes.

**Cost:** $0/month forever

**Time to setup:** 10-15 minutes

### How It Works

1. **You point your domain to Cloudflare**
   - Change your DNS nameservers at your domain registrar
   - Cloudflare becomes the "middleman" between users and your site

2. **Cloudflare automatically caches images**
   - Images from Sanity CDN get cached at 300+ global locations
   - Users get images from the nearest Cloudflare server
   - First user waits for Sanity, everyone else gets instant cached version

3. **Your Sanity images stay exactly where they are**
   - No migration needed
   - No code changes
   - Sanity CMS continues to work normally

### Step-by-Step Setup

#### Step 1: Sign up for Cloudflare
1. Go to https://cloudflare.com
2. Sign up for free account
3. Add your domain (e.g., `thecatchdfw.com`)

#### Step 2: Change Your Nameservers
Cloudflare will give you two nameservers like:
- `aron.ns.cloudflare.com`
- `june.ns.cloudflare.com`

Go to wherever you bought your domain (GoDaddy, Namecheap, etc.) and change the nameservers to Cloudflare's.

**Wait time:** 15 minutes to 48 hours (usually under an hour)

#### Step 3: Enable Caching for Sanity Images
In Cloudflare Dashboard:
1. Go to **Rules** → **Page Rules** (or **Cache Rules**)
2. Add a new rule:
   ```
   URL Pattern: *cdn.sanity.io/*
   Cache Level: Cache Everything
   Edge Cache TTL: 1 month
   Browser Cache TTL: 1 day
   ```

#### Step 4: Test It
1. Open your site (clear browser cache first)
2. Open a menu item modal
3. Open browser DevTools → Network tab
4. Look for the image request - should show `cf-cache-status: HIT` after first load

### What You Get
- ✅ Images load 5-10x faster for most users
- ✅ Zero code changes
- ✅ Works with your existing Sanity CMS
- ✅ Free forever
- ✅ Automatic HTTPS/SSL
- ✅ DDoS protection as bonus

### Gotchas
- First user to request an image still hits Sanity (unavoidable)
- Cache takes ~24 hours to fully populate
- Purging cache takes ~30 seconds to propagate

---

## Option 2: Cloudflare Images (PAID - $5/month)

**What it does:** Cloudflare stores and optimizes your images with advanced features.

**Cost:** $5/month base + $1 per 100,000 images served + storage fees

**Time to setup:** 2-3 hours (requires migration)

### How It Works

1. **Upload images to Cloudflare Images**
   - One-time migration from Sanity to Cloudflare
   - Or setup automatic sync

2. **Cloudflare optimizes and serves images**
   - Automatic WebP/AVIF conversion
   - Responsive variants (different sizes for mobile/desktop)
   - Built-in CDN serving

3. **Update your CMS to use Cloudflare URLs**
   - Change image URLs in Sanity from `cdn.sanity.io/...` to Cloudflare
   - Or use Cloudflare as a proxy/transform layer

### When to Use This
- ✅ You want automatic image optimization (WebP, AVIF)
- ✅ You need responsive variants without Next.js processing
- ✅ You want better image analytics
- ❌ Don't use if you're happy with Option 1 (it's free!)

### Pros vs Option 1
- Better format optimization
- More control over variants
- Better analytics

### Cons vs Option 1
- Costs money
- Requires migration
- More complex setup
- Vendor lock-in (harder to switch away)

---

## Option 3: Cloudflare R2 + CDN (PAID - Very Cheap)

**What it does:** Store images in Cloudflare's S3-compatible storage, serve via CDN.

**Cost:** ~$0.50-2/month for typical usage (storage + operations, zero egress)

**Time to setup:** 4-6 hours (requires full migration)

### How It Works

1. **Store images in R2 buckets**
   - Like Amazon S3 but cheaper
   - No egress fees (S3 charges $0.09/GB to download)
   - Automatic geographic replication

2. **Serve via Cloudflare CDN**
   - R2 buckets can be exposed as public URLs
   - Automatic CDN distribution
   - Or use Workers for custom logic

3. **Migrate from Sanity**
   - Write a script to sync Sanity images → R2
   - Update Sanity to point to R2 URLs
   - Or keep Sanity for management, R2 for storage

### When to Use This
- ✅ You're processing thousands of images
- ✅ You want to reduce vendor lock-in
- ✅ You need custom image processing logic
- ✅ You want lowest possible cost at scale

### Cost Comparison
**Your site with 234 menu items:**
- Storage: 234 images × 100KB avg = ~23MB = $0.015/GB = **$0.35/month**
- Operations: 100,000 reads/month (generous) = $0.36
- Egress: **$0** (this is the big win vs S3)

**Total: ~$0.71/month** vs S3's ~$10-20/month

---

## Option 4: Cloudflare Workers for Advanced Caching (FREE or $5/month)

**What it does:** Write custom code to cache/optimize/transform images on the fly.

**Cost:** Free tier (100k requests/day) or $5/month (millions of requests)

**Time to setup:** 2-4 hours (requires coding)

### How It Works

1. **Write a Cloudflare Worker**
   ```javascript
   // Intercept requests to your site
   // Cache Sanity images with custom rules
   // Add image transformations
   ```

2. **Deploy to Cloudflare Edge**
   - Runs on every request
   - Caches based on your logic
   - Can resize, optimize, watermark images

3. **No changes to Sanity**
   - Worker intercepts requests
   - Transparently caches/optimizes
   - Sanity remains source of truth

### Example Use Cases
- Cache Sanity images for 30 days
- Resize images on-the-fly based on device
- Convert to WebP automatically
- Add watermarks for certain routes
- A/B test different image qualities

### When to Use This
- ✅ You want maximum control
- ✅ You're comfortable with JavaScript
- ✅ You need custom logic (watermarks, A/B tests, etc.)
- ❌ Don't use if Option 1 meets your needs (it's simpler)

---

## Comparison Table

| Feature | Option 1: CDN Proxy | Option 2: Images | Option 3: R2 | Option 4: Workers |
|---------|-------------------|------------------|-------------|-------------------|
| **Cost** | FREE | $5+/month | $0.50-2/month | FREE-$5/month |
| **Setup Time** | 15 min | 2-3 hours | 4-6 hours | 2-4 hours |
| **Code Changes** | None | Medium | High | Medium |
| **Sanity Migration** | No | Yes | Yes | No |
| **Auto Optimization** | No | Yes | No | Custom |
| **Maintenance** | None | Low | Medium | Medium |

---

## Recommendations

### For You Right Now: **Option 1 (CDN Proxy)**

**Why:**
1. ✅ **Zero code changes** - your site works exactly as-is
2. ✅ **Free forever** - no recurring costs
3. ✅ **Quick setup** - 15 minutes max
4. ✅ **Instant performance boost** - 5-10x faster images
5. ✅ **Works with Sanity** - no migration needed

**How your images will work:**
```
1. User visits thecatchdfw.com
   → Cloudflare serves your Next.js site

2. User opens menu item modal
   → Browser requests image from cdn.sanity.io
   → Cloudflare intercepts this request
   → If cached: serves immediately (50ms)
   → If not cached: fetches from Sanity, caches, serves (300ms first time)

3. Next user requests same image
   → Cloudflare serves from cache (50ms)
   → No Sanity request needed
```

### When to Upgrade Later

**Move to Option 2 (Cloudflare Images) when:**
- You're serving 1M+ page views/month
- You want automatic WebP/AVIF optimization
- You need detailed image analytics
- $5/month is trivial for your business

**Move to Option 3 (R2) when:**
- You're spending >$20/month on images
- You want to own your storage layer
- You need custom image processing
- You have technical resources to maintain it

**Add Option 4 (Workers) when:**
- You need custom image logic (watermarks, etc.)
- You want to A/B test image strategies
- You want device-specific optimizations
- You have a developer to maintain it

---

## Next Steps

### To Get Started with Option 1 Today:

1. **Sign up:** https://cloudflare.com
2. **Add your domain:** Follow their wizard
3. **Update nameservers:** At your domain registrar
4. **Wait for activation:** Usually <1 hour
5. **Add cache rule:** For `cdn.sanity.io/*`
6. **Test:** Check DevTools Network tab for `cf-cache-status: HIT`

### Need Help?

Common issues:
- **"My site isn't loading"** - DNS propagation can take up to 48 hours (usually <1 hour)
- **"Images aren't cached"** - Check your Page Rules, might need to wait 24 hours for cache to populate
- **"Cache isn't purging"** - Purge takes ~30 seconds, try clearing browser cache too

---

## Technical Details (For Reference)

### How Cloudflare Caching Works with Sanity

1. **Request Flow:**
   ```
   Browser → Cloudflare Edge → Your Next.js Site → Next.js Image API
                                                 ↓
                                              Sanity CDN
   ```

2. **Caching Layers:**
   - Browser cache (controlled by Next.js)
   - Cloudflare edge cache (controlled by you)
   - Next.js image cache (automatic)
   - Sanity CDN cache (controlled by Sanity)

3. **Cache Keys:**
   - Cloudflare caches based on full URL
   - Next.js Image API URLs include size/quality params
   - Each variant is cached separately
   - Example: `/next/image?url=...&w=640&q=75` is one cache entry

### Combining with Your Smart Preloading

Your new smart preloading (PR #7) + Cloudflare = **instant modals**:

1. **Page loads** → Smart preload kicks in
2. **First 12 items preload** → Cloudflare caches them
3. **User opens modal** → Image already in Cloudflare cache → **instant!**
4. **User scrolls** → Intersection Observer preloads → Cloudflare caches
5. **Next user** → All images cached → Everything instant

This is the ideal setup: Smart preloading populates Cloudflare cache for all users.

---

*Generated with Claude Code*
