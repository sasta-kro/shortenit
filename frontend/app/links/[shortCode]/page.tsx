"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, ExternalLink, Calendar, Clock, MousePointer2, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";


import { api } from "@/lib/api";
import { buildShortUrl } from "@/lib/app-path";
import { LinkDetails } from "@/lib/types";

export default function LinkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shortCodeParam = params.shortCode as string;

  const [link, setLink] = useState<LinkDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [expirationDays, setExpirationDays] = useState<string>("");
  const [clearExpiration, setClearExpiration] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (shortCodeParam) {
      fetchLinkDetails(shortCodeParam);
    }
  }, [shortCodeParam]);

  const fetchLinkDetails = async (codeToFetch: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.links.getOne(codeToFetch);
      setLink(data);
      
      // Initialize form defaults
      setTitle(data.title || "");
      setCode(data.code);
      setIsActive(data.isActive);
      setExpirationDays("");
      setClearExpiration(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (link?.shortUrl) {
      navigator.clipboard.writeText(link.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: any = {
        title,
        code, // shortCode
        isActive,
      };

      if (clearExpiration) {
        payload.clearExpiration = true;
      } else if (expirationDays) {
        // Ensure expirationDays is a valid number if provided
        const days = parseInt(expirationDays, 10);
        if (!isNaN(days) && days > 0) {
            payload.expirationDays = days;
        }
      }

      const updatedLink = await api.links.update(shortCodeParam, payload);
      
      setSuccessMessage("Link updated successfully!");
      setLink(updatedLink);
      
      // If code changed, we might need to update the URL or redirect.
      // Ideally, the user should be redirected to the new URL or the state updated handled.
      if (code !== shortCodeParam) {
           router.replace(`/links/${code}`);
      }
      
      // Clear specific temporary fields
      setExpirationDays("");
      setClearExpiration(false);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this link? This action cannot be undone.")) return;
    
    setDeleting(true);
    try {
      await api.links.delete(shortCodeParam);
      router.push("/links");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-1 flex items-center justify-center bg-background h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center bg-background h-full">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Error</h1>
          <p className="text-muted-foreground mb-6">{error || "Link not found"}</p>
          <Link href="/links">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Links
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-muted/30 font-sans">
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link href="/links" className="hover:text-foreground transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Links
                </Link>
                <span>/</span>
                <span>Details</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {/* Displaying Short URL as requested */}
                {link.title}
              </h1>
              <p className="text-muted-foreground break-all max-w-2xl">{link.shortUrl}</p>
            </div>
            <div className="flex items-center gap-3">
               <Button 
                 variant="outline" 
                 onClick={handleCopy}
                 className="shadow-sm"
               >
                  {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copied" : "Copy"}
               </Button>
               <Link href={`/analytics/${shortCodeParam}`}>
                  <Button variant="outline" className="shadow-sm">
                      <MousePointer2 className="w-4 h-4 mr-2" />
                      Analytics
                  </Button>
               </Link>
               <Button 
                  variant="destructive" 
                  size="icon"
                  className="shadow-sm"
                  onClick={handleDelete}
               >
                  <Trash2 className="w-4 h-4" />
               </Button>
            </div>
          </div>

          {successMessage && (
            <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm dark:bg-green-900/30 dark:border-green-800 dark:text-green-300">
               <div className="p-1 bg-green-200 dark:bg-green-800 rounded-full">
                  <Check className="w-3 h-3" />
               </div>
               {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Config Column */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                     <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <ExternalLink className="w-5 h-5" />
                     </div>
                     <div>
                        <CardTitle>Link Configuration</CardTitle>
                        <CardDescription>Manage settings for your short link</CardDescription>
                     </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Display Title
                          </label>
                          <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="e.g. My Awesome Portfolio"
                            className="bg-background/50 h-11"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Short Code (Alias)
                          </label>
                          <div className="flex shadow-sm rounded-md">
                             <div className="flex items-center px-4 bg-muted border border-r-0 rounded-l-md text-muted-foreground text-sm font-mono whitespace-nowrap">
                                {buildShortUrl(new URL(link.shortUrl).origin, "")}
                             </div>
                             <Input 
                               value={code} 
                               onChange={(e) => setCode(e.target.value)} 
                               className="rounded-l-none bg-background/50 h-11 font-mono"
                             />
                          </div>
                          <p className="text-[13px] text-muted-foreground">
                              Customize how your link looks. Changing this will redirect you to the new URL.
                          </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium">Link Status</label>
                            <p className="text-xs text-muted-foreground">
                                {isActive ? "Link is accessible to everyone" : "Link redirects to 404 page"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {isActive ? "Active" : "Inactive"}
                            </span>
                            <Button 
                                type="button" 
                                variant={isActive ? "outline" : "default"}
                                size="sm"
                                onClick={() => setIsActive(!isActive)}
                                className={!isActive ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                                {isActive ? "Deactivate" : "Activate"}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                         <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-medium">Expiration Settings</h3>
                         </div>
                         
                         <div className="p-5 bg-muted/30 rounded-xl border space-y-4">
                             {link.expiresAt && !clearExpiration ? (
                                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Expires on <strong>{new Date(link.expiresAt).toLocaleString()}</strong></span>
                                </div>
                             ) : (
                                <div className="text-sm text-muted-foreground mb-2 pl-1">
                                    Link currently has no expiration date.
                                </div>
                             )}

                             <div className="space-y-4 pt-2">
                                 <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="clearExpected" 
                                        checked={clearExpiration} 
                                        onChange={(e) => setClearExpiration(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="clearExpected" className="text-sm font-medium cursor-pointer select-none">
                                        Make Permanent (Remove Expiration)
                                    </label>
                                 </div>
                                 
                                 {!clearExpiration && (
                                     <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                         <span className="text-sm">Expire in:</span>
                                         <Input
                                            type="number"
                                            min="1"
                                            placeholder="30"
                                            value={expirationDays}
                                            onChange={(e) => setExpirationDays(e.target.value)}
                                            className="w-24 h-9"
                                         />
                                         <span className="text-sm text-muted-foreground">days</span>
                                     </div>
                                 )}
                             </div>
                         </div>
                    </div>

                    <div className="flex justify-end pt-2">
                       <Button type="submit" disabled={saving} size="lg" className="min-w-[140px] shadow-md transition-all hover:scale-[1.02]">
                         {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                                Saving...
                            </>
                         ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                         )}
                       </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Stats Column */}
            <div className="space-y-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Clicks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-primary">{link.clickCount}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MousePointer2 className="w-3 h-3" /> All time interactions
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="flex flex-row items-center border-b bg-muted/50 px-6 py-4">
                        <CardTitle className="text-base font-medium">
                          Link Metadata
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            <div className="flex justify-between p-4 hover:bg-muted/20 transition-colors">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Created
                                </span>
                                <span className="text-sm font-medium">{new Date(link.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between p-4 hover:bg-muted/20 transition-colors">
                                <span className="text-sm text-muted-foreground">Code Type</span>
                                <span className="text-sm font-medium px-2 py-0.5 bg-secondary rounded-full text-[10px] uppercase">
                                    {link.codeType}
                                </span>
                            </div>
                            <div className="flex justify-between p-4 hover:bg-muted/20 transition-colors">
                                <span className="text-sm text-muted-foreground">Link ID</span>
                                <span className="text-sm font-mono text-muted-foreground">#{link.id}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </div>
    </div>
  );
}
