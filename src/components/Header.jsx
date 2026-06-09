import { Bell, Menu, Plus, Search } from "lucide-react";

const pageDetails = {
  dashboard: ["Dashboard", "A clear view of your prospecting pipeline."],
  finder: ["Lead Finder", "Define and save your ideal customer profile."],
  leads: ["Lead Sheet", "Organize, score, and manage every prospect."],
  linkedin: ["LinkedIn Assistant", "Connect officially and manage manual LinkedIn outreach."],
  campaigns: ["Campaigns", "Plan outreach and track progress manually."],
  templates: ["Message Templates", "Build reusable, personalized outreach drafts."],
  outreach: ["Outreach Assistant", "Prepare compliant LinkedIn and email outreach."],
  import: ["Import & Export", "Move lead data in and out with confidence."],
  settings: ["Settings", "Personalize Qyrova Leads and manage local data."],
};

export default function Header({
  activePage,
  globalSearch,
  setGlobalSearch,
  onMenu,
  onAddLead,
}) {
  const [title, subtitle] = pageDetails[activePage] || pageDetails.dashboard;
  return (
    <header className="topbar">
      <div className="topbar-title-wrap">
        <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation">
          <Menu size={21} />
        </button>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="topbar-actions">
        <label className="global-search">
          <Search size={17} />
          <input
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Search leads..."
          />
          <kbd>⌘ K</kbd>
        </label>
        <button className="icon-button notification-button" aria-label="Notifications">
          <Bell size={19} />
          <span />
        </button>
        <button className="button button-primary top-add-button" onClick={onAddLead}>
          <Plus size={17} />
          Add lead
        </button>
      </div>
    </header>
  );
}
