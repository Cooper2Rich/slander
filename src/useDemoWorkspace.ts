import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { DemoAccess, DemoOptions, Role, Workspace } from "./types";

export function useDemoWorkspace() {
  const [access, setAccess] = useState<DemoAccess>(() => {
    const saved = localStorage.getItem("slander-role");
    return {
      role:
        saved === "owner" || saved === "nonprofit"
          ? "nonprofit"
          : saved === "creator"
            ? saved
            : "admin",
      nonprofitId: null,
      creatorId: null,
    };
  });
  const [options, setOptions] = useState<DemoOptions>({
    nonprofits: [],
    creators: [],
  });
  const [loaded, setLoaded] = useState<{ key: string; data: Workspace } | null>(
    null,
  );
  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const key = `${access.role}:${access.nonprofitId || access.creatorId || ""}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const requestVersion = useRef(0);
  const needsSelection =
    access.role !== "admin" && !(access.nonprofitId || access.creatorId);
  const refresh = useCallback(async () => {
    if (needsSelection) return;
    const version = ++requestVersion.current;
    const data = await api<Workspace>("/workspace", access);
    if (currentKey.current !== key || version !== requestVersion.current)
      return;
    setLoaded({ key, data });
    setFailure(null);
  }, [access, key, needsSelection]);
  const loadOptions = useCallback(
    async () => setOptions(await api<DemoOptions>("/demo-options")),
    [],
  );
  const load = useCallback(() => {
    void Promise.all([loadOptions(), refresh()]).catch((e) =>
      setFailure({ key, message: e.message }),
    );
  }, [key, loadOptions, refresh]);
  useEffect(() => {
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [load]);
  const setRole = (role: Role) => {
    setAccess({ role, nonprofitId: null, creatorId: null });
    localStorage.setItem("slander-role", role === "nonprofit" ? "owner" : role);
  };
  const chooseIdentity = (id: string | null) =>
    setAccess((current) => ({
      ...current,
      nonprofitId: current.role === "nonprofit" ? id : null,
      creatorId: current.role === "creator" ? id : null,
    }));
  const identity =
    access.role === "nonprofit"
      ? options.nonprofits.find((n) => n.id === access.nonprofitId)
      : options.creators.find((c) => c.id === access.creatorId);
  return {
    access,
    role: access.role,
    setRole,
    chooseIdentity,
    identity: identity || null,
    options,
    needsSelection,
    workspace: loaded?.key === key && !needsSelection ? loaded.data : null,
    error: failure?.key === key ? failure.message : "",
    refresh,
    load,
    loadOptions,
    scopeKey: key,
  };
}
