"use client";

import React, { useState } from "react";
import { useMockData } from "@/components/context/MockDataContext";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  Database, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  Webhook, 
  Terminal, 
  Send, 
  Plus, 
  ShieldCheck, 
  AlertTriangle 
} from "lucide-react";
import { motion } from "framer-motion";

export default function TestingPanelPage() {
  const { generateFakeLeads, resetQuotas, resetSystem, submitLead, leads } = useMockData();
  const { toast } = useToast();

  // Generator State
  const [generateCount, setGenerateCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom Lead State
  const [customLead, setCustomLead] = useState({
    fullName: "",
    email: "",
    phone: "",
    category: "Service 1",
    location: "Jaipur, Rajasthan",
    description: ""
  });

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState("https://api.acme-corp.com/v1/webhooks/leads");
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<"idle" | "success" | "error">("idle");
  const [webhookPayload, setWebhookPayload] = useState("");

  // System Clean State
  const [confirmReset, setConfirmReset] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      generateFakeLeads(generateCount);
      setIsGenerating(false);
      toast({
        title: "Leads Generated",
        description: `Successfully inserted ${generateCount} randomized leads into the system.`,
        type: "success"
      });
    }, 800);
  };

  const handleResetSystem = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      toast({
        title: "Confirmation Required",
        description: "Click 'Reset System Data' again to confirm resetting all lead state.",
        type: "info"
      });
      setTimeout(() => setConfirmReset(false), 5000); // Reset confirmation state after 5 seconds
      return;
    }

    resetSystem();
    setConfirmReset(false);
    toast({
      title: "System Database Reset",
      description: "All records have been reset to seed values, and localStorage is cleared.",
      type: "success"
    });
  };

  const handleResetQuotas = () => {
    resetQuotas();
    toast({
      title: "Provider Quotas Cleared",
      description: "All monthly quota usages have been set back to 0.",
      type: "success"
    });
  };

  const handleCustomLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLead.fullName || !customLead.phone) {
      toast({
        title: "Missing Fields",
        description: "Please fill in Name and Phone Number.",
        type: "error"
      });
      return;
    }

    try {
      const newLead = await submitLead(customLead);
      
      // Reset state
      setCustomLead({
        fullName: "",
        email: "",
        phone: "",
        category: "Service 1",
        location: "Jaipur, Rajasthan",
        description: ""
      });

      if (newLead.status === "duplicate") {
        toast({
          title: "Lead Submission Flagged",
          description: `Lead '${newLead.fullName}' was flagged as a duplicate. No provider assigned.`,
          type: "error"
        });
      } else if (newLead.status === "allocated" || newLead.status === "pending") {
        toast({
          title: newLead.status === "allocated" ? "Lead Allocated" : "Lead Submission Received",
          description: newLead.status === "allocated" 
            ? `Lead '${newLead.fullName}' successfully routed to 3 providers.`
            : `Lead '${newLead.fullName}' is pending allocation (insufficient eligible providers).`,
          type: newLead.status === "allocated" ? "success" : "info"
        });
      }
    } catch (error: any) {
      let errorMsg = "Something went wrong. Please try again.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      toast({
        title: "Submission Failed",
        description: errorMsg,
        type: "error"
      });
    }
  };

  const handleSimulateWebhook = () => {
    if (!webhookUrl) {
      toast({
        title: "Webhook URL Required",
        description: "Please specify a destination webhook endpoint.",
        type: "error"
      });
      return;
    }

    setIsSimulatingWebhook(true);
    setWebhookStatus("idle");

    const sampleLead = leads[0] || {
      id: "LEAD-SAMPLE",
      fullName: "Test Customer",
      phone: "9988776655",
      email: "test@example.com",
      category: "Home Services",
      location: "Delhi, NCR",
      description: "Sample payload webhook transfer test.",
      status: "allocated",
      assignedProviderName: "Provider One",
      createdAt: new Date().toISOString()
    };

    setWebhookPayload(JSON.stringify(sampleLead, null, 2));

    setTimeout(() => {
      setIsSimulatingWebhook(false);
      // Simulate success/failure randomly (80% success)
      const success = Math.random() > 0.2;
      if (success) {
        setWebhookStatus("success");
        toast({
          title: "Webhook Broadcast Success",
          description: `Payload successfully delivered to ${webhookUrl} (200 OK).`,
          type: "success"
        });
      } else {
        setWebhookStatus("error");
        toast({
          title: "Webhook Connection Timeout",
          description: `Endpoint ${webhookUrl} failed to respond (504 Gateway Timeout).`,
          type: "error"
        });
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Developer Panel</h2>
        <p className="text-xs text-slate-400 font-medium mt-1">Interact with debugging tools, generate synthetic leads, test webhooks, and reset system quotas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Synthetic Generators & Data Control */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Mock Generator Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                Synthetic Lead Generator
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 font-medium">
                Insert a batch of realistic, randomized lead submissions. Each submission automatically runs duplicate check and allocation logic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-400">BATCH SIZE:</span>
                <div className="flex gap-2">
                  {[1, 5, 10, 25].map((val) => (
                    <button
                      key={val}
                      onClick={() => setGenerateCount(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        generateCount === val
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                          : "border-border-color bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {val} Leads
                    </button>
                  ))}
                </div>
              </div>
              <Button
                variant="gradient"
                className="w-full font-bold h-10 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={handleGenerate}
                isLoading={isGenerating}
              >
                <Plus className="h-4 w-4 text-white" />
                Generate synthetic records
              </Button>
            </CardContent>
          </Card>

          {/* Quick Submission Simulator */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-blue-500" />
                Manual Lead Distributor
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 font-medium">
                Submit an individual lead directly into the engine to watch matches occur in real time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCustomLeadSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">FULL NAME</label>
                    <input
                      type="text"
                      placeholder="e.g. Vikram Joshi"
                      value={customLead.fullName}
                      onChange={(e) => setCustomLead({...customLead, fullName: e.target.value})}
                      className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">PHONE NUMBER</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={customLead.phone}
                      onChange={(e) => setCustomLead({...customLead, phone: e.target.value})}
                      className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      placeholder="e.g. vikram@gmail.com"
                      value={customLead.email}
                      onChange={(e) => setCustomLead({...customLead, email: e.target.value})}
                      className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450">SERVICE CATEGORY</label>
                    <select
                      value={customLead.category}
                      onChange={(e) => setCustomLead({...customLead, category: e.target.value})}
                      className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-200"
                    >
                      <option value="Service 1">Service 1</option>
                      <option value="Service 2">Service 2</option>
                      <option value="Service 3">Service 3</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">GEOGRAPHIC LOCATION</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={customLead.location}
                    onChange={(e) => setCustomLead({...customLead, location: e.target.value})}
                    className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">DESCRIPTION</label>
                  <textarea
                    placeholder="Detail the specific service requested..."
                    value={customLead.description}
                    onChange={(e) => setCustomLead({...customLead, description: e.target.value})}
                    className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100 placeholder-slate-400 min-h-[70px] resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-bold h-10 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  Distribute & Allocate Lead
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Webhook Simulator & Destructive operations */}
        <div className="space-y-6">
          
          {/* Webhook broadcast panel */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Webhook className="h-4.5 w-4.5 text-emerald-500" />
                Webhook Integrator Test
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 font-medium">
                Simulate outbound API payload transfer. Transmits the most recent lead data to a client CRM endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">WEBHOOK URL</label>
                <input
                  type="url"
                  placeholder="https://api.crm.com/v1/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <Button
                variant="outline"
                className="w-full font-bold h-9 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border-border-color"
                onClick={handleSimulateWebhook}
                isLoading={isSimulatingWebhook}
              >
                <Send className="h-3.5 w-3.5 text-slate-400" />
                Simulate Post Payload
              </Button>

              {webhookPayload && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-450 uppercase flex items-center gap-1">
                      <Terminal className="h-3 w-3" />
                      Payload Inspector
                    </span>
                    {webhookStatus === "success" && (
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        200 OK
                      </span>
                    )}
                    {webhookStatus === "error" && (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                        504 TIMEOUT
                      </span>
                    )}
                  </div>
                  <pre className="text-[10px] bg-slate-950 p-3 rounded-xl border border-border-color text-slate-300 font-mono overflow-auto max-h-[180px]">
                    {webhookPayload}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Destructive Tools */}
          <Card className="glass-card border-rose-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-500">
                <Trash2 className="h-4.5 w-4.5" />
                System Maintenance
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 font-medium">
                Reset system states, flush quota constraints, or perform clean reinstalls of seed mock records.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full font-bold h-9 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border-border-color hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                onClick={handleResetQuotas}
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                Reset Quota Consumptions
              </Button>

              <Button
                variant="primary"
                className={`w-full font-bold h-9 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  confirmReset 
                    ? "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-500/20" 
                    : "bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-600/20"
                }`}
                onClick={handleResetSystem}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {confirmReset ? "Confirm Database Purge" : "Purge All System Records"}
              </Button>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
