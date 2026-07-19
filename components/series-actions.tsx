"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Heart } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  seriesId: string;
  userId: string | null;
  initialLiked: boolean;
  initialFollowing: boolean;
  likeCount: number;
  followerCount: number;
}

export function SeriesActions({
  seriesId,
  userId,
  initialLiked,
  initialFollowing,
  likeCount,
  followerCount,
}: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [following, setFollowing] = useState(initialFollowing);
  const [likes, setLikes] = useState(likeCount);
  const [followers, setFollowers] = useState(followerCount);

  function requireAuth() {
    if (userId) return true;
    router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
    return false;
  }

  async function toggleLike() {
    if (!requireAuth()) return;
    const supabase = createClient();
    if (liked) {
      setLiked(false);
      setLikes((n) => n - 1);
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId!)
        .eq("series_id", seriesId);
      if (error) toast.error(error.message);
    } else {
      setLiked(true);
      setLikes((n) => n + 1);
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: userId!, series_id: seriesId });
      if (error) toast.error(error.message);
    }
  }

  async function toggleFollow() {
    if (!requireAuth()) return;
    const supabase = createClient();
    if (following) {
      setFollowing(false);
      setFollowers((n) => n - 1);
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userId!)
        .eq("series_id", seriesId);
      if (error) toast.error(error.message);
    } else {
      setFollowing(true);
      setFollowers((n) => n + 1);
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: userId!, series_id: seriesId });
      if (error) toast.error(error.message);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={liked ? "default" : "outline"} size="sm" onClick={toggleLike}>
        <Heart className={cn("size-4", liked && "fill-current")} />
        {likes} {likes === 1 ? "like" : "likes"}
      </Button>
      <Button
        variant={following ? "secondary" : "outline"}
        size="sm"
        onClick={toggleFollow}
      >
        {following ? <BellOff className="size-4" /> : <Bell className="size-4" />}
        {following ? "Following" : "Follow"} · {followers}
      </Button>
    </div>
  );
}
