"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Check, Copy, Link2, Sparkles, BarChart3, QrCode, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { appFetch } from "@/lib/api";
import { buildShortUrl } from "@/lib/app-path";

interface LinkItem {
  id: string;
  longUrl: string;
  shortCode: string;
  shortUrl?: string;
  createdAt: string;
  title?: string;
}

interface RawApiResponse {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl?: string;
  createdAt: string;
  title?: string;
}

export default function Home() {
  const [longUrl, setLongUrl] = useState("");
  const [title, setTitle] = useState("");
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const response = await appFetch(
        `/api/urls?page=0&size=5`,
        {
          headers: {
            "Authorization": token ? `Bearer ${token}` : ""
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        const linksList = Array.isArray(data) ? data : (data?.content || data?.urls || []);
        
        setLinks(
          linksList
            .map((link: any) => ({
              id: link.id,
              longUrl: link.originalUrl,
              shortCode: link.code || link.shortCode,
              shortUrl: link.shortUrl,
              createdAt: link.createdAt,
              title: link.title,
            }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
    }
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!longUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Auto-prepend https:// if no protocol is specified
    let urlToShorten = longUrl.trim();
    if (!/^https?:\/\//i.test(urlToShorten)) {
      urlToShorten = `https://${urlToShorten}`;
      setLongUrl(urlToShorten);
    }

    try {
      new URL(urlToShorten);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("auth-token");
    
    try {
      // 1. Validate URL and fetch Title via internal API
      const validationRes = await appFetch("/internal/validate-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToShorten }),
      });

      if (!validationRes.ok) {
        const errorData = await validationRes.json();
        throw new Error(errorData.message || "Invalid or unreachable URL");
      }

      const { title: fetchedTitle } = await validationRes.json();

      // Generate a fallback title from the URL if no title was fetched
      const fallbackTitle = (() => {
        try {
          const urlObj = new URL(urlToShorten);
          const path = urlObj.pathname.replace(/^\/|\/$/g, "");
          return path ? `${urlObj.hostname}/${path}` : urlObj.hostname;
        } catch {
          return urlToShorten;
        }
      })();

      // 2. Shorten (using correct POST /api/urls endpoint)
      const response = await appFetch(
        `/api/urls`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
          },
          body: JSON.stringify({
            originalUrl: urlToShorten,
            title: (title || fetchedTitle || fallbackTitle).slice(0, 200),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to shorten URL");
      }

      const data = await response.json();
      const newLink: LinkItem = {
        id: data.id,
        longUrl: data.originalUrl,
        shortCode: data.code,
        shortUrl: data.shortUrl,
        createdAt: data.createdAt,
        title: data.title,
      };

      setLinks([newLink, ...links]);
      setLongUrl("");
      setTitle("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-full bg-background flex flex-col font-sans selection:bg-primary/20">
      
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden p-4 md:p-0">
        {/* Background Gradients */}
        <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
          <div className="absolute top-1/2 -left-1/4 w-1/2 h-1/2 bg-blue-500/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
        </div>

        <div className="container max-w-5xl mx-auto px-4 py-12 md:py-24 flex flex-col items-center">
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-10 animate-appear">
            <div className="inline-flex items-center justify-center p-2 mb-6 rounded-full bg-primary/5 text-primary border border-primary/10">
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Simple, fast, and secure link shortening</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              Shorten Your Links, <br /> Expand Your Reach
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform long, ugly URLs into short, trackable links in seconds. 
              Perfect for social media, marketing campaigns, and more.
            </p>
          </div>

          {/* Main Card */}
          <Card className="w-full max-w-2xl p-2 md:p-3 glass-card shadow-2xl animate-appear delay-100 mb-16 rounded-2xl">
            <div className="bg-background/50 rounded-xl p-6 md:p-8 border border-white/10">
              <form onSubmit={handleShorten} className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative group flex-1">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Link2 className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      id="url"
                      type="text"
                      placeholder="Paste your long URL here..."
                      value={longUrl}
                      onChange={(e) => setLongUrl(e.target.value)}
                      disabled={isLoading}
                      className="pl-12 h-14 text-lg bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl w-full"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isLoading}
                    size="lg"
                    className="h-14 px-8 rounded-xl font-semibold bg-primary hover:bg-primary/80 text-primary-foreground shadow-lg hover:cursor-pointer transition-all duration-300 active:scale-95 shrink-0"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                         <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                         <span>Shortening...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 ">
                        <span>Shorten It</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </div>
                
                {error && <p className="text-sm text-destructive font-medium animate-appear pl-1">{error}</p>}
              </form>
            </div>
          </Card>

          {/* Features Grid */}
          {links.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl animate-appear delay-200">
              {[
                { icon: QrCode, title: "QR Codes", desc: "Generate instant QR codes for your short links to share offline." },
                { icon: BarChart3, title: "Analytics", desc: "Track clicks, locations, and devices in real-time." },
                { icon: Link2, title: "Custom Aliases", desc: "Customize your short links to match your brand." }
              ].map((feature, i) => (
                <div key={i} className="group p-6 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/50 transition-colors backdrop-blur-sm">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recent Links */}
          {links.length > 0 && (
             <div className="w-full max-w-2xl animate-appear delay-200">
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="w-2 h-8 rounded-full bg-primary" />
                  Recent Links
                </h2>
                <Link href="/links" className="text-sm font-medium text-primary hover:text-primary/80 hover:cursor-pointer transition-colors">
                  View all
                </Link>
              </div>
              
              <div className="space-y-3">
                {links.map((link, index) => (
                  <div
                    key={link.id || link.shortCode || index}
                    className="group relative p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1 mb-1">
                          <span className="font-semibold text-foreground truncate max-w-[90%]">
                              {link.title || "Untitled Link"}
                          </span>
                          <div className="flex items-center gap-2">
                             <a 
                               href={link.shortUrl || buildShortUrl(window.location.origin, link.shortCode)}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="font-mono text-sm font-bold text-primary hover:underline hover:text-primary/80 truncate"
                             >
                                {(link.shortUrl || buildShortUrl(window.location.origin, link.shortCode)).replace(/^https?:\/\//, "")}
                             </a>
                             <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground">
                               Active
                             </span>
                          </div>
                          <span className="text-xs text-muted-foreground truncate max-w-[90%] opacity-75">
                             {link.longUrl}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(link.shortUrl || buildShortUrl(window.location.origin, link.shortCode), link.id || link.shortCode)}
                          className={cn(
                            "h-9 w-9 rounded-lg transition-all hover:cursor-pointer", 
                            copiedId === (link.id || link.shortCode) ? "text-green-600 bg-green-50" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {copiedId === (link.id || link.shortCode) ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                         <Link href={`/analytics/${link.shortCode}`}>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:cursor-pointer">
                               <BarChart3 className="w-4 h-4" />
                            </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
