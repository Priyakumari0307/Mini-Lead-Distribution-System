"use client";

import React, { useState, useMemo } from "react";
import { useMockData, Provider, Lead } from "@/components/context/MockDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Building2, ShieldAlert, Sparkles, Star, Phone, Mail, MapPin, ClipboardCheck, ArrowRight } from "lucide-react";

export default function ProviderPortalPage() {
  const { providers, leads } = useMockData();
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");

  // Auto-select the first provider if none selected
  React.useEffect(() => {
    if (providers.length > 0 && !selectedProviderId) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, selectedProviderId]);

  // Find currently selected provider
  const currentProvider = useMemo(() => {
    return providers.find(p => p.id === selectedProviderId) || null;
  }, [providers, selectedProviderId]);

  // Filter leads assigned to selected provider
  const assignedLeads = useMemo(() => {
    if (!selectedProviderId) return [];
    return leads.filter(l => l.providerIds && l.providerIds.includes(selectedProviderId));
  }, [leads, selectedProviderId]);

  const remainingQuota = currentProvider ? Math.max(0, currentProvider.monthlyQuota - currentProvider.quotaUsed) : 0;
  const utilizationRate = currentProvider && currentProvider.monthlyQuota > 0 
    ? Math.round((currentProvider.quotaUsed / currentProvider.monthlyQuota) * 100) 
    : 0;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header with Provider Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-500" />
            Provider Portal
          </h2>
          <p className="text-xs text-slate-400 font-medium">Select a partner provider to inspect their quota, matching assignments, and incoming leads.</p>
        </div>

        {/* Dropdown Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 whitespace-nowrap">VIEWING AS:</label>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="bg-card-bg text-foreground border border-border-color rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-color/40"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentProvider ? (
        <>
          {/* Key Stats Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Quota Progress */}
            <Card className="glass-card">
              <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quota Utilization</span>
                  <Badge variant={utilizationRate >= 80 ? "danger" : "success"} className="text-[9px] uppercase">
                    {utilizationRate}% Used
                  </Badge>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">{currentProvider.quotaUsed} of {currentProvider.monthlyQuota} leads allocated</span>
                    <span className="text-foreground">{remainingQuota} left</span>
                  </div>
                  <Progress value={currentProvider.quotaUsed} max={currentProvider.monthlyQuota} />
                </div>
              </CardContent>
            </Card>

            {/* Total Leads */}
            <Card className="glass-card">
              <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads Assigned</span>
                <div className="mt-4 flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-foreground">{assignedLeads.length}</p>
                  <span className="text-xs text-slate-400 font-semibold">leads received total</span>
                </div>
              </CardContent>
            </Card>

            {/* Provider Details */}
            <Card className="glass-card">
              <CardContent className="p-5 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Partner Profile</span>
                <div className="text-xs font-semibold space-y-1 text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{currentProvider.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{currentProvider.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>Rating: 4.8 / 5.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* List of Leads */}
          <div className="space-y-3">
            <div className="px-1 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Assigned Service Leads</h3>
                <p className="text-xs text-slate-400 font-medium">Real-time listing of customer queries assigned to this provider.</p>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead ID / Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Received Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedLeads.length > 0 ? (
                  assignedLeads.map((l) => (
                    <TableRow key={l.id} className="hover:bg-slate-55 dark:hover:bg-slate-900/10">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700 dark:text-slate-350">
                            #{(l as any).leadNumber || l.id.substring(0, 8)}
                          </span>
                          <span className="text-[10px] text-slate-450 font-mono mt-0.5">{l.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-300">{l.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" /> {l.phone}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" /> {l.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral" className="text-[10px]">
                          {l.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {l.location}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {l.description}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-400">
                        {new Date(l.createdAt).toLocaleDateString()} {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-450 font-bold">
                      No leads allocated to this provider yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-card-bg rounded-2xl border border-border-color">
          <p className="text-sm text-slate-400 font-semibold">No providers found in system database.</p>
        </div>
      )}

    </div>
  );
}
