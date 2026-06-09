import {
  ExternalLink,
  FileUp,
  KeyRound,
  LoaderCircle,
  Search,
} from "lucide-react";
import { sourceDefinitions, sourceLocation } from "./config";

export default function LeadSourcePanel({
  criteria,
  includeContactDetails,
  mapsInput,
  onImportMapsFile,
  onImportSelected,
  onProviderChange,
  onRunSearch,
  onToggleContactDetails,
  onToggleResult,
  provider,
  results,
  searching,
  selectedResults,
  selectedSource,
  status,
  statusError,
  updateCriteria,
}) {
  const providerStatus = status?.[provider];

  return (
    <section className="panel source-panel">
      <div className="panel-header panel-header-wrap">
        <div>
          <span className="eyebrow">Live sources</span>
          <h3>Choose where to search</h3>
          <p>Credentials remain on the integration server and are never saved in the browser.</p>
        </div>
        <button className="button button-secondary" onClick={() => mapsInput.current?.click()}>
          <FileUp size={16} /> Import Google Maps export
        </button>
        <input
          ref={mapsInput}
          hidden
          type="file"
          accept=".csv,.tsv,.json,.kml,text/csv,application/json,application/vnd.google-earth.kml+xml"
          onChange={(event) => onImportMapsFile(event.target.files[0])}
        />
      </div>

      {statusError && (
        <div className="integration-alert">
          <KeyRound size={17} />
          <span>
            {statusError} Run <code>npm run dev:server</code>.
          </span>
        </div>
      )}

      <div className="source-card-grid">
        {sourceDefinitions.map((source) => {
          const Icon = source.icon;
          const configured = Boolean(status?.[source.id]?.configured);
          return (
            <button
              key={source.id}
              className={`source-card ${provider === source.id ? "active" : ""}`}
              onClick={() => onProviderChange(source.id)}
            >
              <span className="source-card-icon">
                <Icon size={19} />
              </span>
              <span className="source-card-copy">
                <strong>{status?.[source.id]?.label || source.name}</strong>
                <small>{source.description}</small>
                <em>{source.note}</em>
              </span>
              <span className={`connection-state ${configured ? "connected" : ""}`}>
                {configured ? "Ready" : "Setup needed"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="source-search-bar">
        <label className="form-field">
          <span>Business keyword</span>
          <input
            value={criteria.keyword}
            onChange={(event) => updateCriteria("keyword", event.target.value)}
            placeholder="e.g. web agency, tax consultant"
          />
        </label>
        <label className="form-field">
          <span>Location</span>
          <input
            value={sourceLocation(criteria)}
            readOnly
            placeholder="Complete city, state, or country below"
          />
        </label>
        {provider === "google" && (
          <label className="contact-detail-toggle">
            <input
              type="checkbox"
              checked={includeContactDetails}
              onChange={(event) => onToggleContactDetails(event.target.checked)}
            />
            <span>
              <strong>Include phone and website</strong>
              <small>May use a higher-cost Google Places SKU.</small>
            </span>
          </label>
        )}
        <button
          className="button button-primary"
          disabled={!providerStatus?.configured || searching}
          onClick={onRunSearch}
        >
          {searching ? <LoaderCircle size={16} className="spin" /> : <Search size={16} />}
          Search {selectedSource?.name}
        </button>
      </div>

      {provider === "openstreetmap" && (
        <p className="source-attribution">
          Results use OpenStreetMap Nominatim for small manual searches only. Data:{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            © OpenStreetMap contributors
          </a>
        </p>
      )}

      {results.length > 0 && (
        <div className="source-results">
          <div className="source-results-head">
            <div>
              <strong>{results.length} businesses found</strong>
              <span>{selectedResults.length} selected for import</span>
            </div>
            <div>
              <button
                className="text-button"
                onClick={() =>
                  onToggleResult(
                    selectedResults.length === results.length
                      ? []
                      : results.map((result) => result.providerId),
                  )
                }
              >
                {selectedResults.length === results.length ? "Clear selection" : "Select all"}
              </button>
              <button
                className="button button-primary"
                disabled={!selectedResults.length}
                onClick={onImportSelected}
              >
                Import {selectedResults.length} leads
              </button>
            </div>
          </div>
          <div className="source-result-grid">
            {results.map((result) => (
              <article
                key={result.providerId}
                className={`source-result-card ${
                  selectedResults.includes(result.providerId) ? "selected" : ""
                }`}
              >
                <label>
                  <input
                    type="checkbox"
                    checked={selectedResults.includes(result.providerId)}
                    onChange={() => onToggleResult(result.providerId)}
                  />
                  <span className="source-result-logo">{result.name.slice(0, 1)}</span>
                  <span>
                    <strong>{result.name}</strong>
                    <small>{result.category || "Business"}</small>
                  </span>
                </label>
                <p>{result.address || "No address returned"}</p>
                <div className="source-result-meta">
                  {result.phone && <span>{result.phone}</span>}
                  {result.website && (
                    <a href={result.website} target="_blank" rel="noreferrer">
                      Website <ExternalLink size={12} />
                    </a>
                  )}
                  {result.sourceUrl && (
                    <a href={result.sourceUrl} target="_blank" rel="noreferrer">
                      Source <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
