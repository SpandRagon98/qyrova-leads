import { ArrowRight, Lightbulb, MapPin, Save, Sparkles, Target } from "lucide-react";

export default function TargetingBrief({
  criteria,
  onAddLead,
  onClear,
  onSave,
  updateCriteria,
}) {
  return (
    <section className="finder-layout">
      <article className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Targeting brief</span>
            <h3>Define your audience</h3>
          </div>
          <Sparkles size={20} className="accent-icon" />
        </div>
        <div className="form-grid form-grid-three">
          <label className="form-field">
            <span>Country</span>
            <input
              value={criteria.country}
              onChange={(event) => updateCriteria("country", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>State / region</span>
            <input
              value={criteria.state}
              onChange={(event) => updateCriteria("state", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>City</span>
            <input
              value={criteria.city}
              onChange={(event) => updateCriteria("city", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Target segment</span>
            <input
              value={criteria.targetSegment}
              onChange={(event) => updateCriteria("targetSegment", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Industry</span>
            <input
              value={criteria.industry}
              onChange={(event) => updateCriteria("industry", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Business type</span>
            <select
              value={criteria.businessType}
              onChange={(event) => updateCriteria("businessType", event.target.value)}
            >
              <option value="">Select type</option>
              <option>Freelancer</option>
              <option>Agency</option>
              <option>Small Business</option>
              <option>Consultant</option>
            </select>
          </label>
          <label className="form-field form-span-two">
            <span>Keywords</span>
            <input
              value={criteria.keyword}
              onChange={(event) => updateCriteria("keyword", event.target.value)}
              placeholder="e.g. brand designer, invoice, quotation"
            />
          </label>
          <label className="form-field">
            <span>Company size</span>
            <select
              value={criteria.companySize}
              onChange={(event) => updateCriteria("companySize", event.target.value)}
            >
              <option value="">Any size</option>
              <option>Solo</option>
              <option>2-10</option>
              <option>11-50</option>
              <option>51-200</option>
            </select>
          </label>
          <label className="form-field">
            <span>Lead source</span>
            <input
              value={criteria.leadSource}
              onChange={(event) => updateCriteria("leadSource", event.target.value)}
              placeholder="Referral, directory..."
            />
          </label>
          <label className="form-field form-span-two">
            <span>Likely pain point</span>
            <textarea
              rows="3"
              value={criteria.painPoint}
              onChange={(event) => updateCriteria("painPoint", event.target.value)}
            />
          </label>
          <label className="form-field form-span-three">
            <span>Research notes</span>
            <textarea
              rows="3"
              value={criteria.notes}
              onChange={(event) => updateCriteria("notes", event.target.value)}
            />
          </label>
        </div>
        <div className="panel-actions">
          <button className="button button-secondary" onClick={onClear}>
            Clear
          </button>
          <button className="button button-secondary" onClick={onSave}>
            <Save size={16} /> Save profile
          </button>
          <button className="button button-primary" onClick={onAddLead}>
            Add matching lead <ArrowRight size={16} />
          </button>
        </div>
      </article>

      <aside className="finder-tips">
        <article className="tip-card tip-card-dark">
          <Lightbulb size={21} />
          <h3>Provider data is a starting point</h3>
          <p>
            Listings usually identify a business, not the decision maker. Review and enrich each
            imported lead manually.
          </p>
        </article>
        <article className="tip-card">
          <MapPin size={20} />
          <h3>Geography matters</h3>
          <p>
            Start with one city or region. A focused message usually feels more relevant than a
            broad campaign.
          </p>
        </article>
        <article className="tip-card">
          <Target size={20} />
          <h3>Strong buying signals</h3>
          <p>
            Prioritize owner-led businesses that mention estimates, retainers, packages,
            proposals, or manual billing.
          </p>
        </article>
      </aside>
    </section>
  );
}
