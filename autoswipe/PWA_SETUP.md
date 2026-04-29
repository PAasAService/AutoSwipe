# AutoSwipe PWA (Progressive Web App) Setup

This document outlines the PWA configuration for AutoSwipe web app.

## What is a PWA?

A Progressive Web App (PWA) is a web application that:
- Works offline or with poor network connectivity
- Can be installed on home screens (mobile and desktop)
- Provides an app-like experience
- Uses service workers for caching and background operations

## Current Implementation

### ✅ Completed

1. **Manifest Configuration** (`/public/manifest.json`)
   - App name, description, and branding
   - Display mode: standalone (full-screen app experience)
   - App icons configuration (192px and 512px)
   - App shortcuts for quick actions (Browse Cars, My Listings)
   - Screenshots for app store listings

2. **Service Worker** (`/public/service-worker.js`)
   - Network-first caching strategy
   - Offline fallback support
   - Cache management and cleanup
   - Updates detection

3. **Service Worker Registration** (`/src/components/providers/ServiceWorkerProvider.tsx`)
   - Client-side service worker registration
   - Update detection and notification
   - Install prompt handling
   - Integrated into main Providers component

4. **Meta Tags & Viewport Configuration** (`/src/app/layout.tsx`)
   - PWA-specific meta tags
   - Apple Web App configuration
   - OpenGraph and Twitter card metadata
   - Proper viewport settings for mobile
   - Theme color configuration

### ⏳ Next Steps (Required for Production)

1. **Add PWA Icons**
   - Create 192x192px app icon (`/public/pwa-icon-192.png`)
   - Create 192x192px maskable icon (`/public/pwa-icon-192-maskable.png`)
   - Create 512x512px app icon (`/public/pwa-icon-512.png`)
   - Create 512x512px maskable icon (`/public/pwa-icon-512-maskable.png`)
   - Create 180x180px Apple touch icon (`/public/apple-touch-icon.png`)
   - Create screenshots (`/public/pwa-screenshot-1.png`, `pwa-screenshot-2.png`)
   
   See `/public/PWA_ASSETS_README.md` for detailed icon specifications.

2. **Set metadataBase in Next.js Config**
   ```typescript
   // next.config.mjs
   const nextConfig = {
     metadataBase: new URL('https://autoswipe.vercel.app'),
   }
   ```

3. **Testing PWA Features Locally**
   ```bash
   # Build the app
   npm run build
   
   # Start production server
   npm run start
   
   # Test in Chrome DevTools:
   # - Open Application tab
   # - Check Service Workers section
   # - Verify Manifest loads correctly
   # - Test offline functionality in Network tab
   ```

4. **Deploy to Vercel**
   - Push changes to main branch
   - Vercel automatically builds and deploys
   - PWA features available at deployed URL

## How to Install AutoSwipe as an App

### On Mobile (Chrome/Edge)
1. Open https://autoswipe.vercel.app
2. Tap menu (three dots)
3. Select "Install app" or "Add to Home screen"
4. Confirm installation

### On Desktop (Chrome/Edge)
1. Open https://autoswipe.vercel.app
2. Click "Install AutoSwipe" button in address bar
3. Confirm installation

### On iOS
1. Open in Safari
2. Tap Share icon
3. Select "Add to Home Screen"
4. Name the shortcut and add

## Technical Details

### Caching Strategy

The service worker uses a **network-first with cache fallback** strategy:

1. Try to fetch from network
2. If successful, cache the response and serve it
3. If network fails, serve from cache if available
4. If not in cache, show offline message

**Excluded from caching:**
- API routes (`/api/*`)
- Cross-origin requests

### Offline Behavior

- App shell loads from cache
- API calls fail with clear error messages
- User can browse previously loaded content
- Real-time features gracefully degrade

### Updates

When a new version is deployed:
1. Service worker detects update
2. New content cached in background
3. User can choose to reload and use new version
4. No forced interruption of user session

## File Structure

```
/public/
  ├── manifest.json                 # PWA manifest
  ├── service-worker.js             # Service worker logic
  ├── PWA_ASSETS_README.md          # Icon specifications
  └── [icon files]                  # TODO: Add icon files

/src/
  ├── app/layout.tsx                # PWA meta tags
  ├── components/
  │   └── providers/
  │       └── ServiceWorkerProvider.tsx  # SW registration
  └── components/Providers.tsx       # Provider integration
```

## Lighthouse Audit

After adding icon assets and deploying, you can run a Lighthouse audit:

1. Deploy the app with all icon assets
2. Open in Chrome DevTools (F12)
3. Go to Lighthouse tab
4. Run "PWA" audit
5. Check for:
   - ✅ Installable
   - ✅ Fast on 3G
   - ✅ Responsive design
   - ✅ Splash screen
   - ✅ App shortcuts

## Resources

- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [Maskable Icons](https://web.dev/maskable-icon/)

## Support

For PWA-specific issues:
- Check browser console for service worker errors
- Verify manifest.json is loading correctly
- Test in Incognito mode (fresh cache)
- Use Chrome DevTools Application tab for debugging
