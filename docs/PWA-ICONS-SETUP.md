# PWA Icons Setup and Build Integration

## Overview

The Catch kitchen dashboard is configured as a Progressive Web App (PWA) with automatic icon generation during the build process. Icons are generated from an SVG template using Sharp and verified before deployment.

## Build Integration

### Local Development

```bash
# Generate icons (runs automatically)
npm run generate-icons

# Verify icons exist (runs automatically during build)
npm run verify-icons

# Full build with icon generation and verification
npm run build
```

### Automatic Icon Generation

The build process now includes:

1. **Icon Generation** (`npm run generate-icons`)
   - Runs before dev server starts and before production build
   - Uses Sharp to render SVG→PNG at 8 sizes (72px to 512px)
   - Outputs to `public/icons/*.png`
   - Fails fast if Sharp is missing or rendering fails

2. **Icon Verification** (`npm run verify-icons`)
   - Checks all required sizes exist (192x192, 512x512)
   - Warns if recommended sizes missing (72x72, 96x96, etc.)
   - Fails build if critical icons are missing
   - Displays file sizes for debugging

3. **CI/CD Verification** (GitHub Actions)
   - `.github/workflows/build-icons.yml` runs on every push/PR
   - Generates icons in CI environment
   - Verifies icons exist in final build artifact
   - Uploads PWA icons as build artifacts for inspection

## Icon Files Generated

```
public/icons/
├── icon-72x72.png      (72×72px - Android low-res)
├── icon-96x96.png      (96×96px - Android low-res)
├── icon-128x128.png    (128×128px - Chrome)
├── icon-144x144.png    (144×144px - Android)
├── icon-152x152.png    (152×152px - iPad)
├── icon-192x192.png    (192×192px - Android, home screen) [REQUIRED]
├── icon-384x384.png    (384×384px - Splash screens)
└── icon-512x512.png    (512×512px - PWA, install prompts) [REQUIRED]
```

**Manifest Reference**: `public/manifest.json` declares these icons with both `maskable` and `any` purposes for adaptive icons on Android.

## Customizing Icons

### Changing the Icon Design

To use a different icon design:

1. **Option A: Replace SVG generation** in `scripts/generate-pwa-icons.js`
   - Edit the `generateIconSvg(size)` function
   - Requires understanding SVG templating

2. **Option B: Use a pre-built image** as source
   ```bash
   # Replace the generateIconPng function to use sharp.fromFile() instead:
   # await sharp('source-icon.png')
   #   .png()
   #   .resize(size, size)
   #   .toFile(filename)
   ```

3. **Option C: Manual PNG icons**
   - Generate PNG files manually (Figma, Photoshop, etc.)
   - Place in `public/icons/` with naming pattern `icon-{size}x{size}.png`
   - Run `npm run verify-icons` to confirm they're recognized

### Icon Color/Theme

To adjust the SVG icon colors (currently dark background #1c1c1e, white icon):

1. Open `scripts/generate-pwa-icons.js`
2. Modify the SVG fill/stroke attributes in `generateIconSvg()`:
   ```svg
   <rect fill="#1c1c1e" />  <!-- Background color -->
   <path stroke="white" />   <!-- Icon color -->
   ```
3. Run `npm run generate-icons` to rebuild with new colors

## Production Deployment

### Before Deploying

```bash
# Verify icons are present and correctly sized
npm run verify-icons

# Build and test full PWA functionality
npm run build

# Check that icons exist in build output
ls -la public/icons/
# Should show 8 PNG files
```

### Deployment Checklist

- [ ] Icons generated: `npm run generate-icons`
- [ ] Icons verified: `npm run verify-icons` (no errors)
- [ ] Build succeeds: `npm run build`
- [ ] Icon files present in build artifacts
- [ ] `public/manifest.json` declares all icon sizes
- [ ] Install prompt visible in Chrome DevTools Application tab
- [ ] PWA installable on test device

### Common Issues

**Issue: "Missing required icons" error**
```
❌ CRITICAL: Missing required icons: 192x192, 512x512
```

**Solution:**
```bash
# Ensure Sharp is installed (should be in package.json)
npm install --save sharp

# Regenerate icons
npm run generate-icons

# Verify
npm run verify-icons
```

**Issue: Icons not updating after changes**

```bash
# Clear Next.js cache and regenerate
rm -rf .next public/icons/*.png
npm run generate-icons
npm run dev
```

**Issue: GitHub Actions build fails with icon generation**

1. Check workflow logs: `.github/workflows/build-icons.yml`
2. Verify Sharp dependency installed in CI
3. Check file permissions on `public/icons/` directory

## Icon Design Notes

Current design: **Kitchen pot with steam** (suitable for kitchen display system)

- Simple line drawing for scalability to small sizes
- High contrast (white on dark) for visibility
- Recognizable even at 72×72px
- Matches dark theme of kitchen dashboard

## Related Files

- **Generation**: `scripts/generate-pwa-icons.js`
- **Verification**: `scripts/verify-pwa-icons.js`
- **Manifest**: `public/manifest.json`
- **Config**: `.github/workflows/build-icons.yml`
- **Build**: `package.json` scripts

## Monitoring and Alerts

The PWA icon verification is integrated into:

1. **Local Development**
   - `npm run dev` generates icons automatically
   - Missing icons prevent dev server from starting

2. **Production Build**
   - `npm run build` fails if icons are missing
   - CI/CD workflow uploads icons as artifacts for inspection

3. **Post-Deployment Testing**
   - Use Chrome DevTools: Application > Manifest
   - Check all icon sizes are served with correct content-type
   - Install PWA and verify icon appears on home screen

## Next Steps

1. Generate icons: `npm run generate-icons`
2. Test locally: `npm run dev`
3. Test PWA install: Navigate to `localhost:3000/kitchen`, use Chrome menu > "Install app"
4. Verify icon appears with correct design
