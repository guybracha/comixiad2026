"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { compressImage, getImageDimensions } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PageDraft {
  id: string;
  file: File;
  preview: string;
}

interface Props {
  userId: string;
  seriesId: string;
  nextNumber: number;
}

export function ChapterUploadForm({ userId, seriesId, nextNumber }: Props) {
  const router = useRouter();
  const [number, setNumber] = useState(String(nextNumber));
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState<PageDraft[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  function addFiles(files: FileList | File[]) {
    const drafts = [...files]
      .filter((f) => f.type.startsWith("image/"))
      // natural sort so page_2 < page_10
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      )
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }));
    setPages((prev) => [...prev, ...drafts]);
  }

  function move(index: number, delta: number) {
    setPages((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    setPages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleDrop(index: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === index) return;
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  }

  async function save(publish: boolean) {
    const num = Number(number);
    if (!Number.isFinite(num) || num <= 0) {
      return toast.error("Chapter number must be a positive number.");
    }
    if (pages.length === 0) {
      return toast.error("Add at least one page image.");
    }

    const supabase = createClient();
    const chapterId = crypto.randomUUID();

    try {
      setProgress("Creating chapter…");
      const { error: chapterError } = await supabase.from("chapters").insert({
        id: chapterId,
        series_id: seriesId,
        number: num,
        title: title.trim() || null,
        status: "draft",
      });
      if (chapterError) {
        if (chapterError.code === "23505") {
          throw new Error(`Chapter ${num} already exists in this series.`);
        }
        throw chapterError;
      }

      const pageRows = [];
      for (let i = 0; i < pages.length; i++) {
        setProgress(`Uploading page ${i + 1} of ${pages.length}…`);
        const compressed = await compressImage(pages[i].file, {
          maxWidthOrHeight: 1600,
          maxSizeMB: 1.5,
        });
        const { width, height } = await getImageDimensions(compressed);
        const path = `${userId}/${chapterId}/${i + 1}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("pages")
          .upload(path, compressed, { contentType: "image/webp" });
        if (uploadError) throw uploadError;
        pageRows.push({
          chapter_id: chapterId,
          page_number: i + 1,
          image_path: path,
          width,
          height,
        });
      }

      setProgress("Saving pages…");
      const { error: pagesError } = await supabase.from("pages").insert(pageRows);
      if (pagesError) throw pagesError;

      if (publish) {
        setProgress("Publishing…");
        const { error } = await supabase
          .from("chapters")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", chapterId);
        if (error) throw error;
      }

      toast.success(publish ? "Chapter published!" : "Chapter saved as draft.");
      router.push(`/dashboard/series/${seriesId}/edit`);
      router.refresh();
    } catch (err) {
      // Clean up the chapter row so a failed upload can be retried cleanly.
      await supabase.from("chapters").delete().eq("id", chapterId);
      setProgress(null);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  const busy = progress !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <div className="grid gap-2">
          <Label htmlFor="number">Chapter #</Label>
          <Input
            id="number"
            type="number"
            min={0.1}
            step="any"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="title">Title (optional)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder="e.g. The Beginning"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Pages</Label>
        <label
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground transition-colors hover:border-primary"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
        >
          <ImagePlus className="size-8" />
          <span>
            Click or drag images here. They are sorted by filename — you can
            reorder them below.
          </span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {pages.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {pages.map((p, i) => (
            <div
              key={p.id}
              draggable={!busy}
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDrop(i);
              }}
              className="group relative aspect-2/3 cursor-grab overflow-hidden rounded border bg-muted"
            >
              <Image
                src={p.preview}
                alt={`Page ${i + 1}`}
                fill
                sizes="150px"
                className="object-cover"
                unoptimized
              />
              <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                {i + 1}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  className="rounded bg-white/20 p-1 text-white hover:bg-white/40"
                  aria-label="Move earlier"
                >
                  <ArrowUp className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  className="rounded bg-white/20 p-1 text-white hover:bg-white/40"
                  aria-label="Move later"
                >
                  <ArrowDown className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded bg-white/20 p-1 text-white hover:bg-red-500/70"
                  aria-label="Remove page"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={() => save(false)} variant="outline" disabled={busy}>
          Save as draft
        </Button>
        <Button onClick={() => save(true)} disabled={busy}>
          {busy ? progress : "Publish chapter"}
        </Button>
      </div>
    </div>
  );
}
