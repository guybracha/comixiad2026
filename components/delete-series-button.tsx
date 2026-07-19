"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function DeleteSeriesButton({
  seriesId,
  seriesTitle,
}: {
  seriesId: string;
  seriesTitle: string;
}) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("series").delete().eq("id", seriesId);
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success("Series deleted.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete series
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete “{seriesTitle}”?</DialogTitle>
          <DialogDescription>
            This permanently deletes the series with all chapters, pages, likes and
            comments. Type the series title to confirm.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={seriesTitle}
        />
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={confirmText !== seriesTitle || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting…" : "Delete forever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
