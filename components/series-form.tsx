"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LANGUAGES, type Genre, type Series } from "@/lib/types";

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

interface Props {
  userId: string;
  genres: Genre[];
  series?: Series;
  selectedGenreIds?: number[];
}

export function SeriesForm({ userId, genres, series, selectedGenreIds }: Props) {
  const router = useRouter();
  const isEdit = !!series;

  const [title, setTitle] = useState(series?.title ?? "");
  const [description, setDescription] = useState(series?.description ?? "");
  const [language, setLanguage] = useState(series?.language ?? "en");
  const [format, setFormat] = useState(series?.format ?? "pages");
  const [direction, setDirection] = useState(series?.reading_direction ?? "ltr");
  const [status, setStatus] = useState(series?.status ?? "ongoing");
  const [genreIds, setGenreIds] = useState<number[]>(selectedGenreIds ?? []);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    series?.cover_url ?? null
  );
  const [saving, setSaving] = useState(false);

  function toggleGenre(id: number) {
    setGenreIds((prev) =>
      prev.includes(id)
        ? prev.filter((g) => g !== id)
        : prev.length >= 4
          ? (toast.error("Pick up to 4 genres."), prev)
          : [...prev, id]
    );
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required.");
    if (genreIds.length === 0) {
      return toast.error("Pick at least one genre so readers can find your comic.");
    }
    setSaving(true);
    const supabase = createClient();

    try {
      const seriesId = series?.id ?? crypto.randomUUID();

      let coverUrl = series?.cover_url ?? null;
      if (coverFile) {
        coverUrl = await uploadImage(
          "covers",
          `${userId}/${seriesId}.webp`,
          coverFile,
          { maxWidthOrHeight: 1000, maxSizeMB: 1 }
        );
      }

      const fields = {
        title: title.trim(),
        description: description.trim() || null,
        language,
        format,
        reading_direction: direction,
        status,
        cover_url: coverUrl,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("series")
          .update(fields)
          .eq("id", seriesId);
        if (error) throw error;
      } else {
        // Try a clean slug first; add a random suffix if it's taken.
        let slug = slugify(title) || "untitled";
        let { error } = await supabase.from("series").insert({
          id: seriesId,
          creator_id: userId,
          slug,
          ...fields,
        });
        if (error?.code === "23505") {
          slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
          ({ error } = await supabase.from("series").insert({
            id: seriesId,
            creator_id: userId,
            slug,
            ...fields,
          }));
        }
        if (error) throw error;
      }

      // Sync genres: replace the whole set.
      await supabase.from("series_genres").delete().eq("series_id", seriesId);
      if (genreIds.length > 0) {
        const { error } = await supabase
          .from("series_genres")
          .insert(genreIds.map((genre_id) => ({ series_id: seriesId, genre_id })));
        if (error) throw error;
      }

      toast.success(isEdit ? "Series updated." : "Series created.");
      router.push(`/dashboard/series/${seriesId}/edit`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col gap-2">
          <Label>Cover</Label>
          <label className="relative block aspect-2/3 w-40 cursor-pointer overflow-hidden rounded-lg border bg-muted transition-colors hover:border-primary">
            {coverPreview ? (
              <Image
                src={coverPreview}
                alt="Cover preview"
                fill
                sizes="160px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                Click to upload a cover (2:3 ratio recommended)
              </span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverChange}
              className="sr-only"
            />
          </label>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={150}
              placeholder="My Amazing Comic"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="What is your comic about?"
            />
          </div>
          <div className="grid gap-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label>Format</Label>
          <Select
            value={format}
            onValueChange={(v) => setFormat(v as typeof format)}
            disabled={isEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pages">Page by page (comic / manga)</SelectItem>
              <SelectItem value="webtoon">Vertical scroll (webtoon)</SelectItem>
            </SelectContent>
          </Select>
          {isEdit && (
            <p className="text-xs text-muted-foreground">
              Format can&apos;t be changed after creation.
            </p>
          )}
        </div>
        {format === "pages" && (
          <div className="grid gap-2">
            <Label>Reading direction</Label>
            <Select
              value={direction}
              onValueChange={(v) => setDirection(v as typeof direction)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ltr">Left to right (Western)</SelectItem>
                <SelectItem value="rtl">Right to left (Manga)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as typeof status)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="hiatus">On hiatus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Genres (pick 1–4)</Label>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Badge
              key={g.id}
              variant={genreIds.includes(g.id) ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => toggleGenre(g.id)}
            >
              {g.name}
            </Badge>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "Saving…" : isEdit ? "Save changes" : "Create series"}
      </Button>
    </form>
  );
}
