"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BookOpen, MessageSquare, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification } from "@/lib/types";

function notificationText(n: Notification) {
  switch (n.type) {
    case "new_chapter":
      return `New chapter ${n.data.chapter_number} of “${n.data.series_title}”`;
    case "comment":
      return `@${n.data.commenter} commented on “${n.data.series_title}”`;
    case "collab_added":
      return `You were added as a collaborator on “${n.data.series_title}”`;
    default:
      return "New notification";
  }
}

function notificationHref(n: Notification) {
  if (!n.data.series_slug) return "/dashboard";
  if (n.type === "new_chapter" && n.data.chapter_number != null) {
    return `/series/${n.data.series_slug}/${n.data.chapter_number}`;
  }
  return `/series/${n.data.series_slug}`;
}

function NotificationIcon({ type }: { type: string }) {
  const cls = "size-4 shrink-0 text-primary";
  if (type === "new_chapter") return <BookOpen className={cls} />;
  if (type === "comment") return <MessageSquare className={cls} />;
  if (type === "collab_added") return <Users className={cls} />;
  return <Bell className={cls} />;
}

export function NotificationsBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unread = notifications.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  }, [userId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  async function markAllRead() {
    if (unread === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) load();
        else markAllRead();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nothing here yet — follow some comics!
          </p>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} asChild>
              <Link
                href={notificationHref(n)}
                className={`flex items-start gap-2 ${n.read ? "opacity-60" : ""}`}
              >
                <NotificationIcon type={n.type} />
                <span className="min-w-0">
                  <span className="block text-sm leading-snug">
                    {notificationText(n)}
                  </span>
                  {n.data.preview && (
                    <span className="block truncate text-xs text-muted-foreground">
                      “{n.data.preview}”
                    </span>
                  )}
                  <span className="block text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
