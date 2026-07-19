"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isConfigError =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-32 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      {isConfigError ? (
        <p className="max-w-md text-muted-foreground">
          The site isn&apos;t fully configured yet: the Supabase environment
          variables (<code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) are missing. Add them in
          your hosting settings and redeploy.
        </p>
      ) : (
        <p className="max-w-md text-muted-foreground">
          An unexpected error occurred. Please try again.
          {error.digest && (
            <span className="mt-2 block text-xs">Error code: {error.digest}</span>
          )}
        </p>
      )}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
