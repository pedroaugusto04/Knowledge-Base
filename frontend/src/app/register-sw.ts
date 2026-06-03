import { withFrontendBasePath } from './base-path';

/**
 * Registers the service worker for PWA caching and push notifications.
 *
 * This runs once at app startup, independently of whether push is enabled.
 * The push integration section in GuidedIntegrationsSection still uses the
 * registration for subscribing to push, but it does not need to register
 * the SW itself anymore — this module handles that.
 *
 * In development mode (Vite dev server), registration is skipped since
 * the SW would interfere with hot-module replacement.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  // Skip SW registration during Vite dev to avoid caching dev bundles
  if (import.meta.env.DEV) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(withFrontendBasePath('/sw.js'))
      .catch((error) => {
        console.warn('[KB] Service worker registration failed:', error);
      });
  });
}
