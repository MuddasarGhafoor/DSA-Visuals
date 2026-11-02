export default function Loading() {
  return (
    <div className="loading" role="status">
      {/* The logo's three nodes, lit one after another. */}
      <svg width="44" height="40" viewBox="0 0 44 40" aria-hidden="true">
        <path d="M22 9 9 31M22 9l13 22" />
        <circle cx="22" cy="9" r="6" />
        <circle cx="9" cy="31" r="6" />
        <circle cx="35" cy="31" r="6" />
      </svg>
      <span>Loading…</span>
    </div>
  );
}
