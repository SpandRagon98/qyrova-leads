export default function LinkedInIcon({ size = 18, className = "" }) {
  return (
    <span
      className={`linkedin-glyph ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.55) }}
      aria-hidden="true"
    >
      in
    </span>
  );
}
