import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen, Eye, Globe, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeriesActions } from "@/components/series-actions";
import { CommentsSection } from "@/components/comments-section";
import { LANGUAGES, type Chapter, type Genre } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("series")
    .select("title, description, cover_url, language, profiles(username, display_name)")
    .eq("slug", slug)
    .single();
  if (!data) return { title: "Not found" };

  const profileRel = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  const creator = profileRel?.display_name ?? profileRel?.username;
  const description =
    data.description ??
    `Read ${data.title}${creator ? ` by ${creator}` : ""} free on Comixiad.`;

  return {
    title: data.title,
    description,
    alternates: { canonical: `/series/${slug}` },
    openGraph: {
      type: "article",
      title: data.title,
      description,
      url: `/series/${slug}`,
      images: data.cover_url ? [{ url: data.cover_url }] : undefined,
    },
    twitter: {
      card: data.cover_url ? "summary_large_image" : "summary",
      title: data.title,
      description,
      images: data.cover_url ? [data.cover_url] : undefined,
    },
  };
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
      "*, profiles(*), genres(*), chapters(*), likes(count), follows(count), series_collaborators(user_id, role, profiles(username, display_name, avatar_url))"
    )
    .eq("slug", slug)
    .single();
  if (!series) notFound();

  const { data: seriesComments } = await supabase
    .from("series_comments")
    .select("*, profiles(*)")
    .eq("series_id", series.id)
    .order("created_at", { ascending: false });

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ComicSeries",
    name: series.title,
    description: series.description ?? undefined,
    image: series.cover_url ?? undefined,
    inLanguage: series.language,
    genre: series.genres?.map((g: Genre) => g.name),
    author: {
      "@type": "Person",
      name: series.profiles.display_name ?? series.profiles.username,
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/creator/${series.profiles.username}`,
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
            {series.series_collaborators?.map(
              (c: {
                user_id: string;
                role: string;
                profiles: {
                  username: string;
                  display_name: string | null;
                  avatar_url: string | null;
                };
              }) => (
                <Link
                  key={c.user_id}
                  href={`/creator/${c.profiles.username}`}
                  className="flex w-fit items-center gap-2 text-muted-foreground hover:underline"
                  title={c.role}
                >
                  <Avatar className="size-6">
                    <AvatarImage src={c.profiles.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {c.profiles.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {c.profiles.display_name ?? c.profiles.username}
                    <span className="ml-1 text-xs">({c.role})</span>
                  </span>
                </Link>
              )
            )}
          </div>

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
            <Badge variant="outline">
              <Eye className="size-3" /> {series.view_count ?? 0} views
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

      <div className="mt-12">
        <CommentsSection
          table="series_comments"
          targetId={series.id}
          userId={user?.id ?? null}
          comments={seriesComments ?? []}
          title="Discussion"
        />
      </div>
    </div>
  );
}
