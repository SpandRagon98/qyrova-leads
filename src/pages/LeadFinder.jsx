import { Target } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import IcpTemplateGrid from "../features/leadFinder/IcpTemplateGrid";
import LeadSourcePanel from "../features/leadFinder/LeadSourcePanel";
import LinkedInConnectionPanel from "../features/leadFinder/LinkedInConnectionPanel";
import TargetingBrief from "../features/leadFinder/TargetingBrief";
import {
  blankCriteria,
  sourceDefinitions,
  sourceLocation,
} from "../features/leadFinder/config";
import { getIntegrationStatus, searchLeadSource } from "../services/integrationService";
import { parseGoogleMapsExport, sourceResultToLead } from "../utils/mapsImport";

export default function LeadFinder({
  savedCriteria,
  defaultCountry,
  onSave,
  onCreateLead,
  onImportLeads,
  linkedinProfile,
  notify,
}) {
  const [criteria, setCriteria] = useState({
    ...blankCriteria,
    country: defaultCountry || "",
    ...savedCriteria,
  });
  const [selectedTemplate, setSelectedTemplate] = useState(savedCriteria?.templateId || "");
  const [provider, setProvider] = useState("google");
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [results, setResults] = useState([]);
  const [selectedResults, setSelectedResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [includeContactDetails, setIncludeContactDetails] = useState(false);
  const mapsInput = useRef(null);

  useEffect(() => {
    getIntegrationStatus()
      .then((nextStatus) => {
        setStatus(nextStatus);
        const firstConfigured = sourceDefinitions.find(
          (source) => nextStatus[source.id]?.configured,
        );
        if (firstConfigured) setProvider(firstConfigured.id);
      })
      .catch(() => {
        setStatusError("Start the integration server to enable live provider searches.");
      });
  }, []);

  const selectedSource = sourceDefinitions.find((source) => source.id === provider);
  const linkedinQuery = useMemo(
    () =>
      new URLSearchParams({
        keywords: [criteria.keyword || criteria.industry, sourceLocation(criteria)]
          .filter(Boolean)
          .join(" "),
      }).toString(),
    [criteria],
  );

  const updateCriteria = (field, value) => {
    setCriteria((current) => ({ ...current, [field]: value }));
  };

  const applyTemplate = (template) => {
    setSelectedTemplate(template.id);
    setCriteria((current) => ({
      ...current,
      targetSegment: template.segment,
      industry: template.industry,
      businessType: template.businessType,
      keyword: template.keywords,
      painPoint: template.painPoint,
    }));
    notify(`${template.name} profile applied`);
  };

  const runSearch = async () => {
    const query = criteria.keyword || criteria.industry || criteria.targetSegment;
    const location = sourceLocation(criteria);
    if (!query || !location) {
      notify("Add a keyword and at least one location field before searching.", "error");
      return;
    }

    setSearching(true);
    setResults([]);
    setSelectedResults([]);
    try {
      const response = await searchLeadSource(provider, {
        query,
        location,
        limit: 12,
        includeContactDetails: provider === "google" && includeContactDetails,
      });
      setResults(response.results);
      setSelectedResults(response.results.map((result) => result.providerId));
      notify(
        `${response.results.length} ${selectedSource.name} result${
          response.results.length === 1 ? "" : "s"
        } found`,
      );
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSearching(false);
    }
  };

  const importSelected = () => {
    const leads = results
      .filter((result) => selectedResults.includes(result.providerId))
      .map((result) => sourceResultToLead(result, criteria));
    const { added, skipped } = onImportLeads(leads);
    notify(`${added} leads imported${skipped ? `, ${skipped} duplicates skipped` : ""}`);
    setResults([]);
    setSelectedResults([]);
  };

  const importMapsFile = async (file) => {
    if (!file) return;
    try {
      const leads = await parseGoogleMapsExport(file);
      const { added, skipped } = onImportLeads(leads);
      notify(
        `${added} Google Maps leads imported${skipped ? `, ${skipped} duplicates skipped` : ""}`,
      );
    } catch (error) {
      notify(error.message, "error");
    } finally {
      if (mapsInput.current) mapsInput.current.value = "";
    }
  };

  const toggleResult = (value) => {
    if (Array.isArray(value)) {
      setSelectedResults(value);
      return;
    }
    setSelectedResults((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const clearCriteria = () => {
    setCriteria({ ...blankCriteria, country: defaultCountry || "" });
    setSelectedTemplate("");
  };

  const saveCriteria = () => {
    onSave({ ...criteria, templateId: selectedTemplate });
    notify("Target profile saved locally");
  };

  return (
    <div className="page-stack">
      <section className="finder-hero">
        <div className="finder-hero-copy">
          <span className="eyebrow eyebrow-light">Connected lead discovery</span>
          <h2>Find businesses without crossing the line.</h2>
          <p>
            Search approved place and directory APIs, import your own Maps exports, and keep
            LinkedIn outreach deliberately manual.
          </p>
        </div>
        <div className="finder-orbit">
          <div className="orbit-ring orbit-one" />
          <div className="orbit-ring orbit-two" />
          <Target size={34} />
          <span className="orbit-chip chip-one">Places</span>
          <span className="orbit-chip chip-two">Directories</span>
          <span className="orbit-chip chip-three">Imports</span>
        </div>
      </section>

      <LeadSourcePanel
        criteria={criteria}
        includeContactDetails={includeContactDetails}
        mapsInput={mapsInput}
        onImportMapsFile={importMapsFile}
        onImportSelected={importSelected}
        onProviderChange={(nextProvider) => {
          setProvider(nextProvider);
          setResults([]);
        }}
        onRunSearch={runSearch}
        onToggleContactDetails={setIncludeContactDetails}
        onToggleResult={toggleResult}
        provider={provider}
        results={results}
        searching={searching}
        selectedResults={selectedResults}
        selectedSource={selectedSource}
        status={status}
        statusError={statusError}
        updateCriteria={updateCriteria}
      />

      <LinkedInConnectionPanel
        linkedinProfile={linkedinProfile}
        linkedinQuery={linkedinQuery}
        linkedinReady={Boolean(status?.linkedin?.configured)}
      />

      <IcpTemplateGrid onApply={applyTemplate} selectedTemplate={selectedTemplate} />

      <TargetingBrief
        criteria={criteria}
        onAddLead={() => onCreateLead(criteria)}
        onClear={clearCriteria}
        onSave={saveCriteria}
        updateCriteria={updateCriteria}
      />
    </div>
  );
}
