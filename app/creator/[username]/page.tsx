import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Globe, MapPin } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/brand-icons";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SeriesGrid } from "@/components/series-card";
import type { Series } from "@/lib/types";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url, country")
    .eq("username", username)
    .single();
  if (!data) return { title: `@${username}` };

  const name = data.display_name ?? data.username;
  const description =
    data.bio ??
    `Comics and webtoons by ${name}${data.country ? ` from ${data.country}` : ""} on Comixiad.`;

  return {
    title: `${name} (@${data.username})`,
    description,
    alternates: { canonical: `/creator/${username}` },
    openGraph: {
      type: "profile",
      title: `${name} (@${data.username})`,
      description,
      url: `/creator/${username}`,
      images: data.avatar_url ? [{ url: data.avatar_url }] : undefined,
    },
  };
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.display_name ?? profile.username,
    alternateName: `@${profile.username}`,
    description: profile.bio ?? undefined,
    image: profile.avatar_url ?? undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/creator/${profile.username}`,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
          {profile.social_links &&
            Object.keys(profile.social_links).length > 0 && (
              <div className="mt-3 flex items-center justify-center gap-1 sm:justify-start">
                {(
                  [
                    ["website", Globe, "Website"],
                    ["twitter", XIcon, "X / Twitter"],
                    ["instagram", InstagramIcon, "Instagram"],
                    ["youtube", YoutubeIcon, "YouTube"],
                    ["facebook", FacebookIcon, "Facebook"],
                  ] as const
                ).map(([key, Icon, label]) => {
                  const href = profile.social_links?.[key];
                  if (!href) return null;
                  return (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      title={label}
                      className="rounded-full border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Icon className="size-4" />
                    </a>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold">
        Comics ({series.length})
      </h2>
      <SeriesGrid series={series} />
    </div>
  );
}
