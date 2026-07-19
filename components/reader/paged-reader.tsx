"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReaderPage {
  page_number: number;
  url: string;
  width: number | null;
  height: number | null;
}

interface Props {
  pages: ReaderPage[];
  direction: "ltr" | "rtl";
  prevChapterUrl: string | null;
  nextChapterUrl: string | null;
}

export function PagedReader({ pages, direction, prevChapterUrl, nextChapterUrl }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const page = pages[index];
  const isRtl = direction === "rtl";

  const goForward = useCallback(() => {
    setIndex((i) => {
      if (i < pages.length - 1) return i + 1;
      if (nextChapterUrl) router.push(nextChapterUrl);
      return i;
    });
  }, [pages.length, nextChapterUrl, router]);

  const goBack = useCallback(() => {
    setIndex((i) => {
      if (i > 0) return i - 1;
      if (prevChapterUrl) router.push(prevChapterUrl);
      return i;
    });
  }, [prevChapterUrl, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // In RTL (manga) the left arrow moves forward.
      if (e.key === "ArrowRight") isRtl ? goBack() : goForward();
      if (e.key === "ArrowLeft") isRtl ? goForward() : goBack();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRtl, goForward, goBack]);

  // Preload the next page image.
  useEffect(() => {
    const next = pages[index + 1];
    if (next) {
      const img = new window.Image();
      img.src = next.url;
    }
  }, [index, pages]);

  if (!page) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex w-full justify-center">
        {/* click zones */}
        <button
          className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize"
          onClick={() => (isRtl ? goForward() : goBack())}
          aria-label={isRtl ? "Next page" : "Previous page"}
        />
        <button
          className="absolute inset-y-0 right-0 z-10 w-1/3 cursor-e-resize"
          onClick={() => (isRtl ? goBack() : goForward())}
          aria-label={isRtl ? "Previous page" : "Next page"}
        />
        <Image
          src={page.url}
          alt={`Page ${page.page_number}`}
          width={page.width ?? 1000}
          height={page.height ?? 1500}
          priority
          className="max-h-[85vh] w-auto select-none rounded border object-contain"
        />
      </div>

      <div className="flex items-center gap-4" dir={direction}>
        <Button variant="outline" size="icon" onClick={goBack} aria-label="Previous">
          {isRtl ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
        <span className="min-w-20 text-center text-sm tabular-nums text-muted-foreground">
          {index + 1} / {pages.length}
        </span>
        <Button variant="outline" size="icon" onClick={goForward} aria-label="Next">
          {isRtl ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </Button>
      </div>
      {isRtl && (
        <p className="text-xs text-muted-foreground">
          Reading right to left — use ← to advance.
        </p>
      )}
    </div>
  );
}
