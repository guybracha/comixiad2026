import Link from "next/link";
import Image from "next/image";
import { Eye, Heart, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { languageInfo, type Series } from "@/lib/types";

export function SeriesCard({ series }: { series: Series }) {
  return (
    <Link
      href={`/series/${series.slug}`}
      data-reveal
      className="group flex flex-col gap-2 rounded-xl"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-xl border bg-muted shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:shadow-lg group-hover:shadow-primary/15">
        {series.cover_url ? (
          <Image
            src={series.cover_url}
            alt={series.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-10" />
          </div>
        )}
        <Badge
          variant="secondary"
          className="absolute left-2 top-2 capitalize backdrop-blur"
        >
          {series.format === "webtoon" ? "Webtoon" : "Comic"}
        </Badge>
        <span
          className="absolute right-2 top-2 rounded bg-black/50 px-1 text-sm backdrop-blur"
          title={languageInfo(series.language).name}
        >
          {languageInfo(series.language).flag}
        </span>
      </div>
      <div className="px-1">
        <h3 className="line-clamp-1 font-semibold leading-tight">{series.title}</h3>
        <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="line-clamp-1">
            {series.profiles ? `by ${series.profiles.display_name ?? series.profiles.username}` : ""}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="flex items-center gap-1">
              <Eye className="size-3" /> {series.view_count ?? 0}
            </span>
            {typeof series.likes_count === "number" && (
              <span className="flex items-center gap-1">
                <Heart className="size-3" /> {series.likes_count}
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function SeriesGrid({ series }: { series: Series[] }) {
  if (series.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">No comics found.</p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {series.map((s) => (
        <SeriesCard key={s.id} series={s} />
      ))}
    </div>
  );
}
