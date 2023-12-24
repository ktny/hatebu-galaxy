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

// ブックマーカー情報APIのレスポンス
export interface UserInfoResponse {
  name: string;
  profile_image_url: string;
  total_bookmarks: number;
  private: boolean;
}

// ブックマークごとのスター数取得APIのレスポンス
export interface StarPageResponse {
  entries: StarPageEntry[];
}

// ブックマークごとのスター数
export interface StarPageEntry {
  uri: string;
  stars: StarCount[];
  colored_stars: ColorStarCount[];
}

// ブックマークページAPIのレスポンス
export interface BookmarksPageResponse {
  item: { bookmarks: Bookmark[] };
  pager: {
    pages: { page_path: string; label: string }[];
    next: { label: string; page_path: string; xhr_path: string };
  };
}

// はてなからのブックマーク形式
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

// ギャラクシー内で扱うブックマーク形式
export interface IBookmark {
  eid: string;
  title: string;
  bookmarkCount: number;
  category: string;
  entryURL: string;
  entryBookmarkURL: string;
  commentURL: string;
  created: number;
  comment: string;
  image: string;
  star: AllColorStarCount;
}

export interface fetchBookmarksFromHatenaResponse {
  bookmarks: IBookmark[];
  hasNextPage: boolean;
}

export interface MonthlyBookmarks {
  [yyyymm: string]: IBookmark[];
}

export interface MonthlyAllColorStarCount {
  [yyyymm: string]: AllColorStarCount;
}

export interface BookmarksMap {
  [eid: string]: IBookmark;
}
