"use client";

import React, { useState, useMemo } from "react";
import { Star, ShieldAlert, Edit, PieChart as ChartIcon, Sparkles } from "lucide-react";
import { useMockData, Provider } from "@/components/context/MockDataContext";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { BarChart, PieChart } from "@/components/ui/charts";

export default function QuotasPage() {
  const { providers, updateProvider } = useMockData();
  const { toast } = useToast();

  // Modal State
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [newQuotaLimit, setNewQuotaLimit] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  // 1. Calculate KPI widgets
  const quotaKPIs = useMemo(() => {
    const totalQuota = providers.reduce((acc, p) => acc + p.monthlyQuota, 0);
    const totalUsed = providers.reduce((acc, p) => acc + p.quotaUsed, 0);
    const utilizationRate = totalQuota > 0 ? Math.round((totalUsed / totalQuota) * 100) : 0;
    
    // Providers with usage >= 80%
    const thresholdCount = providers.filter((p) => p.quotaUsed >= p.monthlyQuota * 0.8 && p.active).length;

    return { totalQuota, totalUsed, utilizationRate, thresholdCount };
  }, [providers]);

  // 2. Prepare charts data
  const quotaBarData = useMemo(() => {
    return providers.map((p) => ({
      name: p.name,
      value: p.quotaUsed
    }));
  }, [providers]);

  const categoryQuotaData = useMemo(() => {
    const categories = ["Service 1", "Service 2", "Service 3"];
    const colors = ["#3b82f6", "#a855f7", "#f59e0b"];

    return categories.map((cat, idx) => {
      const quota = providers
        .filter((p) =>
          p.category
            .split(",")
            .map((c) => c.trim())
            .includes(cat)
        )
        .reduce((acc, p) => acc + p.monthlyQuota, 0);
      return {
        name: cat,
        value: quota,
        color: colors[idx]
      };
    });
  }, [providers]);

  // 3. Edit Quota Limit Handlers
  const openEditDialog = (provider: Provider) => {
    setSelectedProvider(provider);
    setNewQuotaLimit(provider.monthlyQuota.toString());
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !newQuotaLimit.trim()) return;

    const quotaVal = Number(newQuotaLimit);
    if (isNaN(quotaVal) || quotaVal <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid positive number for the quota.",
        type: "error"
      });
      return;
    }

    if (quotaVal < selectedProvider.quotaUsed) {
      toast({
        title: "Quota Reduction Warn",
        description: `New limit (${quotaVal}) is below currently used quota (${selectedProvider.quotaUsed}). Adjusting limits will apply.`,
        type: "error"
      });
    }

    updateProvider({
      ...selectedProvider,
      monthlyQuota: quotaVal
    });

    toast({
      title: "Quota Adjusted",
      description: `Monthly quota for ${selectedProvider.name} set to ${quotaVal}.`,
      type: "success"
    });

    setIsEditOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Title header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Quota Management</h2>
        <p className="text-xs text-slate-400 font-medium">Verify system allocation capacities and prevent distribution halts.</p>
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Pool Capacity</span>
            <p className="text-xl sm:text-2xl font-extrabold text-foreground">{quotaKPIs.totalQuota}</p>
            <span className="text-[10px] text-slate-400 font-semibold mt-1">leads per month limit</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Pool Used</span>
            <p className="text-xl sm:text-2xl font-extrabold text-foreground">{quotaKPIs.totalUsed}</p>
            <span className="text-[10px] text-slate-400 font-semibold mt-1">allocated leads in period</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Global Utilization</span>
            <p className="text-xl sm:text-2xl font-extrabold text-foreground">{quotaKPIs.utilizationRate}%</p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${quotaKPIs.utilizationRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Near Critical Limit</span>
            <p className="text-xl sm:text-2xl font-extrabold text-rose-500">{quotaKPIs.thresholdCount}</p>
            <span className="text-[10px] text-slate-400 font-semibold mt-1">partners above 80% usage</span>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8">
          <CardHeader className="pb-3 flex flex-row justify-between items-center space-y-0">
            <div>
              <CardTitle className="text-base">Quota Consumption Analytics</CardTitle>
              <CardDescription>Provider ranking based on allocated distribution volume.</CardDescription>
            </div>
            <ChartIcon className="h-4.5 w-4.5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <BarChart data={quotaBarData} color="#4f46e5" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quota Limits by Sector</CardTitle>
            <CardDescription>Aggregate category distribution pool capacities.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[200px]">
            {quotaKPIs.totalQuota > 0 ? (
              <PieChart data={categoryQuotaData} />
            ) : (
              <div className="text-xs text-slate-400 font-bold">No active quotas.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quota Usage Table */}
      <div className="space-y-3">
        <div className="px-1">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Partner Quota Utilization</h3>
          <p className="text-xs text-slate-400 font-medium">Detailed tracking list showing limit margins and trigger warnings.</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider Partner</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Utilization</TableHead>
              <TableHead className="text-center">Limit Margin</TableHead>
              <TableHead>Status Badge</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.length > 0 ? (
              providers.map((p) => {
                const utilRate = p.monthlyQuota > 0 ? Math.round((p.quotaUsed / p.monthlyQuota) * 100) : 0;
                const isNearing = p.quotaUsed >= p.monthlyQuota * 0.85;

                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-450 font-bold mt-0.5">{p.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" className="text-[10px]">
                        {p.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[200px] sm:w-[250px]">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400">{p.quotaUsed} of {p.monthlyQuota} used</span>
                          <span className="text-foreground">{utilRate}%</span>
                        </div>
                        <Progress value={p.quotaUsed} max={p.monthlyQuota} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-700 dark:text-slate-350 text-sm">
                      {Math.max(0, p.monthlyQuota - p.quotaUsed)}
                    </TableCell>
                    <TableCell>
                      {isNearing && p.active ? (
                        <Badge variant="danger" className="text-[9px] uppercase tracking-wider animate-pulse">
                          Critical limit
                        </Badge>
                      ) : p.active ? (
                        <Badge variant="success" className="text-[9px] uppercase tracking-wider">
                          Healthy
                        </Badge>
                      ) : (
                        <Badge variant="rejected" className="text-[9px] uppercase tracking-wider">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(p)}
                        className="h-8.5 px-3 rounded-xl text-xs font-bold border-border-color cursor-pointer text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 ml-auto"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit Limit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-slate-405 font-bold">
                  No partners registered in system.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Quota Limit Modal Dialog */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Adjust Partner Quota Limit"
        maxWidth="sm"
      >
        {selectedProvider && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="p-3 border border-border-color bg-slate-50 dark:bg-slate-900/30 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Provider Partner</span>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Partner name:</span>
                <span className="text-foreground">{selectedProvider.name}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Current quota used:</span>
                <span className="text-indigo-500">{selectedProvider.quotaUsed} allocations used</span>
              </div>
            </div>

            <Input
              name="newQuotaLimit"
              type="number"
              label="New Monthly Quota Limit *"
              value={newQuotaLimit}
              onChange={(e) => setNewQuotaLimit(e.target.value)}
              placeholder="e.g. 150"
              required
            />

            <div className="flex items-start gap-2 p-2.5 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] text-blue-400 font-semibold leading-normal">
              <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span>Limits are updated instantly. High volume capacity settings ensure smooth system routing.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" variant="gradient" className="rounded-xl cursor-pointer font-bold">
                Apply Adjustments
              </Button>
            </div>
          </form>
        )}
      </Dialog>

    </div>
  );
}
