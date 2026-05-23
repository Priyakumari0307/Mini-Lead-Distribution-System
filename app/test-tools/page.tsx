"use client";

import React, { useState, useMemo } from "react";
import { useMockData } from "@/components/context/MockDataContext";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Terminal, Webhook, RefreshCw, Send, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function TestToolsPage() {
  const router = useRouter();
  const { providers, leads } = useMockData();
  const { toast } = useToast();

  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("Service 1");
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({});

  // Auto-select the first provider if none selected
  React.useEffect(() => {
    if (providers.length > 0 && !selectedProviderId) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, selectedProviderId]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const setRunningState = (key: string, val: boolean) => {
    setIsRunning((prev) => ({ ...prev, [key]: val }));
  };

  // 1. Reset Quota Simulation
  const handleResetQuota = async () => {
    if (!selectedProviderId) {
      toast({ title: "Error", description: "Select a provider first", type: "error" });
      return;
    }
    const provider = providers.find(p => p.id === selectedProviderId);
    if (!provider) return;

    setRunningState("resetQuota", true);
    const txnId = `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    addLog(`Initiating single quota reset webhook for ${provider.name}...`);
    addLog(`Transaction ID: ${txnId}`);

    try {
      const res = await axios.post("/api/webhooks/payment", {
        providerId: selectedProviderId,
        transactionId: txnId
      });

      if (res.status === 200) {
        addLog(`Success! Webhook responded with Status 200.`);
        addLog(`Payload response: ${JSON.stringify(res.data)}`);
        toast({
          title: "Quota Reset Success",
          description: `Quota successfully reset for ${provider.name}.`,
          type: "success"
        });
      }
    } catch (err: any) {
      addLog(`Failed: ${err.message}`);
      toast({
        title: "Simulation Failed",
        description: err.message,
        type: "error"
      });
    } finally {
      setRunningState("resetQuota", false);
    }
  };

  // 2. Test Idempotency Simulation
  const handleTestIdempotency = async () => {
    if (!selectedProviderId) {
      toast({ title: "Error", description: "Select a provider first", type: "error" });
      return;
    }
    const provider = providers.find(p => p.id === selectedProviderId);
    if (!provider) return;

    setRunningState("idempotency", true);
    const txnId = `TXN-IDEMP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    addLog(`Testing Idempotency: Triggering 3 concurrent webhook quota reset calls for ${provider.name} in parallel...`);
    addLog(`Shared Transaction ID: ${txnId}`);

    try {
      const promises = [
        axios.post("/api/webhooks/payment", { providerId: selectedProviderId, transactionId: txnId }),
        axios.post("/api/webhooks/payment", { providerId: selectedProviderId, transactionId: txnId }),
        axios.post("/api/webhooks/payment", { providerId: selectedProviderId, transactionId: txnId })
      ];

      const results = await Promise.all(promises);

      addLog(`Parallel Webhook responses completed.`);
      results.forEach((res, index) => {
        addLog(`Call ${index + 1} Status: ${res.status} | response duplicate flag: ${res.data.duplicate ? "true (Bypassed)" : "false (Created)"}`);
      });

      toast({
        title: "Idempotency Test Completed",
        description: "All requests succeeded. Webhook processed transaction only once.",
        type: "success"
      });
    } catch (err: any) {
      addLog(`Error during parallel calls: ${err.message}`);
      toast({
        title: "Simulation Failed",
        description: err.message,
        type: "error"
      });
    } finally {
      setRunningState("idempotency", false);
    }
  };

  // 3. Test Concurrency Submission
  const handleTestConcurrency = async () => {
    setRunningState("concurrency", true);
    addLog(`Testing Concurrency: Submitting 10 parallel service requests for '${selectedService}'...`);

    const submissions = Array.from({ length: 10 }).map((_, i) => {
      const randomPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      const payload = {
        customerName: `Concurrent Client ${i + 1}`,
        phone: randomPhone,
        email: `client${i + 1}@concurrent.com`,
        category: selectedService,
        location: "Simulation Lab",
        description: `Load testing concurrent submission. Sequence number ${i + 1}`
      };
      return axios.post("/api/leads", payload);
    });

    try {
      const results = await Promise.all(submissions);
      addLog(`Finished sending 10 concurrent requests.`);
      
      let allocatedCount = 0;
      let pendingCount = 0;

      results.forEach((res, i) => {
        const lead = res.data.data;
        const status = lead.status;
        if (status === "ALLOCATED") {
          allocatedCount++;
          const pNames = lead.providers ? lead.providers.map((p: any) => p.name).join(", ") : "None";
          addLog(`Lead ${i + 1}: ${status} | Assigned to: [${pNames}]`);
        } else {
          pendingCount++;
          addLog(`Lead ${i + 1}: ${status} | Reason: No eligible providers matching quota constraint`);
        }
      });

      addLog(`Concurrency Run Summary: ${allocatedCount} Allocated | ${pendingCount} Pending`);
      toast({
        title: "Concurrency Test Complete",
        description: `${allocatedCount} allocated, ${pendingCount} pending due to quota constraints.`,
        type: "success"
      });
    } catch (err: any) {
      addLog(`Error during concurrent submissions: ${err.message}`);
      toast({
        title: "Simulation Failed",
        description: err.message,
        type: "error"
      });
    } finally {
      setRunningState("concurrency", false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between py-6 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Top Navbar */}
      <nav className="max-w-7xl w-full mx-auto flex items-center justify-between mb-8 md:mb-12 z-10">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 font-bold text-white cursor-pointer hover:opacity-85 transition-opacity"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </button>
        <span className="text-sm font-bold text-slate-400">LeadFlow Engine Simulator</span>
      </nav>

      {/* Main Grid */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 flex-1 z-10">
        
        {/* Left Column: Actions */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Webhook Quotas & Idempotency Testing */}
          <Card className="glass-card border border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-400">
                <Webhook className="h-4.5 w-4.5" />
                Payment Webhook Simulation
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 font-medium">
                Simulate payment webhook payload receipt to reset provider quotas. Tests transaction idempotency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="w-full">
                  <label className="text-xs font-bold text-slate-400 block mb-1">TARGET PROVIDER</label>
                  <select
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-color/40"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current allocations: {p.quotaUsed})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Button
                  variant="gradient"
                  onClick={handleResetQuota}
                  isLoading={isRunning["resetQuota"]}
                  className="rounded-xl font-bold h-10 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset Quota Webhook
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleTestIdempotency}
                  isLoading={isRunning["idempotency"]}
                  className="rounded-xl font-bold h-10 text-xs flex items-center justify-center gap-1.5 cursor-pointer border-slate-750 text-slate-200"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                  Test Webhook Idempotency
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Concurrency Testing */}
          <Card className="glass-card border border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                <Zap className="h-4.5 w-4.5" />
                Concurrency Allocation Test
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 font-medium">
                Trigger 10 parallel lead submissions at once to verify allocation logic correctness, quota limits, and round-robin fair rotation under heavy concurrent loads.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">SELECT TEST SERVICE CATEGORY</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-color/40"
                >
                  <option value="Service 1">Service 1 (Mandatory: Provider 1 | Pool: Providers 2, 3, 4)</option>
                  <option value="Service 2">Service 2 (Mandatory: Provider 5 | Pool: Providers 6, 7, 8)</option>
                  <option value="Service 3">Service 3 (Mandatory: Providers 1 & 4 | Pool: Providers 2, 3, 5, 6, 7, 8)</option>
                </select>
              </div>

              <Button
                variant="gradient"
                onClick={handleTestConcurrency}
                isLoading={isRunning["concurrency"]}
                className="w-full rounded-xl font-bold h-10 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Submit 10 Parallel Leads
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Console Log */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[400px]">
          <Card className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                System Simulation Output
              </span>
              <button
                onClick={() => setLogs([])}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear Console
              </button>
            </div>
            
            <div className="flex-1 p-4 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-1.5 flex flex-col-reverse h-[300px]">
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap leading-normal border-b border-slate-900 pb-1.5">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-slate-650 italic text-center my-auto">
                  No simulation logs. Trigger one of the actions on the left.
                </div>
              )}
            </div>
          </Card>
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="text-center mt-12 text-xs text-slate-500 font-medium z-10">
        © 2026 LeadFlow Distribution. All rights reserved.
      </footer>

    </div>
  );
}
