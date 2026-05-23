"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Building, Phone, Mail, Award, CheckCircle } from "lucide-react";
import { useMockData } from "@/components/context/MockDataContext";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export default function NewProviderPage() {
  const router = useRouter();
  const { addProvider } = useMockData();
  const { toast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Service 1",
    monthlyQuota: "100",
    contactPerson: "",
    email: "",
    phone: "",
    active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: "Service 1", label: "Service 1" },
    { value: "Service 2", label: "Service 2" },
    { value: "Service 3", label: "Service 3" },
    { value: "Service 1, Service 3", label: "Service 1 & Service 3" },
    { value: "Service 2, Service 3", label: "Service 2 & Service 3" }
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Provider name is required";
    if (!formData.contactPerson.trim()) newErrors.contactPerson = "Contact person name is required";
    
    // Quota validation
    const quotaNum = Number(formData.monthlyQuota);
    if (!formData.monthlyQuota.trim()) {
      newErrors.monthlyQuota = "Monthly quota limit is required";
    } else if (isNaN(quotaNum) || quotaNum <= 0) {
      newErrors.monthlyQuota = "Enter a valid positive number";
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit mobile number";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleToggleActive = () => {
    setFormData((prev) => ({ ...prev, active: !prev.active }));
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    // Simulate database write
    setTimeout(() => {
      try {
        addProvider({
          name: formData.name,
          category: formData.category,
          monthlyQuota: Number(formData.monthlyQuota),
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          active: formData.active
        });

        setIsSubmitting(false);
        toast({
          title: "Provider Registered",
          description: `Successfully added ${formData.name} as a partner.`,
          type: "success"
        });
        router.push("/dashboard/providers");
      } catch (err) {
        setIsSubmitting(false);
        toast({
          title: "Registration Failed",
          description: "Something went wrong. Please try again.",
          type: "error"
        });
      }
    }, 1000);
  };

  return (
    <div className="space-y-6 font-sans max-w-4xl pb-16">
      
      {/* Back button and navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/providers")}
          className="rounded-xl border border-border-color bg-card-bg p-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer h-9 w-9 flex items-center justify-center text-slate-500 transition-colors"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Partners Database</span>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Register New Provider
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: BUSINESS PROFILE */}
        <Card>
          <CardHeader className="pb-3 flex flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4.5 w-4.5 text-primary-color" />
                Business Profile
              </CardTitle>
              <CardDescription>Company name, category registration, and availability.</CardDescription>
            </div>
            
            {/* Status Switch Toggle */}
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Availability Status</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">
                  {formData.active ? "Active" : "Inactive"}
                </span>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                    formData.active ? "bg-emerald-500" : "bg-slate-350 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.active ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                label="Provider Business Name *"
                placeholder="e.g. Acme Plumbing Contractors"
                error={errors.name}
                required
              />
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="Service Category Specialization *"
                options={categories}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: QUOTA ALLOCATION */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-primary-color" />
              Quota Configuration
            </CardTitle>
            <CardDescription>Set distribution limits for this provider partner.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                name="monthlyQuota"
                type="number"
                value={formData.monthlyQuota}
                onChange={handleChange}
                label="Monthly Lead Limit (Quota) *"
                placeholder="e.g. 100"
                error={errors.monthlyQuota}
                required
              />
              <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-900/30 border border-border-color/85 rounded-xl text-xs text-slate-500 font-semibold self-end h-[46px] mb-[1px]">
                <CheckCircle className="h-4.5 w-4.5 text-blue-500 flex-shrink-0" />
                <span>Starts at 0/100 utilized allocations. Increments automatically.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: CONTACT REPRESENTATIVE */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4.5 w-4.5 text-primary-color" />
              Contact Details
            </CardTitle>
            <CardDescription>Primary rep contact to dispatch lead notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                label="Contact Representative Name *"
                placeholder="e.g. Robert Smith"
                error={errors.contactPerson}
                required
              />
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                label="Phone Number *"
                placeholder="10-digit mobile number"
                error={errors.phone}
                required
              />
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                label="Email Address *"
                placeholder="e.g. partner@acme.com"
                error={errors.email}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Sticky Action Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/providers")}
            className="rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            className="rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
            isLoading={isSubmitting}
          >
            <Save className="h-4 w-4" />
            Save Partner Profile
          </Button>
        </div>

      </form>
    </div>
  );
}
