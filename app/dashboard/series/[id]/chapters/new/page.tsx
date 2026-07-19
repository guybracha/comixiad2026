import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChapterUploadForm } from "@/components/chapter-upload-form";

export const metadata: Metadata = { title: "New chapter" };

export default async function NewChapterPage({
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
    .select("id, title, creator_id, chapters(number), series_collaborators(user_id)")
    .eq("id", id)
    .single();
  if (!series) notFound();

  const canUpload =
    series.creator_id === user.id ||
    (series.series_collaborators ?? []).some(
      (c: { user_id: string }) => c.user_id === user.id
    );
  if (!canUpload) notFound();

  const maxNumber = Math.max(
    0,
    ...(series.chapters ?? []).map((c: { number: number }) => Number(c.number))
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">Upload a chapter</h1>
      <p className="mb-6 text-muted-foreground">{series.title}</p>
      <ChapterUploadForm
        userId={user.id}
        seriesId={series.id}
        nextNumber={Math.floor(maxNumber) + 1}
      />
    </div>
  );
}
