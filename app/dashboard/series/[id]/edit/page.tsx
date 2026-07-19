import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SeriesForm } from "@/components/series-form";
import { ChapterListManager } from "@/components/chapter-list-manager";
import { CollaboratorsManager } from "@/components/collaborators-manager";
import { DeleteSeriesButton } from "@/components/delete-series-button";

export const metadata: Metadata = { title: "Edit series" };

export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: series } = await supabase
    .from("series")
    .select(
      "*, series_genres(genre_id), chapters(*, pages(count)), series_collaborators(series_id, user_id, role, profiles(id, username, display_name, avatar_url))"
    )
    .eq("id", id)
    .eq("creator_id", user.id)
    .single();
  if (!series) notFound();

  const { data: genres } = await supabase.from("genres").select("*").order("name");
  const chapters = [...(series.chapters ?? [])].sort(
    (a, b) => Number(a.number) - Number(b.number)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit series</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/series/${series.slug}`}>View public page</Link>
        </Button>
      </div>

      <SeriesForm
        userId={user.id}
        genres={genres ?? []}
        series={series}
        selectedGenreIds={series.series_genres?.map(
          (sg: { genre_id: number }) => sg.genre_id
        )}
      />

      <Separator className="my-10" />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Chapters</h2>
        <Button asChild>
          <Link href={`/dashboard/series/${series.id}/chapters/new`}>
            <Plus className="size-4" /> New chapter
          </Link>
        </Button>
      </div>
      <ChapterListManager chapters={chapters} seriesSlug={series.slug} />

      <Separator className="my-10" />

      <h2 className="mb-4 text-xl font-bold">Collaborators</h2>
      <CollaboratorsManager
        seriesId={series.id}
        collaborators={series.series_collaborators ?? []}
      />

      <Separator className="my-10" />

      <div className="rounded-lg border border-destructive/40 p-4">
        <h3 className="font-semibold text-destructive">Danger zone</h3>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">
          Deleting a series removes all its chapters, pages, comments and likes.
          This cannot be undone.
        </p>
        <DeleteSeriesButton seriesId={series.id} seriesTitle={series.title} />
      </div>
    </div>
  );
}
