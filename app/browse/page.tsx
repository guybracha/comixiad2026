import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SeriesGrid } from "@/components/series-card";
import { BrowseFilters } from "@/components/browse-filters";
import type { Series } from "@/lib/types";

export const metadata: Metadata = { title: "Browse comics" };

interface Props {
  searchParams: Promise<{ q?: string; genre?: string; language?: string; format?: string }>;
}

export default async function BrowsePage({ searchParams }: Props) {
  const { q, genre, language, format } = await searchParams;
  const supabase = await createClient();

  const { data: genres } = await supabase.from("genres").select("*").order("name");

  let query = supabase
    .from("series")
    .select("*, profiles(*), likes(count), series_genres!inner(genre_id, genres!inner(slug))")
    .order("created_at", { ascending: false })
    .limit(60);

  // When no genre filter, use a plain (non-inner) join so series without genres appear.
  if (!genre) {
    query = supabase
      .from("series")
      .select("*, profiles(*), likes(count)")
      .order("created_at", { ascending: false })
      .limit(60);
  } else {
    query = query.eq("series_genres.genres.slug", genre);
  }

  if (q) query = query.ilike("title", `%${q}%`);
  if (language) query = query.eq("language", language);
  if (format === "pages" || format === "webtoon") query = query.eq("format", format);

  const { data: rows } = await query;
  const series: Series[] = (rows ?? []).map((s) => ({
    ...s,
    likes_count: s.likes?.[0]?.count ?? 0,
  }));

  // When searching, also look for matching creators.
  const { data: creators } = q
    ? await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(12)
    : { data: null };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Browse comics</h1>
      <BrowseFilters genres={genres ?? []} />

      {creators && creators.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Creators</h2>
          <div className="flex flex-wrap gap-3">
            {creators.map((p) => (
              <Link
                key={p.id}
                href={`/creator/${p.username}`}
                className="flex items-center gap-2 rounded-full border bg-card py-1.5 pl-1.5 pr-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <Avatar className="size-8">
                  <AvatarImage src={p.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {(p.display_name ?? p.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {p.display_name ?? p.username}
                  <span className="ml-1 text-xs text-muted-foreground">
                    @{p.username}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6">
        <SeriesGrid series={series} />
      </div>
    </div>
  );
}
