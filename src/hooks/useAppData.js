import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { INITIAL_DATA } from "../data/defaultData";
import { enrichLead } from "../utils/leadScoring";
import { loadAppData, saveAppData } from "../services/storageService";
import {
  loadCloudWorkspace,
  saveCloudWorkspace,
} from "../services/cloudSyncService";

function mergeWorkspace(fallback, saved) {
  if (!saved) return fallback;
  return {
    ...fallback,
    ...saved,
    settings: { ...fallback.settings, ...saved.settings },
    integrations: { ...fallback.integrations, ...saved.integrations },
  };
}

export function useAppData() {
  const [data, setDataState] = useState(() => loadAppData(INITIAL_DATA));
  const [cloudSync, setCloudSync] = useState({
    state: "checking",
    email: "",
    updatedAt: null,
    message: "Checking Cloudflare D1 availability...",
  });
  const cloudReady = useRef(false);
  const localDirty = useRef(false);
  const localRevision = useRef(0);
  const remoteUpdatedAt = useRef(null);

  const setData = useCallback((value) => {
    localDirty.current = true;
    localRevision.current += 1;
    setDataState(value);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => saveAppData(data), 150);
    return () => window.clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    loadCloudWorkspace()
      .then((response) => {
        if (cancelled) return;
        if (response.data) {
          setDataState((current) => mergeWorkspace(current, response.data));
        }
        cloudReady.current = true;
        localDirty.current = false;
        remoteUpdatedAt.current = response.updatedAt || null;
        setCloudSync({
          state: "ready",
          email: response.identity?.email || "",
          updatedAt: response.updatedAt,
          message: response.identity?.protectedByAccess
            ? "Cloud sync is protected by Cloudflare Access."
            : "Cloud sync is using the configured shared workspace.",
        });
      })
      .catch((error) => {
        if (cancelled) return;
        cloudReady.current = false;
        setCloudSync({
          state: "local",
          email: "",
          updatedAt: null,
          message:
            error.status === 401
              ? "Local storage is active. Configure Cloudflare Access to enable D1 sync."
              : "Local storage is active because the cloud API is unavailable.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cloudReady.current || !localDirty.current) return undefined;
    const revision = localRevision.current;
    const timer = window.setTimeout(() => {
      setCloudSync((current) => ({ ...current, state: "syncing" }));
      saveCloudWorkspace(data)
        .then((response) => {
          remoteUpdatedAt.current = response.updatedAt || null;
          if (localRevision.current === revision) localDirty.current = false;
          setCloudSync((current) => ({
            ...current,
            state: "ready",
            updatedAt: response.updatedAt,
          }));
        })
        .catch(() => {
          setCloudSync((current) => ({
            ...current,
            state: "error",
            message:
              "Cloud save failed. Your latest changes are still saved in this browser.",
          }));
        });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!cloudReady.current || localDirty.current) return;
      loadCloudWorkspace()
        .then((response) => {
          if (
            !response.data ||
            !response.updatedAt ||
            response.updatedAt === remoteUpdatedAt.current
          ) {
            return;
          }
          remoteUpdatedAt.current = response.updatedAt;
          setDataState((current) => mergeWorkspace(current, response.data));
          setCloudSync((current) => ({
            ...current,
            state: "ready",
            updatedAt: response.updatedAt,
            message: "Cloud workspace updated from an external integration.",
          }));
        })
        .catch(() => undefined);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, []);

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
    cloudSync,
  };
}
