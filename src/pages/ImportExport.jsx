import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { LEAD_FIELD_OPTIONS, findDuplicate, guessField, mapCsvRows, parseCsvFile } from "../utils/csvImport";
import { exportLeadsCsv, exportLeadsXlsx } from "../utils/exportUtils";
import { downloadBackup, readBackup } from "../services/storageService";

export default function ImportExport({ data, leads, setData, notify }) {
  const csvInput = useRef(null);
  const backupInput = useRef(null);
  const [csvData, setCsvData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [duplicateMode, setDuplicateMode] = useState("skip");

  const pickCsv = async (file) => {
    if (!file) return;
    try {
      const parsed = await parseCsvFile(file);
      setCsvData(parsed);
      setMapping(Object.fromEntries(parsed.headers.map((header) => [header, guessField(header)])));
      notify(`${parsed.rows.length} rows ready to preview`);
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const mappedRows = csvData ? mapCsvRows(csvData.rows, mapping) : [];
  const duplicateCount = mappedRows.filter((lead) => findDuplicate(leads, lead)).length;

  const importRows = () => {
    let added = 0;
    let updated = 0;
    const nextLeads = [...data.leads];
    mappedRows.forEach((incoming) => {
      const duplicate = findDuplicate(nextLeads, incoming);
      if (!duplicate) {
        nextLeads.unshift(incoming);
        added += 1;
      } else if (duplicateMode === "update") {
        const index = nextLeads.findIndex((lead) => lead.id === duplicate.id);
        nextLeads[index] = {
          ...nextLeads[index],
          ...Object.fromEntries(Object.entries(incoming).filter(([, value]) => value !== "")),
          id: duplicate.id,
        };
        updated += 1;
      }
    });
    setData({ ...data, leads: nextLeads });
    setCsvData(null);
    notify(`${added} leads added${updated ? `, ${updated} updated` : ""}`);
  };

  const importBackup = async (file) => {
    if (!file) return;
    try {
      const backup = await readBackup(file);
      setData(backup);
      notify("Backup restored");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  return (
    <div className="page-stack">
      <section className="io-grid">
        <article className="panel import-card">
          <div className="io-icon"><Upload size={21} /></div>
          <span className="eyebrow">Bring data in</span>
          <h2>Import leads from CSV</h2>
          <p>Map any CSV structure to Qyrova fields, preview it, and handle duplicates before saving.</p>
          <button className="button button-primary" onClick={() => csvInput.current?.click()}><FileSpreadsheet size={17} /> Choose CSV file</button>
          <input ref={csvInput} hidden type="file" accept=".csv,text/csv" onChange={(e) => pickCsv(e.target.files[0])} />
        </article>
        <article className="panel export-card">
          <div className="io-icon"><Download size={21} /></div>
          <span className="eyebrow">Take data out</span>
          <h2>Export your lead sheet</h2>
          <p>Download all scored lead records in a spreadsheet-friendly format.</p>
          <div className="export-buttons">
            <button className="button button-secondary" onClick={() => exportLeadsCsv(leads)}>Export CSV</button>
            <button className="button button-primary" onClick={() => exportLeadsXlsx(leads)}>Export XLSX</button>
          </div>
        </article>
      </section>

      {csvData && (
        <section className="panel mapping-panel">
          <div className="panel-header panel-header-wrap">
            <div><span className="eyebrow">Step 1 of 2</span><h3>Map CSV columns</h3><p>We guessed the matches. Review them before importing.</p></div>
            <span className="count-pill">{csvData.rows.length} rows</span>
          </div>
          <div className="mapping-grid">
            {csvData.headers.map((header) => (
              <label className="mapping-item" key={header}>
                <span className="csv-column"><FileSpreadsheet size={15} /> {header}</span>
                <span className="mapping-arrow">→</span>
                <select value={mapping[header]} onChange={(e) => setMapping({ ...mapping, [header]: e.target.value })}>
                  {LEAD_FIELD_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            ))}
          </div>

          <div className="preview-head"><div><span className="eyebrow">Step 2 of 2</span><h3>Preview import</h3></div>{duplicateCount > 0 && <span className="duplicate-pill"><AlertTriangle size={15} /> {duplicateCount} possible duplicates</span>}</div>
          <div className="import-preview">
            <table>
              <thead><tr><th>Name</th><th>Business</th><th>Email</th><th>LinkedIn</th><th>Duplicate</th></tr></thead>
              <tbody>{mappedRows.slice(0, 6).map((lead, index) => { const duplicate = findDuplicate(leads, lead); return <tr key={index}><td>{lead.fullName || "—"}</td><td>{lead.businessName || "—"}</td><td>{lead.email || "—"}</td><td>{lead.linkedinUrl ? "Yes" : "—"}</td><td>{duplicate ? <span className="duplicate-tag">Match found</span> : <span className="new-tag">New</span>}</td></tr>; })}</tbody>
            </table>
          </div>
          {duplicateCount > 0 && (
            <div className="duplicate-options">
              <strong>When duplicates are found:</strong>
              <label><input type="radio" name="duplicates" checked={duplicateMode === "skip"} onChange={() => setDuplicateMode("skip")} /><span><strong>Skip duplicates</strong><small>Keep the existing lead unchanged.</small></span></label>
              <label><input type="radio" name="duplicates" checked={duplicateMode === "update"} onChange={() => setDuplicateMode("update")} /><span><strong>Update existing</strong><small>Fill existing records with imported values.</small></span></label>
            </div>
          )}
          <div className="panel-actions"><button className="button button-secondary" onClick={() => setCsvData(null)}>Cancel</button><button className="button button-primary" onClick={importRows}><CheckCircle2 size={17} /> Import {mappedRows.length - (duplicateMode === "skip" ? duplicateCount : 0)} leads</button></div>
        </section>
      )}

      <section className="panel backup-panel">
        <div className="panel-header">
          <div><span className="eyebrow">Local data portability</span><h3>Backup & restore</h3><p>Keep a complete copy of your leads, templates, campaigns, and settings.</p></div>
          <Database size={22} className="accent-icon" />
        </div>
        <div className="backup-actions">
          <button className="backup-action" onClick={() => downloadBackup(data)}><span><FileJson size={20} /></span><div><strong>Export full backup</strong><small>Download one JSON file with all local app data.</small></div><Download size={17} /></button>
          <button className="backup-action" onClick={() => backupInput.current?.click()}><span><RefreshCw size={20} /></span><div><strong>Restore from backup</strong><small>Replace current data with a Qyrova backup file.</small></div><Upload size={17} /></button>
          <input ref={backupInput} hidden type="file" accept=".json,application/json" onChange={(e) => importBackup(e.target.files[0])} />
        </div>
      </section>
    </div>
  );
}
