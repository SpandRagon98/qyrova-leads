import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import LinkedInIcon from "../components/icons/LinkedInIcon";
import { useEffect, useMemo, useState } from "react";
import { ScoreBadge, StatusBadge } from "../components/Badges";
import EmptyState from "../components/EmptyState";
import {
  getIntegrationStatus,
  getLinkedInConnectUrl,
} from "../services/integrationService";
import { parseTemplate } from "../utils/templateParser";

export default function LinkedInPage({
  leads,
  templates,
  settings,
  linkedinProfile,
  selectedLeadId,
  setSelectedLeadId,
  updateLead,
  notify,
}) {
  const linkedInLeads = useMemo(
    () => leads.filter((lead) => lead.linkedinUrl && lead.status !== "Do Not Contact"),
    [leads],
  );
  const linkedInTemplates = useMemo(
    () => templates.filter((template) => template.channel === "linkedin"),
    [templates],
  );
  const [templateId, setTemplateId] = useState(linkedInTemplates[0]?.id || "");
  const [connectionReady, setConnectionReady] = useState(false);
  const lead =
    linkedInLeads.find((item) => item.id === selectedLeadId) ||
    linkedInLeads[0];
  const template =
    linkedInTemplates.find((item) => item.id === templateId) ||
    linkedInTemplates[0];
  const message = useMemo(
    () => parseTemplate(template?.body || "", lead, settings),
    [lead, settings, template],
  );

  useEffect(() => {
    getIntegrationStatus()
      .then((status) => setConnectionReady(Boolean(status.linkedin?.configured)))
      .catch(() => setConnectionReady(false));
  }, []);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
    notify("LinkedIn message copied");
  };

  const markContacted = () => {
    updateLead(lead.id, {
      status: "Contacted",
      lastContacted: new Date().toISOString().slice(0, 10),
    });
    notify(`${lead.firstName || lead.fullName} marked as contacted`);
  };

  const searchQuery = new URLSearchParams({
    keywords: [lead?.role, lead?.industry, lead?.city, lead?.country]
      .filter(Boolean)
      .join(" "),
  });

  return (
    <div className="page-stack">
      <section className="linkedin-hero">
        <div>
          <span className="eyebrow eyebrow-light">LinkedIn workspace</span>
          <h2>Personalized outreach, sent by you.</h2>
          <p>
            Connect your own LinkedIn identity, organize approved profile URLs,
            and keep every message manual and compliant.
          </p>
        </div>
        <div className="linkedin-hero-actions">
          {connectionReady ? (
            <a className="button button-light" href={getLinkedInConnectUrl()}>
              <LinkedInIcon size={17} />
              {linkedinProfile ? "Reconnect LinkedIn" : "Connect LinkedIn"}
            </a>
          ) : (
            <a
              className="button button-light"
              href="https://www.linkedin.com/developers/apps"
              target="_blank"
              rel="noreferrer"
            >
              <KeyRound size={17} /> Configure LinkedIn app
            </a>
          )}
          <a
            className="button linkedin-search-button"
            href={`https://www.linkedin.com/search/results/people/?${searchQuery}`}
            target="_blank"
            rel="noreferrer"
          >
            <Search size={16} /> Open manual search
          </a>
        </div>
      </section>

      <section className="linkedin-account-strip">
        <div className="linkedin-account-icon">
          <LinkedInIcon size={20} />
        </div>
        <div>
          <strong>
            {linkedinProfile
              ? `Connected as ${linkedinProfile.name}`
              : "LinkedIn identity not connected"}
          </strong>
          <span>
            OpenID Connect reads only your consenting account's basic identity.
            It does not grant lead search or messaging automation.
          </span>
        </div>
        <ShieldCheck size={20} />
      </section>

      {!lead ? (
        <section className="panel">
          <EmptyState
            title="No LinkedIn-ready leads"
            description="Add a LinkedIn profile URL to a lead before preparing outreach."
          />
        </section>
      ) : (
        <section className="linkedin-workspace">
          <aside className="panel linkedin-lead-queue">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Profile queue</span>
                <h3>LinkedIn-ready leads</h3>
              </div>
              <span className="count-pill">{linkedInLeads.length}</span>
            </div>
            <div className="lead-queue">
              {linkedInLeads.map((item) => (
                <button
                  key={item.id}
                  className={item.id === lead.id ? "queue-item active" : "queue-item"}
                  onClick={() => setSelectedLeadId(item.id)}
                >
                  <div className="lead-avatar">{item.firstName?.[0] || "?"}</div>
                  <div>
                    <strong>{item.fullName}</strong>
                    <span>{item.businessName || item.industry}</span>
                  </div>
                  <span className={`queue-dot queue-${item.leadTemperature.toLowerCase()}`} />
                </button>
              ))}
            </div>
          </aside>

          <main className="linkedin-composer">
            <section className="panel outreach-profile">
              <div className="profile-main">
                <div className="profile-avatar">
                  {lead.firstName?.[0]}
                  {lead.lastName?.[0]}
                </div>
                <div>
                  <span className="eyebrow">Selected profile</span>
                  <h2>{lead.fullName}</h2>
                  <p>{lead.role} at {lead.businessName}</p>
                </div>
              </div>
              <div className="profile-badges">
                <ScoreBadge
                  score={lead.leadScore}
                  temperature={lead.leadTemperature}
                />
                <StatusBadge status={lead.status} />
              </div>
              <div className="profile-details">
                <span><UserRound size={15} /> {lead.industry}</span>
                <span>{[lead.city, lead.country].filter(Boolean).join(", ")}</span>
              </div>
            </section>

            <section className="panel linkedin-message-panel">
              <div className="manual-notice">
                <ShieldCheck size={17} />
                <span>
                  Qyrova creates the draft. You review it, open LinkedIn, and send it yourself.
                </span>
              </div>
              <div className="composer-controls">
                <label className="form-field">
                  <span>LinkedIn template</span>
                  <select
                    value={template?.id || ""}
                    onChange={(event) => setTemplateId(event.target.value)}
                  >
                    {linkedInTemplates.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="message-preview">
                <div className="message-preview-top">
                  <span>Personalized LinkedIn draft</span>
                  <span>{message.length} characters</span>
                </div>
                <p>{message}</p>
              </div>
              <div className="composer-actions">
                <button className="button button-secondary" onClick={copyMessage}>
                  <Copy size={16} /> Copy message
                </button>
                <a
                  className="button button-primary"
                  href={lead.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={16} /> Open LinkedIn profile
                </a>
                <button className="button button-success" onClick={markContacted}>
                  <Check size={16} /> Mark contacted
                </button>
              </div>
            </section>

            <section className="panel followup-panel">
              <div>
                <CalendarDays size={19} />
                <div>
                  <strong>Manual follow-up date</strong>
                  <span>Keep your next LinkedIn touch visible.</span>
                </div>
              </div>
              <input
                type="date"
                value={lead.followUpDate || ""}
                onChange={(event) => {
                  updateLead(lead.id, { followUpDate: event.target.value });
                  notify("Follow-up date saved");
                }}
              />
            </section>
          </main>
        </section>
      )}
    </div>
  );
}
