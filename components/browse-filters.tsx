"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES, type Genre } from "@/lib/types";

const ALL = "__all__";

function BrowseFiltersInner({ genres }: { genres: Genre[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const activeGenre = searchParams.get("genre");
  const activeLanguage = searchParams.get("language") ?? ALL;
  const activeFormat = searchParams.get("format") ?? ALL;

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value && value !== ALL) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== search) setParam("q", search || null);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters =
    !!activeGenre || activeLanguage !== ALL || activeFormat !== ALL || !!search;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="pl-8"
          />
        </div>
        <Select
          value={activeLanguage}
          onValueChange={(v) => setParam("language", v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All languages</SelectItem>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFormat} onValueChange={(v) => setParam("format", v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All formats</SelectItem>
            <SelectItem value="pages">Comics</SelectItem>
            <SelectItem value="webtoon">Webtoons</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              router.push(pathname);
            }}
          >
            <X className="size-4" /> Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {genres.map((g) => (
          <Badge
            key={g.id}
            variant={activeGenre === g.slug ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() =>
              setParam("genre", activeGenre === g.slug ? null : g.slug)
            }
          >
            {g.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function BrowseFilters({ genres }: { genres: Genre[] }) {
  return (
    <Suspense>
      <BrowseFiltersInner genres={genres} />
    </Suspense>
  );
}
