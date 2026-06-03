import { useSyncExternalStore } from 'react';

// ---------------------------------------------------------------------------
// Hook: useOnlineStatus
// ---------------------------------------------------------------------------

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  // During SSR (not applicable here, but required by the API), assume online
  return true;
}

/**
 * Returns `true` when the browser has network connectivity.
 * Re-renders automatically when the status changes.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribeOnlineStatus, getOnlineSnapshot, getServerSnapshot);
}

// ---------------------------------------------------------------------------
// Component: OfflineBanner
// ---------------------------------------------------------------------------

/**
 * Renders a subtle, non-intrusive banner at the top of the viewport when
 * the user loses network connectivity. Automatically hides when back online.
 *
 * Usage: place once in the app shell, outside the main content area.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-2.38 1.25 1.25 0 000-1.69A10.03 10.03 0 0010 6.5c-.846 0-1.667.108-2.447.306L3.28 2.22zM7.617 6.87A7.544 7.544 0 0110 6.5a7.53 7.53 0 016.67 4.001 7.537 7.537 0 01-2.166 2.352l-6.887-6.983z" clipRule="evenodd" />
        <path d="M3.16 10.5a7.531 7.531 0 011.705-2.226l-1.065-1.08A10.028 10.028 0 00.83 10.905a1.25 1.25 0 000 1.69 10.03 10.03 0 002.91 2.18l1.09-1.09A7.53 7.53 0 013.16 10.5z" />
      </svg>
      <span>Offline — showing cached data</span>
    </div>
  );
}
