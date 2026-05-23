"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Calendar, ClipboardList, Filter, ArrowUpRight, CheckCircle, RefreshCw } from "lucide-react";
import { useMockData } from "@/components/context/MockDataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LogsPage() {
  const { logs, providers } = useMockData();

  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // 1. Prepare provider choices for dropdown filter
  const providerOptions = useMemo(() => {
    const list = providers.map((p) => ({ value: p.id, label: p.name }));
    return [{ value: "all", label: "All Providers" }, ...list];
  }, [providers]);

  // 2. Filter logs list
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.leadId.toLowerCase().includes(search.toLowerCase()) ||
        log.leadName.toLowerCase().includes(search.toLowerCase()) ||
        (log.providerName && log.providerName.toLowerCase().includes(search.toLowerCase())) ||
        log.reason.toLowerCase().includes(search.toLowerCase());

      const matchesProvider =
        providerFilter === "all" || log.providerId === providerFilter;

      const matchesType = typeFilter === "all" || log.type === typeFilter;

      return matchesSearch && matchesProvider && matchesType;
    });
  }, [logs, search, providerFilter, typeFilter]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page header title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Allocation Logs</h2>
          <p className="text-xs text-slate-400 font-medium">Verify execution logs from matching rule algorithms.</p>
        </div>
      </div>

      {/* Filters Card panel */}
      <Card className="glass-card">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs by lead, customer, provider, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border-color rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-color/30 transition-all"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto flex-col sm:flex-row">
            <Select
              options={providerOptions}
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="sm:w-48 border-border-color py-2"
            />
            <Select
              options={[
                { value: "all", label: "All Types" },
                { value: "system", label: "Automated System" },
                { value: "manual", label: "Manual Adjust" }
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="sm:w-44 border-border-color py-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline List layout */}
      <div className="relative max-w-4xl mx-auto py-4">
        
        {/* Vertical Track Line */}
        <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />

        {filteredLogs.length > 0 ? (
          <div className="space-y-8">
            {filteredLogs.map((log, index) => {
              const date = new Date(log.timestamp);
              
              return (
                <div key={log.id} className="relative pl-10 sm:pl-16 group">
                  
                  {/* Timeline node point */}
                  <div className={`absolute left-2.5 sm:left-4.5 top-1.5 w-3.5 h-3.5 rounded-full border bg-card-bg transition-all duration-200 z-10 ${
                    log.type === "system"
                      ? "border-blue-500 ring-4 ring-blue-500/10"
                      : "border-amber-500 ring-4 ring-amber-500/10"
                  }`} />

                  {/* Log Content Card */}
                  <Card className="hover:border-border-color/100 transition-all duration-250 border-border-color/85">
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Log core details */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {log.id}
                          </span>
                          <span className="text-slate-400 font-semibold">•</span>
                          <span className="text-slate-400 font-semibold flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {date.toLocaleDateString()} {date.toLocaleTimeString()}
                          </span>
                          <span className="text-slate-400 font-semibold">•</span>
                          <Badge variant={log.type === "system" ? "info" : "warning"} className="scale-90 font-bold">
                            {log.type === "system" ? "System Auto" : "Manual override"}
                          </Badge>
                        </div>

                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                          Lead{" "}
                          <span className="font-extrabold text-foreground">
                            {log.leadName}
                          </span>{" "}
                          was distributed and allocated to partner{" "}
                          <span className="font-extrabold text-foreground">
                            {log.providerName}
                          </span>.
                        </p>

                        <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-border-color/60 text-slate-500 dark:text-slate-400 font-medium">
                          <span className="font-bold text-slate-450 uppercase tracking-wider text-[9px] flex-shrink-0">Rule description:</span>
                          <span className="truncate">{log.reason}</span>
                        </div>
                      </div>

                      {/* Right Link Button */}
                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                        <Link href={`/dashboard/leads/${log.leadId}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 rounded-xl text-xs font-bold border-border-color flex items-center gap-1.5 cursor-pointer hover:bg-slate-50"
                          >
                            Inspect Lead
                            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                          </Button>
                        </Link>
                      </div>

                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 font-semibold bg-card-bg border border-border-color rounded-2xl p-6">
            No matching execution logs found.
          </div>
        )}
      </div>

    </div>
  );
}
