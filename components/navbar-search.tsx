"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function NavbarSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/browse?q=${encodeURIComponent(q.trim())}` : "/browse");
  }

  return (
    <form onSubmit={submit} className="relative hidden w-full max-w-56 md:block">
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search comics & creators…"
        className="h-9 rounded-full pl-8"
      />
    </form>
  );
}
