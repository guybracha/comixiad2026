import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SeriesGrid } from "@/components/series-card";
import type { Series } from "@/lib/types";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function CreatorPage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  if (!profile) notFound();

  const { data: seriesRaw } = await supabase
    .from("series")
    .select("*, profiles(*), likes(count)")
    .eq("creator_id", profile.id)
    .order("created_at", { ascending: false });

  const series: Series[] = (seriesRaw ?? []).map((s) => ({
    ...s,
    likes_count: s.likes?.[0]?.count ?? 0,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Avatar className="size-24">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
          <AvatarFallback className="text-2xl">
            {(profile.display_name ?? profile.username).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">
            {profile.display_name ?? profile.username}
          </h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.country && (
            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
              <MapPin className="size-3.5" /> {profile.country}
            </p>
          )}
          {profile.bio && <p className="mt-2 max-w-xl text-sm">{profile.bio}</p>}
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold">
        Comics ({series.length})
      </h2>
      <SeriesGrid series={series} />
    </div>
  );
}
