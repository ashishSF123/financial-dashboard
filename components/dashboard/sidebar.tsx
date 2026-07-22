"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme-context";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Briefcase,
  Shield,
  CreditCard,
  Target,
  CalendarDays,
  Goal,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  LineChart,
  Repeat,
  Sun,
  Moon,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Finance",
    items: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
      { id: "income", label: "Income", icon: <IndianRupee size={18} /> },
      { id: "daily-expenses", label: "Expenses", icon: <Receipt size={18} /> },
      { id: "budget", label: "Monthly Plan", icon: <Wallet size={18} /> },
    ],
  },
  {
    title: "Wealth",
    items: [
      { id: "portfolio", label: "Portfolio", icon: <Briefcase size={18} /> },
      { id: "insurance", label: "Insurance", icon: <Shield size={18} /> },
      { id: "net-worth", label: "Net Worth", icon: <LineChart size={18} /> },
    ],
  },
  {
    title: "Liability",
    items: [
      { id: "loans", label: "Loans & Debt", icon: <CreditCard size={18} /> },
      { id: "debt-plan", label: "Debt Strategy", icon: <Target size={18} /> },
    ],
  },
  {
    title: "Planning",
    items: [
      { id: "calendar", label: "Calendar", icon: <CalendarDays size={18} /> },
      { id: "goals", label: "Goals", icon: <Goal size={18} /> },
      { id: "subscriptions", label: "Subscriptions", icon: <Repeat size={18} /> },
      { id: "trends", label: "Trends", icon: <TrendingUp size={18} /> },
    ],
  },
  {
    title: "System",
    items: [
      { id: "settings", label: "Settings", icon: <Settings size={18} /> },
    ],
  },
];

interface Props {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export function Sidebar({ activeTab, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen z-[60] flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] transition-all duration-300 ${
          collapsed ? "w-16" : "w-[220px]"
        }`}
      >
        {/* Logo area */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-[var(--border-subtle)] ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-bg)] flex items-center justify-center shrink-0">
            <span className="text-[var(--accent)] font-bold text-sm">A</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[0.8rem] font-semibold text-[var(--text-heading)] truncate">Ashish Finance</p>
              <p className="text-[0.6rem] text-[var(--text-muted)]">Personal Dashboard</p>
            </div>
          )}
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 rounded-lg transition-all duration-150 ${
                        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
                      } ${
                        isActive
                          ? "bg-[var(--accent-bg)] text-[var(--text-heading)] border-l-2 border-[var(--accent)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border-l-2 border-transparent"
                      }`}
                    >
                      <span className={`shrink-0 transition-colors ${isActive ? "text-[var(--accent)]" : ""}`}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="text-[0.78rem] font-medium truncate">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Theme toggle + Collapse */}
        <div className="border-t border-[var(--border-subtle)] p-2 space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {!collapsed && <span className="text-[0.7rem] font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span className="text-[0.7rem] font-medium">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Spacer to push content */}
      <div className={`shrink-0 transition-all duration-300 ${collapsed ? "w-16" : "w-[220px]"}`} />
    </>
  );
}
