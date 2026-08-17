import { createContext, useContext, useEffect, useState } from "react";
import type { ChildSummary } from "@kampus/shared-types";
import { useAuth } from "./auth-context";
import { api } from "./api";

interface ChildContextValue {
  children: ChildSummary[];
  activeChild: ChildSummary | null;
  activeChildId: string | null;
  setActiveChildId: (id: string) => void;
  refresh: () => void;
}

const ChildContext = createContext<ChildContextValue | null>(null);

export function ChildProvider({ children: node }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [list, setList] = useState<ChildSummary[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  function refresh() {
    if (!user) return;
    api.students.children().then((r) => {
      setList(r);
      if (!activeChildId && r[0]) setActiveChildId(r[0].id);
    });
  }

  useEffect(refresh, [user]);

  const activeChild = list.find((c) => c.id === activeChildId) ?? list[0] ?? null;

  return (
    <ChildContext.Provider value={{ children: list, activeChild, activeChildId: activeChild?.id ?? null, setActiveChildId, refresh }}>
      {node}
    </ChildContext.Provider>
  );
}

export function useChildren() {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error("useChildren must be used within ChildProvider");
  return ctx;
}
