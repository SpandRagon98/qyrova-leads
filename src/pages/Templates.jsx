import { Copy, Mail, MessageSquare, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";

const variables = [
  "{{firstName}}",
  "{{fullName}}",
  "{{businessName}}",
  "{{industry}}",
  "{{city}}",
  "{{country}}",
  "{{painPoint}}",
  "{{myProductName}}",
];

const blankTemplate = { name: "", channel: "linkedin", subject: "", body: "" };

export default function Templates({ templates, setTemplates, notify }) {
  const [channel, setChannel] = useState("linkedin");
  const [editing, setEditing] = useState(null);
  const filtered = useMemo(() => templates.filter((template) => template.channel === channel), [templates, channel]);

  const save = (template) => {
    if (!template.name.trim() || !template.body.trim()) return;
    if (template.id) {
      setTemplates(templates.map((item) => item.id === template.id ? template : item));
    } else {
      setTemplates([...templates, { ...template, id: crypto.randomUUID() }]);
    }
    setEditing(null);
    notify("Template saved");
  };

  return (
    <div className="page-stack">
      <section className="template-banner">
        <div>
          <span className="eyebrow eyebrow-light">Personalization library</span>
          <h2>Write once. Make every message feel considered.</h2>
          <p>Use variables to tailor each draft, then review and send it manually.</p>
        </div>
        <button className="button button-light" onClick={() => setEditing({ ...blankTemplate, channel })}><Plus size={17} /> New template</button>
      </section>

      <section className="panel">
        <div className="template-tabs">
          <button className={channel === "linkedin" ? "active" : ""} onClick={() => setChannel("linkedin")}><MessageSquare size={17} /> LinkedIn <span>{templates.filter((t) => t.channel === "linkedin").length}</span></button>
          <button className={channel === "email" ? "active" : ""} onClick={() => setChannel("email")}><Mail size={17} /> Email <span>{templates.filter((t) => t.channel === "email").length}</span></button>
        </div>
        <div className="variable-strip">
          <span>Available variables</span>
          {variables.map((variable) => <button key={variable} onClick={() => { navigator.clipboard.writeText(variable); notify("Variable copied"); }}>{variable}</button>)}
        </div>
        <div className="message-template-grid">
          {filtered.map((template, index) => (
            <article className="message-template-card" key={template.id}>
              <div className="template-card-top">
                <div className={`channel-icon channel-${template.channel}`}>{template.channel === "email" ? <Mail size={17} /> : "in"}</div>
                <span>Template {String(index + 1).padStart(2, "0")}</span>
                <div className="template-card-actions">
                  <button className="icon-button icon-button-small" onClick={() => { navigator.clipboard.writeText(template.body); notify("Template copied"); }}><Copy size={15} /></button>
                  <button className="icon-button icon-button-small" onClick={() => setEditing({ ...template })}><Pencil size={15} /></button>
                  <button className="icon-button icon-button-small icon-danger" onClick={() => { setTemplates(templates.filter((item) => item.id !== template.id)); notify("Template deleted"); }}><Trash2 size={15} /></button>
                </div>
              </div>
              <h3>{template.name}</h3>
              {template.subject && <strong className="template-subject">{template.subject}</strong>}
              <p>{template.body}</p>
              <button className="text-button" onClick={() => setEditing({ ...template })}>Edit template <Pencil size={14} /></button>
            </article>
          ))}
          {!filtered.length && <EmptyState title="No templates yet" description={`Create your first ${channel} outreach template.`} />}
        </div>
      </section>

      <TemplateModal
        key={editing ? editing.id || "new-template" : "closed-template"}
        template={editing}
        onClose={() => setEditing(null)}
        onSave={save}
      />
    </div>
  );
}

function TemplateModal({ template, onClose, onSave }) {
  const [draft, setDraft] = useState(template || blankTemplate);
  if (!template) return null;
  const addVariable = (variable) => setDraft((current) => ({ ...current, body: `${current.body}${current.body ? " " : ""}${variable}` }));
  return (
    <Modal open title={template.id ? "Edit template" : "Create template"} description="Variables are personalized when you select a lead." onClose={onClose} wide>
      <div className="template-editor">
        <div className="form-grid">
          <label className="form-field"><span>Template name</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label className="form-field"><span>Channel</span><select value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value })}><option value="linkedin">LinkedIn</option><option value="email">Email</option></select></label>
        </div>
        {draft.channel === "email" && <label className="form-field"><span>Subject line</span><input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} /></label>}
        <label className="form-field"><span>Message body</span><textarea rows="10" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></label>
        <div className="editor-variables"><span>Insert variable:</span>{variables.map((variable) => <button key={variable} onClick={() => addVariable(variable)}>{variable}</button>)}</div>
        <div className="modal-actions"><button className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" onClick={() => onSave(draft)}><Save size={16} /> Save template</button></div>
      </div>
    </Modal>
  );
}
