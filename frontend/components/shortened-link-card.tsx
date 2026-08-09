"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildShortUrl, withBasePath } from "@/lib/app-path";

interface ShortenedLinkCardProps {
  link: {
    id: string;
    longUrl: string;
    shortCode: string;
    createdAt: string;
  };
}

export default function ShortenedLinkCard({ link }: ShortenedLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const shortUrl =
    typeof window !== "undefined"
      ? buildShortUrl(window.location.origin, link.shortCode)
      : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    const analytics = JSON.parse(
      localStorage.getItem("bitly-analytics") || "{}"
    );
    analytics[link.shortCode] = (analytics[link.shortCode] || 0) + 1;
    localStorage.setItem("bitly-analytics", JSON.stringify(analytics));
    setTimeout(() => setCopied(false), 2000);
  };

  const generateQRCode = () => {
    const encodedUrl = encodeURIComponent(shortUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
  };

  return (
    <Card className="p-4 md:p-6 mb-8 bg-primary/5 border border-primary/20">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Original URL</p>
          <p className="text-sm break-all text-foreground">{link.longUrl}</p>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Shortened URL</p>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <code className="flex-1 bg-background p-3 rounded border border-border font-mono text-xs md:text-sm overflow-auto">
              {shortUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="gap-2 shrink-0 bg-transparent w-full sm:w-auto"
            >
              {copied ? "✓" : "📋"}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowQR(!showQR)}
            className="gap-2"
          >
            📱 {showQR ? "Hide QR" : "Show QR"}
          </Button>
        </div>

        {showQR && (
          <div className="pt-4 border-t border-border flex justify-center">
            <div className="bg-background p-4 rounded border border-border">
              <img
                src={generateQRCode() || withBasePath("/placeholder.svg")}
                alt={`QR code for ${shortUrl}`}
                className="w-48 h-48"
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
