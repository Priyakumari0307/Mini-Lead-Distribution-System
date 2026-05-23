"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Building2,
  PieChart,
  ClipboardList,
  Copy,
  BarChart3,
  FlaskConical,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen = false, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", path: "/dashboard/leads", icon: Users },
    { name: "Providers", path: "/dashboard/providers", icon: Building2 },
    { name: "Quota Management", path: "/dashboard/quotas", icon: PieChart },
    { name: "Provider Portal", path: "/dashboard/provider", icon: Building2 },
    { name: "Allocation Logs", path: "/dashboard/logs", icon: ClipboardList },
    { name: "Duplicate Leads", path: "/dashboard/duplicates", icon: Copy },
    { name: "Reports", path: "/dashboard/reports", icon: BarChart3 },
    { name: "Admin Testing", path: "/dashboard/testing", icon: FlaskConical },
    { name: "Simulation Tools", path: "/test-tools", icon: FlaskConical },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
    // Navigate back to login
    router.push("/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            P
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-base font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            >
              LeadFlow
            </motion.span>
          )}
        </Link>

        {/* Collapse arrow (Desktop only) */}
        {setMobileOpen === undefined && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
          </button>
        )}
      </div>

      {/* Menu Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white shadow-md shadow-indigo-950/40"
                  : "hover:bg-slate-800/60 hover:text-slate-100 text-slate-400"
              }`}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-100"}`} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="truncate"
                >
                  {item.name}
                </motion.span>
              )}

              {/* Tooltip on collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-950 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-xl border border-slate-800">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-red-950/20 hover:text-red-400 text-slate-400 w-full transition-all group relative cursor-pointer"
        >
          <LogOut className="h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-red-400" />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              Sign Out
            </motion.span>
          )}

          {collapsed && (
            <div className="absolute left-full ml-4 px-2 py-1 bg-red-950 text-red-300 text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-xl border border-red-900/30">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside
        className={`hidden md:block h-screen fixed top-0 left-0 z-30 transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible on mobile menu toggle) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen && setMobileOpen(false)}
          />
          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-64 h-full z-50 flex flex-col"
          >
            {sidebarContent}
          </motion.div>
        </div>
      )}
    </>
  );
}
