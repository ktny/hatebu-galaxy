export interface BookmarkerInfoResponse {
  name: string;
  profile_image_url: string;
  total_bookmarks: number;
  private: boolean;
}

export interface StarPageResponse {
  entries: StarPageEntry[];
}

export interface StarPageEntry {
  uri: string;
  stars: IStar[];
  colored_stars: IColorStar[];
}

export type IStar = number | { quote: string; name: string };

export type IColorStar = {
  color: typeof ColorTypes;
  stars: IStar[];
};

export interface BookmarksPageResponse {
  item: { bookmarks: Bookmark[] };
  pager: {
    pages: { page_path: string; label: string }[];
    next: { label: string; page_path: string; xhr_path: string };
  };
}

export interface Bookmark {
  created: string;
  user: {
    image: { image_url: string };
    name: string;
  };
  entry: {
    title: string;
    canonical_url: string;
    total_bookmarks: number;
    total_comments: number;
    category: { title: string; path: string };
    created_at: string;
    image: string;
  };
  location_id: string;
  url: string;
  canonical_url: string;
  comment: string;
}

export const ColorTypes = ["purple", "blue", "red", "green", "yellow"] as const;

// export type IStarCount = Record<(typeof ColorTypes)[number], number>;

export interface IStarCount {
  yellow: number;
  green: number;
  red: number;
  blue: number;
  purple: number;
}

export const initalStarCount: IStarCount = { yellow: 0, green: 0, red: 0, blue: 0, purple: 0 };

export interface IBookmark {
  eid: string;
  title: string;
  bookmarkCount: number;
  category: string;
  entryURL: string;
  bookmarksURL: string;
  commentURL: string;
  bookmarkDate: string;
  comment: string;
  image: string;
  star: IStarCount;
}

export interface IBookmarker {
  bookmarks: IBookmark[];
  totalStars: number;
}
