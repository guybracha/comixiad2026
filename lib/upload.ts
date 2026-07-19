"use client";

import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { publicUrl } from "@/lib/storage";

export interface CompressOptions {
  maxWidthOrHeight?: number;
  maxSizeMB?: number;
}

export async function compressImage(
  file: File,
  { maxWidthOrHeight = 1600, maxSizeMB = 1.5 }: CompressOptions = {}
) {
  return imageCompression(file, {
    maxWidthOrHeight,
    maxSizeMB,
    fileType: "image/webp",
    useWebWorker: true,
    initialQuality: 0.85,
  });
}

export async function getImageDimensions(file: Blob) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Compress + upload an image to a bucket path; returns the public URL. */
export async function uploadImage(
  bucket: string,
  path: string,
  file: File,
  options?: CompressOptions
) {
  const supabase = createClient();
  const compressed = await compressImage(file, options);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, compressed, { upsert: true, contentType: "image/webp" });
  if (error) throw error;
  // Cache-bust since paths are stable and buckets are public/cached.
  return `${publicUrl(bucket, path)}?v=${Date.now()}`;
}
