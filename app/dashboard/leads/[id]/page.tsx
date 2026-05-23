"use client";

import React, { use, useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building,
  PlusCircle,
  HelpCircle
} from "lucide-react";
import { useMockData, Lead } from "@/components/context/MockDataContext";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea, Select, Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const leadId = resolvedParams.id;
  
  const {
    leads,
    providers,
    logs,
    duplicates,
    addNoteToLead,
    allocateLeadManual,
    reassignLead,
    resolveDuplicate
  } = useMockData();
  
  const { toast } = useToast();

  // Internal states
  const [newNote, setNewNote] = useState("");
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [allocateProvider, setAllocateProvider] = useState("");
  const [allocateReason, setAllocateReason] = useState("");

  // 1. Fetch current lead
  const lead = useMemo(() => {
    return leads.find((l) => l.id === leadId);
  }, [leads, leadId]);

  // 2. Fetch associated logs
  const leadLogs = useMemo(() => {
    return logs.filter((lg) => lg.leadId === leadId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [logs, leadId]);

  // 3. Fetch duplicate alerts matching this lead
  const duplicateAlert = useMemo(() => {
    return duplicates.find((d) => d.leadId === leadId && d.status === "pending");
  }, [duplicates, leadId]);

  // 4. Fetch matching provider info if allocated
  const provider = useMemo(() => {
    if (!lead || !lead.assignedProviderId) return null;
    return providers.find((p) => p.id === lead.assignedProviderId);
  }, [providers, lead]);

  // 5. Active providers in same category
  const categoryProviders = useMemo(() => {
    if (!lead) return [];
    return providers.filter((p) => p.category === lead.category && p.active);
  }, [providers, lead]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    addNoteToLead(leadId, newNote.trim());
    setNewNote("");
    toast({
      title: "Note Added",
      description: "Note successfully appended to lead record.",
      type: "success"
    });
  };

  const handleManualAllocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !allocateProvider) return;

    if (lead.status === "allocated") {
      reassignLead(lead.id, allocateProvider, allocateReason);
      toast({
        title: "Allocation Updated",
        description: `Successfully reassigned ${lead.fullName} to new provider.`,
        type: "success"
      });
    } else {
      allocateLeadManual(lead.id, allocateProvider, allocateReason);
      toast({
        title: "Lead Allocated",
        description: `Successfully allocated ${lead.fullName} manually.`,
        type: "success"
      });
    }

    setIsAllocateOpen(false);
  };

  const handleDuplicateResolve = (action: "merge" | "ignore") => {
    if (!duplicateAlert) return;
    resolveDuplicate(duplicateAlert.id, action);
    toast({
      title: action === "merge" ? "Merged & Rejected" : "Duplicate Warning Ignored",
      description: action === "merge"
        ? "Lead rejected and marked as merged with original."
        : "Lead flagged warning dismissed, set to pending.",
      type: "success"
    });
  };

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-foreground">Lead Not Found</h3>
        <p className="text-xs text-slate-400 mt-2">The requested Lead ID does not exist.</p>
        <Link href="/dashboard/leads" className="mt-4 inline-block">
          <Button variant="outline" size="sm" className="rounded-xl border-border-color cursor-pointer">
            Back to Leads
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Back to list Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/leads">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border-color cursor-pointer p-2 h-9 w-9 flex items-center justify-center"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </Button>
        </Link>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads Database</span>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Lead Details
            <Badge variant="neutral" className="text-xs font-bold tracking-wide">
              {lead.id}
            </Badge>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 cols): Info & Logs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Customer Information Card */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-primary-color" />
                  Customer Information
                </CardTitle>
                <CardDescription>Personal and location contact info.</CardDescription>
              </div>
              <Badge variant={lead.status}>{lead.status}</Badge>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 font-medium">Full Name</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{lead.fullName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 font-medium">Phone Number</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{lead.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 font-medium">Email Address</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-none">
                        {lead.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 font-medium">Location</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{lead.location}</span>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Lead Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary-color" />
                Service Requirement Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-slate-400">Category:</span>
                <Badge variant="neutral">{lead.category}</Badge>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Submitted: {new Date(lead.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-border-color/80 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {lead.description}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Provider Detail */}
          {lead.status === "allocated" && provider && (
            <Card className="border-emerald-500/25 dark:border-emerald-500/10">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="h-4.5 w-4.5 text-emerald-500" />
                    Assigned Provider Partner
                  </CardTitle>
                  <CardDescription>Technician company detail matched for distribution.</CardDescription>
                </div>
                <Badge variant="success">Match Rate: 4.8★</Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-semibold">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Partner name:</span>
                      <span className="text-foreground">{provider.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contact person:</span>
                      <span className="text-foreground">{provider.contactPerson}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="text-foreground">{provider.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-foreground truncate max-w-[150px] sm:max-w-none">{provider.email}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Logs & Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-primary-color" />
                Distribution Timeline Logs
              </CardTitle>
              <CardDescription>Step-by-step history of lead distribution rules.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6">
                
                {/* Always show capture event */}
                <div className="relative text-xs">
                  <div className="absolute -left-[30px] w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-600 flex items-center justify-center text-blue-600">
                    <PlusCircle className="h-3 w-3" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-foreground">Lead Submitted by Customer</span>
                    <p className="text-slate-400 font-semibold leading-normal mt-0.5">
                      Request created in database with category "{lead.category}". Phone verified.
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                      {new Date(lead.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Show duplicate checks or allocations */}
                {leadLogs.map((log) => (
                  <div key={log.id} className="relative text-xs">
                    <div className="absolute -left-[30px] w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 border border-indigo-500 flex items-center justify-center text-indigo-500">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-foreground">{log.reason}</span>
                      <p className="text-slate-400 font-semibold leading-normal mt-0.5">
                        {log.type === "system" ? "Engine auto-assignment rule trigger." : "Admin manual routing override override."}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}

              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column (4 cols) - Sticky Panel */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          
          {/* Quick Actions Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Distribution Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Button
                variant="gradient"
                className="w-full justify-center rounded-xl font-bold cursor-pointer"
                onClick={() => {
                  setAllocateProvider(lead.assignedProviderId || "");
                  setAllocateReason("");
                  setIsAllocateOpen(true);
                }}
              >
                {lead.status === "allocated" ? "Override Allocation" : "Manually Distribute Lead"}
              </Button>
            </CardContent>
          </Card>

          {/* Duplicate Risk Alerts */}
          {duplicateAlert && (
            <Card className="border-purple-500/25 dark:border-purple-500/10 bg-purple-950/5 dark:bg-purple-950/20">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                  <AlertTriangle className="h-4.5 w-4.5" />
                  Duplicate Warning
                </CardTitle>
                <Badge variant="danger" className="scale-90 font-bold uppercase tracking-wider">
                  {duplicateAlert.risk} Risk
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 text-xs font-semibold pt-0">
                <p className="text-slate-500 dark:text-slate-400 leading-normal">
                  Identical phone number found in system:{" "}
                  <span className="underline font-bold text-slate-700 dark:text-slate-300">
                    {duplicateAlert.phone}
                  </span>.
                  Conflict found with original lead{" "}
                  <span className="font-bold text-slate-800 dark:text-white">
                    {duplicateAlert.matchedLeadId}
                  </span>{" "}
                  ({duplicateAlert.matchedLeadName}).
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl text-[10px] font-bold border-border-color cursor-pointer"
                    onClick={() => handleDuplicateResolve("ignore")}
                  >
                    Ignore Alert
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl text-[10px] font-bold bg-purple-600 text-white cursor-pointer hover:bg-purple-750"
                    onClick={() => handleDuplicateResolve("merge")}
                  >
                    Reject & Merge
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Admin Audit Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* Note feed list */}
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {lead.notes && lead.notes.length > 0 ? (
                  lead.notes.map((note, index) => (
                    <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900/30 border border-border-color/80 rounded-xl text-xs space-y-1">
                      <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                        {note}
                      </p>
                      <span className="text-[9px] text-slate-450 font-bold block">
                        Admin User
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-400 py-2 font-semibold">
                    No notes recorded on this lead.
                  </p>
                )}
              </div>

              {/* Note input form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <Textarea
                  placeholder="Type an internal audit note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  className="text-xs bg-slate-50/50"
                  required
                />
                <Button type="submit" variant="secondary" size="sm" className="w-full text-xs py-2 rounded-xl font-bold cursor-pointer">
                  Append Note
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Manual Allocation Dialog Modal */}
      <Dialog
        isOpen={isAllocateOpen}
        onClose={() => setIsAllocateOpen(false)}
        title={lead.status === "allocated" ? "Override Allocation Partner" : "Manual Lead Distribution"}
      >
        <form onSubmit={handleManualAllocationSubmit} className="space-y-4">
          <div className="p-3 border border-border-color bg-slate-50 dark:bg-slate-900/30 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Routing target</span>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Customer name:</span>
              <span className="text-foreground">{lead.fullName}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Category sector:</span>
              <span className="text-primary-color">{lead.category}</span>
            </div>
          </div>

          <Select
            label="Select Matching Provider Partner *"
            value={allocateProvider}
            onChange={(e) => setAllocateProvider(e.target.value)}
            options={[
              { value: "", label: "-- Choose Active Category Provider --" },
              ...categoryProviders.map((p) => ({
                value: p.id,
                label: `${p.name} (Quota: ${p.quotaUsed}/${p.monthlyQuota} | Rating: ${p.rating})`
              }))
            ]}
            required
          />

          <Input
            label="Manual Override Reason *"
            placeholder="e.g. VIP client request / Provider quota adjustment"
            value={allocateReason}
            onChange={(e) => setAllocateReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAllocateOpen(false)}
              className="rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" variant="gradient" className="rounded-xl cursor-pointer font-bold">
              Allocate Lead
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
}
