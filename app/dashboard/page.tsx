"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  ArrowUpRight,
  TrendingUp,
  Activity,
  ArrowRight
} from "lucide-react";
import { useMockData } from "@/components/context/MockDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, PieChart, BarChart } from "@/components/ui/charts";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function DashboardOverview() {
  const { leads, providers, logs } = useMockData();

  // 1. Calculate Stats
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const allocatedLeads = leads.filter((l) => l.status === "allocated").length;
    const pendingLeads = leads.filter((l) => l.status === "pending").length;
    const duplicateLeads = leads.filter((l) => l.status === "duplicate").length;
    const activeProviders = providers.filter((p) => p.active).length;

    return {
      total: totalLeads,
      allocated: allocatedLeads,
      pending: pendingLeads,
      duplicate: duplicateLeads,
      activeProviders
    };
  }, [leads, providers]);

  // 2. Prepare Category Chart Data
  const categoryChartData = useMemo(() => {
    const categories = ["Service 1", "Service 2", "Service 3"];
    const colors = ["#3b82f6", "#a855f7", "#f59e0b"];

    return categories.map((cat, idx) => {
      const count = leads.filter((l) => l.category === cat).length;
      return {
        name: cat,
        value: count,
        color: colors[idx]
      };
    });
  }, [leads]);

  // 3. Prepare Provider Bar Chart Data (Top 5 Providers by allocations)
  const providerChartData = useMemo(() => {
    return [...providers]
      .sort((a, b) => b.quotaUsed - a.quotaUsed)
      .slice(0, 5)
      .map((p) => ({
        name: p.name,
        value: p.quotaUsed
      }));
  }, [providers]);

  // 4. Prepare Trend Data (Dynamic based on current state)
  const trendData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    // Distribute current lead values across days
    return days.map((day, idx) => {
      const factor = (idx + 1) / 7;
      return {
        label: day,
        values: [
          Math.max(2, Math.round(stats.total * factor)),
          Math.max(1, Math.round(stats.allocated * factor)),
          Math.max(0, Math.round(stats.pending * (1 - factor * 0.4)))
        ]
      };
    });
  }, [stats]);

  // 5. Recent Leads (Top 5)
  const recentLeads = useMemo(() => {
    return leads.slice(0, 5);
  }, [leads]);

  // 6. Recent Logs (Top 4)
  const recentLogs = useMemo(() => {
    return logs.slice(0, 4);
  }, [logs]);

  // Animations configuration
  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className="space-y-6 md:space-y-8 font-sans">
      
      {/* Realtime Live Engine Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card-bg/60 border border-border-color/85 p-4 rounded-2xl glass-card">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              Live Allocation Engine Online
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-0.5">
              Distributing service requests in real-time. Automated rule matching enabled.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Quick mock trigger from dashboard
              window.location.href = "/dashboard/testing";
            }}
            className="rounded-xl text-xs font-bold border-border-color cursor-pointer"
          >
            Trigger Allocations
          </Button>
        </div>
      </div>

      {/* 5 Stats Widgets Row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* Total Leads */}
        <motion.div variants={cardVariants}>
          <Card className="hover:border-blue-500/30 transition-colors">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads</span>
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {stats.total}
                </span>
                <span className="text-[10px] text-green-500 font-bold flex items-center gap-0.5 mt-1">
                  <TrendingUp className="h-3 w-3" /> +12% this month
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Allocated Leads */}
        <motion.div variants={cardVariants}>
          <Card className="hover:border-emerald-500/30 transition-colors">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Allocated Leads</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {stats.allocated}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">
                  {stats.total > 0 ? Math.round((stats.allocated / stats.total) * 100) : 0}% success rate
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Leads */}
        <motion.div variants={cardVariants}>
          <Card className="hover:border-amber-500/30 transition-colors">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Leads</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {stats.pending}
                </span>
                <span className="text-[10px] text-amber-500 font-bold mt-1">
                  Action required
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Duplicate Leads */}
        <motion.div variants={cardVariants}>
          <Card className="hover:border-purple-500/30 transition-colors">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duplicate Leads</span>
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {stats.duplicate}
                </span>
                <span className="text-[10px] text-purple-500 font-bold mt-1">
                  Screening caught
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Providers */}
        <motion.div variants={cardVariants} className="col-span-2 lg:col-span-1">
          <Card className="hover:border-purple-500/30 transition-colors">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Providers</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Building className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {stats.activeProviders}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">
                  of {providers.length} registered
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend line chart */}
        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
            <div>
              <CardTitle>Leads Overview Trend</CardTitle>
              <CardDescription>Visual comparison of total submissions, allocations, and pendings.</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-indigo-500 hidden sm:block" />
          </CardHeader>
          <CardContent>
            <LineChart data={trendData} />
          </CardContent>
        </Card>

        {/* Category donut chart */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2 border-b-0">
            <CardTitle>Leads by Category</CardTitle>
            <CardDescription>Lead submissions broken down by service type.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-full min-h-[220px]">
            {stats.total > 0 ? (
              <PieChart data={categoryChartData} />
            ) : (
              <div className="text-xs text-slate-400 font-bold">No data available. Submit a lead to view.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Split details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent leads table */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Recent Leads</h3>
              <p className="text-xs text-slate-400 font-medium">Quick view of the most recent service requests.</p>
            </div>
            <Link href="/dashboard/leads" className="text-xs font-bold text-primary-color hover:underline flex items-center gap-1">
              View all leads <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Assigned Provider</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLeads.length > 0 ? (
                recentLeads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-bold text-slate-800 dark:text-slate-200">{l.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{l.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{l.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" className="text-[10px]">
                        {l.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.status}>{l.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-slate-600 dark:text-slate-400 font-semibold">
                      {l.assignedProviderName || (
                        <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/leads/${l.id}`}>
                        <Button variant="outline" size="sm" className="h-8 px-2.5 rounded-lg text-xs font-bold border-border-color cursor-pointer">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-slate-400 font-semibold">
                    No leads captured. Submit one from the home page.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Top providers & Logs columns */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Top providers list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top Providers</CardTitle>
              <CardDescription>Ranked by successful lead distributions.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <BarChart data={providerChartData} color="#6366f1" />
            </CardContent>
          </Card>

          {/* Live Activity Feed */}
          <Card>
            <CardHeader className="pb-3 flex flex-row justify-between items-center space-y-0">
              <div>
                <CardTitle className="text-base">Allocation Logs</CardTitle>
                <CardDescription>Live updates from matching rules.</CardDescription>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 text-xs items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 flex flex-col gap-0.5">
                        <p className="text-slate-600 dark:text-slate-350 font-medium">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {log.leadName}
                          </span>{" "}
                          allocated to{" "}
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {log.providerName}
                          </span>
                        </p>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {new Date(log.timestamp).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <Badge variant={log.type === "system" ? "info" : "warning"} className="text-[9px] px-1 py-0 scale-95">
                        {log.type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-xs text-slate-400 py-4 font-semibold">
                    No activities registered yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
