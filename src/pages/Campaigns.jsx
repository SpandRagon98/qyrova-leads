import { CalendarDays, ChevronRight, Mail, Megaphone, Play, Plus, Target, Users } from "lucide-react";
import { useState } from "react";
import { CAMPAIGN_STATUSES } from "../data/defaultData";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { StatusBadge } from "../components/Badges";

export default function Campaigns({ campaigns, setCampaigns, leads, templates, notify }) {
  const [editing, setEditing] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(campaigns[0]?.id || "");
  const selected = campaigns.find((campaign) => campaign.id === selectedCampaign);

  const save = (campaign) => {
    if (campaign.id) setCampaigns(campaigns.map((item) => item.id === campaign.id ? campaign : item));
    else setCampaigns([{ ...campaign, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...campaigns]);
    setEditing(null);
    notify("Campaign saved");
  };

  return (
    <div className="page-stack">
      <section className="campaign-summary">
        <div><span className="campaign-summary-icon"><Megaphone size={19} /></span><div><span>Total campaigns</span><strong>{campaigns.length}</strong></div></div>
        <div><span className="campaign-summary-icon"><Play size={19} /></span><div><span>Active</span><strong>{campaigns.filter((c) => c.status === "Active").length}</strong></div></div>
        <div><span className="campaign-summary-icon"><Users size={19} /></span><div><span>Leads enrolled</span><strong>{new Set(campaigns.flatMap((c) => c.leadIds)).size}</strong></div></div>
        <button className="button button-primary" onClick={() => setEditing({ name: "", targetSegment: "", country: "", industry: "", templateId: templates[0]?.id || "", leadIds: [], status: "Draft" })}><Plus size={17} /> New campaign</button>
      </section>

      <section className="campaign-layout">
        <div className="campaign-list">
          {campaigns.map((campaign) => {
            const campaignLeads = leads.filter((lead) => campaign.leadIds.includes(lead.id));
            const contacted = campaignLeads.filter((lead) => ["Contacted", "Replied", "Interested", "Converted"].includes(lead.status)).length;
            return (
              <button key={campaign.id} className={`campaign-card ${selectedCampaign === campaign.id ? "active" : ""}`} onClick={() => setSelectedCampaign(campaign.id)}>
                <div className="campaign-card-top"><span className={`campaign-status campaign-${campaign.status.toLowerCase()}`}>{campaign.status}</span><ChevronRight size={17} /></div>
                <h3>{campaign.name}</h3>
                <p>{campaign.targetSegment || campaign.industry || "General outreach"} · {campaign.country || "All locations"}</p>
                <div className="campaign-progress"><span style={{ width: `${campaignLeads.length ? (contacted / campaignLeads.length) * 100 : 0}%` }} /></div>
                <div className="campaign-card-foot"><span>{contacted}/{campaignLeads.length} contacted</span><span>{new Date(campaign.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></div>
              </button>
            );
          })}
          {!campaigns.length && <EmptyState title="No campaigns yet" description="Group leads and templates into a simple manual outreach plan." />}
        </div>

        <article className="panel campaign-detail">
          {selected ? (
            <>
              <div className="campaign-detail-head">
                <div><span className="eyebrow">Campaign details</span><h2>{selected.name}</h2><p>{selected.targetSegment} · {selected.industry} · {selected.country}</p></div>
                <button className="button button-secondary" onClick={() => setEditing({ ...selected })}>Edit campaign</button>
              </div>
              <div className="campaign-meta-grid">
                <div><Target size={18} /><span>Segment</span><strong>{selected.targetSegment || "All leads"}</strong></div>
                <div><Mail size={18} /><span>Template</span><strong>{templates.find((t) => t.id === selected.templateId)?.name || "None"}</strong></div>
                <div><CalendarDays size={18} /><span>Status</span><strong>{selected.status}</strong></div>
              </div>
              <div className="campaign-leads-head"><h3>Leads in campaign</h3><span>{selected.leadIds.length} leads</span></div>
              <div className="campaign-lead-list">
                {leads.filter((lead) => selected.leadIds.includes(lead.id)).map((lead) => (
                  <div className="campaign-lead-row" key={lead.id}>
                    <div className="lead-avatar">{lead.firstName?.[0]}</div>
                    <div><strong>{lead.fullName}</strong><span>{lead.businessName}</span></div>
                    <StatusBadge status={lead.status} />
                    <span className="followup-date">{lead.followUpDate ? `Follow up ${lead.followUpDate}` : "No follow-up"}</span>
                  </div>
                ))}
                {!selected.leadIds.length && <EmptyState title="No leads selected" description="Edit this campaign to add leads." />}
              </div>
            </>
          ) : <EmptyState title="Select a campaign" description="Campaign details will appear here." />}
        </article>
      </section>
      <CampaignModal
        key={editing ? editing.id || "new-campaign" : "closed-campaign"}
        campaign={editing}
        leads={leads}
        templates={templates}
        onClose={() => setEditing(null)}
        onSave={save}
      />
    </div>
  );
}

function CampaignModal({ campaign, leads, templates, onClose, onSave }) {
  const [draft, setDraft] = useState(campaign || null);
  if (!campaign) return null;
  const toggleLead = (id) => setDraft((current) => ({ ...current, leadIds: current.leadIds.includes(id) ? current.leadIds.filter((item) => item !== id) : [...current.leadIds, id] }));
  return (
    <Modal open title={campaign.id ? "Edit campaign" : "Create campaign"} description="Campaigns organize manual outreach; they do not send messages automatically." onClose={onClose} wide>
      <div className="form-grid">
        <label className="form-field"><span>Campaign name</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
        <label className="form-field"><span>Status</span><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{CAMPAIGN_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label className="form-field"><span>Target segment</span><input value={draft.targetSegment} onChange={(e) => setDraft({ ...draft, targetSegment: e.target.value })} /></label>
        <label className="form-field"><span>Industry</span><input value={draft.industry} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} /></label>
        <label className="form-field"><span>Country</span><input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></label>
        <label className="form-field"><span>Message template</span><select value={draft.templateId} onChange={(e) => setDraft({ ...draft, templateId: e.target.value })}>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
      </div>
      <div className="campaign-picker"><div><strong>Select leads</strong><span>{draft.leadIds.length} selected</span></div><div className="campaign-picker-list">{leads.map((lead) => <label key={lead.id}><input type="checkbox" checked={draft.leadIds.includes(lead.id)} onChange={() => toggleLead(lead.id)} /><span className="lead-avatar">{lead.firstName?.[0]}</span><span><strong>{lead.fullName}</strong><small>{lead.businessName} · {lead.industry}</small></span></label>)}</div></div>
      <div className="modal-actions"><button className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={!draft.name.trim()} onClick={() => onSave(draft)}>Save campaign</button></div>
    </Modal>
  );
}
