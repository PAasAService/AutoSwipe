'use client'

import { useEffect } from 'react'

export function ServiceWorkerProvider() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker for PWA functionality
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope)

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is ready; notify user of update
                  console.log('[PWA] New service worker ready, app update available')
                  // You could show a toast or banner here
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error)
        })

      // Handle installation prompt (Add to Home Screen)
      let deferredPrompt: Event | null = null

      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault()
        deferredPrompt = e
        console.log('[PWA] beforeinstallprompt triggered, ready to install')
        // You could store this for later and show an "Install App" button
      })

      window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed to home screen')
        deferredPrompt = null
      })

      // Listen for app launch from home screen
      window.addEventListener('beforeunload', () => {
        console.log('[PWA] App about to close')
      })
    }
  }, [])

  return null
}
