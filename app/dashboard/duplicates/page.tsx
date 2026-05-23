"use client";

import React, { useState, useMemo } from "react";
import { useMockData } from "@/components/context/MockDataContext";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Check, 
  X, 
  Search, 
  SlidersHorizontal, 
  ArrowRightLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Building,
  ShieldAlert,
  Merge,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function DuplicatesPage() {
  const { duplicates, leads, resolveDuplicate } = useMockData();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Summary Metrics
  const metrics = useMemo(() => {
    const pending = duplicates.filter(d => d.status === "pending");
    const highRisk = pending.filter(d => d.risk === "high").length;
    const medRisk = pending.filter(d => d.risk === "medium").length;
    const resolved = duplicates.filter(d => d.status === "resolved").length;
    
    return {
      total: duplicates.length,
      pending: pending.length,
      highRisk,
      medRisk,
      resolved
    };
  }, [duplicates]);

  // Filter Duplicates
  const filteredDuplicates = useMemo(() => {
    return duplicates.filter(dup => {
      const leadMatch = dup.leadName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        dup.matchedLeadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        dup.phone.includes(searchQuery);
      
      const riskMatch = riskFilter === "all" || dup.risk === riskFilter;
      const statusMatch = statusFilter === "all" || 
                          (statusFilter === "pending" && dup.status === "pending") ||
                          (statusFilter === "resolved" && dup.status === "resolved");

      return leadMatch && riskMatch && statusMatch;
    });
  }, [duplicates, searchQuery, riskFilter, statusFilter]);

  const handleResolve = (id: string, action: "merge" | "ignore", dupName: string) => {
    resolveDuplicate(id, action);
    toast({
      title: action === "merge" ? "Duplicate Merged & Rejected" : "Duplicate Warning Ignored",
      description: action === "merge" 
        ? `Successfully merged ${dupName} and set status to rejected.`
        : `Allowed lead ${dupName} to proceed as pending.`,
      type: action === "merge" ? "success" : "info"
    });
  };

  const getRiskBadgeVariant = (risk: "high" | "medium" | "low") => {
    if (risk === "high") return "danger";
    if (risk === "medium") return "warning";
    return "info";
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Duplicate Detection</h2>
        <p className="text-xs text-slate-400 font-medium mt-1">Review potentially duplicate phone number submissions and execute resolution workflows.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">Pending Reviews</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.pending}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">High Risk Alerts</span>
              <p className="text-2xl font-bold text-rose-500">{metrics.highRisk}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">Medium Risk Alerts</span>
              <p className="text-2xl font-bold text-amber-500">{metrics.medRisk}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">Total Resolved</span>
              <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">{metrics.resolved}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Check className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="glass-card border-border-color">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search duplicates by lead name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border-color rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-color/30 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full sm:w-36 bg-background border border-border-color rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Risks</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-36 bg-background border border-border-color rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Action</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main List */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredDuplicates.length > 0 ? (
            filteredDuplicates.map((dup) => {
              const dupLead = leads.find(l => l.id === dup.leadId);
              const origLead = leads.find(l => l.id === dup.matchedLeadId);
              const formattedDate = new Date(dup.createdAt).toLocaleString();

              return (
                <motion.div
                  key={dup.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="overflow-hidden border-border-color relative">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/40 p-4 border-b border-border-color flex flex-row items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {dup.id}
                        </span>
                        <Badge variant={getRiskBadgeVariant(dup.risk)} className="text-[10px] uppercase font-extrabold">
                          {dup.risk} Risk Alert
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formattedDate}
                        </span>
                      </div>
                      
                      {dup.status === "resolved" ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                          <Check className="h-3.5 w-3.5" />
                          Resolved
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded-xl">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Action Required
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-stretch">
                        
                        {/* Left Side: New Duplicate Lead */}
                        <div className="lg:col-span-5 space-y-4">
                          <div className="flex items-center gap-2 border-b border-border-color/60 pb-2">
                            <div className="p-1 rounded-lg bg-purple-500/10 text-purple-500">
                              <ShieldAlert className="h-4 w-4" />
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-500">New Submission (Duplicate Flag)</h4>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                {dup.leadName}
                              </span>
                              <Link href={`/dashboard/leads/${dup.leadId}`} className="text-xs font-semibold text-primary-color hover:underline">
                                Inspect {dup.leadId}
                              </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-450">
                              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/20 p-2 rounded-lg border border-border-color/40">
                                <Phone className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                                <span className="font-semibold text-rose-600 dark:text-rose-400 select-all">{dup.phone}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/20 p-2 rounded-lg border border-border-color/40 truncate">
                                <Mail className="h-3.5 w-3.5 text-slate-450 flex-shrink-0" />
                                <span className="truncate" title={dupLead?.email}>{dupLead?.email || "No Email"}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-450">
                              <div className="flex items-center gap-1.5">
                                <Building className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                <span className="font-medium text-slate-700 dark:text-slate-350">{dupLead?.category}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                <span className="truncate text-slate-700 dark:text-slate-350" title={dupLead?.location}>{dupLead?.location}</span>
                              </div>
                            </div>

                            {dupLead?.description && (
                              <div className="text-xs bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-border-color/60 text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                "{dupLead.description}"
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle Action Vector */}
                        <div className="lg:col-span-1 flex flex-row lg:flex-col items-center justify-center gap-2 py-4 lg:py-0 border-t border-b lg:border-t-0 lg:border-b-0 border-border-color/50">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-border-color text-slate-400">
                            <ArrowRightLeft className="h-4 w-4 rotate-90 lg:rotate-0" />
                          </div>
                        </div>

                        {/* Right Side: Matched Original Lead */}
                        <div className="lg:col-span-5 space-y-4">
                          <div className="flex items-center gap-2 border-b border-border-color/60 pb-2">
                            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500">
                              <Check className="h-4 w-4" />
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500">Original Record (Matched Safe)</h4>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                {dup.matchedLeadName}
                              </span>
                              <Link href={`/dashboard/leads/${dup.matchedLeadId}`} className="text-xs font-semibold text-primary-color hover:underline">
                                Inspect {dup.matchedLeadId}
                              </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-450">
                              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/20 p-2 rounded-lg border border-border-color/40">
                                <Phone className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 select-all">{dup.phone}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/20 p-2 rounded-lg border border-border-color/40 truncate">
                                <Mail className="h-3.5 w-3.5 text-slate-450 flex-shrink-0" />
                                <span className="truncate" title={origLead?.email}>{origLead?.email || "No Email"}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-450">
                              <div className="flex items-center gap-1.5">
                                <Badge variant={origLead?.status === "allocated" ? "allocated" : origLead?.status === "duplicate" ? "duplicate" : origLead?.status === "rejected" ? "rejected" : "pending"} className="text-[10px] scale-95 font-bold">
                                  {origLead?.status || "Unknown Status"}
                                </Badge>
                                {origLead?.assignedProviderName && (
                                  <span className="text-[10px] text-slate-400 font-semibold truncate">
                                    → {origLead.assignedProviderName}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                <span className="truncate text-slate-700 dark:text-slate-350" title={origLead?.location}>{origLead?.location}</span>
                              </div>
                            </div>

                            {origLead?.description && (
                              <div className="text-xs bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-border-color/60 text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                "{origLead.description}"
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Lower Actions section */}
                      {dup.status === "pending" ? (
                        <div className="mt-6 pt-4 border-t border-border-color flex flex-col sm:flex-row gap-3 justify-end items-center">
                          <p className="text-xs text-slate-400 font-semibold text-center sm:text-left">
                            Compare data points and select the resolution action.
                          </p>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1 sm:flex-initial text-slate-600 dark:text-slate-300 font-semibold h-9 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                              onClick={() => handleResolve(dup.id, "ignore", dup.leadName)}
                            >
                              <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                              Ignore & Allow
                            </Button>
                            <Button 
                              variant="gradient" 
                              size="sm"
                              className="flex-1 sm:flex-initial font-bold h-9 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                              onClick={() => handleResolve(dup.id, "merge", dup.leadName)}
                            >
                              <Merge className="h-3.5 w-3.5 text-white" />
                              Merge & Reject
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6 pt-4 border-t border-border-color flex items-center gap-2 justify-end">
                          <span className="text-xs text-slate-400 font-semibold">
                            Outcome: {dupLead?.status === "rejected" ? (
                              <span className="text-rose-500 font-bold uppercase">Merged & Rejected</span>
                            ) : (
                              <span className="text-emerald-500 font-bold uppercase">Ignored & Mark Safe</span>
                            )}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-card-bg border border-border-color rounded-2xl p-8"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">No duplicates flagged</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All submissions have unique phone numbers. The system is operating cleanly.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
