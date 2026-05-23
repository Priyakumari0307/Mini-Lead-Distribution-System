"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, ShieldAlert, User, Sparkles, Briefcase } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useMockData } from "@/components/context/MockDataContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setCurrentUser } = useMockData();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@leadflow.com");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState("ADMIN");
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    if (!isSignUp) {
      // Switching to Sign Up, clear fields
      setName("");
      setEmail("");
      setPassword("");
    } else {
      // Switching to Sign In, restore pre-filled credentials
      setEmail("admin@leadflow.com");
      setPassword("password123");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError("Please fill in all fields.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      setIsLoading(true);
      try {
        // 1. Register the user
        await axios.post("/api/auth/register", { 
          name, 
          email, 
          password, 
          role 
        });

        // 2. Automatically log them in
        const loginResponse = await axios.post("/api/auth/login", { 
          email, 
          password 
        });
        
        setIsLoading(false);
        const { token, user } = loginResponse.data.data;
        localStorage.setItem("auth_token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setCurrentUser(user);
        
        toast({
          title: "Registration Successful!",
          description: `Welcome, ${name}! Your account has been created and you are now signed in.`,
          type: "success"
        });
        router.push("/dashboard");
      } catch (err: any) {
        setIsLoading(false);
        const errMsg = err.response?.data?.message || "Registration failed. Please try again.";
        setError(errMsg);
        toast({
          title: "Registration Failed",
          description: errMsg,
          type: "error"
        });
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError("Please fill in all fields.");
        return;
      }
      setIsLoading(true);

      try {
        const response = await axios.post("/api/auth/login", { email, password });
        setIsLoading(false);
        
        const { token, user } = response.data.data;
        localStorage.setItem("auth_token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setCurrentUser(user);
        
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to Admin Portal.",
          type: "success"
        });
        router.push("/dashboard");
      } catch (err: any) {
        setIsLoading(false);
        const errMsg = err.response?.data?.message || "Invalid email address or password.";
        setError(errMsg);
        toast({
          title: "Authentication Failed",
          description: errMsg,
          type: "error"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Animated Background Blur Highlight Circles */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [-20, 20, -20],
            y: [-30, 30, -30]
          }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [20, -20, 20],
            y: [30, -30, 30]
          }}
          transition={{ repeat: Infinity, duration: 8, delay: 2, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[100px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full z-10"
      >
        <Card className="bg-[#0b0f19]/80 border-slate-800 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
          
          <CardHeader className="text-center pt-8 pb-4">
            <div className="flex justify-center mb-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-indigo-500/20">
                L
              </div>
            </div>
            <CardTitle className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
              {isSignUp ? "Create an Account" : "Welcome Back!"}
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs font-semibold mt-1">
              {isSignUp 
                ? "Register a new profile to manage lead distribution rules." 
                : "Sign in to manage lead distribution rules & quotas."}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-6 md:px-8">
              
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-xs text-rose-300 font-bold">
                  <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Demo Credentials alert box */}
              {!isSignUp && (
                <div className="p-3 bg-blue-950/30 border border-blue-900/45 rounded-xl text-xs text-blue-300 font-semibold leading-relaxed flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold text-blue-400">
                    <Sparkles className="h-4 w-4" />
                    <span>Quick Demo Access (Pre-seeded)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">The system database is seeded automatically with the following administrator credentials:</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5 text-[11px]">
                    <span><strong>Email:</strong> <code className="text-blue-200 bg-blue-950/60 px-1 py-0.5 rounded">admin@leadflow.com</code></span>
                    <span><strong>Password:</strong> <code className="text-blue-200 bg-blue-950/60 px-1 py-0.5 rounded">password123</code></span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {isSignUp && (
                  <div className="relative flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-slate-400">Full Name</span>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="relative flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-slate-400">Email Address</span>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@leadflow.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="relative flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-400">Password</span>
                    {!isSignUp && (
                      <a href="#" className="text-[10px] font-bold text-blue-400 hover:underline">
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="relative flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-slate-400">Access Role</span>
                    <div className="relative flex items-center">
                      <Briefcase className="absolute left-3.5 h-4.5 w-4.5 text-slate-500" />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="ADMIN">Administrator (Full Access)</option>
                        <option value="SALES">Sales Agent (Restricted Access)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      defaultChecked
                      className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                    />
                    <label htmlFor="remember" className="text-xs text-slate-400 font-semibold cursor-pointer select-none">
                      Remember this device
                    </label>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="px-6 md:px-8 pb-6 pt-4 flex flex-col gap-4">
              <Button
                type="submit"
                variant="gradient"
                className="w-full py-3 rounded-xl font-bold cursor-pointer"
                isLoading={isLoading}
              >
                {isSignUp ? "Create Account & Sign In" : "Sign In to Dashboard"}
              </Button>

              <div className="text-center text-xs text-slate-400">
                {isSignUp ? (
                  <p>
                    Already have an admin profile?{" "}
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="text-blue-400 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                    >
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p>
                    Need a new administrator/sales account?{" "}
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="text-blue-400 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                    >
                      Create Account
                    </button>
                  </p>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
