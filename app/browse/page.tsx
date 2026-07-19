import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Browse comics</h1>
      <BrowseFilters genres={genres ?? []} />
      <div className="mt-6">
        <SeriesGrid series={series} />
      </div>
    </div>
  );
}
