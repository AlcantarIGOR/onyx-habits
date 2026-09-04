"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ListTodo,
  Heart,
  CalendarDays,
  Shield,
  Timer,
  StickyNote,
  ClipboardList,
  Settings2,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  CalendarClock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NavigationProvider, useNavigation, Section } from "@/lib/navigation";

interface ShellProps {
  children: React.ReactNode;
}

// ─── Navigation structure ──────────────────────────────────
interface NavItem {
  key: Section;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Mi Día",
    items: [
      { key: "tasks",    label: "Tareas",      icon: ListTodo },
      { key: "schedule", label: "Cronograma",  icon: CalendarClock },
      { key: "habits",   label: "Hábitos",     icon: Heart },
      { key: "log",      label: "Registro",    icon: ClipboardList },
    ],
  },
  {
    title: "Agenda",
    items: [
      { key: "calendar", label: "Calendario", icon: CalendarDays },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { key: "focus",    label: "Enfoque",   icon: Timer },
      { key: "notes",    label: "Notas",     icon: StickyNote },
      { key: "sobriety", label: "Sobriedad", icon: Shield },
    ],
  },
];

interface PageLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PAGE_LINKS: PageLink[] = [
  { label: "Gestionar Hábitos", href: "/habits", icon: Settings2 },
  { label: "Bitácora", href: "/journal", icon: BookOpen },
];

// Bottom nav items for mobile (4 core tabs)
const MOBILE_NAV: NavItem[] = [
  { key: "tasks",    label: "Tareas",      icon: ListTodo },
  { key: "schedule", label: "Horario",     icon: CalendarClock },
  { key: "habits",   label: "Hábitos",     icon: Heart },
  { key: "focus",    label: "Enfoque",     icon: Timer },
];

// ─── Shell Content (uses context) ──────────────────────────
function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    activeSection,
    setActiveSection,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useNavigation();

  if (pathname?.startsWith("/login")) {
    return (
      <main id="main-content" className="min-h-screen bg-background-dark text-foreground">
        {children}
      </main>
    );
  }

  const isHomePage = pathname === "/";

  const handleSectionClick = React.useCallback((key: Section) => {
    setActiveSection(key);
    setMobileSidebarOpen(false);
    if (pathname !== "/") {
      router.push("/");
    }
  }, [pathname, router, setActiveSection, setMobileSidebarOpen]);

  // Desktop keyboard shortcuts (1: Tasks, 2: Schedule, 3: Habits, 4: Calendar, 5: Focus)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "1") handleSectionClick("tasks");
      if (e.key === "2") handleSectionClick("schedule");
      if (e.key === "3") handleSectionClick("habits");
      if (e.key === "4") handleSectionClick("calendar");
      if (e.key === "5") handleSectionClick("focus");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSectionClick]);

  // ─── Sidebar inner content (shared between desktop & mobile overlay)
  const sidebarContent = (
    <>
      {/* Header */}
      <div className={`flex items-center ${sidebarCollapsed ? "justify-center px-2" : "px-5"} py-5 gap-3`}>
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary text-sm font-bold">M</span>
        </div>
        {!sidebarCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-semibold text-sm text-foreground tracking-tight"
          >
            Mi Espacio
          </motion.span>
        )}
      </div>

      {/* Sections Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-text-muted/50 uppercase tracking-wider px-3 mb-2">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = isHomePage && activeSection === item.key;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSectionClick(item.key)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`relative flex items-center w-full ${
                      sidebarCollapsed ? "justify-center px-2" : "px-3 gap-3"
                    } py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "text-foreground"
                        : "text-text-muted hover:text-foreground/70 hover:bg-card-dark/50"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-card-dark rounded-xl"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Divider */}
        <div className={`border-t border-border-dark/30 ${sidebarCollapsed ? "mx-2" : "mx-3"}`} />

        {/* Page Links */}
        <div>
          {!sidebarCollapsed && (
            <p className="text-[10px] font-semibold text-text-muted/50 uppercase tracking-wider px-3 mb-2">
              Configurar
            </p>
          )}
          <div className="space-y-0.5">
            {PAGE_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={sidebarCollapsed ? link.label : undefined}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`relative flex items-center ${
                    sidebarCollapsed ? "justify-center px-2" : "px-3 gap-3"
                  } py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "text-foreground bg-card-dark"
                      : "text-text-muted hover:text-foreground/70 hover:bg-card-dark/50"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{link.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Toggle Button (desktop only) */}
      <div className={`hidden md:flex p-3 ${sidebarCollapsed ? "justify-center" : "justify-end"}`}>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 text-text-muted/50 hover:text-text-muted rounded-lg hover:bg-card-dark/50 transition cursor-pointer"
          aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Version */}
      {!sidebarCollapsed && (
        <div className="p-4 text-[10px] text-text-muted/30 font-mono">
          v3.0
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-background-dark text-foreground">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-background-dark focus:font-bold focus:rounded-lg"
      >
        Saltar al contenido principal
      </a>

      {/* ── Desktop Sidebar ────────────────────────────── */}
      <motion.aside
        aria-label="Navegación principal"
        className="hidden md:flex flex-col fixed inset-y-0 left-0 bg-background-dark border-r border-border-dark/50 z-20 overflow-hidden"
        animate={{ width: sidebarCollapsed ? 64 : 224 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {sidebarContent}
      </motion.aside>

      {/* ── Mobile Sidebar Overlay ────────────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            {/* Sidebar panel */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="md:hidden fixed inset-y-0 left-0 w-[280px] bg-background-dark border-r border-border-dark/70 z-50 flex flex-col pt-[env(safe-area-inset-top,8px)] pb-[env(safe-area-inset-bottom,8px)] shadow-2xl"
            >
              {/* Close button */}
              <div className="flex items-center justify-end p-3">
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-foreground active:scale-95 rounded-xl bg-card-dark border border-border-dark/60 transition cursor-pointer"
                  aria-label="Cerrar menú"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* Reuse sidebar content but force expanded for mobile */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center px-5 py-3 gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm font-bold">M</span>
                  </div>
                  <span className="font-semibold text-sm text-foreground tracking-tight">
                    Mi Espacio
                  </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto">
                  {NAV_GROUPS.map((group) => (
                    <div key={group.title}>
                      <p className="text-[10px] font-semibold text-text-muted/50 uppercase tracking-wider px-3 mb-2">
                        {group.title}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const isActive = isHomePage && activeSection === item.key;
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.key}
                              onClick={() => handleSectionClick(item.key)}
                              className={`relative flex items-center w-full px-3.5 gap-3 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                                isActive
                                  ? "text-foreground bg-card-dark border border-border-dark/60 shadow-sm"
                                  : "text-text-muted hover:text-foreground/70 hover:bg-card-dark/50"
                              }`}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-border-dark/30 mx-3" />

                  <div>
                    <p className="text-[10px] font-semibold text-text-muted/50 uppercase tracking-wider px-3 mb-2">
                      Configurar
                    </p>
                    <div className="space-y-1">
                      {PAGE_LINKS.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={`flex items-center px-3.5 gap-3 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                              isActive
                                ? "text-foreground bg-card-dark border border-border-dark/60 shadow-sm"
                                : "text-text-muted hover:text-foreground/70 hover:bg-card-dark/50"
                            }`}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span>{link.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? "md:pl-16" : "md:pl-56"
        }`}
      >

        {/* Top bar - mobile (Optimized for iPhone 15 touch ergonomics) */}
        <header className="md:hidden sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border-dark/60 bg-background-dark/95 backdrop-blur-xl px-4 pt-[env(safe-area-inset-top,0px)] shadow-md">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="w-11 h-11 flex items-center justify-center text-foreground hover:text-primary active:scale-90 rounded-2xl bg-card-dark border border-border-dark/70 transition-all cursor-pointer shadow-md"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
              <span className="text-primary text-xs font-black">M</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">Mi Espacio</span>
          </div>
          <div className="w-11" />
        </header>

        {/* Page Content */}
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 md:p-8 pb-20 sm:pb-24 md:pb-10 max-w-6xl mx-auto w-full"
        >
          {children}
        </main>
      </div>

      {/* ── Bottom Nav - Mobile (iPhone 15 Optimized) ──────────────────────── */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 pb-[env(safe-area-inset-bottom,8px)] bg-background-dark/95 backdrop-blur-xl border-t border-border-dark/60 flex items-center justify-around px-2 z-30 shadow-2xl"
      >
        {MOBILE_NAV.map((item) => {
          const isActive = isHomePage && activeSection === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => handleSectionClick(item.key)}
              className={`flex flex-col items-center justify-center py-1 flex-1 h-full transition-all cursor-pointer ${
                isActive ? "text-foreground font-semibold" : "text-text-muted hover:text-foreground"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? "bg-card-dark text-primary scale-110 shadow-sm" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Shell wrapper with provider ──────────────────────────
export default function Shell({ children }: ShellProps) {
  return (
    <NavigationProvider>
      <ShellContent>{children}</ShellContent>
    </NavigationProvider>
  );
}
