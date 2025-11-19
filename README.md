# The Catch Seafood - Website

Fresh Cajun seafood restaurant website featuring 4 Houston-area locations. Modern, responsive single-page application showcasing menu items, locations, and online ordering.

**Live Site:** https://www.thecatchseafood.com/

## 🎯 Overview

This is a static website built with React (via CDN) and custom CSS, designed for easy deployment and maintenance without requiring a build process.

### Features

- ✅ Responsive design (mobile-first)
- ✅ Interactive menu with image gallery
- ✅ 4 location cards with Google Maps integration
- ✅ Direct ordering integration with Revel Systems
- ✅ SEO optimized (Open Graph, Twitter Cards, Schema.org)
- ✅ Performance optimized (lazy loading, custom CSS)
- ✅ Accessibility ready

## 🚀 Quick Start

### Deployment

1. **Upload files to web server:**
   ```bash
   # Upload these files to your web root:
   - index.html
   - styles.css
   - tailwind-custom.css
   - images/ (directory)
   ```

2. **Configure web server:**
   - Set `index.html` as the default document
   - Enable HTTPS (required for secure ordering)
   - Configure caching headers (see below)

3. **Update Analytics:**
   - Open `index.html`
   - Find line 35-40 (Google Analytics section)
   - Replace `G-XXXXXXXXXX` with your actual GA4 Measurement ID (twice)

4. **Add Favicon:**
   - Create favicons using a tool like [RealFaviconGenerator](https://realfavicongenerator.net/)
   - Upload to web root:
     - `favicon-32x32.png`
     - `favicon-16x16.png`
     - `apple-touch-icon.png`

5. **Test the site:**
   - Verify all images load
   - Test menu gallery (click menu images)
   - Check location maps
   - Test "Order Now" buttons
   - Verify mobile responsiveness

## 📁 File Structure

```
/
├── index.html              # Main application (React SPA)
├── styles.css              # Custom CSS overrides
├── tailwind-custom.css     # Minimal Tailwind utilities (self-hosted)
└── images/                 # Image assets (21 files, ~7MB)
    ├── Admirals_Platter.png
    ├── Bourbon_Chicken_Pasta.png
    ├── Buffalo_Ranch_Catfish_Nuggets-and-Shrimp-Combo.png
    ├── Caesar_Salad.png
    ├── Cajun_Special.png
    ├── Catfish(1)-and-Crawfish_Tails-Combo.png
    ├── Dessert-Key_Lime_Pie.png
    ├── French_Quarter_Plate.png
    ├── Fried_Snow_Crab.png
    ├── Jumbo_Shrimp(6)-and-Catfish(1)-Combo.png
    ├── Jumbo_Shrimp(8)-and-Catfish(2)-Combo.png
    ├── Location-Conroe.jpg
    ├── Location-Humble.jpg
    ├── Location-Post-Oak.jpg
    ├── Location-Willowbrook.jpg
    ├── Snow_Crab.png
    ├── Whitefish_Basket.png
    ├── chicken_tender_basket.png
    ├── menu_item-chicken_and_waffles.png
    └── starter-fried_green_tomatoes.png
```

## 🛠 Technology Stack

| Component | Technology | Source |
|-----------|------------|--------|
| Frontend Framework | React 18 | CDN (unpkg.com) |
| JSX Compiler | Babel Standalone | CDN (unpkg.com) |
| CSS Framework | Custom Tailwind subset | Self-hosted |
| Image Gallery | lightGallery 2.7.2 | CDN (jsdelivr.net) |
| Maps | Google Maps Embed | External |
| Ordering | Revel Systems | External |

## 📝 Content Management

### Updating Menu Items

1. Open `index.html` in a text editor
2. Find the `menuCategories` array (starts around line 70)
3. Edit items following this format:

```javascript
{
  name: 'Item Name',
  price: 9.99,
  description: 'Item description',
  image: 'images/Item_Name.png' // or null if no image
}
```

4. To add a menu category:

```javascript
{
  name: 'Category Name',
  subtitle: 'Optional subtitle', // can omit this line
  items: [
    // ... menu items here
  ]
}
```

### Updating Locations

1. Find the `locations` array (starts around line 27)
2. Edit or add locations:

```javascript
{
  id: 'unique-id',
  name: 'Location Name',
  address: 'Street Address',
  city: 'City, State ZIP',
  phone: '123-456-7890',
  hours: '10:30 AM - 10:00 PM',
  orderUrl: 'https://ordering-system-url.com',
  hasDelivery: true // or false
}
```

3. Add corresponding location image to `/images/` directory
4. Update the `locationImages` object (around line 277) with the new ID

### Updating Images

1. **Menu Item Images:**
   - Format: PNG, square aspect ratio recommended
   - Naming: Use descriptive names with underscores (e.g., `Snow_Crab.png`)
   - Size: Optimize to <500KB per image
   - Upload to `/images/` directory
   - Reference in menu items array

2. **Location Photos:**
   - Format: JPG or PNG
   - Naming: `Location-Name.jpg`
   - Aspect ratio: ~16:9 or 4:3
   - Size: Optimize to <1MB per image

3. **Image Optimization Tools:**
   - [TinyPNG](https://tinypng.com/) - PNG compression
   - [Squoosh](https://squoosh.app/) - Universal image compression
   - [ImageOptim](https://imageoptim.com/) - Mac app for optimization

## ⚙️ Web Server Configuration

### Nginx Example

```nginx
server {
    listen 443 ssl http2;
    server_name www.thecatchseafood.com;

    root /var/www/thecatchseafood;
    index index.html;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https://images.unsplash.com; frame-src https://www.google.com;" always;

    # Caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
```

### Apache .htaccess Example

```apache
# HTTPS Redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security Headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"

# Caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Gzip Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/javascript
</IfModule>
```

## 🔒 Security Considerations

### Current Security Features

- ✅ `crossorigin="anonymous"` on all CDN resources
- ✅ `rel="noopener noreferrer"` on external links
- ✅ HTTPS-only recommended
- ✅ No sensitive data in client-side code

### Recommended Enhancements

1. **Add SRI (Subresource Integrity) hashes** to CDN links:
   - Calculate hashes using [SRI Hash Generator](https://www.srihash.org/)
   - Add `integrity` attribute to `<script>` and `<link>` tags

2. **Configure CSP headers** on web server (see Nginx example above)

3. **Regular Updates:**
   - Monitor CDN dependency versions
   - Update React, lightGallery when security patches released

## 🎨 Brand Guidelines

### Color Palette

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Brown | `#8b4513` | Primary headings, navigation |
| Rust | `#c17a5c` | Buttons, accent elements |
| Dark Brown | `#5a3a2a` | Body text (dark) |
| Medium Brown | `#7a5f4f` | Body text (medium) |
| Light Brown | `#9b7961` | Secondary text |
| Cream | `#fef3e2` | Background (light) |
| Off-White | `#fefaf5` | Background (alternate) |

### Typography

- **Primary Font:** System UI stack (San Francisco, Segoe UI, Roboto, Helvetica, Arial)
- **Headings:** 3xl-8xl sizes, Bold to Light weights
- **Body:** lg-2xl sizes, Regular weight

## 📊 Performance Optimization

### Current Optimizations

- ✅ Custom minimal Tailwind CSS (~10KB vs 3MB CDN)
- ✅ Lazy loading on all images
- ✅ Production React build (minified)
- ✅ Removed 92 unused images (~35MB saved)

### Future Improvements

1. **Set up build process:**
   - Pre-compile JSX (remove Babel from browser)
   - Tree-shake unused code
   - Minify HTML

2. **Image optimization:**
   - Convert JPGs to WebP format
   - Implement responsive images with `srcset`
   - Use CDN for image delivery

3. **Code splitting:**
   - Separate vendor bundles
   - Load React components dynamically

## 🧪 Testing Checklist

Before going live, test:

- [ ] Desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile browsers (iOS Safari, Android Chrome)
- [ ] Menu gallery (click images, zoom works)
- [ ] Location maps (load correctly, interactive)
- [ ] All "Order Now" buttons (correct URLs)
- [ ] Phone number links (trigger call on mobile)
- [ ] Image lazy loading (network throttling test)
- [ ] Page speed (Lighthouse score >90)
- [ ] SEO metadata (Open Graph validator, Twitter Card validator)
- [ ] Structured data (Google Rich Results Test)
- [ ] Analytics tracking (Real-time view in GA4)

## 📱 SEO & Social Media

### Validators

- **Open Graph:** https://developers.facebook.com/tools/debug/
- **Twitter Cards:** https://cards-dev.twitter.com/validator
- **Schema.org:** https://search.google.com/test/rich-results
- **Mobile-Friendly:** https://search.google.com/test/mobile-friendly
- **Page Speed:** https://pagespeed.web.dev/

### Sitemap & Robots

The site is currently a single page, so a sitemap is optional. If you add a blog or multiple pages:

1. Create `sitemap.xml` in web root
2. Submit to Google Search Console
3. Add to `robots.txt`

## 🐛 Troubleshooting

### Images not loading

- Check file paths are relative (`images/File_Name.png`)
- Verify file names match exactly (case-sensitive)
- Ensure images directory uploaded to server

### Gallery not working

- Verify lightGallery CDN scripts loaded (check browser console)
- Ensure images have valid `href` attribute
- Check browser console for JavaScript errors

### Maps not displaying

- Verify Google Maps embed URL is correct
- Check if domain is whitelisted for Google Maps API
- Ensure iframe not blocked by CSP headers

### Analytics not tracking

- Replace `G-XXXXXXXXXX` with actual Measurement ID
- Check Google Analytics Real-time view
- Verify gtag.js script loaded (Network tab)

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Monitor analytics for traffic patterns
- Check for broken links or images

**Monthly:**
- Update menu items and pricing as needed
- Review and update location hours/info
- Check CDN dependency versions

**Quarterly:**
- Performance audit (Lighthouse)
- Security review (dependency updates)
- SEO audit (rankings, metadata)

### Contact for Technical Support

For website issues or questions, contact your web developer or hosting provider.

### Business Locations

- **Post Oak:** 713-360-6862
- **Conroe:** 936-521-1618
- **Atascocita:** 281-973-9825
- **Willowbrook:** 281-661-1760

## 📄 License

Copyright © 2025 The Catch Seafood. All rights reserved.

---

**Last Updated:** November 2025
**Version:** 1.0.0
