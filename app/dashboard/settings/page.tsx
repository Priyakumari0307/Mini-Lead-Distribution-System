"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/components/context/ThemeContext";
import { useMockData } from "@/components/context/MockDataContext";
import { 
  User, 
  Settings2, 
  Webhook, 
  Bell, 
  ShieldCheck, 
  Save, 
  Eye, 
  EyeOff, 
  Key, 
  RefreshCw,
  SlidersHorizontal,
  Mail,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useMockData();
  
  const [activeTab, setActiveTab] = useState<"profile" | "routing" | "api" | "notifications">("profile");

  // Profile Form States
  const [profile, setProfile] = useState({
    name: "System Administrator",
    email: "admin@leadsystem.com",
    phone: "+91 98765 43210",
    timezone: "UTC+5:30 (IST)",
    lang: "en"
  });

  useEffect(() => {
    if (currentUser) {
      setProfile((prev) => ({
        ...prev,
        name: currentUser.name,
        email: currentUser.email,
      }));
    }
  }, [currentUser]);

  // Routing Rule States
  const [routing, setRouting] = useState({
    autoAssign: true,
    allocationMode: "rating", // rating | round-robin | load-balance
    maxRetries: 3,
    safetyCheck: true
  });

  // Webhook State
  const [api, setApi] = useState({
    webhookUrl: "https://api.acme-corp.com/v1/webhooks/leads",
    apiKey: "lds_live_9a2b8c7d6e5f4g3h2i1j0k9l8m7n6o",
    leadCreatedEvent: true,
    leadAllocatedEvent: true,
    leadDuplicateEvent: true
  });

  // Notification States
  const [notifications, setNotifications] = useState({
    emailDupAlert: true,
    emailQuotaWarning: true,
    slackReport: false,
    smsCriticalMerge: true
  });

  // Password reset States
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = (section: string) => {
    toast({
      title: "Settings Saved Successfully",
      description: `Your ${section} configuration adjustments have been updated in your profile preferences.`,
      type: "success"
    });
  };

  const handleRegenerateKey = () => {
    const randomKey = "lds_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApi({ ...api, apiKey: randomKey });
    toast({
      title: "API Credentials Regenerated",
      description: "A new authentication token has been created. Update this in your external headers.",
      type: "info"
    });
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.current || !password.new || !password.confirm) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all security input fields.",
        type: "error"
      });
      return;
    }
    if (password.new !== password.confirm) {
      toast({
        title: "Verification Mismatch",
        description: "Your new password and confirmation password do not match.",
        type: "error"
      });
      return;
    }

    toast({
      title: "Security Credentials Updated",
      description: "Your login credentials have been updated. Use your new password on next login.",
      type: "success"
    });
    setPassword({ current: "", new: "", confirm: "" });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Account & System Settings</h2>
        <p className="text-xs text-slate-400 font-medium mt-1">Configure profile coordinates, automated distribution routing rules, webhook callbacks, and warning toggles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-border-color">
          {[
            { id: "profile", label: "General & Profile", icon: User },
            { id: "routing", label: "Distribution Rules", icon: SlidersHorizontal },
            { id: "api", label: "Webhooks & API Keys", icon: Webhook },
            { id: "notifications", label: "Notification Toggles", icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-border-color"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${activeTab === tab.id ? "text-primary-color" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Configurations content panel */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            
            {/* 1. GENERAL & PROFILE */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <User className="h-4.5 w-4.5 text-indigo-500" />
                      Profile Settings
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 font-medium">
                      Configure your administrative contact parameters and appearance theme.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">ADMIN NAME</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({...profile, name: e.target.value})}
                          className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">EMAIL ADDRESS</label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({...profile, email: e.target.value})}
                          className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">CONTACT TELEPHONE</label>
                        <input
                          type="text"
                          value={profile.phone}
                          onChange={(e) => setProfile({...profile, phone: e.target.value})}
                          className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">TIMEZONE</label>
                        <select
                          value={profile.timezone}
                          onChange={(e) => setProfile({...profile, timezone: e.target.value})}
                          className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-200"
                        >
                          <option value="UTC+5:30 (IST)">UTC+5:30 (Indian Standard Time)</option>
                          <option value="UTC+0:00 (GMT)">UTC+0:00 (Greenwich Mean Time)</option>
                          <option value="UTC-5:00 (EST)">UTC-5:00 (Eastern Standard Time)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400">APPEARANCE MODE</label>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => theme === "dark" && toggleTheme()}
                          className={`px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer transition-all ${
                            theme === "light" 
                              ? "bg-slate-100 border-indigo-500 text-indigo-600 dark:bg-slate-800" 
                              : "border-border-color text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          ☀ Light Theme
                        </button>
                        <button
                          onClick={() => theme === "light" && toggleTheme()}
                          className={`px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer transition-all ${
                            theme === "dark" 
                              ? "bg-slate-800 border-indigo-500 text-indigo-400" 
                              : "border-border-color text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          ☾ Dark Theme
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        className="font-bold text-xs flex items-center gap-1.5 cursor-pointer h-9 rounded-xl"
                        onClick={() => handleSave("Profile & General")}
                      >
                        <Save className="h-4.5 w-4.5" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Password reset sub-card */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Key className="h-4.5 w-4.5 text-blue-500" />
                      Change Password
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 font-medium">
                      Ensure your system account is protected by updating passwords regularly.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-slate-400">CURRENT PASSWORD</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password.current}
                          onChange={(e) => setPassword({...password, current: e.target.value})}
                          className="w-full bg-background border border-border-color rounded-xl px-3 py-2 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400">NEW PASSWORD</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password.new}
                            onChange={(e) => setPassword({...password, new: e.target.value})}
                            className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400">CONFIRM PASSWORD</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password.confirm}
                            onChange={(e) => setPassword({...password, confirm: e.target.value})}
                            className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="font-bold text-xs h-9 rounded-xl border-border-color cursor-pointer"
                        >
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 2. ROUTING ENGINE RULES */}
            {activeTab === "routing" && (
              <motion.div
                key="routing"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <SlidersHorizontal className="h-4.5 w-4.5 text-purple-500" />
                      Distribution Routing Engine Rules
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 font-medium">
                      Establish allocation behaviors, routing constraints, and safety checkpoints.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Auto assigning toggle */}
                    <div className="flex items-center justify-between border-b border-border-color/60 pb-4">
                      <div className="space-y-0.5 max-w-[80%]">
                        <p className="text-xs font-bold text-slate-800 dark:text-white">Enable Automated Distribution</p>
                        <p className="text-[10px] text-slate-400">Incoming public service requests automatically allocate to matched providers without admin review.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={routing.autoAssign}
                        onChange={(e) => setRouting({...routing, autoAssign: e.target.checked})}
                        className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    {/* Allocation Selection Mode */}
                    <div className="space-y-2 border-b border-border-color/60 pb-4">
                      <label className="text-xs font-bold text-slate-400">ALGORITHM MATCHING MODE</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { id: "rating", title: "Highest Rating", desc: "Routes lead to the provider with the highest satisfaction score inside category." },
                          { id: "round-robin", title: "Round Robin", desc: "Evenly cycles allocations across active provider registries sequentially." },
                          { id: "load-balance", title: "Quota Balance", desc: "Prioritizes providers with lowest monthly quota consumption index." }
                        ].map((mode) => (
                          <div
                            key={mode.id}
                            onClick={() => setRouting({...routing, allocationMode: mode.id})}
                            className={`p-3 border rounded-xl cursor-pointer transition-all ${
                              routing.allocationMode === mode.id
                                ? "bg-indigo-500/5 border-indigo-500"
                                : "border-border-color hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            }`}
                          >
                            <p className={`text-xs font-bold ${routing.allocationMode === mode.id ? "text-indigo-500" : "text-slate-800 dark:text-slate-200"}`}>
                              {mode.title}
                            </p>
                            <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">{mode.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Safety check and limits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-border-color/60 pb-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">MAX ALLOCATION ATTEMPTS</label>
                        <input
                          type="number"
                          value={routing.maxRetries}
                          onChange={(e) => setRouting({...routing, maxRetries: parseInt(e.target.value) || 1})}
                          className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100 font-semibold"
                        />
                      </div>
                      <div className="flex items-center justify-between self-end pb-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800 dark:text-white font-sans">Apply Duplicate Shield</p>
                          <p className="text-[9px] text-slate-400">Hold leads matching recent phone records for manual merge checks.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={routing.safetyCheck}
                          onChange={(e) => setRouting({...routing, safetyCheck: e.target.checked})}
                          className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        className="font-bold text-xs flex items-center gap-1.5 cursor-pointer h-9 rounded-xl"
                        onClick={() => handleSave("Distribution Routing")}
                      >
                        <Save className="h-4.5 w-4.5" />
                        Save Rules
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 3. WEBHOOKS & API KEYS */}
            {activeTab === "api" && (
              <motion.div
                key="api"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Webhook className="h-4.5 w-4.5 text-emerald-500" />
                      Webhook Integrator Configuration
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 font-medium">
                      Configure outbound POST callbacks to deliver allocation payloads instantly to your CRM/database systems.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400">DESTINATION WEBHOOK URL</label>
                      <input
                        type="url"
                        value={api.webhookUrl}
                        onChange={(e) => setApi({...api, webhookUrl: e.target.value})}
                        className="w-full bg-background border border-border-color rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-color/30 text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>

                    {/* API Token Key */}
                    <div className="space-y-1 relative">
                      <label className="text-xs font-bold text-slate-400">ADMIN API AUTH TOKEN</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={api.apiKey}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-border-color rounded-xl px-3 py-2 text-xs font-mono text-slate-500 select-all"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-semibold text-xs border-border-color cursor-pointer h-9 rounded-xl flex items-center gap-1"
                          onClick={handleRegenerateKey}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Regenerate
                        </Button>
                      </div>
                    </div>

                    {/* Webhook Events Checklist */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400">WEBHOOK TOPIC TRIGGERS</label>
                      <div className="space-y-2.5">
                        {[
                          { key: "leadCreatedEvent", label: "lead.created", desc: "Dispatches immediately upon form submission (including duplicates)." },
                          { key: "leadAllocatedEvent", label: "lead.allocated", desc: "Fires once auto-matching rules route a lead to a provider successfully." },
                          { key: "leadDuplicateEvent", label: "lead.duplicate", desc: "Transmits duplicate check notifications on conflict warnings." }
                        ].map((evt) => (
                          <div key={evt.key} className="flex items-start justify-between bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-border-color/60">
                            <div className="space-y-0.5">
                              <code className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{evt.label}</code>
                              <p className="text-[10px] text-slate-400 font-medium">{evt.desc}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={(api as any)[evt.key]}
                              onChange={(e) => setApi({...api, [evt.key]: e.target.checked})}
                              className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer mt-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        className="font-bold text-xs flex items-center gap-1.5 cursor-pointer h-9 rounded-xl"
                        onClick={() => handleSave("Webhook API Integrations")}
                      >
                        <Save className="h-4.5 w-4.5" />
                        Save Integrations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 4. NOTIFICATION PREFERENCES */}
            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Bell className="h-4.5 w-4.5 text-blue-500" />
                      Alert & Notification Preferences
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 font-medium">
                      Specify which system triggers deliver email notifications, slack dispatches, or text alerts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {[
                      { 
                        key: "emailDupAlert", 
                        title: "Duplicate Check warning emails", 
                        desc: "Send daily digests to admin inbox detailing high-risk matching candidates.",
                        icon: Mail,
                        color: "text-blue-500 bg-blue-500/10"
                      },
                      { 
                        key: "emailQuotaWarning", 
                        title: "Partner Quota Depletion Warnings", 
                        desc: "Alert admins when a provider reaches 90% of their monthly limit allocation.",
                        icon: Mail,
                        color: "text-blue-500 bg-blue-500/10"
                      },
                      { 
                        key: "slackReport", 
                        title: "Slack Channel Operations Report", 
                        desc: "Publish hourly summaries of allocation efficiency directly into operations room.",
                        icon: MessageSquare,
                        color: "text-purple-500 bg-purple-500/10"
                      },
                      { 
                        key: "smsCriticalMerge", 
                        title: "SMS notifications for critical merges", 
                        desc: "Deliver high-priority SMS alerts for overrides of high-value duplicate matches.",
                        icon: MessageSquare,
                        color: "text-emerald-500 bg-emerald-500/10"
                      }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="flex items-center justify-between border-b border-border-color/60 pb-3 last:border-b-0 last:pb-0">
                          <div className="flex gap-3 items-start max-w-[85%]">
                            <div className={`p-2 rounded-lg mt-0.5 ${item.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800 dark:text-white">{item.title}</p>
                              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={(notifications as any)[item.key]}
                            onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                            className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                      );
                    })}

                    <div className="pt-4 flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        className="font-bold text-xs flex items-center gap-1.5 cursor-pointer h-9 rounded-xl"
                        onClick={() => handleSave("Notifications Preferences")}
                      >
                        <Save className="h-4.5 w-4.5" />
                        Save Preferences
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
