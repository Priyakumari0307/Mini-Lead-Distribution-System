"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Download, Trash2, ArrowUpRight, HelpCircle, UserPlus, RefreshCw } from "lucide-react";
import { useMockData, Lead } from "@/components/context/MockDataContext";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";

export default function LeadsListPage() {
  const { leads, providers, deleteLead, reassignLead, allocateLeadManual } = useMockData();
  const { toast } = useToast();

  // Search & Filters state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialog Modals state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignProvider, setReassignProvider] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Filter categories
  const categories = [
    { value: "all", label: "All Categories" },
    { value: "Service 1", label: "Service 1" },
    { value: "Service 2", label: "Service 2" },
    { value: "Service 3", label: "Service 3" }
  ];

  // Filter statuses
  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "allocated", label: "Allocated" },
    { value: "duplicate", label: "Duplicate" },
    { value: "rejected", label: "Rejected" }
  ];

  // 1. Apply Search and Filters
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.id.toLowerCase().includes(search.toLowerCase()) ||
        lead.fullName.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone.includes(search) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.location.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === "all" || lead.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [leads, search, categoryFilter, statusFilter]);

  // 2. Pagination Calculations
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 3. Export CSV handler
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      toast({
        title: "Export Failed",
        description: "No data available to export.",
        type: "error"
      });
      return;
    }

    const headers = ["Lead ID", "Customer Name", "Phone", "Email", "Category", "Location", "Status", "Assigned Provider", "Created At"];
    const rows = filteredLeads.map((l) => [
      l.id,
      l.fullName,
      l.phone,
      l.email,
      l.category,
      l.location,
      l.status,
      l.assignedProviderName || "Unassigned",
      l.createdAt
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leadflow_leads_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Downloaded CSV containing ${filteredLeads.length} leads.`,
      type: "success"
    });
  };

  // 4. Reassign Handlers
  const openReassignDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setReassignProvider(lead.assignedProviderId || "");
    setReassignReason("");
    setIsReassignOpen(true);
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !reassignProvider) return;

    if (selectedLead.status === "allocated") {
      reassignLead(selectedLead.id, reassignProvider, reassignReason);
      toast({
        title: "Lead Reassigned",
        description: `Successfully reassigned ${selectedLead.fullName} to new provider.`,
        type: "success"
      });
    } else {
      allocateLeadManual(selectedLead.id, reassignProvider, reassignReason);
      toast({
        title: "Lead Allocated",
        description: `Successfully allocated ${selectedLead.fullName} manually.`,
        type: "success"
      });
    }

    setIsReassignOpen(false);
  };

  // 5. Delete Handlers
  const confirmDelete = (id: string) => {
    setLeadToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = () => {
    if (!leadToDelete) return;
    deleteLead(leadToDelete);
    setIsDeleteOpen(false);
    setLeadToDelete(null);
    toast({
      title: "Lead Deleted",
      description: "The lead record was permanently removed.",
      type: "success"
    });
  };

  // Get active providers matching current lead category
  const matchingProviders = useMemo(() => {
    if (!selectedLead) return [];
    return providers.filter((p) =>
      p.category
        .split(",")
        .map((c) => c.trim())
        .includes(selectedLead.category) && p.active
    );
  }, [selectedLead, providers]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Leads Management</h2>
          <p className="text-xs text-slate-400 font-medium">Verify, reassign, or audit submitted requirements.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="rounded-xl font-bold border-border-color cursor-pointer flex items-center gap-2 self-start"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="glass-card">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, name, email, phone, location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border-color rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-color/30 transition-all"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto flex-col sm:flex-row">
            <Select
              options={categories}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="sm:w-44 border-border-color py-2"
            />
            <Select
              options={statuses}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="sm:w-44 border-border-color py-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Contact</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned Provider</TableHead>
            <TableHead className="hidden lg:table-cell">Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedLeads.length > 0 ? (
            paginatedLeads.map((l) => (
              <TableRow key={l.id}>
                {/* Lead ID */}
                <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                  {l.id}
                </TableCell>

                {/* Customer */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700 dark:text-slate-350 leading-tight">
                      {l.fullName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{l.location}</span>
                  </div>
                </TableCell>

                {/* Contact (Phone/Email) */}
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col text-xs text-slate-500 font-medium">
                    <span>{l.phone}</span>
                    <span className="text-[10px] text-slate-400">{l.email}</span>
                  </div>
                </TableCell>

                {/* Category */}
                <TableCell>
                  <Badge variant="neutral" className="text-[10px]">
                    {l.category}
                  </Badge>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge variant={l.status}>{l.status}</Badge>
                </TableCell>

                {/* Assigned Provider */}
                <TableCell className="text-slate-600 dark:text-slate-300 font-semibold">
                  {l.assignedProviderName ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {l.assignedProviderName}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                  )}
                </TableCell>

                {/* Created At */}
                <TableCell className="hidden lg:table-cell text-xs text-slate-400 font-medium">
                  {new Date(l.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/dashboard/leads/${l.id}`}>
                      <Button variant="outline" size="sm" className="h-8 px-2.5 rounded-lg text-xs font-bold border-border-color cursor-pointer">
                        View
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReassignDialog(l)}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold border-border-color cursor-pointer text-indigo-600 dark:text-indigo-400"
                    >
                      {l.status === "allocated" ? "Reassign" : "Allocate"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => confirmDelete(l.id)}
                      className="h-8 px-2 rounded-lg text-xs border-border-color cursor-pointer text-rose-500 hover:bg-rose-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-slate-400 font-semibold">
                No matching leads found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Details */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <span className="text-xs text-slate-400 font-bold">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8.5 rounded-lg text-xs border-border-color"
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "primary" : "outline"}
                size="sm"
                onClick={() => handlePageChange(i + 1)}
                className="w-8.5 h-8.5 p-0 rounded-lg text-xs font-semibold"
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8.5 rounded-lg text-xs border-border-color"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Reassign / Manual Allocation Dialog */}
      <Dialog
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
        title={selectedLead?.status === "allocated" ? "Reassign Provider Override" : "Manual Lead Allocation"}
      >
        {selectedLead && (
          <form onSubmit={handleReassignSubmit} className="space-y-4">
            <div className="p-3 border border-border-color bg-slate-50 dark:bg-slate-900/30 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead details</span>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Lead ID / Customer:</span>
                <span className="text-foreground">{selectedLead.id} ({selectedLead.fullName})</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Category requirement:</span>
                <span className="text-primary-color">{selectedLead.category}</span>
              </div>
            </div>

            <Select
              label="Select Available Provider *"
              value={reassignProvider}
              onChange={(e) => setReassignProvider(e.target.value)}
              options={[
                { value: "", label: "-- Choose Active Category Provider --" },
                ...matchingProviders.map((p) => ({
                  value: p.id,
                  label: `${p.name} (Quota: ${p.quotaUsed}/${p.monthlyQuota} | Rating: ${p.rating})`
                }))
              ]}
              required
            />

            <Input
              label="Allocation / Override Reason *"
              placeholder="e.g. Highest technician rating / Direct request / Quota re-balance"
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReassignOpen(false)}
                className="rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" variant="gradient" className="rounded-xl cursor-pointer font-bold">
                Confirm Allocation
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Permanently Delete Lead"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-sm text-slate-500">
            <Trash2 className="h-8 w-8 text-rose-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-foreground">Are you sure you want to delete this lead?</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                This action is irreversible and will permanently delete the lead, clean allocation logs, and adjust the provider quota count.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteSubmit}
              className="rounded-xl cursor-pointer font-bold"
            >
              Delete Record
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
