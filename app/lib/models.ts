// 全色の星の数
export interface AllColorStarCount {
  yellow: number;
  green: number;
  red: number;
  blue: number;
  purple: number;
}

// 全色の星の数の初期値
export const initalAllColorStarCount: AllColorStarCount = { yellow: 0, green: 0, red: 0, blue: 0, purple: 0 };

// はてなからレスポンスされる星の数
export type StarCount = number | { quote: string; name: string };

// はてなからレスポンスされる色ごとの星の数
export type ColorStarCount = {
  color: keyof AllColorStarCount;
  stars: StarCount[];
};

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
  stars: StarCount[];
  colored_stars: ColorStarCount[];
}

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
  star: AllColorStarCount;
}

export interface IBookmarker {
  bookmarks: IBookmark[];
  totalStars: AllColorStarCount;
  hasNextPage: boolean;
}

export interface BookmarksMap {
  [eid: string]: IBookmark;
}
