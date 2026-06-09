import { Building2, Globe2, MapPinned, Search } from "lucide-react";

export const blankCriteria = {
  country: "",
  state: "",
  city: "",
  targetSegment: "",
  industry: "",
  businessType: "",
  keyword: "",
  companySize: "",
  leadSource: "",
  notes: "",
  painPoint: "",
};

export const sourceDefinitions = [
  {
    id: "google",
    name: "Google Places",
    description: "Search public business listings by service and location.",
    icon: MapPinned,
    note: "API key, billing, and quota controls required",
  },
  {
    id: "openstreetmap",
    name: "OpenStreetMap",
    description: "Run small, user-triggered place searches with attribution.",
    icon: Globe2,
    note: "Free public service, strict fair-use limits",
  },
  {
    id: "yelp",
    name: "Yelp",
    description: "Find reviewed local service businesses through the official API.",
    icon: Building2,
    note: "Official API key required",
  },
  {
    id: "directory",
    name: "Public directory",
    description: "Connect an owner-approved JSON business directory API.",
    icon: Search,
    note: "Configured through the local server environment",
  },
];

export function sourceLocation(criteria) {
  return [criteria.city, criteria.state, criteria.country].filter(Boolean).join(", ");
}
