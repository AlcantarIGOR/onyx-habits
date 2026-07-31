"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Inicio", href: "/", icon: LayoutDashboard },
    { name: "Hábitos", href: "/habits", icon: CalendarDays },
    { name: "Bitácora", href: "/journal", icon: BookOpen },
  ];

  if (pathname === "/login") {
    return <main className="min-h-screen bg-background-dark text-foreground">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-background-dark text-foreground">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-56 fixed inset-y-0 left-0 bg-background-dark border-r border-border-dark/50 z-20">
        {/* Header */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-sm font-bold">M</span>
          </div>
          <div>
            <h1 className="font-semibold text-sm text-foreground tracking-tight">
              Mi Espacio
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative ${
                  isActive
                    ? "text-foreground bg-card-dark"
                    : "text-text-muted hover:text-foreground/70 hover:bg-card-dark/50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-card-dark rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 text-[10px] text-text-muted font-mono">
          v2.0
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-56 flex flex-col min-h-screen">
        {/* Top bar - mobile */}
        <header className="md:hidden sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border-dark/50 bg-background-dark/90 backdrop-blur-md px-5">
          <span className="font-semibold text-sm text-foreground">Mi Espacio</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-10 pb-20 sm:pb-24 md:pb-10 max-w-3xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-background-dark/95 backdrop-blur-lg border-t border-border-dark/50 flex items-center justify-around px-4 z-20">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full transition-all ${
                isActive ? "text-foreground" : "text-text-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-medium mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
