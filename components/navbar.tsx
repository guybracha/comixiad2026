import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { NavbarSearch } from "@/components/navbar-search";
import { NotificationsBell } from "@/components/notifications-bell";
import type { Profile } from "@/lib/types";

export async function Navbar() {
  let profile: Profile | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      profile = data;
    }
  } catch {
    // Misconfigured Supabase env must not take down the whole layout;
    // render the logged-out navbar instead.
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <BookOpenText className="size-6 text-primary" />
          <span className="text-gradient">Comixiad</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/browse">Browse</Link>
          </Button>
        </nav>
        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <NavbarSearch />
          {profile ? (
            <>
              <NotificationsBell userId={profile.id} />
              <UserMenu profile={profile} />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
