import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PagedReader } from "@/components/reader/paged-reader";
import { WebtoonReader } from "@/components/reader/webtoon-reader";
import { CommentsSection } from "@/components/comments-section";
import type { Chapter, Page } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string; chapter: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapter } = await params;
  return { title: `${slug.replace(/-/g, " ")} — Chapter ${chapter}` };
}

export default async function ChapterPage({ params }: Props) {
  const { slug, chapter: chapterParam } = await params;
  const chapterNumber = Number(chapterParam);
  if (!Number.isFinite(chapterNumber)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: series } = await supabase
    .from("series")
    .select("id, title, slug, format, reading_direction, creator_id, chapters(*)")
    .eq("slug", slug)
    .single();
  if (!series) notFound();

  const isOwner = user?.id === series.creator_id;
  const visibleChapters: Chapter[] = [...(series.chapters ?? [])]
    .filter((c: Chapter) => c.status === "published" || isOwner)
    .sort((a: Chapter, b: Chapter) => Number(a.number) - Number(b.number));

  const chapter = visibleChapters.find((c) => Number(c.number) === chapterNumber);
  if (!chapter) notFound();

  const idx = visibleChapters.indexOf(chapter);
  const prev = idx > 0 ? visibleChapters[idx - 1] : null;
  const next = idx < visibleChapters.length - 1 ? visibleChapters[idx + 1] : null;
  const prevUrl = prev ? `/series/${series.slug}/${Number(prev.number)}` : null;
  const nextUrl = next ? `/series/${series.slug}/${Number(next.number)}` : null;

  const [{ data: pagesData }, { data: comments }] = await Promise.all([
    supabase
      .from("pages")
      .select("*")
      .eq("chapter_id", chapter.id)
      .order("page_number"),
    supabase
      .from("comments")
      .select("*, profiles(*)")
      .eq("chapter_id", chapter.id)
      .order("created_at", { ascending: false }),
  ]);

  const pages = (pagesData ?? []).map((p: Page) => ({
    page_number: p.page_number,
    url: publicUrl("pages", p.image_path),
    width: p.width,
    height: p.height,
  }));

  return (
    <div className="px-2 py-4 sm:px-4">
      {/* Reader header */}
      <div className="mx-auto mb-4 flex max-w-5xl flex-wrap items-center justify-center gap-2 sm:justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/series/${series.slug}`}>
            <List className="size-4" /> {series.title}
          </Link>
        </Button>
        <span className="text-sm font-medium">
          Chapter {Number(chapter.number)}
          {chapter.title ? `: ${chapter.title}` : ""}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={!prevUrl} asChild={!!prevUrl}>
            {prevUrl ? (
              <Link href={prevUrl}>
                <ChevronLeft className="size-4" /> Prev
              </Link>
            ) : (
              <span>
                <ChevronLeft className="size-4" /> Prev
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" disabled={!nextUrl} asChild={!!nextUrl}>
            {nextUrl ? (
              <Link href={nextUrl}>
                Next <ChevronRight className="size-4" />
              </Link>
            ) : (
              <span>
                Next <ChevronRight className="size-4" />
              </span>
            )}
          </Button>
        </div>
      </div>

      {pages.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          This chapter has no pages yet.
        </p>
      ) : series.format === "webtoon" ? (
        <WebtoonReader pages={pages} />
      ) : (
        <PagedReader
          pages={pages}
          direction={series.reading_direction}
          prevChapterUrl={prevUrl}
          nextChapterUrl={nextUrl}
        />
      )}

      {/* Bottom navigation */}
      <div className="mx-auto mt-8 flex max-w-3xl items-center justify-between">
        <Button variant="outline" disabled={!prevUrl} asChild={!!prevUrl}>
          {prevUrl ? (
            <Link href={prevUrl}>
              <ChevronLeft className="size-4" /> Previous chapter
            </Link>
          ) : (
            <span>
              <ChevronLeft className="size-4" /> Previous chapter
            </span>
          )}
        </Button>
        <Button variant="outline" disabled={!nextUrl} asChild={!!nextUrl}>
          {nextUrl ? (
            <Link href={nextUrl}>
              Next chapter <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span>
              Next chapter <ChevronRight className="size-4" />
            </span>
          )}
        </Button>
      </div>

      <Separator className="mx-auto my-8 max-w-3xl" />
      <CommentsSection
        chapterId={chapter.id}
        userId={user?.id ?? null}
        comments={comments ?? []}
      />
    </div>
  );
}
