export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 7 6 17M12 7l6 10" stroke="currentColor" strokeWidth="2" />
      <rect x="8.5" y="2.5" width="7" height="7" rx="2" fill="currentColor" />
      <circle cx="6" cy="18" r="3.5" fill="var(--value)" />
      <circle cx="18" cy="18" r="3.5" fill="var(--value)" />
    </svg>
  );
}
