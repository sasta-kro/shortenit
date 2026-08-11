"use client";

import { useState, useEffect } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "next-themes";
import { Trash2, Copy, Check, Plus, Key, Eye, EyeOff, Terminal, ExternalLink } from "lucide-react";
import { appFetch } from "@/lib/api";

interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  value?: string; // Full key value if available/stored
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [expirationDays, setExpirationDays] = useState("30");
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    if (user) {
        setEmail(user.email);
        setDisplayName(user.name || "");
        fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    setLoadingKeys(true);
    try {
        const token = localStorage.getItem("auth-token");
        const response = await appFetch(`/api/users/me/api-keys`, {
            headers: {
                "Authorization": token ? `Bearer ${token}` : ""
            }
        });
        if (response.ok) {
            const data = await response.json();
            const mappedKeys = (Array.isArray(data) ? data : []).map((k: any) => ({
                id: k.id.toString(), // Ensure string for consistency
                name: k.name,
                maskedKey: k.maskedKey || "wk_...****",
                value: k.apiKey || k.key || k.token, // Try multiple fields for full key
                createdAt: k.createdAt,
                expiresAt: k.expiresAt,
                lastUsedAt: k.lastUsedAt
            }));
            setApiKeys(mappedKeys);
        }
    } catch (error) {
        console.error("Failed to fetch API keys", error);
    } finally {
        setLoadingKeys(false);
    }
  };

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreatingKey(true);

    try {
        const token = localStorage.getItem("auth-token");
        const response = await appFetch(`/api/users/me/api-keys`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : ""
            },
            body: JSON.stringify({
                name: newKeyName,
                expirationDays: parseInt(expirationDays) || 30
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            const newKey: ApiKey = {
                id: (data.id || Date.now()).toString(),
                name: newKeyName,
                maskedKey: data.maskedKey || "wk_...****",
                value: data.apiKey || data.key || data.token, 
                createdAt: new Date().toISOString(),
                expiresAt: expirationDays ? new Date(Date.now() + parseInt(expirationDays) * 86400000).toISOString() : null,
                lastUsedAt: null
            };

            setApiKeys([newKey, ...apiKeys]);
            setNewKeyName("");
        }
    } catch (error) {
        console.error("Failed to create API key", error);
    } finally {
        setCreatingKey(false);
    }
  };



  const deleteApiKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) return;

    try {
        const token = localStorage.getItem("auth-token");
        await appFetch(`/api/users/me/api-keys/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": token ? `Bearer ${token}` : ""
            }
        });
        setApiKeys(apiKeys.filter(k => k.id !== id));
    } catch (error) {
        console.error("Failed to delete API key", error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReveal = (id: string) => {
    const newRevealed = new Set(revealedKeys);
    if (newRevealed.has(id)) {
        newRevealed.delete(id);
    } else {
        newRevealed.add(id);
    }
    setRevealedKeys(newRevealed);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <main className="flex-1 overflow-auto bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Settings</h1>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Settings */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                Account Settings
                </h2>
                <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-foreground">
                    Display Name
                    </label>
                    <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-2"
                    disabled
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-foreground">
                    Email
                    </label>
                    <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2"
                    disabled
                    />
                </div>
                </div>
            </Card>

            {/* Appearance Settings */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                Appearance
                </h2>
                <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                    Theme
                    </label>
                    <div className="flex flex-wrap gap-2">
                    {["light", "dark", "system"].map((themeOption) => (
                        <button
                        key={themeOption}
                        onClick={() => setTheme(themeOption)}
                        className={`px-4 py-2 rounded-lg border transition-colors capitalize flex-1 sm:flex-none hover:cursor-pointer ${
                            theme === themeOption
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-foreground hover:border-primary"
                        }`}
                        >
                        {themeOption}
                        </button>
                    ))}
                    </div>
                </div>
                </div>
            </Card>
          </div>

          {/* CLI Promotion */}
          <Card className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Terminal className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                         <Terminal className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">ShortenIt CLI</h2>
                        <p className="text-sm text-muted-foreground">Manage links directly from your terminal</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div className="space-y-4">
                        <div className="bg-zinc-950 text-zinc-50 rounded-lg p-3 font-mono text-sm border border-zinc-800 flex items-center justify-between shadow-sm">
                            <code className="text-blue-400">npm <span className="text-zinc-50">install -g</span> shortenit-cli</code>
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white hover:cursor-pointer" onClick={() => copyToClipboard("npm install -g shortenit-cli", "cli-install")}>
                                {copiedId === "cli-install" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                             </Button>
                        </div>
                         <div className="bg-zinc-950 text-zinc-50 rounded-lg p-3 font-mono text-sm border border-zinc-800 flex items-center justify-between shadow-sm">
                            <code className="text-blue-400">shortenit <span className="text-zinc-50">config</span></code>
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white hover:cursor-pointer" onClick={() => copyToClipboard("shortenit config <your-api-key>", "cli-config")}>
                                {copiedId === "cli-config" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                             </Button>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <ul className="space-y-2 text-sm text-muted-foreground">
                             <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Quick link shortening</li>
                             <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Bulk processing support</li>
                             <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Analytics in your terminal</li>
                        </ul>
                        <a 
                            href="https://www.npmjs.com/package/shortenit-cli" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 hover:cursor-pointer transition-colors"
                        >
                            View on npm <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                    </div>
                </div>
            </div>
          </Card>

          {/* API Keys Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Key className="w-5 h-5 text-primary" />
                        API Keys
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage API keys to access the ShortenIt API programmatically.
                    </p>
                </div>
            </div>

            {/* Create New Key */}
            <div className="bg-muted/30 p-4 rounded-lg border border-border mb-6">
                <h3 className="text-sm font-medium mb-3">Generate New Key</h3>
                <form onSubmit={createApiKey} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-xs text-muted-foreground mb-1 block">Key Name</label>
                        <Input 
                            placeholder="e.g. My CLI Script" 
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            className="bg-background"
                        />
                    </div>
                    <div className="w-full sm:w-32">
                         <label className="text-xs text-muted-foreground mb-1 block">Expires (Days)</label>
                         <Input 
                            type="number"
                            min="1"
                            value={expirationDays}
                            onChange={(e) => setExpirationDays(e.target.value)}
                            className="bg-background"
                        />
                    </div>
                    <Button type="submit" disabled={creatingKey || !newKeyName.trim()} className="hover:cursor-pointer">
                        {creatingKey ? (
                             <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Generate
                            </>
                        )}
                    </Button>
                </form>
            </div>
            <div className="space-y-4">
                <h3 className="text-sm font-medium">Your API Keys</h3>
                {loadingKeys ? (
                    <div className="text-center py-8 text-muted-foreground">Loading keys...</div>
                ) : apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                        No API keys found. Generate one to get started.
                    </div>
                ) : (
                    <div className="border rounded-lg divide-y">
                        {apiKeys.map((key) => (
                            <div key={key.id} className="p-4 flex flex-col gap-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{key.name}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground space-x-3">
                                            <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                                            {key.lastUsedAt && <span>Used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                                            {key.expiresAt && <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:cursor-pointer shrink-0"
                                        onClick={() => deleteApiKey(key.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                {/* Key Value Display */}
                                <div className="flex items-center gap-2 bg-muted/30 border border-border p-2 rounded relative group">
                                    <code className="flex-1 font-mono text-xs sm:text-sm break-all text-muted-foreground">
                                        {revealedKeys.has(key.id) 
                                            ? (key.value || "Hidden by server") 
                                            : (key.value ? "•".repeat(key.value.length) : key.maskedKey)
                                        }
                                    </code>
                                    <div className="flex items-center gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:cursor-pointer"
                                            onClick={() => toggleReveal(key.id)}
                                            title={revealedKeys.has(key.id) ? "Hide key" : "Reveal key"}
                                        >
                                           {revealedKeys.has(key.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                        </Button>
                                        
                                        {/* Show Copy button if we have a value OR if user wants to copy what is likely masked? 
                                            Usually only useful to copy the real value. 
                                            If we don't have the value, copying the mask is useless. 
                                            Only show copy if we have value.
                                        */}
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:cursor-pointer"
                                            onClick={() => copyToClipboard(key.value || "", key.id)}
                                            title="Copy key"
                                        >
                                            {copiedId === key.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
