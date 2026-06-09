export function StatusBadge({ status }) {
  const slug = (status || "New").toLowerCase().replaceAll(" ", "-");
  return <span className={`status-badge status-${slug}`}>{status || "New"}</span>;
}

export function ScoreBadge({ score, temperature }) {
  const temp = (temperature || "Cold").toLowerCase();
  return (
    <span className={`score-badge score-${temp}`}>
      <strong>{score}</strong>
      <span>{temperature}</span>
    </span>
  );
}
