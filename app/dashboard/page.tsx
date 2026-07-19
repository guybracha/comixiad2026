import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookPlus, ImageIcon, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: series } = await supabase
    .from("series")
    .select("*, chapters(id, status), likes(count), follows(count)")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My comics</h1>
        <Button asChild>
          <Link href="/dashboard/series/new">
            <BookPlus className="size-4" /> New series
          </Link>
        </Button>
      </div>

      {!series || series.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-lg font-medium">You haven&apos;t created any series yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Create your first series, upload chapters, and share your comics with
              readers around the world.
            </p>
            <Button asChild className="mt-2">
              <Link href="/dashboard/series/new">
                <BookPlus className="size-4" /> Create your first series
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {series.map((s) => {
            const published = s.chapters?.filter(
              (c: { status: string }) => c.status === "published"
            ).length ?? 0;
            const drafts = (s.chapters?.length ?? 0) - published;
            return (
              <Card key={s.id}>
                <CardContent className="flex items-center gap-4">
                  <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded border bg-muted">
                    {s.cover_url ? (
                      <Image
                        src={s.cover_url}
                        alt={s.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/series/${s.slug}`}
                        className="font-semibold hover:underline"
                      >
                        {s.title}
                      </Link>
                      <Badge variant="outline" className="capitalize">
                        {s.format === "webtoon" ? "Webtoon" : "Comic"}
                      </Badge>
                      <Badge variant="secondary" className="capitalize">
                        {s.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {published} published {published === 1 ? "chapter" : "chapters"}
                      {drafts > 0 && ` · ${drafts} draft${drafts === 1 ? "" : "s"}`}
                      {" · "}
                      {s.likes?.[0]?.count ?? 0} likes · {s.follows?.[0]?.count ?? 0}{" "}
                      followers
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/series/${s.id}/edit`}>
                      <Pencil className="size-4" /> Manage
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
