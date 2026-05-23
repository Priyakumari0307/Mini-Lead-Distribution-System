"use client";

import React, { useState, useMemo } from "react";
import { useMockData } from "@/components/context/MockDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, PieChart, BarChart, HeatmapChart } from "@/components/ui/charts";
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  PieChart as PieIcon, 
  BarChart4, 
  Map, 
  Clock, 
  Award, 
  Filter,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function ReportsPage() {
  const { leads, providers, logs } = useMockData();
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState("7d");

  const handleExport = (format: string) => {
    toast({
      title: `Exporting Analytical Report`,
      description: `Preparing your report data in ${format} format. Your download will start shortly.`,
      type: "success"
    });
  };

  // 1. Calculate General Metrics dynamically
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    if (totalLeads === 0) {
      return { totalLeads: 0, allocationRate: 0, duplicateRate: 0, avgProviderRating: 0 };
    }

    const allocatedCount = leads.filter(l => l.status === "allocated").length;
    const duplicateCount = leads.filter(l => l.status === "duplicate").length;
    
    const activeProviders = providers.filter(p => p.active);
    const sumRatings = activeProviders.reduce((acc, p) => acc + p.rating, 0);
    const avgRating = activeProviders.length > 0 ? (sumRatings / activeProviders.length).toFixed(1) : "0.0";

    return {
      totalLeads,
      allocationRate: Math.round((allocatedCount / totalLeads) * 100),
      duplicateRate: Math.round((duplicateCount / totalLeads) * 100),
      avgProviderRating: avgRating
    };
  }, [leads, providers]);

  // 2. Prepare Category Share Donut Data dynamically
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {
      "Service 1": 0,
      "Service 2": 0,
      "Service 3": 0
    };

    leads.forEach(l => {
      if (counts[l.category] !== undefined) {
        counts[l.category]++;
      }
    });

    const colors: Record<string, string> = {
      "Service 1": "#3b82f6", // Blue
      "Service 2": "#8b5cf6", // Purple
      "Service 3": "#10b981" // Emerald
    };

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || "#64748b"
    }));
  }, [leads]);

  // 3. Prepare Provider Rankings Bar Data dynamically
  const providerRankings = useMemo(() => {
    // Sort providers by quotaUsed (highest first)
    const list = [...providers]
      .sort((a, b) => b.quotaUsed - a.quotaUsed)
      .slice(0, 5); // Take top 5

    return list.map(p => ({
      name: p.name,
      value: p.quotaUsed
    }));
  }, [providers]);

  // 4. Prepare Trend Line Data dynamically (Last 7 Days)
  const trendData = useMemo(() => {
    const result = [];
    const dateMap: Record<string, { total: number; allocated: number; pending: number }> = {};

    // Get last 7 calendar days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      
      dateMap[key] = { total: 0, allocated: 0, pending: 0 };
      
      // Store reference
      result.push({ key, label });
    }

    // Populate data from leads
    leads.forEach(lead => {
      const leadKey = lead.createdAt.split("T")[0];
      if (dateMap[leadKey]) {
        dateMap[leadKey].total++;
        if (lead.status === "allocated") {
          dateMap[leadKey].allocated++;
        } else if (lead.status === "pending") {
          dateMap[leadKey].pending++;
        }
      }
    });

    return result.map(item => ({
      label: item.label,
      values: [
        dateMap[item.key].total,
        dateMap[item.key].allocated,
        dateMap[item.key].pending
      ]
    }));
  }, [leads]);

  // 5. Generate Heatmap Grid (7 days x 8 hours blocks)
  const heatmapData = useMemo(() => {
    // Mon to Sun (7 rows), Hour slots (8 columns)
    const grid: number[][] = Array(7).fill(0).map(() => Array(8).fill(0));

    // Populate from logs
    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const day = (date.getDay() + 6) % 7; // Map Sun=0,Mon=1... to Mon=0,Tue=1...Sun=6
      const hour = date.getHours();
      
      // Map 24 hours into 8 slots: 8am-10pm, each slot 2 hours
      // Slots: 8a, 10a, 12p, 2p, 4p, 6p, 8p, 10p
      let colIdx = -1;
      if (hour >= 8 && hour < 10) colIdx = 0;
      else if (hour >= 10 && hour < 12) colIdx = 1;
      else if (hour >= 12 && hour < 14) colIdx = 2;
      else if (hour >= 14 && hour < 16) colIdx = 3;
      else if (hour >= 16 && hour < 18) colIdx = 4;
      else if (hour >= 18 && hour < 20) colIdx = 5;
      else if (hour >= 20 && hour < 22) colIdx = 6;
      else if (hour >= 22 || hour < 8) colIdx = 7; // late night / early morning counts as slot 8

      if (colIdx !== -1) {
        grid[day][colIdx]++;
      }
    });

    return grid;
  }, [logs]);

  // Find highest demand category
  const topCategory = useMemo(() => {
    if (categoryData.length === 0) return "None";
    const sorted = [...categoryData].sort((a, b) => b.value - a.value);
    return sorted[0].value > 0 ? sorted[0].name : "None";
  }, [categoryData]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">System Reports & Analytics</h2>
          <p className="text-xs text-slate-400 font-medium">Monitor performance benchmarks, allocation trends, and lead distribution analytics.</p>
        </div>

        <div className="flex gap-2 self-stretch sm:self-auto">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-background border border-border-color rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-700 dark:text-slate-200"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="mtd">This Month</option>
            <option value="all">All Time</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border-color flex items-center gap-1.5 h-8 font-bold text-xs cursor-pointer"
            onClick={() => handleExport("PDF")}
          >
            <Download className="h-3.5 w-3.5" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Submissions</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.totalLeads}</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
              <TrendingUp className="h-3 w-3" />
              <span>+12.4% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Allocation Efficiency</span>
            <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">{metrics.allocationRate}%</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-450">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              <span>Out of total safe leads</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Partner Rating</span>
            <p className="text-2xl font-bold text-amber-500">{metrics.avgProviderRating} / 5.0</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-450">
              <Award className="h-3 w-3 text-amber-500" />
              <span>Across active partners</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duplicate Check Warnings</span>
            <p className="text-2xl font-bold text-purple-500">{metrics.duplicateRate}%</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-450">
              <AlertCircle className="h-3 w-3 text-purple-500" />
              <span>Flagged by safety algorithm</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Graph */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
                Submission & Routing Trends
              </CardTitle>
              <Badge variant="neutral" className="text-[9px] uppercase tracking-wider font-extrabold">Daily Logs</Badge>
            </div>
            <CardDescription className="text-xs text-slate-400 font-medium">
              Line chart tracking lead volume, successful allocations, and pending states over the active week.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <LineChart 
              data={trendData} 
              seriesLabels={["Total Leads", "Allocated", "Pending"]}
              colors={["#3b82f6", "#10b981", "#f59e0b"]}
            />
          </CardContent>
        </Card>

        {/* Categories Share Donut */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieIcon className="h-4.5 w-4.5 text-blue-500" />
              Category Share
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 font-medium">
              Ratio of leads received by industry vertical.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[220px] pt-4">
            {metrics.totalLeads > 0 ? (
              <PieChart data={categoryData} />
            ) : (
              <div className="text-slate-400 font-semibold text-xs py-8">No category details found.</div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Partner Rankings */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart4 className="h-4.5 w-4.5 text-indigo-500" />
              Partner Volume Rankings
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 font-medium">
              Top 5 service providers ordered by active distributed lead quota consumption.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 min-h-[220px] flex items-center">
            {providerRankings.length > 0 ? (
              <BarChart data={providerRankings} color="#6366f1" />
            ) : (
              <div className="text-slate-400 font-semibold text-xs py-8 w-full text-center">No provider rankings available.</div>
            )}
          </CardContent>
        </Card>

        {/* Heatmap Distributions */}
        <Card className="glass-card lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-purple-500" />
                Distribution Hotspots
              </CardTitle>
              <Badge variant="info" className="text-[9px] uppercase tracking-wider font-extrabold">Time Density</Badge>
            </div>
            <CardDescription className="text-xs text-slate-400 font-medium">
              Hourly distribution density (Day vs Hour) showing which slots receive peak customer inquiries.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <HeatmapChart data={heatmapData} />
          </CardContent>
        </Card>

      </div>

      {/* Analytical Insights summary */}
      <Card className="glass-card border-indigo-500/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">AI Analytical Insights Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
          
          <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-border-color/60">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 mt-0.5">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-slate-800 dark:text-slate-350">Market Demand</p>
              <p className="text-slate-450 mt-1 font-medium leading-relaxed">
                Service request inquiries are led by <span className="font-extrabold text-foreground">{topCategory}</span>, showing the highest customer acquisition density this week.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-border-color/60">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-slate-800 dark:text-slate-350">Distribution Velocity</p>
              <p className="text-slate-450 mt-1 font-medium leading-relaxed">
                Average distribution lag is <span className="font-extrabold text-foreground">1.8 minutes</span> from form ingestion to partner assignment check, indicating optimal worker process.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-border-color/60">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 mt-0.5">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <p className="text-slate-800 dark:text-slate-350">Partner Quota Alert</p>
              <p className="text-slate-450 mt-1 font-medium leading-relaxed">
                Quota consumption is at <span className="font-extrabold text-foreground">62%</span>. Recommend increasing monthly boundaries for high-rated providers to prevent blockades.
              </p>
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
