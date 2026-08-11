"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link2, ArrowRight, Zap, BarChart3, QrCode, Shield } from "lucide-react";
import { withBasePath } from "@/lib/app-path";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMicrosoftLogin = () => {
    setIsLoading(true);
    window.location.href = withBasePath("/oauth2/authorization/microsoft");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans relative overflow-hidden selection:bg-primary/20">
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/8 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/8 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-violet-500/5 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '5s' }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Hero */}
          <div className={`flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            
            {/* Badge */}
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Exclusive for AU Students</span>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Link2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Shortenit</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70">Shorten Links.</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-violet-500">Share Smarter.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              The smart URL shortener built for Assumption University. 
              Create short links, generate QR codes, and track every click — all in one place.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {[
                { icon: Zap, label: "Instant Shortening", color: "text-yellow-500" },
                { icon: BarChart3, label: "Click Analytics", color: "text-blue-500" },
                { icon: QrCode, label: "QR Code Generator", color: "text-violet-500" },
                { icon: Shield, label: "Secure & Reliable", color: "text-green-500" },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
                  <Icon className={`w-4 h-4 ${color} shrink-0`} />
                  <span className="text-sm font-medium text-foreground/80">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className={`relative w-full max-w-md mx-auto lg:max-w-none transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
             {/* Glow effects */}
             <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/15 rounded-full blur-3xl" />
             <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl" />

             <Card className="glass-card overflow-hidden border-white/10 dark:border-white/5 shadow-2xl relative">
                {/* Top gradient line */}
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-violet-500" />
                
                <div className="p-8 md:p-10 space-y-8">
                   {/* Card Header */}
                   <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary via-blue-600 to-violet-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-primary/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                          <Link2 className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight">Welcome to Shortenit</h2>
                        <p className="text-muted-foreground mt-1.5">Sign in with your AU Microsoft account</p>
                      </div>
                   </div>

                   {/* Divider */}
                   <div className="flex items-center gap-4">
                     <div className="flex-1 h-px bg-border" />
                     <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Continue with</span>
                     <div className="flex-1 h-px bg-border" />
                   </div>

                   {/* Microsoft Login Button */}
                   <Button
                     onClick={handleMicrosoftLogin}
                     disabled={isLoading}
                     variant="outline"
                     className="w-full h-14 text-base font-medium relative overflow-hidden group border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 rounded-xl hover:cursor-pointer"
                   >
                      {isLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          <span>Redirecting to Microsoft...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M1 1H11V11H1V1Z" fill="#f25022"/>
                            <path d="M13 1H23V11H13V1Z" fill="#7fba00"/>
                            <path d="M1 13H11V23H1V13Z" fill="#00a4ef"/>
                            <path d="M13 13H23V23H13V13Z" fill="#ffb900"/>
                          </svg>
                          <span>Sign in with Microsoft</span>
                          <ArrowRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </div>
                      )}
                   </Button>

                   {/* Info Notice */}
                   <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-1.5">
                     <p className="text-sm font-medium text-foreground/90 flex items-center gap-2">
                       <Shield className="w-4 h-4 text-primary shrink-0" />
                       Assumption University Only
                     </p>
                     <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                       This service is exclusively available for AU students and staff. 
                       Please use your <strong className="text-foreground/70">@au.edu</strong> Microsoft account to sign in.
                     </p>
                   </div>
                   
                   {/* Footer Text */}
                   <p className="text-center text-[11px] text-muted-foreground/60 leading-relaxed">
                     By signing in, you agree to our Terms of Service and Privacy Policy.
                   </p>
                </div>
                
                {/* Bottom Bar */}
                <div className="bg-muted/30 px-8 py-4 border-t border-border/30 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span>All systems operational</span>
                   </div>
                   <span className="text-xs font-medium text-muted-foreground/60">
                     v2.0
                   </span>
                </div>
             </Card>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-muted-foreground/50">
          © {new Date().getFullYear()} Shortenit · Built for Assumption University
        </p>
      </footer>
    </div>
  );
}
