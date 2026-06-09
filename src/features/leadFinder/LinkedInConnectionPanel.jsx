import { ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
import LinkedInIcon from "../../components/icons/LinkedInIcon";
import { getLinkedInConnectUrl } from "../../services/integrationService";

export default function LinkedInConnectionPanel({
  linkedinProfile,
  linkedinQuery,
  linkedinReady,
}) {
  return (
    <section className="linkedin-connection-panel">
      <article className="linkedin-official-card">
        <div className="linkedin-brand-icon">
          <LinkedInIcon size={22} />
        </div>
        <div>
          <span className="eyebrow">Official LinkedIn connection</span>
          <h3>{linkedinProfile ? `Connected as ${linkedinProfile.name}` : "OpenID Connect"}</h3>
          <p>
            Official sign-in can read only the consenting member&apos;s own basic profile. General
            profile or lead search is not available through LinkedIn&apos;s open APIs.
          </p>
        </div>
        {linkedinReady ? (
          <a className="button button-secondary" href={getLinkedInConnectUrl()}>
            <ShieldCheck size={16} /> {linkedinProfile ? "Reconnect" : "Connect LinkedIn"}
          </a>
        ) : (
          <a
            className="button button-secondary"
            href="https://www.linkedin.com/developers/apps"
            target="_blank"
            rel="noreferrer"
          >
            <KeyRound size={16} /> Configure developer app
          </a>
        )}
      </article>
      <article className="linkedin-manual-card">
        <div>
          <span className="eyebrow">Manual prospecting</span>
          <h3>Search LinkedIn yourself</h3>
          <p>
            Open LinkedIn&apos;s normal search, review profiles yourself, then paste approved
            profile URLs into Qyrova.
          </p>
        </div>
        <a
          className="button button-primary"
          href={`https://www.linkedin.com/search/results/people/?${linkedinQuery}`}
          target="_blank"
          rel="noreferrer"
        >
          Open manual search <ExternalLink size={16} />
        </a>
      </article>
    </section>
  );
}
