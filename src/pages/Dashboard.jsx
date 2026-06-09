import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Flame,
  Mail,
  MessageSquareReply,
  Snowflake,
  Target,
  Users,
} from "lucide-react";
import ComplianceNote from "../components/ComplianceNote";
import LeadTable from "../components/LeadTable";
import StatCard from "../components/StatCard";

export default function Dashboard({ leads, campaigns, onNavigate, onEditLead }) {
  const count = (predicate) => leads.filter(predicate).length;
  const hot = count((lead) => lead.leadTemperature === "Hot");
  const warm = count((lead) => lead.leadTemperature === "Warm");
  const cold = count((lead) => lead.leadTemperature === "Cold");
  const contacted = count((lead) => ["Contacted", "Replied", "Interested", "Converted"].includes(lead.status));
  const replied = count((lead) => ["Replied", "Interested", "Converted"].includes(lead.status));
  const converted = count((lead) => lead.status === "Converted");
  const conversionRate = leads.length ? Math.round((converted / leads.length) * 100) : 0;
  const replyRate = contacted ? Math.round((replied / contacted) * 100) : 0;
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "Active").length;
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const funnel = [
    { label: "Total leads", value: leads.length, color: "#153d32" },
    { label: "Contacted", value: contacted, color: "#237a60" },
    { label: "Replied", value: replied, color: "#42a581" },
    { label: "Converted", value: converted, color: "#c8ef9e" },
  ];

  return (
    <div className="page-stack">
      <section className="welcome-strip">
        <div>
          <span className="eyebrow">Tuesday, June 9</span>
          <h2>Good afternoon. Your pipeline is taking shape.</h2>
          <p>Focus on the {hot} hot leads most likely to need Qyrova right now.</p>
        </div>
        <button className="button button-light" onClick={() => onNavigate("finder")}>
          Refine target profile <ArrowRight size={17} />
        </button>
      </section>

      <section className="stats-grid">
        <StatCard label="Total leads" value={leads.length} detail="+6 this week" icon={Users} tone="mint" />
        <StatCard label="Hot leads" value={hot} detail={`${warm} warm`} icon={Flame} tone="coral" />
        <StatCard label="Contacted" value={contacted} detail={`${replyRate}% replied`} icon={Mail} tone="blue" />
        <StatCard label="Converted" value={converted} detail={`${conversionRate}% conversion`} icon={CheckCircle2} tone="gold" />
      </section>

      <section className="dashboard-grid">
        <article className="panel pipeline-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Pipeline health</span>
              <h3>Lead journey</h3>
            </div>
            <span className="date-pill">Last 30 days</span>
          </div>
          <div className="funnel-chart">
            {funnel.map((item, index) => (
              <div className="funnel-row" key={item.label}>
                <div className="funnel-label">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="funnel-track">
                  <span
                    style={{
                      width: `${Math.max(8, leads.length ? (item.value / leads.length) * 100 : 0)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                {index < funnel.length - 1 && (
                  <span className="funnel-rate">
                    {item.value ? Math.round((funnel[index + 1].value / item.value) * 100) : 0}%
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mini-metrics">
            <div>
              <Target size={17} />
              <span>Conversion rate</span>
              <strong>{conversionRate}%</strong>
            </div>
            <div>
              <MessageSquareReply size={17} />
              <span>Reply rate</span>
              <strong>{replyRate}%</strong>
            </div>
            <div>
              <CircleDot size={17} />
              <span>Active campaigns</span>
              <strong>{activeCampaigns}</strong>
            </div>
          </div>
        </article>

        <article className="panel temperature-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Lead quality</span>
              <h3>Temperature mix</h3>
            </div>
          </div>
          <div
            className="donut"
            style={{
              background: `conic-gradient(#e86e55 0 ${(hot / Math.max(1, leads.length)) * 100}%, #dfb958 0 ${((hot + warm) / Math.max(1, leads.length)) * 100}%, #87a9c5 0 100%)`,
            }}
          >
            <div>
              <strong>{leads.length}</strong>
              <span>scored leads</span>
            </div>
          </div>
          <div className="temperature-legend">
            <div><span className="legend-dot dot-hot" /><span>Hot</span><strong>{hot}</strong></div>
            <div><span className="legend-dot dot-warm" /><span>Warm</span><strong>{warm}</strong></div>
            <div><span className="legend-dot dot-cold" /><span>Cold</span><strong>{cold}</strong></div>
          </div>
          <button className="text-button" onClick={() => onNavigate("leads")}>
            Review scored leads <ArrowRight size={15} />
          </button>
        </article>
      </section>

      <section className="readiness-grid">
        <article className="readiness-card">
          <div className="readiness-icon"><Mail size={18} /></div>
          <div><span>Email-ready</span><strong>{count((lead) => lead.email)}</strong></div>
          <p>leads have a verified address</p>
        </article>
        <article className="readiness-card">
          <div className="readiness-icon linkedin-icon">in</div>
          <div><span>LinkedIn-ready</span><strong>{count((lead) => lead.linkedinUrl)}</strong></div>
          <p>profiles ready for manual outreach</p>
        </article>
        <article className="readiness-card">
          <div className="readiness-icon"><Snowflake size={18} /></div>
          <div><span>Needs research</span><strong>{count((lead) => !lead.email && !lead.linkedinUrl)}</strong></div>
          <p>leads need contact information</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Recently added</span>
            <h3>Latest leads</h3>
          </div>
          <button className="text-button" onClick={() => onNavigate("leads")}>
            View all <ArrowRight size={15} />
          </button>
        </div>
        <LeadTable leads={recentLeads} compact onEdit={onEditLead} />
      </section>

      <ComplianceNote />
    </div>
  );
}
