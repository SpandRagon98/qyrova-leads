import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function StatCard({ label, value, detail, trend = "up", icon: Icon, tone = "mint" }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-icon-${tone}`}>
        <Icon size={19} strokeWidth={2} />
      </div>
      <div className="stat-main">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {detail && (
        <div className={`stat-detail ${trend === "down" ? "trend-down" : ""}`}>
          {trend === "down" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
          {detail}
        </div>
      )}
    </article>
  );
}
