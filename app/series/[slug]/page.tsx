import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen, Globe, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeriesActions } from "@/components/series-actions";
import { LANGUAGES, type Chapter, type Genre } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("series")
    .select("title, description")
    .eq("slug", slug)
    .single();
  if (!data) return { title: "Not found" };
  return { title: data.title, description: data.description ?? undefined };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: series } = await supabase
    .from("series")
    .select(
      "*, profiles(*), genres(*), chapters(*), likes(count), follows(count)"
    )
    .eq("slug", slug)
    .single();
  if (!series) notFound();

  const isOwner = user?.id === series.creator_id;
  const chapters: Chapter[] = [...(series.chapters ?? [])]
    .filter((c: Chapter) => c.status === "published" || isOwner)
    .sort((a: Chapter, b: Chapter) => Number(a.number) - Number(b.number));
  const firstChapter = chapters.find((c) => c.status === "published");

  let liked = false;
  let followingSeries = false;
  if (user) {
    const [{ data: likeRow }, { data: followRow }] = await Promise.all([
      supabase
        .from("likes")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("series_id", series.id)
        .maybeSingle(),
      supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("series_id", series.id)
        .maybeSingle(),
    ]);
    liked = !!likeRow;
    followingSeries = !!followRow;
  }

  const languageName =
    LANGUAGES.find((l) => l.code === series.language)?.name ?? series.language;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-8 sm:flex-row">
        <div className="relative mx-auto aspect-2/3 w-48 shrink-0 overflow-hidden rounded-lg border bg-muted sm:mx-0 sm:w-56">
          {series.cover_url ? (
            <Image
              src={series.cover_url}
              alt={series.title}
              fill
              sizes="224px"
              priority
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-12" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <h1 className="text-3xl font-bold">{series.title}</h1>

          <Link
            href={`/creator/${series.profiles.username}`}
            className="flex w-fit items-center gap-2 hover:underline"
          >
            <Avatar className="size-7">
              <AvatarImage src={series.profiles.avatar_url ?? undefined} />
              <AvatarFallback>
                {series.profiles.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {series.profiles.display_name ?? series.profiles.username}
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="capitalize">
              {series.format === "webtoon" ? "Webtoon" : "Comic"}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {series.status}
            </Badge>
            <Badge variant="outline">
              <Globe className="size-3" /> {languageName}
            </Badge>
            {series.genres?.map((g: Genre) => (
              <Link key={g.id} href={`/browse?genre=${g.slug}`}>
                <Badge variant="outline" className="hover:bg-accent">
                  {g.name}
                </Badge>
              </Link>
            ))}
          </div>

          {series.description && (
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {series.description}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
            {firstChapter && (
              <Button asChild>
                <Link href={`/series/${series.slug}/${Number(firstChapter.number)}`}>
                  <BookOpen className="size-4" /> Start reading
                </Link>
              </Button>
            )}
            <SeriesActions
              seriesId={series.id}
              userId={user?.id ?? null}
              initialLiked={liked}
              initialFollowing={followingSeries}
              likeCount={series.likes?.[0]?.count ?? 0}
              followerCount={series.follows?.[0]?.count ?? 0}
            />
          </div>
        </div>
      </div>

      <h2 className="mb-3 mt-10 text-xl font-bold">
        Chapters ({chapters.filter((c) => c.status === "published").length})
      </h2>
      {chapters.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No chapters published yet — check back soon!
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {chapters.map((c) => (
            <Link
              key={c.id}
              href={`/series/${series.slug}/${Number(c.number)}`}
              className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-accent"
            >
              <span className="font-medium">
                Chapter {Number(c.number)}
                {c.title ? `: ${c.title}` : ""}
                {c.status === "draft" && (
                  <Badge variant="secondary" className="ml-2">
                    draft
                  </Badge>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {c.published_at
                  ? new Date(c.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
