"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Sun, Moon, Bell, Search, User, ChevronDown, Sparkles } from "lucide-react";
import { useTheme } from "@/components/context/ThemeContext";
import { useMockData } from "@/components/context/MockDataContext";

interface NavbarProps {
  setMobileOpen: (open: boolean) => void;
}

export function Navbar({ setMobileOpen }: NavbarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useMockData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Breadcrumb generation based on route path
  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Overview";
    
    // Capitalize first letters
    return segments
      .map((segment) => {
        if (segment === "dashboard") return "Dashboard";
        if (segment === "leads") return "Leads";
        if (segment === "providers") return "Providers";
        if (segment === "quotas") return "Quota Management";
        if (segment === "logs") return "Allocation Logs";
        if (segment === "duplicates") return "Duplicate Leads";
        if (segment === "testing") return "Admin Testing";
        if (segment === "reports") return "Reports & Analytics";
        if (segment === "settings") return "Settings";
        if (segment === "new") return "New Provider";
        return segment;
      })
      .join(" / ");
  };

  const notifications = [
    { id: "1", title: "New lead submitted", desc: "Rahul Sharma registered for Home Services", time: "10 mins ago" },
    { id: "2", title: "Quota limit alert", desc: "Provider Four reached 83% of monthly quota", time: "2 hrs ago" },
    { id: "3", title: "Duplicate warning", desc: "Anjali Mehta flagged as high risk duplicate", time: "4 hrs ago" },
  ];

  return (
    <header className="sticky top-0 z-20 h-16 w-full flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-md border-b border-border-color">
      {/* Breadcrumbs & Mobile Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm font-semibold text-primary-color flex items-center gap-1 bg-primary-color/10 px-2.5 py-1 rounded-full dark:bg-primary-color/20">
            <Sparkles className="h-3.5 w-3.5" />
            Admin Panel
          </span>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
          <h1 className="text-sm md:text-base font-semibold tracking-tight text-foreground/90 truncate max-w-[200px] sm:max-w-none">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Action items */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search bar */}
        <div className="relative hidden md:flex items-center w-56 lg:w-72">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, providers..."
            className="w-full pl-10 pr-4 py-2 border border-border-color rounded-xl bg-card-bg/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-color/40 focus:border-primary-color transition-all duration-200"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-border-color bg-card-bg/40 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all"
        >
          {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
        </button>

        {/* Notification Icon */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2.5 rounded-xl border border-border-color bg-card-bg/40 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-card-bg border border-border-color rounded-2xl shadow-xl z-40 overflow-hidden glass-card">
                <div className="p-4 border-b border-border-color/50 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                  <span className="text-sm font-bold text-foreground">Notifications</span>
                  <span className="text-[10px] font-bold text-primary-color bg-primary-color/10 px-2 py-0.5 rounded">3 New</span>
                </div>
                <div className="divide-y divide-border-color/50">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer">
                      <h4 className="text-xs font-bold text-foreground">{n.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-1">{n.time}</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-border-color/50 bg-slate-50 dark:bg-slate-800/30">
                  <button className="text-xs font-bold text-primary-color hover:underline cursor-pointer">
                    Clear all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl border border-border-color bg-card-bg/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="hidden lg:flex flex-col text-left pr-2">
              <span className="text-xs font-bold text-foreground">{currentUser?.name || "Administrator"}</span>
              <span className="text-[9px] font-semibold text-slate-400 leading-none">{currentUser?.email || "admin@leadflow.com"}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden lg:block" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-card-bg border border-border-color rounded-2xl shadow-xl z-40 overflow-hidden glass-card">
                <div className="p-3 border-b border-border-color/50 text-xs font-semibold text-slate-400">
                  Manage Account
                </div>
                <div className="p-1.5 space-y-1">
                  <a
                    href="/dashboard/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-foreground"
                  >
                    Profile Settings
                  </a>
                  <a
                    href="/dashboard/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-foreground"
                  >
                    Security Settings
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
