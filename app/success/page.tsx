"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronLeft, Calendar, ShieldCheck, Sparkles, Building2, User, HelpCircle } from "lucide-react";
import { useMockData } from "@/components/context/MockDataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LeadSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { leads } = useMockData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const leadId = searchParams.get("leadId");

  // Find lead details in our mock data store
  const leadDetails = useMemo(() => {
    if (!leadId) return null;
    return leads.find((l) => l.id === leadId);
  }, [leadId, leads]);

  // Fallback if no lead found (e.g. fresh navigation)
  const fallbackLead = {
    id: leadId || "LEAD-2026-000XXX",
    fullName: "Valued Customer",
    category: "Home Services",
    location: "Your Area",
    status: "allocated" as const,
    assignedProviderName: "Provider One",
    createdAt: new Date().toISOString()
  };

  const lead = leadDetails || fallbackLead;

  // Render a simple and lightweight custom Confetti particle effect
  const confettiParticles = useMemo(() => {
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100 - 50, // width spread
      y: Math.random() * -100 - 50, // height launch
      scale: Math.random() * 0.8 + 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: Math.random() * 360,
      duration: Math.random() * 1.5 + 1.2
    }));
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-mesh flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Custom Confetti Shower */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {confettiParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0, x: 0, y: 100, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: p.scale,
              x: p.x * 6,
              y: p.y * -5 + 200,
              rotate: p.rotate + 360
            }}
            transition={{
              duration: p.duration,
              ease: "easeOut",
              repeat: 0
            }}
            className="absolute w-3 h-3 rounded-sm"
            style={{ backgroundColor: p.color }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="max-w-md w-full"
      >
        <Card className="glass-card border border-border-color shadow-2xl relative text-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
          
          <CardContent className="p-8 space-y-6">
            
            {/* Big Success Icon */}
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2, damping: 10 }}
                className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-500 shadow-md shadow-emerald-500/10"
              >
                <CheckCircle2 className="h-9 w-9" />
              </motion.div>
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Thank You!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Your service request has been successfully submitted and processed.
              </p>
            </div>

            {/* Generated Lead ID Card */}
            <div className="border border-border-color/80 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl p-5 space-y-4 text-left shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-border-color/50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Reference</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {lead.id}
                </span>
              </div>

              <div className="space-y-2 text-xs sm:text-sm font-medium">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    Customer Name:
                  </span>
                  <span className="text-slate-800 dark:text-white font-bold">{lead.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Submitted:
                  </span>
                  <span className="text-slate-800 dark:text-white">
                    {new Date(lead.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Category:
                  </span>
                  <span className="text-slate-800 dark:text-white font-semibold">{lead.category}</span>
                </div>

                <div className="pt-3 border-t border-border-color/50 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distribution Status</span>
                  
                  {lead.status === "allocated" ? (
                    <div className="flex items-center gap-2 text-xs bg-emerald-100/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-2.5 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold">
                      <Building2 className="h-4.5 w-4.5 flex-shrink-0 text-emerald-500" />
                      <div className="flex flex-col">
                        <span>Matched & Allocated</span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Assigned to: <span className="underline">{lead.assignedProviderName}</span>
                        </span>
                      </div>
                    </div>
                  ) : lead.status === "duplicate" ? (
                    <div className="flex items-center gap-2 text-xs bg-purple-100/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 p-2.5 rounded-xl text-purple-800 dark:text-purple-300 font-bold">
                      <HelpCircle className="h-4.5 w-4.5 flex-shrink-0 text-purple-500" />
                      <div className="flex flex-col">
                        <span>System Screen Flagged</span>
                        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                          Holding duplicate screening review.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs bg-amber-100/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-2.5 rounded-xl text-amber-800 dark:text-amber-300 font-bold">
                      <ShieldCheck className="h-4.5 w-4.5 flex-shrink-0 text-amber-500" />
                      <div className="flex flex-col">
                        <span>Pending Distribution</span>
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                          Searching provider quota capacity...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Back button */}
            <div className="pt-2">
              <Button
                variant="gradient"
                className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer font-bold"
                onClick={() => router.push("/")}
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
            
            <p className="text-[10px] text-slate-400 font-semibold leading-normal">
              Our partner technicians typically contact you within 15 minutes of registration.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
