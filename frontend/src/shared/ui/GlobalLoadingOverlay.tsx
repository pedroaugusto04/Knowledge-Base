export function GlobalLoadingOverlay() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="global-loading-overlay"
      role="status"
    >
      <div aria-hidden="true" className="global-loading-spinner" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
