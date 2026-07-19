import Link from "next/link";
import { BookOpenText } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <Link href="/" className="flex items-center justify-center gap-2 font-bold sm:justify-start">
            <BookOpenText className="size-5 text-primary" />
            <span className="text-gradient">Comixiad</span>
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            Comics from every corner of the world.
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/browse" className="hover:text-foreground">
            Browse
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            Become a creator
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Log in
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Comixiad
        </p>
      </div>
    </footer>
  );
}
