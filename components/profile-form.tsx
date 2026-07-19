"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [saving, setSaving] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage("avatars", `${profile.id}/avatar.webp`, file, {
        maxWidthOrHeight: 400,
        maxSizeMB: 0.5,
      });
      setAvatarUrl(url);
      toast.success("Avatar uploaded — remember to save.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return toast.error(
        "Username must be 3-30 characters: lowercase letters, numbers, underscores."
      );
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        display_name: displayName || null,
        bio: bio || null,
        country: country || null,
        avatar_url: avatarUrl,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      if (error.code === "23505") return toast.error("That username is already taken.");
      return toast.error(error.message);
    }
    toast.success("Profile saved.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-20">
          <AvatarImage src={avatarUrl ?? undefined} alt={username} />
          <AvatarFallback className="text-xl">
            {(displayName || username).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="grid gap-2">
          <Label htmlFor="avatar">Avatar</Label>
          <Input
            id="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="max-w-xs"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          required
          pattern="[a-z0-9_]{3,30}"
        />
        <p className="text-xs text-muted-foreground">
          Your public handle: comixiad.com/creator/{username || "username"}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Tell readers about yourself and your work…"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          maxLength={60}
          placeholder="e.g. Japan, Brazil, Israel…"
        />
      </div>

      <Button type="submit" disabled={saving} className="self-start">
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
