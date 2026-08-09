"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Download,
  Palette,
  Square,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
  Search,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appFetch } from "@/lib/api";
import { buildShortUrl } from "@/lib/app-path";


interface Url {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
}

const MOCK_URLS: Url[] = [
  {
    shortCode: "demo",
    shortUrl: "https://shortenit.freaks.dev/s/demo",
    originalUrl: "https://freaks.dev",
  },
];

const COLOR_PRESETS = [
  { name: "Classic", fg: "#000000", bg: "#FFFFFF" },
  { name: "Blue Ocean", fg: "#0ea5e9", bg: "#f0f9ff" },
  { name: "Emerald", fg: "#10b981", bg: "#ecfdf5" },
  { name: "Purple Dream", fg: "#a855f7", bg: "#faf5ff" },
  { name: "Sunset", fg: "#f97316", bg: "#fff7ed" },
  { name: "Dark Mode", fg: "#FFFFFF", bg: "#262626" },
];

const ERROR_LEVELS = [
  { value: "L", label: "Low (7%)" },
  { value: "M", label: "Medium (15%)" },
  { value: "Q", label: "Quartile (25%)" },
  { value: "H", label: "High (30%)" },
];

const PREVIEW_SIZE = 256;
const PAGE_SIZE = 10;

export default function QRCodesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QRCodesContent />
    </Suspense>
  );
}

function QRCodesContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code");
  const [urls, setUrls] = useState<Url[]>(MOCK_URLS);
  // Removed page state as we list all with search now
  const [selectedUrl, setSelectedUrl] = useState<Url>(MOCK_URLS[0]);
  
  // Combobox State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");

  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [marginSize, setMarginSize] = useState(4);
  const [size, setSize] = useState(256);
  const [includeMargin, setIncludeMargin] = useState(true);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSize, setLogoSize] = useState(20);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const response = await appFetch(
          `/api/urls?page=0&size=1000`,
          {
            headers: {
                "Authorization": token ? `Bearer ${token}` : ""
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          const linksList = Array.isArray(data) ? data : (data?.content || data?.urls || []);
          const fetchedUrls = linksList.map((link: any) => ({
            shortCode: link.code || link.shortCode,
            shortUrl:
              link.shortUrl ||
              buildShortUrl(window.location.origin, link.code || link.shortCode),
            originalUrl: link.originalUrl,
          }));
          
          if (fetchedUrls.length > 0) {
            setUrls(fetchedUrls);
            
            if (initialCode) {
              const preselected = fetchedUrls.find((u: Url) => u.shortCode === initialCode);
              if (preselected) {
                setSelectedUrl(preselected);
                const index = fetchedUrls.indexOf(preselected);
                if (index !== -1) {
                  // setPage(Math.floor(index / PAGE_SIZE)); // Pagination removed
                }
              } else {
                 setSelectedUrl(fetchedUrls[0]);
              }
            } else {
              setSelectedUrl(fetchedUrls[0]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch links:", error);
      }
    };

    fetchLinks();
  }, [initialCode]);

  const applyColorPreset = (preset: (typeof COLOR_PRESETS)[0]) => {
    setFgColor(preset.fg);
    setBgColor(preset.bg);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
        setErrorLevel("H");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    let svgData = new XMLSerializer().serializeToString(svg);
    svgData = svgData.replace(/width="[0-9]+"/, `width="${size}"`);
    svgData = svgData.replace(/height="[0-9]+"/, `height="${size}"`);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);

      if (logoUrl) {
        const logo = new Image();
        logo.onload = () => {
          const logoSizePixels = (size * logoSize) / 100;
          const x = (size - logoSizePixels) / 2;
          const y = (size - logoSizePixels) / 2;

          if (ctx) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(
              x - 5,
              y - 5,
              logoSizePixels + 10,
              logoSizePixels + 10
            );
            ctx.drawImage(logo, x, y, logoSizePixels, logoSizePixels);
          }

          downloadFile(canvas.toDataURL("image/png"));
        };
        logo.src = logoUrl;
      } else {
        downloadFile(canvas.toDataURL("image/png"));
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const downloadFile = (data: string) => {
    const link = document.createElement("a");
    link.download = `qr-${selectedUrl.shortCode}.png`;
    link.href = data;
    link.click();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background font-sans h-full">
        <div className="p-6 md:p-8 space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              QR Code Studio
            </h1>
            <p className="text-muted-foreground mt-2">
              Create customizable QR codes for your shortened links
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Preview Section */}
            <div className="space-y-6 lg:sticky lg:top-6">
              <div className="bg-card p-8 rounded-lg border border-border">
                <h3 className="font-semibold mb-4">Live Preview</h3>
                <div
                  className="flex justify-center items-center p-8 rounded-lg"
                  style={{ backgroundColor: bgColor }}
                >
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={selectedUrl.shortUrl}
                    size={PREVIEW_SIZE}
                    bgColor={bgColor}
                    fgColor={fgColor}
                    level={errorLevel}
                    marginSize={marginSize}
                  />
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="absolute rounded"
                      style={{
                        width: `${(PREVIEW_SIZE * logoSize) / 100}px`,
                        height: `${(PREVIEW_SIZE * logoSize) / 100}px`,
                        backgroundColor: bgColor,
                        padding: "4px",
                      }}
                    />
                  )}
                </div>
                <div className="mt-6 space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Selected Link
                  </div>
                  <div className="text-sm font-mono text-primary truncate">
                    {selectedUrl.shortUrl}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {selectedUrl.originalUrl}
                  </div>
                </div>
              </div>

              <Button onClick={downloadQRCode} size="lg" className="w-full hover:cursor-pointer">
                <Download className="w-4 h-4 mr-2" />
                Download QR Code (PNG)
              </Button>
            </div>

            {/* Customization Section */}
            <div className="space-y-6">
              {/* Select Link */}
              <div className="bg-card p-6 rounded-lg border border-border relative z-20">
                <h3 className="font-semibold mb-4">Select Link</h3>
                
                {/* Custom Combobox */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:cursor-pointer"
                  >
                    <span className="truncate">
                      {selectedUrl ? `${selectedUrl.shortCode} - ${selectedUrl.originalUrl}` : "Select a link..."}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-popover rounded-lg border border-border shadow-xl overflow-hidden z-50">
                      <div className="p-2 border-b border-border">
                        <div className="relative">
                           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                           <Input
                             placeholder="Search links..."
                             value={linkSearch}
                             onChange={(e) => setLinkSearch(e.target.value)}
                             className="pl-9 h-9 border-none bg-muted/50 focus-visible:ring-0"
                             autoFocus
                           />
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto p-1">
                        {urls
                          .filter(u => 
                             u.shortCode.toLowerCase().includes(linkSearch.toLowerCase()) || 
                             u.originalUrl.toLowerCase().includes(linkSearch.toLowerCase())
                          )
                          .map((url) => (
                          <button
                            key={url.shortCode}
                            onClick={() => {
                              setSelectedUrl(url);
                              setIsDropdownOpen(false);
                              setLinkSearch("");
                            }}
                            className={`w-full text-left px-3 py-2.5 text-sm rounded-md flex items-center justify-between hover:bg-accent hover:text-accent-foreground ${
                              selectedUrl.shortCode === url.shortCode ? "bg-accent/50 text-accent-foreground" : ""
                            }`}
                          >
                            <div className="flex flex-col truncate pr-2">
                               <span className="font-medium">{url.shortCode}</span>
                               <span className="text-muted-foreground text-xs truncate">{url.originalUrl}</span>
                            </div>
                            {selectedUrl.shortCode === url.shortCode && (
                               <Check className="w-4 h-4 text-primary" />
                            )}
                          </button>
                        ))}
                        {urls.filter(u => u.shortCode.toLowerCase().includes(linkSearch.toLowerCase()) || u.originalUrl.toLowerCase().includes(linkSearch.toLowerCase())).length === 0 && (
                           <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                             No links found.
                           </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* Overlay to close dropdown if clicked outside */}
                {isDropdownOpen && (
                   <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                )}
              </div>

              {/* Color Presets */}
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Color Themes
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyColorPreset(preset)}
                      className="p-4 rounded-lg border-2 border-border hover:border-primary hover:cursor-pointer transition-all"
                      style={{ backgroundColor: preset.bg }}
                      title={preset.name}
                    >
                      <div
                        className="text-xs font-medium text-center"
                        style={{ color: preset.fg }}
                      >
                        {preset.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="font-semibold mb-4">Custom Colors</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      QR Code Color
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Background Color
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Center Logo
                </h3>
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  
                  {!logoUrl ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all group"
                    >
                        <div className="p-3 bg-muted rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">Click to upload logo</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG or JPG, max 2MB</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border border-border">
                        {/* Small preview thumb */}
                        <div className="w-12 h-12 relative rounded bg-white border border-border flex items-center justify-center overflow-hidden shrink-0">
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Custom Logo</p>
                            <p className="text-xs text-muted-foreground">Attached</p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleRemoveLogo}
                            className="text-destructive hover:text-destructive hover:cursor-pointer shrink-0"
                        >
                            Remove
                        </Button>
                    </div>
                  )}

                  {logoUrl && (
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Logo Size</label>
                            <span className="text-xs text-muted-foreground">{logoSize}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="30"
                          value={logoSize}
                          onChange={(e) =>
                            setLogoSize(parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                    </div>
                  )}
                </div>
              </div>

              {/* Error Correction */}
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="font-semibold mb-4">Error Correction</h3>
                <div className="grid grid-cols-2 gap-2">
                  {ERROR_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setErrorLevel(level.value as any)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all hover:cursor-pointer ${
                        errorLevel === level.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size & Options */}
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Square className="w-5 h-5" />
                  Size & Spacing
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Size: {size}px
                    </label>
                    <input
                      type="range"
                      min="128"
                      max="2048"
                      step="64"
                      value={size}
                      onChange={(e) => setSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <label className="flex items-center gap-3 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMargin}
                      onChange={(e) => setIncludeMargin(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Include quiet zone</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
