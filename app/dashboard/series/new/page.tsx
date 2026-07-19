import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SeriesForm } from "@/components/series-form";

export const metadata: Metadata = { title: "New series" };

export default async function NewSeriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/series/new");

  const { data: genres } = await supabase.from("genres").select("*").order("name");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Create a new series</h1>
      <SeriesForm userId={user.id} genres={genres ?? []} />
    </div>
  );
}
