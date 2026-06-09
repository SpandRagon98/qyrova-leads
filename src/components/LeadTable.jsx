import {
  ArrowUpDown,
  Copy,
  ExternalLink,
  Mail,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { ScoreBadge, StatusBadge } from "./Badges";
import EmptyState from "./EmptyState";

export default function LeadTable({
  leads,
  selectedIds = [],
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onOpenOutreach,
  compact = false,
  onSort,
  sortField,
  sortDirection,
}) {
  if (!leads.length) {
    return <EmptyState title="No leads found" description="Try changing your filters or add a new lead." />;
  }

  const sortButton = (field, label) => (
    <button className="table-sort" onClick={() => onSort?.(field)}>
      {label}
      <ArrowUpDown
        size={13}
        className={sortField === field ? `sort-active sort-${sortDirection}` : ""}
      />
    </button>
  );

  return (
    <div className="table-scroll">
      <table className={`lead-table ${compact ? "lead-table-compact" : ""}`}>
        <thead>
          <tr>
            {!compact && (
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={leads.length > 0 && leads.every((lead) => selectedIds.includes(lead.id))}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                />
              </th>
            )}
            <th>{sortButton("fullName", "Lead")}</th>
            <th>Business</th>
            {!compact && <th>Industry</th>}
            <th>Location</th>
            {!compact && <th>Contact</th>}
            <th>{sortButton("leadScore", "Score")}</th>
            <th>{sortButton("status", "Status")}</th>
            {!compact && <th>Last contacted</th>}
            <th className="actions-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              {!compact && (
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(lead.id)}
                    onChange={(e) => onSelect?.(lead.id, e.target.checked)}
                  />
                </td>
              )}
              <td>
                <div className="lead-name-cell">
                  <div className="lead-avatar">
                    {(lead.firstName?.[0] || lead.fullName?.[0] || "?").toUpperCase()}
                  </div>
                  <div>
                    <strong>{lead.fullName || "Unnamed lead"}</strong>
                    <span>{lead.role || "No role added"}</span>
                  </div>
                </div>
              </td>
              <td>
                <div className="stacked-cell">
                  <strong>{lead.businessName || "Independent"}</strong>
                  <span>{lead.businessType || "—"}</span>
                </div>
              </td>
              {!compact && <td>{lead.industry || "—"}</td>}
              <td>
                <div className="stacked-cell">
                  <strong>{lead.city || lead.country || "—"}</strong>
                  <span>{lead.city && lead.country ? lead.country : ""}</span>
                </div>
              </td>
              {!compact && (
                <td>
                  <div className="contact-icons">
                    <span className={lead.email ? "contact-ready" : ""}>
                      <Mail size={15} />
                    </span>
                    <span className={lead.linkedinUrl ? "contact-ready linkedin-letter" : "linkedin-letter"}>
                      in
                    </span>
                  </div>
                </td>
              )}
              <td>
                <ScoreBadge score={lead.leadScore} temperature={lead.leadTemperature} />
              </td>
              <td>
                <StatusBadge status={lead.status} />
              </td>
              {!compact && <td>{lead.lastContacted || "Never"}</td>}
              <td className="actions-cell">
                <div className="row-actions">
                  {!compact && (
                    <>
                      <button
                        className="icon-button icon-button-small"
                        title="Prepare outreach"
                        onClick={() => onOpenOutreach?.(lead)}
                      >
                        <Copy size={15} />
                      </button>
                      {lead.linkedinUrl && (
                        <a
                          className="icon-button icon-button-small"
                          href={lead.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open LinkedIn"
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </>
                  )}
                  <button className="icon-button icon-button-small" title="Edit" onClick={() => onEdit?.(lead)}>
                    <Pencil size={15} />
                  </button>
                  {!compact && (
                    <button
                      className="icon-button icon-button-small icon-danger"
                      title="Delete"
                      onClick={() => onDelete?.(lead)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  {compact && (
                    <button className="icon-button icon-button-small" title="More">
                      <MoreHorizontal size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
