# The Catch Seafood - Website

A modern, responsive website for The Catch Seafood restaurant chain featuring four Houston-area locations.

## Overview

This is a single-page React application built with Tailwind CSS that showcases:
- Four restaurant locations (Post Oak, Conroe, Atascocita, Willowbrook)
- Full menu with images and pricing
- Interactive image gallery using lightGallery
- Location information with embedded Google Maps
- Online ordering integration
- Full SEO optimization with Schema.org structured data

## Tech Stack

- **Frontend**: React 18 (via CDN)
- **Styling**: Tailwind CSS (via CDN)
- **Gallery**: lightGallery 2.7.2
- **Transpilation**: Babel Standalone (for JSX)

## File Structure

```
catch/
├── index.html          # Main application file
├── styles.css          # Custom CSS styles
├── images/            # Restaurant and menu item images
│   ├── Location-*.jpg # Location photos (4 files)
│   ├── *.png         # Menu item images (15 files)
│   └── placeholder.txt
└── README.md          # This file
```

## Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd catch
   ```

2. **Serve the files**
   You can use any local web server. Here are a few options:

   **Python 3:**
   ```bash
   python3 -m http.server 8000
   ```

   **Node.js (http-server):**
   ```bash
   npx http-server -p 8000
   ```

   **PHP:**
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**
   Navigate to `http://localhost:8000`

## Deployment

### Static Hosting (Recommended)

This is a static website and can be deployed to any static hosting service:

- **Netlify**: Drag and drop the folder or connect your Git repository
- **Vercel**: Import your Git repository
- **GitHub Pages**: Push to `gh-pages` branch
- **AWS S3**: Upload to S3 bucket with static hosting enabled
- **Cloudflare Pages**: Connect Git repository

### Web Server Deployment

1. Upload all files to your web server's public directory
2. Ensure the web server is configured to serve `index.html` as the default document
3. Set up HTTPS (required for production)
4. Configure Content Security Policy headers (see Security section)

## Updating Content

### Adding/Updating Menu Items

1. Open `index.html`
2. Find the `menuCategories` array (around line 70)
3. Add or modify items following this structure:

```javascript
{
  name: 'Item Name',
  price: 12.99,
  description: 'Item description',
  image: 'images/Item_Name.png'  // Optional
}
```

4. If adding an image, place it in the `images/` folder

### Adding/Updating Locations

1. Open `index.html`
2. Find the `locations` array (around line 27)
3. Add or modify locations following this structure:

```javascript
{
  id: 'location-id',
  name: 'Location Name',
  address: '123 Main St',
  city: 'City, TX 12345',
  phone: '123-456-7890',
  hours: '10:30 AM - 10:00 PM',
  orderUrl: 'https://your-ordering-url.com',
  hasDelivery: true
}
```

4. Add corresponding location image as `images/Location-Name.jpg`
5. Update the `locationImages` object (around line 277)

### Updating SEO Metadata

1. Open `index.html`
2. Update meta tags in the `<head>` section (lines 8-32):
   - Update `<meta name="description">` for search engine descriptions
   - Update Open Graph tags for social media sharing
   - Update Twitter Card tags for Twitter sharing
3. Update Schema.org structured data (lines 470-598) when menu or location info changes

## Image Management

### Current Images (21 files, ~8MB total)

- **Location Photos** (4): Location-Conroe.jpg, Location-Humble.jpg, Location-Post-Oak.jpg, Location-Willowbrook.jpg
- **Menu Items** (15): Various menu item images in PNG format
- **Other** (2): chicken_tender_basket.png (reserved), placeholder.txt

### Adding New Images

1. **Optimize images first**:
   - Use tools like TinyPNG, ImageOptim, or Squoosh
   - Recommended size: 1200px max width
   - Format: PNG for menu items, JPG for photos

2. **Naming convention**:
   - Menu items: `Item_Name.png` (use underscores, capitalize first letter of each word)
   - Locations: `Location-Name.jpg` (use hyphens)
   - Descriptive categories: `category-item_name.png`

3. **Add to images folder** and reference in `index.html`

### Removing Unused Images

Run this command to identify images not referenced in index.html:
```bash
for img in images/*; do
  grep -q "$(basename "$img")" index.html || echo "Unused: $img"
done
```

## SEO Features

### Implemented

✅ Meta description for search engines
✅ Open Graph tags (Facebook, LinkedIn)
✅ Twitter Card tags
✅ Canonical URL
✅ Schema.org structured data (Restaurant, Menu, Locations)
✅ Favicon references
✅ Semantic HTML structure

### Recommendations

- [ ] Add Google Analytics tracking code
- [ ] Submit sitemap to Google Search Console
- [ ] Verify Open Graph tags using Facebook Sharing Debugger
- [ ] Test structured data using Google's Rich Results Test
- [ ] Generate and add favicon files (favicon-32x32.png, favicon-16x16.png, apple-touch-icon.png)

## Performance Optimization

### Quick Wins

1. **Self-host Tailwind CSS**:
   - Currently loading 3MB+ from CDN
   - Use Tailwind CLI to generate custom build with only used classes
   - Expected reduction: ~2.9MB

2. **Compress images**:
   - Run images through optimization tools
   - Expected reduction: ~30-50%

3. **Add lazy loading**:
   ```html
   <img loading="lazy" src="..." alt="..." />
   ```

4. **Enable compression** on your web server (gzip/brotli)

5. **Add caching headers** in your web server configuration

### Advanced Optimizations

- Implement a service worker for offline caching
- Use WebP format for images with fallback
- Implement critical CSS inlining
- Use CDN for static assets

## Security

### Implemented

✅ Favicon references added
✅ External links use `rel="noopener noreferrer"`

### Recommendations

1. **Add Subresource Integrity (SRI)** to CDN links:
   ```html
   <script src="https://cdn.tailwindcss.com"
           integrity="sha384-..."
           crossorigin="anonymous"></script>
   ```

2. **Configure Content Security Policy** headers on your web server:
   ```
   Content-Security-Policy: default-src 'self';
     script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net;
     style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
     img-src 'self' data: https://images.unsplash.com;
     frame-src https://www.google.com;
   ```

3. **Ensure HTTPS-only deployment**:
   - Redirect HTTP to HTTPS
   - Use HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

4. **Update dependencies** regularly (React, lightGallery, etc.)

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## Troubleshooting

### Images not loading
- Check file paths are correct
- Verify images exist in the `images/` folder
- Check browser console for 404 errors

### Gallery not working
- Ensure lightGallery CSS and JS are loaded
- Check browser console for JavaScript errors
- Verify `menu-item-lightbox` class is on image links

### Menu/Locations not displaying
- Check browser console for JavaScript errors
- Verify React is loading from CDN
- Test in different browser

## License

Proprietary - The Catch Seafood

## Contact

For website updates or technical support, contact the development team.

---

**Last Updated**: November 2025
**Version**: 1.0
