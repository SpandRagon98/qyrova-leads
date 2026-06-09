export default function PageLoading() {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span className="page-loading-spinner" />
      <strong>Loading workspace</strong>
    </div>
  );
}
