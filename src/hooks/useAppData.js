import { useEffect, useMemo, useState } from "react";
import { INITIAL_DATA } from "../data/defaultData";
import { enrichLead } from "../utils/leadScoring";
import { loadAppData, saveAppData } from "../services/storageService";

export function useAppData() {
  const [data, setData] = useState(() => loadAppData(INITIAL_DATA));

  useEffect(() => {
    const timer = window.setTimeout(() => saveAppData(data), 150);
    return () => window.clearTimeout(timer);
  }, [data]);

  const leads = useMemo(
    () => data.leads.map((lead) => enrichLead(lead, data.settings.targetCountries || [])),
    [data.leads, data.settings.targetCountries],
  );

  const addLead = (lead) => {
    const fullName = lead.fullName || `${lead.firstName || ""} ${lead.lastName || ""}`.trim();
    setData((current) => ({
      ...current,
      leads: [
        {
          ...lead,
          id: crypto.randomUUID(),
          fullName,
          status: lead.status || "New",
          createdAt: new Date().toISOString(),
          lastContacted: lead.lastContacted || "",
          followUpDate: lead.followUpDate || "",
        },
        ...current.leads,
      ],
    }));
  };

  const updateLead = (id, updates) => {
    setData((current) => ({
      ...current,
      leads: current.leads.map((lead) => {
        if (lead.id !== id) return lead;
        const next = { ...lead, ...updates };
        if (!updates.fullName && (updates.firstName !== undefined || updates.lastName !== undefined)) {
          next.fullName = `${next.firstName || ""} ${next.lastName || ""}`.trim();
        }
        return next;
      }),
    }));
  };

  const deleteLeads = (ids) => {
    const idSet = new Set(ids);
    setData((current) => ({
      ...current,
      leads: current.leads.filter((lead) => !idSet.has(lead.id)),
      campaigns: current.campaigns.map((campaign) => ({
        ...campaign,
        leadIds: campaign.leadIds.filter((id) => !idSet.has(id)),
      })),
    }));
  };

  return {
    data,
    setData,
    leads,
    addLead,
    updateLead,
    deleteLeads,
  };
}
