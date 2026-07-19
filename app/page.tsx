import Link from "next/link";
import { ArrowRight, Globe2, PenTool, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SeriesGrid } from "@/components/series-card";
import type { Series } from "@/lib/types";

export const revalidate = 60;

function withLikeCount(rows: (Series & { likes?: { count: number }[] })[] | null) {
  return (rows ?? []).map((s) => ({
    ...s,
    likes_count: s.likes?.[0]?.count ?? 0,
  }));
}

export default async function HomePage() {
  const supabase = await createClient();

  const { data: latestRaw } = await supabase
    .from("series")
    .select("*, profiles(*), likes(count)")
    .order("created_at", { ascending: false })
    .limit(10);

  const latest = withLikeCount(latestRaw);
  const popular = [...latest].sort(
    (a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0)
  );

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/10 to-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center">
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Share your comics with the world
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Comixiad is home for comic creators from every country — publish your
            comics and webtoons, grow an audience, and discover stories from
            around the globe.
          </p>
          <div className="flex gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start creating <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/browse">Browse comics</Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-6 text-sm text-muted-foreground sm:grid-cols-3">
            <span className="flex items-center justify-center gap-2">
              <PenTool className="size-4 text-primary" /> Free publishing for creators
            </span>
            <span className="flex items-center justify-center gap-2">
              <Globe2 className="size-4 text-primary" /> Creators from every country
            </span>
            <span className="flex items-center justify-center gap-2">
              <Users className="size-4 text-primary" /> Built around community
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Fresh releases</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/browse">
                See all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <SeriesGrid series={latest} />
        </section>

        {popular.length > 0 && (popular[0].likes_count ?? 0) > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold">Popular this week</h2>
            <SeriesGrid series={popular.slice(0, 5)} />
          </section>
        )}
      </div>
    </div>
  );
}
