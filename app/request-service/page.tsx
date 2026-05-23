"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldCheck, Zap, Award, Sparkles, Building2, UserCheck, ArrowLeft } from "lucide-react";
import { useMockData } from "@/components/context/MockDataContext";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function RequestServicePage() {
  const router = useRouter();
  const { submitLead } = useMockData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    category: "Service 1",
    location: "",
    description: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [createdLeadId, setCreatedLeadId] = useState("");

  const categories = [
    { value: "Service 1", label: "Service 1 (Mandatory: Provider 1 | Pool: Providers 2, 3, 4)" },
    { value: "Service 2", label: "Service 2 (Mandatory: Provider 5 | Pool: Providers 6, 7, 8)" },
    { value: "Service 3", label: "Service 3 (Mandatory: Providers 1 & 4 | Pool: Providers 2, 3, 5, 6, 7, 8)" }
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    
    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit mobile number starting with 6-9";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.location.trim()) newErrors.location = "City/Location is required";
    if (!formData.description.trim()) newErrors.description = "Requirement details are required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: "Validation Error",
        description: "Please correct the highlighted errors in the form.",
        type: "error"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const lead = await submitLead({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        category: formData.category,
        location: formData.location,
        description: formData.description
      });

      setCreatedLeadId(lead.id);
      setIsSubmitting(false);
      setShowSuccessOverlay(true);

      // Redirect after delay
      setTimeout(() => {
        router.push(`/success?leadId=${lead.id}`);
      }, 2200);
    } catch (err: any) {
      setIsSubmitting(false);
      
      let errorMsg = "Something went wrong. Please try again.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMsg = err.response.data.message;
      }

      toast({
        title: "Submission Failed",
        description: errorMsg,
        type: "error"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex flex-col justify-between py-6 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Top Floating Logo */}
      <nav className="max-w-7xl w-full mx-auto flex items-center justify-between mb-8 md:mb-12 z-10">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 font-bold text-slate-800 dark:text-white cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
            L
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            LeadFlow
          </span>
        </button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/login")}
            className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl"
          >
            Admin Portal
          </Button>
        </div>
      </nav>

      {/* Main Grid */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center flex-1 z-10">
        
        {/* Left column: Info */}
        <div className="lg:col-span-5 flex flex-col space-y-6 text-left">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer self-start transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            Back to Home
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold self-start border border-blue-200 dark:border-blue-800/40">
            <Sparkles className="h-3.5 w-3.5" />
            3-Provider Allocation System
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Submit a <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Service Request</span>
          </h2>
          
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
            Our distribution engine will route your request directly to exactly 3 matching provider partners in the system according to fair-rotation and mandatory routing protocols.
          </p>

          <div className="space-y-3 bg-slate-100/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 p-5 shadow-inner">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">System Allocation Rules</h4>
            <div className="space-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="flex gap-2">
                <span className="font-bold text-blue-500">Service 1:</span>
                <span>Assigned to <strong>Provider 1</strong>, plus 2 chosen fairly from [Provider 2, 3, 4].</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-purple-500">Service 2:</span>
                <span>Assigned to <strong>Provider 5</strong>, plus 2 chosen fairly from [Provider 6, 7, 8].</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-emerald-500">Service 3:</span>
                <span>Assigned to <strong>Provider 1 & 4</strong>, plus 1 chosen fairly from [Provider 2, 3, 5, 6, 7, 8].</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Form Card */}
        <div className="lg:col-span-7">
          <Card className="glass-card border border-border-color/85 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600" />
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Request Details</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Please enter your request details to check eligibility and allocate instantly.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    label="Customer Full Name *"
                    placeholder="e.g. Priyanshu Sharma"
                    error={errors.fullName}
                  />
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    label="Customer Phone Number *"
                    placeholder="10-digit mobile number"
                    error={errors.phone}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    label="Customer Email Address *"
                    placeholder="e.g. customer@example.com"
                    error={errors.email}
                  />
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    label="Select Service *"
                    options={categories}
                  />
                </div>

                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  label="City / Location *"
                  placeholder="e.g. Mumbai, Maharashtra"
                  error={errors.location}
                />

                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  label="Describe Requirements *"
                  placeholder="Describe what services you need help with..."
                  rows={4}
                  error={errors.description}
                />

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full py-3 rounded-xl mt-4 cursor-pointer text-sm sm:text-base font-bold shadow-lg"
                  isLoading={isSubmitting}
                >
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="text-center mt-12 text-xs text-slate-400 font-medium z-10">
        © 2026 LeadFlow Distribution. All rights reserved.
      </footer>

      {/* Fullscreen Success Overlay Transition */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/95 dark:bg-slate-950/98 backdrop-blur-md z-50 flex items-center justify-center p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full flex flex-col items-center gap-6"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/30"
              >
                <CheckCircle2 className="h-10 w-10 animate-pulse" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">Request Successfully Routed!</h2>
                <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">
                  Your lead has been registered and distributed to exactly 3 provider partners in our network.
                </p>
              </div>

              <div className="px-4 py-2 border border-slate-800 bg-slate-900/50 rounded-xl text-xs text-slate-400 font-semibold">
                Lead Reference ID: <span className="font-bold text-white tracking-wider">{createdLeadId}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
