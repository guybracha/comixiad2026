import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: series }, { data: profiles }] = await Promise.all([
    supabase.from("series").select("slug, created_at").limit(5000),
    supabase.from("profiles").select("username, created_at").limit(5000),
  ]);

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/browse`, changeFrequency: "daily", priority: 0.9 },
    ...(series ?? []).map((s) => ({
      url: `${siteUrl}/series/${s.slug}`,
      lastModified: new Date(s.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(profiles ?? []).map((p) => ({
      url: `${siteUrl}/creator/${p.username}`,
      lastModified: new Date(p.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
