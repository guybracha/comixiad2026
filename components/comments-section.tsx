"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Comment } from "@/lib/types";

interface Props {
  chapterId: string;
  userId: string | null;
  comments: Comment[];
}

export function CommentsSection({ chapterId, userId, comments }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      return router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
    }
    if (!body.trim()) return;
    setPosting(true);
    const supabase = createClient();
    const { error } = await supabase.from("comments").insert({
      chapter_id: chapterId,
      user_id: userId,
      body: body.trim(),
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setBody("");
    router.refresh();
  }

  async function remove(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    router.refresh();
  }

  return (
    <section className="mx-auto w-full max-w-3xl">
      <h2 className="mb-4 text-lg font-bold">
        Comments ({comments.length})
      </h2>

      <form onSubmit={post} className="mb-6 flex flex-col gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={userId ? "Share your thoughts…" : "Log in to comment"}
          maxLength={2000}
          rows={3}
        />
        <Button
          type="submit"
          disabled={posting || (!!userId && !body.trim())}
          className="self-end"
        >
          {userId ? (posting ? "Posting…" : "Post comment") : "Log in to comment"}
        </Button>
      </form>

      <div className="flex flex-col gap-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
              <AvatarFallback>
                {(c.profiles?.username ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <Link
                  href={`/creator/${c.profiles?.username}`}
                  className="font-medium hover:underline"
                >
                  {c.profiles?.display_name ?? c.profiles?.username}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {c.user_id === userId && (
                  <button
                    onClick={() => remove(c.id)}
                    className="ml-auto text-muted-foreground hover:text-destructive"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
              <p className="whitespace-pre-line text-sm">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
