"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Collaborator } from "@/lib/types";

interface Props {
  seriesId: string;
  collaborators: Collaborator[];
}

export function CollaboratorsManager({ seriesId, collaborators }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const name = username.trim().toLowerCase().replace(/^@/, "");
    if (!name) return;
    setBusy(true);
    const supabase = createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", name)
      .maybeSingle();
    if (!profile) {
      setBusy(false);
      return toast.error(`No creator found with username @${name}.`);
    }

    const { error } = await supabase.from("series_collaborators").insert({
      series_id: seriesId,
      user_id: profile.id,
      role: role.trim() || "Collaborator",
    });
    setBusy(false);
    if (error) {
      if (error.code === "23505") return toast.error("Already a collaborator.");
      return toast.error(error.message);
    }
    toast.success(`@${profile.username} added as a collaborator.`);
    setUsername("");
    setRole("");
    router.refresh();
  }

  async function remove(userId: string, name?: string) {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("series_collaborators")
      .delete()
      .eq("series_id", seriesId)
      .eq("user_id", userId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${name ? `@${name}` : "Collaborator"} removed.`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Collaborators appear on the series page and can upload and manage
        chapters. Add them by their Comixiad username.
      </p>

      {collaborators.length > 0 && (
        <div className="flex flex-col gap-2">
          {collaborators.map((c) => (
            <div
              key={c.user_id}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <Avatar className="size-8">
                <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                <AvatarFallback>
                  {(c.profiles?.username ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/creator/${c.profiles?.username}`}
                  className="text-sm font-medium hover:underline"
                >
                  {c.profiles?.display_name ?? c.profiles?.username}
                </Link>
                <p className="text-xs text-muted-foreground">{c.role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={busy}
                onClick={() => remove(c.user_id, c.profiles?.username)}
                aria-label="Remove collaborator"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={add} className="flex flex-wrap items-center gap-2">
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          className="w-40"
        />
        <Input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role (e.g. Artist, Writer)"
          maxLength={40}
          className="w-48"
        />
        <Button type="submit" variant="outline" disabled={busy || !username.trim()}>
          <UserPlus className="size-4" /> Add
        </Button>
      </form>
    </div>
  );
}
