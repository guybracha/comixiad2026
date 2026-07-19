"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Chapter } from "@/lib/types";

interface ChapterWithCount extends Omit<Chapter, "pages"> {
  pages: { count: number }[];
}

export function ChapterListManager({
  chapters,
  seriesSlug,
}: {
  chapters: ChapterWithCount[];
  seriesSlug: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function togglePublish(chapter: ChapterWithCount) {
    setBusyId(chapter.id);
    const supabase = createClient();
    const publishing = chapter.status === "draft";
    const { error } = await supabase
      .from("chapters")
      .update({
        status: publishing ? "published" : "draft",
        published_at: publishing ? new Date().toISOString() : null,
      })
      .eq("id", chapter.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(publishing ? "Chapter published!" : "Chapter unpublished.");
    router.refresh();
  }

  async function deleteChapter(chapter: ChapterWithCount) {
    if (!confirm(`Delete chapter ${chapter.number}? This cannot be undone.`)) return;
    setBusyId(chapter.id);
    const supabase = createClient();
    const { error } = await supabase.from("chapters").delete().eq("id", chapter.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Chapter deleted.");
    router.refresh();
  }

  if (chapters.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No chapters yet. Upload your first chapter to get started.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {chapters.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 rounded-lg border px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                Chapter {Number(c.number)}
                {c.title ? `: ${c.title}` : ""}
              </span>
              <Badge variant={c.status === "published" ? "default" : "secondary"}>
                {c.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {c.pages?.[0]?.count ?? 0} pages
            </p>
          </div>
          {c.status === "published" && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/series/${seriesSlug}/${Number(c.number)}`}>Read</Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={busyId === c.id}
            onClick={() => togglePublish(c)}
          >
            {c.status === "draft" ? (
              <>
                <Eye className="size-4" /> Publish
              </>
            ) : (
              <>
                <EyeOff className="size-4" /> Unpublish
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={busyId === c.id}
            onClick={() => deleteChapter(c)}
            aria-label="Delete chapter"
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}
