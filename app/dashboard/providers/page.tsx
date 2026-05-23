"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, Building2, UserCheck, Star, ShieldAlert, Award, ArrowUpRight } from "lucide-react";
import { useMockData, Provider } from "@/components/context/MockDataContext";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ProvidersPage() {
  const { providers, toggleProviderActive } = useMockData();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "Service 1", label: "Service 1" },
    { value: "Service 2", label: "Service 2" },
    { value: "Service 3", label: "Service 3" }
  ];

  // 1. Calculate provider KPIs
  const providerStats = useMemo(() => {
    const total = providers.length;
    const active = providers.filter((p) => p.active).length;
    const totalAllocations = providers.reduce((acc, p) => acc + p.quotaUsed, 0);
    const avgRating =
      providers.length > 0
        ? (providers.reduce((acc, p) => acc + p.rating, 0) / providers.length).toFixed(1)
        : "5.0";

    return { total, active, totalAllocations, avgRating };
  }, [providers]);

  // 2. Filter list
  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search);

      const matchesCategory =
        categoryFilter === "all" ||
        p.category
          .split(",")
          .map((c) => c.trim())
          .includes(categoryFilter);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.active) ||
        (statusFilter === "inactive" && !p.active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [providers, search, categoryFilter, statusFilter]);

  const handleToggleActive = (id: string, name: string, currentlyActive: boolean) => {
    toggleProviderActive(id);
    toast({
      title: currentlyActive ? "Provider Deactivated" : "Provider Activated",
      description: `${name} is now ${currentlyActive ? "inactive" : "active"} and ${
        currentlyActive ? "will not" : "will"
      } receive auto-allocations.`,
      type: "info"
    });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Provider Partners</h2>
          <p className="text-xs text-slate-400 font-medium">Manage availability status, review client satisfaction, and adjust monthly quotas.</p>
        </div>
        <Link href="/dashboard/providers/new">
          <Button variant="gradient" size="sm" className="rounded-xl font-bold cursor-pointer flex items-center gap-1.5 self-start">
            <Plus className="h-4.5 w-4.5" />
            Add Provider
          </Button>
        </Link>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Partners</span>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground">{providerStats.total}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-500 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Partners</span>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground">{providerStats.active}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Distributions</span>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground">{providerStats.totalAllocations}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Rating</span>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground">{providerStats.avgRating} <span className="text-xs text-slate-400 font-bold">★</span></p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="glass-card">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search providers by name, contact, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border-color rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-color/30 transition-all"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto flex-col sm:flex-row">
            <Select
              options={categories}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="sm:w-44 border-border-color py-2"
            />
            <Select
              options={[
                { value: "all", label: "All Statuses" },
                { value: "active", label: "Active Only" },
                { value: "inactive", label: "Inactive Only" }
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-44 border-border-color py-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.length > 0 ? (
          filteredProviders.map((p) => {
            const isQuotaNearingLimit = p.quotaUsed >= p.monthlyQuota * 0.85;
            const remainingQuota = Math.max(0, p.monthlyQuota - p.quotaUsed);

            return (
              <Card key={p.id} className="hover:shadow-md transition-all duration-200 border-border-color/80 relative">
                {/* Visual Accent Bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${
                    p.active ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-slate-400"
                  }`}
                />

                <CardContent className="p-6 space-y-5 pt-7">
                  
                  {/* Title and Category */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 dark:text-white truncate max-w-[150px] sm:max-w-none text-base">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                        <span>{p.id}</span>
                        <span>•</span>
                        <Badge variant="neutral" className="text-[9px] px-1.5 py-0">
                          {p.category}
                        </Badge>
                      </div>
                    </div>

                    {/* Active Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-450 uppercase hidden xs:inline">
                        {p.active ? "Active" : "Inactive"}
                      </span>
                      <button
                        onClick={() => handleToggleActive(p.id, p.name, p.active)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                          p.active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            p.active ? "translate-x-4.5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Quota Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Quota Used</span>
                      <span className="font-bold text-foreground">
                        {p.quotaUsed} / {p.monthlyQuota}
                      </span>
                    </div>
                    <Progress value={p.quotaUsed} max={p.monthlyQuota} />

                    <div className="flex justify-between items-center text-[10px] sm:text-xs pt-1">
                      <span className="text-slate-400 font-medium">Remaining Quota:</span>
                      <span className={`font-bold ${isQuotaNearingLimit ? "text-rose-500" : "text-slate-700 dark:text-slate-300"}`}>
                        {remainingQuota} remaining
                      </span>
                    </div>
                  </div>

                  {/* Rating & allocation counts */}
                  <div className="grid grid-cols-2 gap-4 border-t border-b border-border-color/50 py-3 text-xs font-semibold">
                    <div className="flex flex-col items-center justify-center border-r border-border-color/50 py-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Rating</span>
                      <span className="flex items-center gap-1 font-bold text-foreground text-sm">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        {p.rating}
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Allocations</span>
                      <span className="font-bold text-foreground text-sm">
                        {p.quotaUsed}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info details */}
                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <div className="flex justify-between">
                      <span>Contact:</span>
                      <span className="text-foreground font-semibold">{p.contactPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="text-foreground">{p.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="text-foreground truncate max-w-[130px] sm:max-w-none">{p.email}</span>
                    </div>
                  </div>

                  {/* Warnings for low remaining quota */}
                  {isQuotaNearingLimit && p.active && (
                    <div className="flex items-center gap-1.5 p-2.5 bg-rose-950/20 border border-rose-900/30 rounded-xl text-[10px] text-rose-450 font-semibold leading-normal">
                      <ShieldAlert className="h-4 w-4 text-rose-500 flex-shrink-0" />
                      <span>Quota critical limit! Provider nearing allocation threshold.</span>
                    </div>
                  )}

                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-slate-400 font-semibold">
            No matching provider partners registered.
          </div>
        )}
      </div>

    </div>
  );
}
