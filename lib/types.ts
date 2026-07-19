export type SeriesFormat = "pages" | "webtoon";
export type ReadingDirection = "ltr" | "rtl";
export type SeriesStatus = "ongoing" | "completed" | "hiatus";
export type ChapterStatus = "draft" | "published";

export interface SocialLinks {
  website?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  facebook?: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  country: string | null;
  social_links?: SocialLinks | null;
  created_at: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface Series {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  format: SeriesFormat;
  reading_direction: ReadingDirection;
  language: string;
  status: SeriesStatus;
  view_count: number;
  created_at: string;
  // joined relations (optional depending on query)
  profiles?: Profile;
  genres?: Genre[];
  chapters?: Chapter[];
  likes_count?: number;
}

export interface Chapter {
  id: string;
  series_id: string;
  number: number;
  title: string | null;
  status: ChapterStatus;
  published_at: string | null;
  created_at: string;
  pages?: Page[];
  series?: Series;
}

export interface Page {
  id: string;
  chapter_id: string;
  page_number: number;
  image_path: string;
  width: number | null;
  height: number | null;
}

export interface Comment {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: Profile;
}

export interface Collaborator {
  series_id: string;
  user_id: string;
  role: string;
  profiles?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "new_chapter" | "comment" | "collab_added" | string;
  data: {
    series_title?: string;
    series_slug?: string;
    chapter_number?: number;
    chapter_title?: string | null;
    commenter?: string;
    preview?: string;
    role?: string;
  };
  read: boolean;
  created_at: string;
}

export const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "he", name: "Hebrew", flag: "🇮🇱" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "other", name: "Other", flag: "🌍" },
] as const;

export function languageInfo(code: string) {
  return (
    LANGUAGES.find((l) => l.code === code) ?? {
      code,
      name: code,
      flag: "🌍",
    }
  );
}
