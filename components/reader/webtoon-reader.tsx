import Image from "next/image";

interface ReaderPage {
  page_number: number;
  url: string;
  width: number | null;
  height: number | null;
}

export function WebtoonReader({ pages }: { pages: ReaderPage[] }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      {pages.map((p, i) => (
        <Image
          key={p.page_number}
          src={p.url}
          alt={`Page ${p.page_number}`}
          width={p.width ?? 800}
          height={p.height ?? 1200}
          priority={i < 2}
          loading={i < 2 ? "eager" : "lazy"}
          sizes="(max-width: 768px) 100vw, 768px"
          className="h-auto w-full select-none"
        />
      ))}
    </div>
  );
}
