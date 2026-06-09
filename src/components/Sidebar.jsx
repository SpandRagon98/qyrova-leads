import {
  BarChart3,
  FileUp,
  LayoutDashboard,
  Mail,
  Megaphone,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import LinkedInIcon from "./icons/LinkedInIcon";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "finder", label: "Lead Finder", icon: Search },
  { id: "leads", label: "Leads", icon: Users },
  { id: "linkedin", label: "LinkedIn", icon: LinkedInIcon },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "templates", label: "Templates", icon: Sparkles },
  { id: "outreach", label: "Outreach", icon: Mail },
  { id: "import", label: "Import / Export", icon: FileUp },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
  return (
    <>
      {isOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark">
            <BarChart3 size={20} strokeWidth={2.4} />
          </div>
          <div>
            <div className="brand-name">Qyrova</div>
            <div className="brand-subtitle">LEADS</div>
          </div>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={19} />
          </button>
        </div>

        <nav className="nav-list">
          <div className="nav-eyebrow">Workspace</div>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${activePage === id ? "nav-item-active" : ""}`}
              onClick={() => {
                onNavigate(id);
                onClose();
              }}
            >
              <Icon size={18} strokeWidth={1.9} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="compliance-mini">
            <div className="compliance-dot" />
            <div>
              <strong>Manual outreach only</strong>
              <span>No scraping or auto-sending.</span>
            </div>
          </div>
          <div className="user-chip">
            <div className="avatar">QT</div>
            <div>
              <strong>Qyrova Team</strong>
              <span>Local workspace</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
