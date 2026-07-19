import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-32 text-center">
      <h1 className="text-6xl font-extrabold text-muted-foreground">404</h1>
      <p className="text-lg">This page doesn&apos;t exist — or it hasn&apos;t been drawn yet.</p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
