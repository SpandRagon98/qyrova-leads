import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import EmptyState from "../components/EmptyState";
import { ScoreBadge, StatusBadge } from "../components/Badges";
import { parseTemplate } from "../utils/templateParser";

export default function Outreach({
  leads,
  templates,
  settings,
  selectedLeadId,
  setSelectedLeadId,
  updateLead,
  notify,
}) {
  const availableLeads = leads.filter((lead) => lead.status !== "Do Not Contact");
  const [channel, setChannel] = useState("linkedin");
  const channelTemplates = templates.filter((template) => template.channel === channel);
  const [templateId, setTemplateId] = useState(channelTemplates[0]?.id || "");
  const lead = availableLeads.find((item) => item.id === selectedLeadId) || availableLeads[0];
  const template = channelTemplates.find((item) => item.id === templateId) || channelTemplates[0];
  const subject = parseTemplate(template?.subject || "", lead, settings);
  const message = parseTemplate(template?.body || "", lead, settings);

  const changeChannel = (next) => {
    setChannel(next);
    setTemplateId(templates.find((item) => item.channel === next)?.id || "");
  };
  const copy = async (text, label) => {
    await navigator.clipboard.writeText(text);
    notify(`${label} copied`);
  };
  const markContacted = () => {
    updateLead(lead.id, { status: "Contacted", lastContacted: new Date().toISOString().slice(0, 10) });
    notify(`${lead.firstName} marked as contacted`);
  };

  if (!lead) return <EmptyState title="No leads ready for outreach" description="Add a lead to prepare a personalized draft." />;

  return (
    <div className="outreach-layout">
      <aside className="outreach-lead-list panel">
        <div className="panel-header">
          <div><span className="eyebrow">Queue</span><h3>Outreach leads</h3></div>
          <span className="count-pill">{availableLeads.length}</span>
        </div>
        <label className="form-field"><span>Find a lead</span>
          <select value={lead.id} onChange={(e) => setSelectedLeadId(e.target.value)}>
            {availableLeads.map((item) => <option key={item.id} value={item.id}>{item.fullName} · {item.businessName}</option>)}
          </select>
        </label>
        <div className="lead-queue">
          {availableLeads.map((item) => (
            <button key={item.id} className={item.id === lead.id ? "queue-item active" : "queue-item"} onClick={() => setSelectedLeadId(item.id)}>
              <div className="lead-avatar">{item.firstName?.[0] || "?"}</div>
              <div><strong>{item.fullName}</strong><span>{item.businessName || item.industry}</span></div>
              <span className={`queue-dot queue-${item.leadTemperature.toLowerCase()}`} />
            </button>
          ))}
        </div>
      </aside>

      <main className="outreach-workspace">
        <section className="panel outreach-profile">
          <div className="profile-main">
            <div className="profile-avatar">{lead.firstName?.[0]}{lead.lastName?.[0]}</div>
            <div><span className="eyebrow">Selected lead</span><h2>{lead.fullName}</h2><p>{lead.role} at {lead.businessName}</p></div>
          </div>
          <div className="profile-badges"><ScoreBadge score={lead.leadScore} temperature={lead.leadTemperature} /><StatusBadge status={lead.status} /></div>
          <div className="profile-details">
            <span><UserRound size={15} /> {lead.industry}</span>
            <span>{lead.city}, {lead.country}</span>
            {lead.email && <span><Mail size={15} /> {lead.email}</span>}
          </div>
        </section>

        <section className="panel composer-panel">
          <div className="composer-tabs">
            <button className={channel === "linkedin" ? "active" : ""} onClick={() => changeChannel("linkedin")}><MessageSquare size={17} /> LinkedIn</button>
            <button className={channel === "email" ? "active" : ""} onClick={() => changeChannel("email")}><Mail size={17} /> Email</button>
          </div>
          <div className="manual-notice"><ShieldCheck size={17} /><span>{channel === "linkedin" ? "Qyrova prepares the draft. You open the profile and send it yourself." : "Review the email, then copy it or open it in your mail app."}</span></div>
          <div className="composer-controls">
            <label className="form-field"><span>Message template</span>
              <select value={template?.id || ""} onChange={(e) => setTemplateId(e.target.value)}>
                {channelTemplates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          </div>
          {channel === "email" && <div className="subject-preview"><span>Subject</span><strong>{subject}</strong><button className="icon-button icon-button-small" onClick={() => copy(subject, "Subject")}><Copy size={15} /></button></div>}
          <div className="message-preview">
            <div className="message-preview-top"><span>Personalized draft</span><span>{message.length} characters</span></div>
            <p>{message}</p>
          </div>
          <div className="composer-actions">
            <button className="button button-secondary" onClick={() => copy(message, "Message")}><Copy size={16} /> Copy message</button>
            {channel === "linkedin" && lead.linkedinUrl && <a className="button button-primary" href={lead.linkedinUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open LinkedIn profile</a>}
            {channel === "email" && lead.email && <a className="button button-primary" href={`mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}><Send size={16} /> Open mail app</a>}
            <button className="button button-success" onClick={markContacted}><Check size={16} /> Mark contacted</button>
          </div>
        </section>

        <section className="panel followup-panel">
          <div><CalendarDays size={19} /><div><strong>Schedule a manual follow-up</strong><span>Keep the next touch visible in your pipeline.</span></div></div>
          <input type="date" value={lead.followUpDate || ""} onChange={(e) => { updateLead(lead.id, { followUpDate: e.target.value }); notify("Follow-up date saved"); }} />
        </section>
      </main>
    </div>
  );
}
