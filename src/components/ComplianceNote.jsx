import { ShieldCheck } from "lucide-react";

export default function ComplianceNote() {
  return (
    <div className="compliance-note">
      <ShieldCheck size={21} />
      <div>
        <strong>Built for compliant prospecting</strong>
        <p>
          Qyrova Leads does not scrape LinkedIn or automate LinkedIn messaging. Organize leads,
          generate personalized drafts, and manage outreach manually.
        </p>
      </div>
    </div>
  );
}
