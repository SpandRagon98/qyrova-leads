import { useMemo, useState } from "react";
import { LEAD_STATUSES } from "../data/defaultData";
import { enrichLead } from "../utils/leadScoring";
import { ScoreBadge } from "./Badges";

const emptyLead = {
  firstName: "",
  lastName: "",
  fullName: "",
  businessName: "",
  role: "",
  industry: "",
  businessType: "",
  country: "",
  state: "",
  city: "",
  linkedinUrl: "",
  websiteUrl: "",
  email: "",
  phone: "",
  leadSource: "",
  notes: "",
  painPoint: "",
  status: "New",
  followUpDate: "",
};

function Field({ label, required, children }) {
  return (
    <label className="form-field">
      <span>
        {label} {required && <em>*</em>}
      </span>
      {children}
    </label>
  );
}

export default function LeadForm({ lead, targetCountries, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...emptyLead, ...lead });

  const scored = useMemo(() => enrichLead(form, targetCountries), [form, targetCountries]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    const fullName = form.fullName || `${form.firstName} ${form.lastName}`.trim();
    onSubmit({ ...form, fullName });
  };

  return (
    <form onSubmit={submit}>
      <div className="score-preview">
        <div>
          <span>Live lead score</span>
          <p>Updates automatically as details are added.</p>
        </div>
        <ScoreBadge score={scored.leadScore} temperature={scored.leadTemperature} />
      </div>

      <div className="form-section">
        <h3>Contact</h3>
        <div className="form-grid">
          <Field label="First name" required>
            <input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
          </Field>
          <Field label="Last name">
            <input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
          </Field>
          <Field label="Business name">
            <input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />
          </Field>
          <Field label="Role / title">
            <input value={form.role} onChange={(e) => update("role", e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="form-section">
        <h3>Business profile</h3>
        <div className="form-grid">
          <Field label="Industry">
            <input value={form.industry} onChange={(e) => update("industry", e.target.value)} />
          </Field>
          <Field label="Business type">
            <select value={form.businessType} onChange={(e) => update("businessType", e.target.value)}>
              <option value="">Select type</option>
              <option>Freelancer</option>
              <option>Agency</option>
              <option>Small Business</option>
              <option>Consultant</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="LinkedIn profile URL">
            <input
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={form.linkedinUrl}
              onChange={(e) => update("linkedinUrl", e.target.value)}
            />
          </Field>
          <Field label="Website URL">
            <input
              type="url"
              placeholder="https://..."
              value={form.websiteUrl}
              onChange={(e) => update("websiteUrl", e.target.value)}
            />
          </Field>
          <Field label="Lead source">
            <input value={form.leadSource} onChange={(e) => update("leadSource", e.target.value)} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => update("status", e.target.value)}>
              {LEAD_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="form-section">
        <h3>Location & qualification</h3>
        <div className="form-grid form-grid-three">
          <Field label="Country">
            <input value={form.country} onChange={(e) => update("country", e.target.value)} />
          </Field>
          <Field label="State / region">
            <input value={form.state} onChange={(e) => update("state", e.target.value)} />
          </Field>
          <Field label="City">
            <input value={form.city} onChange={(e) => update("city", e.target.value)} />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Pain point">
            <textarea rows="3" value={form.painPoint} onChange={(e) => update("painPoint", e.target.value)} />
          </Field>
          <Field label="Notes">
            <textarea rows="3" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="modal-actions sticky-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="button button-primary" type="submit">
          {lead?.id ? "Save changes" : "Add lead"}
        </button>
      </div>
    </form>
  );
}
