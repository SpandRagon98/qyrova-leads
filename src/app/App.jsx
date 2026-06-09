import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import PageLoading from "../components/PageLoading";
import { INITIAL_DATA } from "../data/defaultData";
import { clearAppData } from "../services/storageService";
import { useAppData } from "../hooks/useAppData";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { findDuplicate } from "../utils/csvImport";
import { consumeLinkedInSession } from "../services/integrationService";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const LeadFinder = lazy(() => import("../pages/LeadFinder"));
const Leads = lazy(() => import("../pages/Leads"));
const LinkedIn = lazy(() => import("../pages/LinkedIn"));
const Campaigns = lazy(() => import("../pages/Campaigns"));
const Templates = lazy(() => import("../pages/Templates"));
const Outreach = lazy(() => import("../pages/Outreach"));
const ImportExport = lazy(() => import("../pages/ImportExport"));
const Settings = lazy(() => import("../pages/Settings"));
const LeadForm = lazy(() => import("../components/LeadForm"));

export default function App() {
  const {
    data,
    setData,
    leads,
    addLead,
    updateLead,
    deleteLeads,
    cloudSync,
  } = useAppData();
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [leadModal, setLeadModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || "");
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedinState = params.get("linkedin");
    const ticket = params.get("ticket");
    if (!linkedinState) return;
    window.history.replaceState({}, "", window.location.pathname);
    if (linkedinState === "connected" && ticket) {
      consumeLinkedInSession(ticket)
        .then(({ profile, limitation }) => {
          setData((current) => ({
            ...current,
            integrations: {
              ...(current.integrations || {}),
              linkedinProfile: profile,
            },
          }));
          notify(`LinkedIn connected as ${profile.name}. ${limitation}`);
        })
        .catch((error) => notify(error.message, "error"));
    } else {
      queueMicrotask(() =>
        notify("LinkedIn connection was not completed.", "error"),
      );
    }
  }, [notify, setData]);

  useEffect(() => {
    const handleKeydown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector(".global-search input")?.focus();
      }
      if (event.key === "Escape") {
        setLeadModal(null);
        setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const saveLead = (lead) => {
    if (lead.id) {
      updateLead(lead.id, lead);
      notify("Lead updated");
    } else {
      addLead(lead);
      notify("Lead added and scored");
    }
    setLeadModal(null);
  };

  const openOutreach = (lead) => {
    setSelectedLeadId(lead.id);
    setActivePage("outreach");
  };

  const confirmDelete = () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget.id];
    deleteLeads(ids);
    setDeleteTarget(null);
    notify(`${ids.length} lead${ids.length > 1 ? "s" : ""} deleted`);
  };

  const resetData = () => {
    clearAppData();
    setData(structuredClone(INITIAL_DATA));
    setResetOpen(false);
    setActivePage("dashboard");
    notify("Sample workspace restored");
  };

  const importLeads = (incomingLeads) => {
    let added = 0;
    let skipped = 0;
    const accepted = [];
    const comparisonSet = [...data.leads];
    incomingLeads.forEach((lead) => {
      if (findDuplicate(comparisonSet, lead)) {
        skipped += 1;
        return;
      }
      comparisonSet.push(lead);
      accepted.push(lead);
      added += 1;
    });
    setData((current) => {
      const next = [...current.leads];
      accepted.forEach((lead) => {
        if (!findDuplicate(next, lead)) next.unshift(lead);
      });
      return { ...current, leads: next };
    });
    return { added, skipped };
  };

  const navigate = (page) => setActivePage(page);
  const search = (value) => {
    setGlobalSearch(value);
    if (value.trim()) setActivePage("leads");
  };

  const page = {
    dashboard: (
      <Dashboard
        leads={leads}
        campaigns={data.campaigns}
        onNavigate={navigate}
        onEditLead={(lead) => setLeadModal(lead)}
      />
    ),
    finder: (
      <LeadFinder
        savedCriteria={data.leadBuilder}
        defaultCountry={data.settings.defaultCountry}
        onSave={(leadBuilder) => setData((current) => ({ ...current, leadBuilder }))}
        onImportLeads={importLeads}
        linkedinProfile={data.integrations?.linkedinProfile}
        onCreateLead={(criteria) =>
          setLeadModal({
            country: criteria.country,
            state: criteria.state,
            city: criteria.city,
            industry: criteria.industry,
            businessType: criteria.businessType,
            leadSource: criteria.leadSource,
            notes: criteria.notes,
            painPoint: criteria.painPoint,
          })
        }
        notify={notify}
      />
    ),
    leads: (
      <Leads
        leads={leads}
        globalSearch={globalSearch}
        onAdd={() => setLeadModal({})}
        onEdit={(lead) => setLeadModal(lead)}
        onDelete={(lead) => setDeleteTarget(lead)}
        onDeleteMany={(ids) => setDeleteTarget(ids)}
        onBulkStatus={(ids, status) =>
          setData((current) => ({
            ...current,
            leads: current.leads.map((lead) => (ids.includes(lead.id) ? { ...lead, status } : lead)),
          }))
        }
        onOpenOutreach={openOutreach}
        onNavigate={navigate}
        notify={notify}
      />
    ),
    linkedin: (
      <LinkedIn
        leads={leads}
        templates={data.templates}
        settings={data.settings}
        linkedinProfile={data.integrations?.linkedinProfile}
        selectedLeadId={selectedLeadId}
        setSelectedLeadId={setSelectedLeadId}
        updateLead={updateLead}
        notify={notify}
      />
    ),
    campaigns: (
      <Campaigns
        campaigns={data.campaigns}
        setCampaigns={(campaigns) => setData((current) => ({ ...current, campaigns }))}
        leads={leads}
        templates={data.templates}
        notify={notify}
      />
    ),
    templates: (
      <Templates
        templates={data.templates}
        setTemplates={(templates) => setData((current) => ({ ...current, templates }))}
        notify={notify}
      />
    ),
    outreach: (
      <Outreach
        leads={leads}
        templates={data.templates}
        settings={data.settings}
        selectedLeadId={selectedLeadId}
        setSelectedLeadId={setSelectedLeadId}
        updateLead={updateLead}
        notify={notify}
      />
    ),
    import: <ImportExport data={data} leads={leads} setData={setData} notify={notify} />,
    settings: (
      <Settings
        key={JSON.stringify(data.settings)}
        settings={data.settings}
        data={data}
        cloudSync={cloudSync}
        setData={setData}
        onSave={(settings) => setData((current) => ({ ...current, settings }))}
        onReset={() => setResetOpen(true)}
        notify={notify}
      />
    ),
  }[activePage];

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        cloudSync={cloudSync}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="app-main">
        <Header
          activePage={activePage}
          globalSearch={globalSearch}
          setGlobalSearch={search}
          onMenu={() => setSidebarOpen(true)}
          onAddLead={() => setLeadModal({})}
        />
        <main className="page-content">
          <Suspense fallback={<PageLoading />}>{page}</Suspense>
        </main>
      </div>

      <Modal
        open={leadModal !== null}
        title={leadModal?.id ? "Edit lead" : "Add a new lead"}
        description="Contact details and buying signals update the score automatically."
        onClose={() => setLeadModal(null)}
        wide
      >
        <Suspense fallback={<PageLoading />}>
          <LeadForm
            lead={leadModal?.id ? leadModal : leadModal || undefined}
            targetCountries={data.settings.targetCountries || []}
            onSubmit={saveLead}
            onCancel={() => setLeadModal(null)}
          />
        </Suspense>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete lead data?"
        message={`This will permanently remove ${Array.isArray(deleteTarget) ? `${deleteTarget.length} selected leads` : deleteTarget?.fullName || "this lead"} from this browser.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={resetOpen}
        title="Reset Qyrova Leads?"
        message="All local changes will be deleted and the original sample workspace will be restored. Export a backup first if you need your current data."
        confirmLabel="Reset app"
        danger
        onConfirm={resetData}
        onClose={() => setResetOpen(false)}
      />

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === "error" ? <CircleAlert size={19} /> : <CheckCircle2 size={19} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
