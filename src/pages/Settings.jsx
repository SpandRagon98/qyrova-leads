import { AlertTriangle, CloudOff, Database, PlugZap, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { downloadBackup, readBackup } from "../services/storageService";
import { getIntegrationStatus } from "../services/integrationService";

export default function Settings({ settings, data, onSave, onReset, setData, notify }) {
  const [draft, setDraft] = useState(settings);
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const restoreInput = useRef(null);
  useEffect(() => {
    getIntegrationStatus().then(setIntegrationStatus).catch(() => setIntegrationStatus({}));
  }, []);

  const importBackup = async (file) => {
    if (!file) return;
    try {
      setData(await readBackup(file));
      notify("Backup restored");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  return (
    <div className="settings-layout">
      <main className="settings-main">
        <section className="panel settings-section">
          <div className="settings-section-head"><div className="settings-icon"><ShieldCheck size={19} /></div><div><h3>Workspace identity</h3><p>Used to personalize templates and outreach drafts.</p></div></div>
          <div className="form-grid">
            <label className="form-field"><span>Product name</span><input value={draft.productName} onChange={(e) => setDraft({ ...draft, productName: e.target.value })} /></label>
            <label className="form-field"><span>Your name</span><input value={draft.userName} onChange={(e) => setDraft({ ...draft, userName: e.target.value })} /></label>
            <label className="form-field"><span>Sender name</span><input value={draft.senderName} onChange={(e) => setDraft({ ...draft, senderName: e.target.value })} /></label>
            <label className="form-field"><span>Sender email</span><input type="email" value={draft.senderEmail} onChange={(e) => setDraft({ ...draft, senderEmail: e.target.value })} /></label>
            <label className="form-field"><span>Website URL</span><input type="url" value={draft.websiteUrl} onChange={(e) => setDraft({ ...draft, websiteUrl: e.target.value })} /></label>
            <label className="form-field"><span>Default country</span><input value={draft.defaultCountry} onChange={(e) => setDraft({ ...draft, defaultCountry: e.target.value })} /></label>
            <label className="form-field form-span-two"><span>Default outreach tone</span><select value={draft.outreachTone} onChange={(e) => setDraft({ ...draft, outreachTone: e.target.value })}><option>Warm and professional</option><option>Concise and direct</option><option>Friendly and conversational</option><option>Formal and consultative</option></select></label>
            <label className="form-field form-span-two"><span>Target countries <small>(comma separated)</small></span><input value={(draft.targetCountries || []).join(", ")} onChange={(e) => setDraft({ ...draft, targetCountries: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
          </div>
          <div className="panel-actions"><button className="button button-primary" onClick={() => { onSave(draft); notify("Settings saved"); }}><Save size={16} /> Save settings</button></div>
        </section>

        <section className="panel settings-section">
          <div className="settings-section-head"><div className="settings-icon"><PlugZap size={19} /></div><div><h3>Lead source connections</h3><p>Secrets are read from the local server environment, never from browser storage.</p></div></div>
          <div className="integration-status-grid">
            {[
              ["google", "Google Places", "GOOGLE_PLACES_API_KEY"],
              ["openstreetmap", "OpenStreetMap", "OSM_CONTACT_EMAIL"],
              ["yelp", "Yelp", "YELP_API_KEY"],
              ["directory", "Public directory", "DIRECTORY_API_URL_TEMPLATE"],
              ["linkedin", "LinkedIn OIDC", "LINKEDIN_CLIENT_ID + secret"],
            ].map(([id, label, environment]) => (
              <div className="integration-status-item" key={id}>
                <span className={integrationStatus?.[id]?.configured ? "ready" : ""} />
                <div><strong>{integrationStatus?.[id]?.label || label}</strong><small>{integrationStatus?.[id]?.configured ? "Configured on local server" : `Set ${environment} in .env`}</small></div>
              </div>
            ))}
          </div>
          <div className="settings-code-note">
            <code>Copy .env.example to .env</code>
            <span>Then run <code>npm run dev:server</code> beside <code>npm run dev</code>.</span>
          </div>
        </section>

        <section className="panel settings-section">
          <div className="settings-section-head"><div className="settings-icon"><Database size={19} /></div><div><h3>Data management</h3><p>Your information stays in this browser unless you export it.</p></div></div>
          <div className="data-actions">
            <button onClick={() => downloadBackup(data)}><Database size={18} /><div><strong>Export backup</strong><span>Download all app data as JSON</span></div></button>
            <button onClick={() => restoreInput.current?.click()}><RotateCcw size={18} /><div><strong>Import backup</strong><span>Restore from a Qyrova JSON file</span></div></button>
            <input ref={restoreInput} hidden type="file" accept=".json" onChange={(e) => importBackup(e.target.files[0])} />
          </div>
        </section>

        <section className="panel settings-section danger-zone">
          <div className="settings-section-head"><div className="settings-icon settings-icon-danger"><AlertTriangle size={19} /></div><div><h3>Reset app</h3><p>Delete all local changes and restore the original sample workspace.</p></div></div>
          <button className="button button-danger-subtle" onClick={onReset}><RotateCcw size={16} /> Reset all app data</button>
        </section>
      </main>

      <aside className="settings-aside">
        <article className="local-data-card"><CloudOff size={26} /><span className="eyebrow eyebrow-light">Private by default</span><h3>Local-only MVP</h3><p>No account, subscription, or paid service is required. Your CRM data is stored in this browser.</p><div><span className="compliance-dot" /> Local persistence active</div></article>
        <article className="coming-soon-card"><span>Secure connector model</span><h3>No secrets in localStorage</h3><p>Google, Yelp, directory, and LinkedIn credentials stay in the optional local server. LinkedIn open access connects identity only; prospect search requires partner approval.</p></article>
      </aside>
    </div>
  );
}
