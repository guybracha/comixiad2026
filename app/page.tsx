import Link from "next/link";
import { ArrowRight, Globe2, PenTool, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SeriesGrid } from "@/components/series-card";
import { HeroFx } from "@/components/fx/hero-fx";
import { Reveal } from "@/components/fx/reveal";
import { LANGUAGES, type Series } from "@/lib/types";

export const revalidate = 60;

function withLikeCount(rows: (Series & { likes?: { count: number }[] })[] | null) {
  return (rows ?? []).map((s) => ({
    ...s,
    likes_count: s.likes?.[0]?.count ?? 0,
  }));
}

const GENRE_GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-fuchsia-500 to-rose-500",
  "from-rose-500 to-orange-400",
  "from-orange-400 to-amber-400",
  "from-emerald-500 to-teal-400",
  "from-teal-400 to-cyan-500",
  "from-cyan-500 to-blue-500",
  "from-blue-500 to-violet-500",
];

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: latestRaw }, { data: genres }] = await Promise.all([
    supabase
      .from("series")
      .select("*, profiles(*), likes(count)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("genres").select("*").order("name"),
  ]);

  const latest = withLikeCount(latestRaw);
  const popular = [...latest].sort(
    (a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0)
  );

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-hero">
        <HeroFx>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center">
            <h1
              data-hero-item
              className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-6xl"
            >
              Share your comics{" "}
              <span className="text-gradient">with the world</span>
            </h1>
            <p data-hero-item className="max-w-xl text-lg text-muted-foreground">
              Comixiad is home for comic creators from every country — publish
              your comics and webtoons, grow an audience, and discover stories
              from around the globe.
            </p>
            <div data-hero-item className="flex gap-3">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start creating <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/browse">Browse comics</Link>
              </Button>
            </div>
            <div
              data-hero-item
              className="mt-6 grid gap-6 text-sm text-muted-foreground sm:grid-cols-3"
            >
              <span className="flex items-center justify-center gap-2">
                <PenTool className="size-4 text-primary" /> Free publishing for
                creators
              </span>
              <span className="flex items-center justify-center gap-2">
                <Globe2 className="size-4 text-primary" /> Creators from every
                country
              </span>
              <span className="flex items-center justify-center gap-2">
                <Users className="size-4 text-primary" /> Built around community
              </span>
            </div>
          </div>
        </HeroFx>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <Reveal className="mb-12">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title text-xl font-bold">Fresh releases</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/browse">
                  See all <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <SeriesGrid series={latest} />
          </section>
        </Reveal>

        {popular.length > 0 && (popular[0].likes_count ?? 0) > 0 && (
          <Reveal className="mb-12">
            <section>
              <h2 className="section-title mb-4 text-xl font-bold">
                Popular this week
              </h2>
              <SeriesGrid series={popular.slice(0, 5)} />
            </section>
          </Reveal>
        )}

        {genres && genres.length > 0 && (
          <Reveal className="mb-12">
            <section>
              <h2 className="section-title mb-1 text-xl font-bold">
                Browse by genre
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Whatever you&apos;re into — there&apos;s a comic for it.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {genres.map((g, i) => (
                  <Link
                    key={g.id}
                    href={`/browse?genre=${g.slug}`}
                    data-reveal
                    className={`bg-gradient-to-br ${GENRE_GRADIENTS[i % GENRE_GRADIENTS.length]} flex h-16 items-center justify-center rounded-xl px-3 text-center text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg`}
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        <Reveal>
          <section>
            <h2 className="section-title mb-1 text-xl font-bold">
              Comics in every language
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Discover stories from creators all over the world.
            </p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.filter((l) => l.code !== "other").map((l) => (
                <Link
                  key={l.code}
                  href={`/browse?language=${l.code}`}
                  data-reveal
                  className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                >
                  <span className="text-base">{l.flag}</span> {l.name}
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
