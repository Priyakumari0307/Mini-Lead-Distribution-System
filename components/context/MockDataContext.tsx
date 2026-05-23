"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { usePathname } from "next/navigation";

// Set up Axios interceptor for authorization tokens
if (typeof window !== "undefined") {
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });
}

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  category: string;
  location: string;
  description: string;
  status: "pending" | "allocated" | "duplicate" | "rejected";
  assignedProviderId: string | null;
  assignedProviderName: string | null;
  providerIds?: string[];
  createdAt: string;
  notes: string[];
}

export interface Provider {
  id: string;
  name: string;
  category: string;
  monthlyQuota: number;
  quotaUsed: number;
  contactPerson: string;
  email: string;
  phone: string;
  active: boolean;
  rating: number;
}

export interface AllocationLog {
  id: string;
  leadId: string;
  leadName: string;
  providerId: string | null;
  providerName: string | null;
  timestamp: string;
  reason: string;
  type: "system" | "manual";
}

export interface DuplicateCheck {
  id: string;
  leadId: string;
  leadName: string;
  matchedLeadId: string;
  matchedLeadName: string;
  phone: string;
  risk: "high" | "medium" | "low";
  status: "pending" | "resolved" | "ignored";
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MockDataContextType {
  leads: Lead[];
  providers: Provider[];
  logs: AllocationLog[];
  duplicates: DuplicateCheck[];
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
  submitLead: (leadData: Omit<Lead, "id" | "status" | "assignedProviderId" | "assignedProviderName" | "createdAt" | "notes">) => Promise<Lead>;
  allocateLeadManual: (leadId: string, providerId: string, reason: string) => void;
  reassignLead: (leadId: string, providerId: string, reason: string) => void;
  deleteLead: (leadId: string) => void;
  addProvider: (providerData: Omit<Provider, "id" | "quotaUsed" | "rating">) => void;
  updateProvider: (provider: Provider) => void;
  toggleProviderActive: (providerId: string) => void;
  resetQuotas: () => void;
  generateFakeLeads: (count: number) => void;
  resolveDuplicate: (duplicateId: string, action: "merge" | "ignore") => void;
  resetSystem: () => void;
  addNoteToLead: (leadId: string, note: string) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [logs, setLogs] = useState<AllocationLog[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCheck[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [initialized, setInitialized] = useState(false);
  const pathname = usePathname();

  // Load user from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.log("No authorization token found, skipping system data fetch.");
      return;
    }

    try {
      // 1. Fetch leads
      const leadsRes = await axios.get("/api/leads?limit=1000");
      const fetchedLeads = leadsRes.data?.data?.leads || [];
      const mappedLeads: Lead[] = fetchedLeads.map((l: any) => ({
        id: l.id,
        fullName: l.customerName || l.fullName,
        phone: l.phone,
        email: l.email,
        category: l.category,
        location: l.location,
        description: l.description,
        status: l.status.toLowerCase() as any, // "pending" | "allocated" | "duplicate" | "rejected"
        assignedProviderId: l.assignedProviderId || null,
        assignedProviderName: l.assignedProviderName || null,
        providerIds: l.providerIds || [],
        createdAt: l.createdAt,
        notes: l.notes || []
      }));

      // 2. Fetch providers
      const providersRes = await axios.get("/api/providers");
      const fetchedProviders = providersRes.data?.data || [];
      const mappedProviders: Provider[] = fetchedProviders.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        monthlyQuota: p.monthlyQuota,
        quotaUsed: p.allocatedThisMonth,
        contactPerson: p.name,
        email: p.email,
        phone: p.phone,
        active: p.isActive,
        rating: 4.5
      }));

      // 3. Fetch logs
      const logsRes = await axios.get("/api/logs?limit=1000");
      const fetchedLogs = logsRes.data?.data?.logs || [];
      const mappedLogs: AllocationLog[] = fetchedLogs.map((lg: any) => ({
        id: lg.id,
        leadId: lg.leadId,
        leadName: lg.lead?.customerName || lg.lead?.fullName || "Unknown",
        providerId: lg.providerId,
        providerName: lg.provider?.name || null,
        timestamp: lg.createdAt,
        reason: lg.reason,
        type: lg.allocationType?.toLowerCase() as any || "system"
      }));

      // 4. Fetch duplicates
      const duplicatesRes = await axios.get("/api/duplicates?limit=1000");
      const fetchedDuplicates = duplicatesRes.data?.data?.duplicates || [];
      const mappedDuplicates: DuplicateCheck[] = fetchedDuplicates.map((d: any) => ({
        id: d.id,
        leadId: d.leadId,
        leadName: d.lead?.customerName || d.lead?.fullName || "New Lead",
        matchedLeadId: d.duplicateOfLeadId,
        matchedLeadName: d.duplicateOfLead?.customerName || d.duplicateOfLead?.fullName || "Original Lead",
        phone: d.lead?.phone || "",
        risk: "high",
        status: "pending",
        createdAt: d.createdAt
      }));

      setLeads(mappedLeads);
      setProviders(mappedProviders);
      setLogs(mappedLogs);
      setDuplicates(mappedDuplicates);
    } catch (error) {
      console.warn("Error fetching system data:", error);
    }
  }, []);

  // Fetch initial data and configure Socket.IO
  useEffect(() => {
    fetchData().then(() => setInitialized(true));

    // Connect to backend Socket.IO server
    const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const backendUrl = rawBackendUrl.replace(/\/$/, "");
    const socket = io(backendUrl);

    socket.on("connect", () => {
      console.log("Connected to Realtime Sockets server");
    });

    // Listen for updates and refresh data in real-time
    const handleUpdate = () => {
      console.log("Realtime event received, refreshing data...");
      fetchData();
    };

    socket.on("lead_created", handleUpdate);
    socket.on("lead_allocated", handleUpdate);
    socket.on("provider_updated", handleUpdate);
    socket.on("duplicate_detected", handleUpdate);
    socket.on("quota_warning", handleUpdate);

    return () => {
      socket.disconnect();
    };
  }, [fetchData]);

  // Refetch data when pathname changes, if authenticated
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        fetchData();
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (e) {}
        }
      } else {
        // Reset state on logout/when not authenticated
        setLeads([]);
        setProviders([]);
        setLogs([]);
        setDuplicates([]);
        setCurrentUser(null);
      }
    }
  }, [pathname, fetchData]);

  const submitLead = async (leadData: Omit<Lead, "id" | "status" | "assignedProviderId" | "assignedProviderName" | "createdAt" | "notes">) => {
    const payload = {
      customerName: leadData.fullName,
      phone: leadData.phone,
      email: leadData.email,
      category: leadData.category,
      location: leadData.location,
      description: leadData.description,
    };
    
    const res = await axios.post("/api/leads", payload);
    await fetchData();

    const createdLead = res.data.data;
    return {
      id: createdLead.id,
      fullName: createdLead.customerName || createdLead.fullName,
      phone: createdLead.phone,
      email: createdLead.email,
      category: createdLead.category,
      location: createdLead.location,
      description: createdLead.description,
      status: createdLead.status.toLowerCase() as any,
      assignedProviderId: createdLead.assignedProviderId || null,
      assignedProviderName: createdLead.assignedProviderName || null,
      createdAt: createdLead.createdAt,
      notes: createdLead.notes || []
    };
  };

  const allocateLeadManual = (leadId: string, providerId: string, reason: string) => {
    axios.post(`/api/leads/${leadId}/reassign`, { providerId, reason }).then(() => {
      fetchData();
    }).catch(err => {
      console.warn("Failed manual allocation:", err);
    });
  };

  const reassignLead = (leadId: string, providerId: string, reason: string) => {
    axios.post(`/api/leads/${leadId}/reassign`, { providerId, reason }).then(() => {
      fetchData();
    }).catch(err => {
      console.warn("Failed lead assignment:", err);
    });
  };

  const deleteLead = (leadId: string) => {
    axios.delete(`/api/leads/${leadId}`).then(() => {
      fetchData();
    }).catch(err => {
      console.warn("Failed to delete lead:", err);
    });
  };

  const addProvider = (providerData: Omit<Provider, "id" | "quotaUsed" | "rating">) => {
    axios.post("/api/providers", {
      name: providerData.name,
      category: providerData.category,
      monthlyQuota: providerData.monthlyQuota,
      email: providerData.email,
      phone: providerData.phone,
      isActive: providerData.active
    }).then(() => {
      fetchData();
    }).catch(err => {
      console.warn("Failed to add provider:", err);
    });
  };

  const updateProvider = (provider: Provider) => {
    axios.put(`/api/providers/${provider.id}`, {
      name: provider.name,
      category: provider.category,
      monthlyQuota: provider.monthlyQuota,
      email: provider.email,
      phone: provider.phone,
      isActive: provider.active
    }).then(() => {
      fetchData();
    }).catch(err => {
      console.warn("Failed to update provider:", err);
    });
  };

  const toggleProviderActive = (providerId: string) => {
    const prov = providers.find(p => p.id === providerId);
    if (!prov) return;
    axios.put(`/api/providers/${providerId}`, {
      isActive: !prov.active
    }).then(() => {
      fetchData();
    }).catch(err => {
      console.warn("Failed to toggle provider active status:", err);
    });
  };

  const resetQuotas = () => {
    axios.post("/api/testing/reset-quotas").then(() => {
      fetchData();
    }).catch(err => {
      console.warn("Failed to reset quotas:", err);
    });
  };

  const generateFakeLeads = (count: number) => {
    axios.post("/api/testing/generate-leads", { count, category: "Service 3" }).then(() => {
      fetchData();
    }).catch(err => {
      console.warn("Failed fake leads generation:", err);
    });
  };

  const resolveDuplicate = (duplicateId: string, action: "merge" | "ignore") => {
    console.log("Resolve duplicate bypassed since backend handles DB-level uniqueness:", duplicateId, action);
  };

  const resetSystem = () => {
    axios.post("/api/testing/reset-quotas").then(() => {
      fetchData();
    }).catch(err => {
      console.warn("Failed system reset:", err);
    });
  };

  const addNoteToLead = (leadId: string, note: string) => {
    console.log("Add note to lead bypassed, notes: ", leadId, note);
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading System Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <MockDataContext.Provider
      value={{
        leads,
        providers,
        logs,
        duplicates,
        currentUser,
        setCurrentUser,
        submitLead: submitLead as any,
        allocateLeadManual,
        reassignLead,
        deleteLead,
        addProvider,
        updateProvider,
        toggleProviderActive,
        resetQuotas,
        generateFakeLeads,
        resolveDuplicate,
        resetSystem,
        addNoteToLead
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error("useMockData must be used within a MockDataProvider");
  }
  return context;
}
