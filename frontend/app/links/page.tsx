"use client";

import { useState, useEffect } from "react";
import { Copy, Plus, BarChart2, Trash2, ChevronLeft, ChevronRight, Search, Check, Lock, AlertCircle, QrCode, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


import { api } from "@/lib/api";
import { Url } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";

export default function LinksPage() {
  const { user } = useAuth();
  const [urls, setUrls] = useState<Url[]>([]);
  const [displayedUrls, setDisplayedUrls] = useState<Url[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newUrlTitle, setNewUrlTitle] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expirationDays, setExpirationDays] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAllLinks, setShowAllLinks] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // UI State
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [errorObj, setErrorObj] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page on search
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery]);

  // Fetch Links
  useEffect(() => {
    fetchUrls();
  }, [showAllLinks]);

  // Filter and Paginate locally (since API is simple GET /urls returning all)
  useEffect(() => {
    let filtered = [...urls];

    if (debouncedSearchQuery) {
      const lowerQuery = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.title.toLowerCase().includes(lowerQuery) ||
          u.originalUrl.toLowerCase().includes(lowerQuery) ||
          u.shortCode.toLowerCase().includes(lowerQuery) ||
          (u.customAlias && u.customAlias.toLowerCase().includes(lowerQuery))
      );
    }

    setTotalElements(filtered.length);
    setTotalPages(Math.ceil(filtered.length / size));

    const start = page * size;
    const end = start + size;
    setDisplayedUrls(filtered.slice(start, end));
  }, [urls, page, size, debouncedSearchQuery]);

  const fetchUrls = async () => {
    setLoading(true);
    try {
      let data;
      if (showAllLinks && user?.role === "ADMIN") {
        // Fetch all links from admin endpoint
        data = await api.admin.getAllLinks({ page: 0, size: 1000, sortBy: "createdAt", direction: "DESC" });
      } else {
        // Fetch user's own links
        data = await api.links.getAll();
      }
      
      const linksList = Array.isArray(data) ? data : ((data as any)?.content || (data as any)?.urls || []);
      const mappedUrls = linksList.map((link: any) => ({
        id: link.id,
        originalUrl: link.originalUrl,
        shortCode: link.code || link.shortCode,
        shortUrl: link.shortUrl || `${window.location.origin}/s/${link.code || link.shortCode}`,
        clickCount: link.clickCount || 0,
        createdAt: link.createdAt,
        customAlias: link.customAlias,
        title: link.title,
        isActive: link.isActive !== undefined ? link.isActive : true,
        owner: link.owner,
      }));
      setUrls(mappedUrls);
    } catch (error) {
      console.error("Failed to fetch URLs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setLoading(true);

    try {
      // Auto-prepend https:// if no protocol is specified
      let urlToShorten = newUrl.trim();
      if (!/^https?:\/\//i.test(urlToShorten)) {
        urlToShorten = `https://${urlToShorten}`;
        setNewUrl(urlToShorten);
      }

      // 1. Validate URL and fetch Title via internal API
      const { title: fetchedTitle } = await api.links.validate(urlToShorten);

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

      // 2. Proceed to shorten with the fetched title
      await api.links.create({
        originalUrl: urlToShorten,
        code: customAlias || undefined,
        title: (newUrlTitle || fetchedTitle || fallbackTitle).slice(0, 200),
        expirationDays: expirationDays ? parseInt(expirationDays) : undefined,
      });

      setNewUrl("");
      setNewUrlTitle("");
      setCustomAlias("");
      setExpirationDays("");
      setShowAdvanced(false);
      fetchUrls(); // Refresh list
    } catch (error: any) {
      console.error("Failed to shorten URL", error);
      setErrorObj({ isOpen: true, title: "Error", message: error.message });
    } finally {
        setLoading(false);
    }
  };

  const handleBulkShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkUrls) return;

    const urlsToShorten = bulkUrls.split('\n').filter(u => u.trim());
    
    // Process sequentially or parallel. Parallel is better for UX.
    // Since backend might not have bulk endpoint, we loop.
    try {
      setLoading(true);
      await Promise.all(urlsToShorten.map(async (url) => {
        let title = url; 
        try {
             // Try to fetch title, but proceed even if it fails (using URL as title)
             const data = await api.links.validate(url);
             if (data.title) title = data.title;
        } catch (e) {
             console.warn(`Failed to fetch title for ${url}`, e);
        }

        return api.links.create({ 
            originalUrl: url,
            title: title.slice(0, 200),
            expirationDays: expirationDays ? parseInt(expirationDays) : undefined
         });
      }));

      setBulkUrls("");
      setExpirationDays("");
      setShowAdvanced(false);
      setShowBulk(false);
      fetchUrls();
    } catch (error: any) {
      console.error("Failed to bulk shorten URLs", error);
      setErrorObj({ isOpen: true, title: "Error", message: "Failed to process some URLs." });
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const linkToDelete = urls.find(u => u.shortCode === deleteId);
    if (!linkToDelete) return;

    try {
        await api.links.delete(deleteId);
        
        const updatedUrls = urls.filter(u => u.shortCode !== deleteId);
        setUrls(updatedUrls);
        setDeleteId(null);
    } catch (error) {
        console.error("Failed to delete URL", error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrlId(id);
    setTimeout(() => setCopiedUrlId(null), 500);
  };

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-background font-sans">
        <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Links</h1>
            {user?.role === "ADMIN" && (
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1 ">
                <Button
                  variant={!showAllLinks ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowAllLinks(false)}
                  className="text-sm hover:cursor-pointer "
                >
                  My Links
                </Button>
                <Button
                  variant={showAllLinks ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowAllLinks(true)}
                  className="text-sm hover:cursor-pointer "
                >
                  All Links
                </Button>
              </div>
            )}
        </header>

        {/* Create Section */}
        <Card className="border-border bg-card">
            <CardContent className="pt-6">
                <div className="flex justify-between mb-4">
                    <h2 className="text-lg font-semibold">Create New Link</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBulk(!showBulk)}
                        className="text-primary hover:text-primary/80 hover:cursor-pointer"
                    >
                        {showBulk ? "Switch to Single" : "Switch to Bulk"}
                    </Button>
                </div>

                {showBulk ? (
                    <form onSubmit={handleBulkShorten} className="space-y-4">
                        <textarea
                            value={bulkUrls}
                            onChange={(e) => setBulkUrls(e.target.value)}
                            placeholder="Paste multiple URLs here (one per line)..."
                            className="w-full h-32 bg-background border border-input rounded-lg px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                        />
                         
                         <div>
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-sm text-primary hover:underline hover:cursor-pointer   flex items-center gap-1"
                            >
                                {showAdvanced ? "Hide" : "Show"} Advanced Options
                            </button>
                        </div>

                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Expiration (Days)</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={expirationDays}
                                        onChange={(e) => setExpirationDays(e.target.value)}
                                        placeholder="e.g. 7"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">Applies to all links in this batch.</p>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full sm:w-auto hover:cursor-pointer hover:bg-primary/80">
                            <Plus className="w-4 h-4" />
                            Bulk Shorten
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleShorten} className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input
                                type="text"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="Paste your long URL here..."
                                className="flex-1"
                                required
                            />
                            <Button type="submit" className="w-full sm:w-auto hover:cursor-pointer hover:bg-primary/80">
                                <Plus className="w-4 h-4" />
                                <span className="">Shorten it</span>
                            </Button>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-sm text-primary hover:underline hover:cursor-pointer flex items-center gap-1"
                            >
                                {showAdvanced ? "Hide" : "Show"} Advanced Options
                            </button>
                        </div>

                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Custom Alias (Optional)</label>
                                    <Input
                                        type="text"
                                        value={customAlias}
                                        onChange={(e) => setCustomAlias(e.target.value)}
                                        placeholder="e.g. summer-sale"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Expiration (Days)</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={expirationDays}
                                        onChange={(e) => setExpirationDays(e.target.value)}
                                        placeholder="e.g. 7"
                                    />
                                </div>
                            </div>
                        )}
                    </form>
                )}
            </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search links..."
                className="pl-10"
            />
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
             <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : displayedUrls.length === 0 ? (
             <Card className="p-8 text-center text-muted-foreground bg-muted/50">
                No links found.
             </Card>
          ) : (
              <div className="grid gap-4">
                {displayedUrls.map((url) => (
                    <Card key={url.shortCode} className="group relative transition-all duration-300 hover:border-primary/50 shadow-sm hover:shadow-md border-border bg-card overflow-hidden">
                        <CardContent>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col gap-1 mb-2">
                                        <span className="font-semibold text-foreground text-lg line-clamp-1 md:truncate">
                                            {url.title || "Untitled Link"}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={url.shortUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-mono text-sm font-bold text-primary hover:underline hover:text-primary/80 truncate max-w-[200px] sm:max-w-none"
                                            >
                                                {url.shortUrl.replace(/^https?:\/\//, '')}
                                            </a>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                onClick={() => copyToClipboard(url.shortUrl, url.shortCode)}
                                            >
                                                {copiedUrlId === url.shortCode ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                            </Button>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${url.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                                                {url.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground line-clamp-1 md:truncate opacity-75">
                                            {url.originalUrl}
                                        </span>
                                    </div>
                                
                                <div className="flex flex-col gap-1">
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <span>{new Date(url.createdAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> {url.clickCount} clicks</span>
                                    </div>
                                    {url.owner && (
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <UserIcon className="w-3 h-3" />
                                            <span className="truncate">{url.owner.name} ({url.owner.email})</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                                <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                                    <Link href={`/qrcodes?code=${url.shortCode}`}>
                                        <Button variant="outline" size="icon" className="h-9 w-9">
                                            <QrCode className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <Link href={`/links/${url.shortCode}`}>
                                        <Button variant="outline" size="icon" className="h-9 w-9">
                                            <Settings className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <Link href={`/analytics/${url.shortCode}`}>
                                        <Button variant="outline" size="icon" className="h-9 w-9">
                                            <BarChart2 className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <Button 
                                        variant="outline" 
                                        size="icon"
                                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setDeleteId(url.shortCode)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
             </div>
          )}

          {/* Pagination */}
          {totalElements > 0 && (
             <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                <div className="text-sm text-muted-foreground">
                    Showing {page * size + 1} to {Math.min((page + 1) * size, totalElements)} of {totalElements}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                        {(() => {
                           const items = [];
                           const maxVisible = 5;
                           
                           // Logic for simpler pagination: 
                           // If totalPages <= maxVisible, show all.
                           // Else show [1] ... [current-1] [current] [current+1] ... [last]
                           
                           if (totalPages <= maxVisible) {
                             for (let i = 0; i < totalPages; i++) {
                               items.push(i);
                             }
                           } else {
                             // Always include first page
                             items.push(0);
                             
                             if (page > 2) {
                               items.push('ellipsis-start');
                             }
                             
                             // Middle items
                             const start = Math.max(1, page - 1);
                             const end = Math.min(totalPages - 2, page + 1);
                             
                             for (let i = start; i <= end; i++) {
                               items.push(i);
                             }
                             
                             if (page < totalPages - 3) {
                               items.push('ellipsis-end');
                             }
                             
                             // Always include last page
                             items.push(totalPages - 1);
                           }
                           
                           return items.map((item, idx) => {
                             if (typeof item === 'string') {
                               return <span key={item} className="px-2 text-muted-foreground">...</span>;
                             }
                             return (
                               <Button
                                 key={item}
                                 variant={page === item ? "default" : "outline"}
                                 size="icon"
                                 onClick={() => setPage(item)}
                                 className="h-8 w-8"
                               >
                                 {item + 1}
                               </Button>
                             );
                           });
                        })()}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Delete Link</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Are you sure you want to delete this link? This action cannot be undone.</p>
                </CardContent>
                <div className="p-6 pt-0 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </div>
            </Card>
        </div>
      )}

      {/* Error Modal Overlay */}
      {errorObj.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md border-destructive/50">
                <CardHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-5 h-5" />
                        <CardTitle>Error</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{errorObj.message}</p>
                </CardContent>
                <div className="p-6 pt-0 flex justify-end">
                    <Button onClick={() => setErrorObj({ ...errorObj, isOpen: false })}>Close</Button>
                </div>
            </Card>
        </div>
      )}
      </div>
  );
}
