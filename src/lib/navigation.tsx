"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Section = "tasks" | "habits" | "calendar" | "sobriety" | "focus" | "notes" | "log" | "schedule";

interface NavigationContextType {
  activeSection: Section;
  setActiveSection: (s: Section) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  activeSection: "tasks",
  setActiveSection: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  mobileSidebarOpen: false,
  setMobileSidebarOpen: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<Section>("tasks");
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Persist sidebar collapsed state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setSidebarCollapsedState(true);
  }, []);

  const setSidebarCollapsed = (v: boolean) => {
    setSidebarCollapsedState(v);
    localStorage.setItem("sidebar-collapsed", String(v));
  };

  return (
    <NavigationContext.Provider
      value={{
        activeSection,
        setActiveSection,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
