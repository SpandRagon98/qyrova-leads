import { ArrowRight, Check } from "lucide-react";
import { ICP_TEMPLATES } from "../../data/defaultData";

export default function IcpTemplateGrid({ onApply, selectedTemplate }) {
  return (
    <section className="panel">
      <div className="panel-header panel-header-wrap">
        <div>
          <span className="eyebrow">Quick start</span>
          <h3>Qyrova ICP templates</h3>
          <p>Choose a proven segment to prefill keywords and likely pain points.</p>
        </div>
        <span className="count-pill">{ICP_TEMPLATES.length} profiles</span>
      </div>
      <div className="template-card-grid">
        {ICP_TEMPLATES.map((template) => (
          <button
            key={template.id}
            className={`icp-card ${selectedTemplate === template.id ? "icp-card-selected" : ""}`}
            onClick={() => onApply(template)}
          >
            <span className="icp-icon">{template.name.slice(0, 1)}</span>
            <span className="icp-content">
              <strong>{template.name}</strong>
              <small>
                {template.industry} · {template.businessType}
              </small>
            </span>
            {selectedTemplate === template.id ? <Check size={18} /> : <ArrowRight size={16} />}
          </button>
        ))}
      </div>
    </section>
  );
}
