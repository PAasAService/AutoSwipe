# PWA Assets

This directory contains PWA (Progressive Web App) assets. To complete PWA setup, you need to add the following image files:

## Required Icons

### App Icons
- `pwa-icon-192.png` - 192x192px PNG icon (rounded corners recommended)
- `pwa-icon-192-maskable.png` - 192x192px PNG icon with safe zone padding (for adaptive icons)
- `pwa-icon-512.png` - 512x512px PNG icon 
- `pwa-icon-512-maskable.png` - 512x512px PNG icon with safe zone padding

### Apple Touch Icon
- `apple-touch-icon.png` - 180x180px PNG icon for iOS home screen

### PWA Screenshots
- `pwa-screenshot-1.png` - 540x720px screenshot for narrow devices
- `pwa-screenshot-2.png` - 540x720px screenshot for narrow devices

## Color Scheme

- Primary Color: `#D4A843` (Gold)
- Background Color: `#ffffff` (White)
- Dark Theme Color: `#131318` (Very Dark Gray)

## Guidelines

1. All PNG files should be properly optimized
2. Icons should have transparent backgrounds where appropriate
3. Maskable icons need 20% safe zone padding from edges
4. Screenshots should showcase key app features
5. All images should follow adaptive icon guidelines for Android

## More Information

- manifest.json configuration is located at `/public/manifest.json`
- PWA meta tags are configured in `/src/app/layout.tsx`
- For maskable icons, see: https://web.dev/maskable-icon/
