import { Download, Filter, Plus, Search, SlidersHorizontal, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { LEAD_STATUSES } from "../data/defaultData";
import LeadTable from "../components/LeadTable";
import { exportLeadsCsv, exportLeadsXlsx } from "../utils/exportUtils";

export default function Leads({
  leads,
  globalSearch,
  onAdd,
  onEdit,
  onDelete,
  onDeleteMany,
  onBulkStatus,
  onOpenOutreach,
  onNavigate,
  notify,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [score, setScore] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const industries = [...new Set(leads.map((lead) => lead.industry).filter(Boolean))].sort();
  const countries = [...new Set(leads.map((lead) => lead.country).filter(Boolean))].sort();

  const filtered = useMemo(() => {
    const query = `${search} ${globalSearch}`.trim().toLowerCase();
    return leads
      .filter((lead) => {
        const haystack = `${lead.fullName} ${lead.businessName} ${lead.role} ${lead.email} ${lead.city} ${lead.industry}`.toLowerCase();
        return (
          (!query || haystack.includes(query)) &&
          (!status || lead.status === status) &&
          (!industry || lead.industry === industry) &&
          (!country || lead.country === country) &&
          (!score || lead.leadTemperature === score)
        );
      })
      .sort((a, b) => {
        const av = a[sortField] ?? "";
        const bv = b[sortField] ?? "";
        const result = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sortDirection === "asc" ? result : -result;
      });
  }, [leads, search, globalSearch, status, industry, country, score, sortField, sortDirection]);

  const selected = leads.filter((lead) => selectedIds.includes(lead.id));
  const sort = (field) => {
    if (sortField === field) setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="page-stack">
      <section className="sheet-summary">
        <div><span>All leads</span><strong>{leads.length}</strong></div>
        <div><span>Hot</span><strong>{leads.filter((lead) => lead.leadTemperature === "Hot").length}</strong></div>
        <div><span>Email-ready</span><strong>{leads.filter((lead) => lead.email).length}</strong></div>
        <div><span>LinkedIn-ready</span><strong>{leads.filter((lead) => lead.linkedinUrl).length}</strong></div>
        <button className="button button-primary" onClick={onAdd}><Plus size={17} /> Add lead</button>
      </section>

      <section className="panel lead-sheet-panel">
        <div className="sheet-toolbar">
          <label className="sheet-search">
            <Search size={17} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, business, email..." />
          </label>
          <div className="toolbar-buttons">
            <button className="button button-secondary" onClick={() => onNavigate("import")}><Upload size={16} /> Import</button>
            <div className="button-menu">
              <button className="button button-secondary" onClick={() => exportLeadsCsv(filtered)}><Download size={16} /> CSV</button>
              <button className="button button-secondary" onClick={() => exportLeadsXlsx(filtered)}>XLSX</button>
            </div>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-label"><SlidersHorizontal size={16} /> Filters</div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{LEAD_STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)}><option value="">All industries</option>{industries.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={country} onChange={(e) => setCountry(e.target.value)}><option value="">All countries</option>{countries.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={score} onChange={(e) => setScore(e.target.value)}><option value="">Any score</option><option>Hot</option><option>Warm</option><option>Cold</option></select>
          {(status || industry || country || score) && <button className="text-button" onClick={() => { setStatus(""); setIndustry(""); setCountry(""); setScore(""); }}>Clear filters</button>}
          <span className="filter-count"><Filter size={14} /> {filtered.length} results</span>
        </div>

        {selectedIds.length > 0 && (
          <div className="bulk-bar">
            <strong>{selectedIds.length} selected</strong>
            <select defaultValue="" onChange={(e) => { if (e.target.value) { onBulkStatus(selectedIds, e.target.value); notify("Lead statuses updated"); e.target.value = ""; } }}>
              <option value="" disabled>Update status</option>
              {LEAD_STATUSES.map((item) => <option key={item}>{item}</option>)}
            </select>
            <button className="button button-compact button-secondary" onClick={() => exportLeadsCsv(selected)}><Download size={15} /> Export selected</button>
            <button className="button button-compact button-danger-subtle" onClick={() => { onDeleteMany(selectedIds); setSelectedIds([]); }}><Trash2 size={15} /> Delete</button>
            <button className="text-button bulk-clear" onClick={() => setSelectedIds([])}>Clear</button>
          </div>
        )}

        <LeadTable
          leads={filtered}
          selectedIds={selectedIds}
          onSelect={(id, checked) => setSelectedIds((current) => checked ? [...current, id] : current.filter((item) => item !== id))}
          onSelectAll={(checked) => setSelectedIds(checked ? filtered.map((lead) => lead.id) : [])}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenOutreach={onOpenOutreach}
          onSort={sort}
          sortField={sortField}
          sortDirection={sortDirection}
        />
      </section>
    </div>
  );
}
