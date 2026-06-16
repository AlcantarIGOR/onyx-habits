"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, BookOpen, Zap, Compass } from "lucide-react";
import { motion } from "framer-motion";

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Hábitos", href: "/habits", icon: CalendarDays },
    { name: "Bitácora", href: "/journal", icon: BookOpen },
  ];

  return (
    <div className="flex min-h-screen bg-background-dark text-foreground">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-card-dark border-r border-border-dark z-20">
        {/* Header / Logo */}
        <div className="p-6 border-b border-border-dark flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-accent-blue bg-clip-text text-transparent">
              ONYX Habits
            </h1>
            <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider">
              Systems for Life
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                  isActive
                    ? "text-primary bg-primary/5"
                    : "text-text-muted hover:text-foreground hover:bg-border-dark/30"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`h-5 w-5 transition-transform group-hover:scale-105 ${isActive ? "text-primary" : "text-text-muted"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Brand */}
        <div className="p-6 border-t border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
            <span className="text-xs text-text-muted font-mono">FLOW ACTIVE</span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">v1.0.0</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header - Mobile & Desktop Info */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-dark bg-background-dark/80 backdrop-blur-md px-6 md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-bold bg-gradient-to-r from-primary to-accent-blue bg-clip-text text-transparent">
              ONYX Habits
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-text-muted">
            <Compass className="h-4 w-4 text-primary" />
            <span>« Pensar en sistemas, medir el progreso y optimizar. »</span>
          </div>
          <div className="flex items-center gap-3">
            {/* User Avatar Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card-dark border border-border-dark">
              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-background-dark">
                JA
              </div>
              <span className="text-xs font-medium hidden sm:inline">Juan Alcántar</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Bottom Nav Bar - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card-dark/95 backdrop-blur-lg border-t border-border-dark/80 flex items-center justify-around px-4 z-20">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full transition-all relative ${
                isActive ? "text-primary" : "text-text-muted"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-indicator-mobile"
                  className="absolute top-0 w-8 h-1 bg-primary rounded-b-full"
                />
              )}
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
