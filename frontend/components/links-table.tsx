"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildShortUrl } from "@/lib/app-path";

interface LinksTableProps {
  links: Array<{
    id: string;
    shortCode: string;
    longUrl: string;
    clicks: number;
    createdAt: string;
    shortUrl?: string;
  }>;
}

export default function LinksTable({ links }: LinksTableProps) {
  const handleCopy = (shortCode: string) => {
    const shortUrl = buildShortUrl(window.location.origin, shortCode);
    navigator.clipboard.writeText(shortUrl);
  };

  const handleOpen = (shortCode: string) => {
    window.open(buildShortUrl(window.location.origin, shortCode), "_blank");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle>All Links</CardTitle>
        <CardDescription>
          Detailed view of all your shortened links
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No links yet
            </p>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 border border-border rounded-lg hover:bg-accent transition gap-3 sm:gap-4"
                >
                  <div className="flex-1 min-w-0 w-full">
                    <p className="font-mono text-sm font-semibold">
                      {link.shortCode}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {link.longUrl}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(link.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    <div className="text-right min-w-fit">
                      <p className="text-lg font-bold">{link.clicks}</p>
                      <p className="text-xs text-muted-foreground">clicks</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(link.shortCode)}
                        title="Copy link"
                      >
                        📋
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpen(link.shortCode)}
                        title="Open link"
                      >
                        🔗
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
