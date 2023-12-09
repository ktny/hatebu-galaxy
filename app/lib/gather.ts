import { type IBookmark, type Bookmark, type BookmarksPageResponse, type IBookmarker, initalStarCount, type IStarCount, type StarPageResponse } from "./models";

const entriesEndpoint = `https://s.hatena.ne.jp/entry.json`;

// ブックマーク一覧の1ページに存在するブックマーク数（はてなブックマークの仕様）
const BOOKMARKS_PER_PAGE = 20;

// 一度に取得するブックマークページの数
const FETCH_PAGE_CHUNK = 5;

export class BookmarkStarGatherer {
  username: string;
  currentPage = 1;
  progress = 0;
  bookmarkerData: IBookmarker = {
    bookmarks: [],
    totalBookmarks: 0, // 最初に1回返せばよい
    totalStars: 0, // フロントで計算する？無駄か
  };

  constructor(username: string) {
    this.username = username;
  }

  private buildURL(baseURL: string, uris: string[]) {
    const url = new URL(baseURL);
    const params = new URLSearchParams();
    for (const uri of uris) {
      params.append("uri", uri);
    }
    params.append("no_comments", "1");
    url.search = params.toString();
    return url.toString();
  }

  private async fetchTotalBookmarks(): Promise<number> {
    const url = `https://b.hatena.ne.jp/api/internal/cambridge/user/${this.username}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.user.total_bookmarks;
  }

  /**
   * ユーザーの各ページのブックマーク情報を取得する。1ページにつき最大20ブックマーク情報取得する
   *
   * @param page 取得するページ番号
   * @returns ブックマーク情報の配列
   */
  private async gatherBookmarks(page: number = 1) {
    const url = `https://b.hatena.ne.jp/api/users/${this.username}/bookmarks?page=${page}`;
    const response = await fetch(url);
    const data: BookmarksPageResponse = await response.json();
    return data;
  }

  /**
   * ユーザーの複数ページのブックマーク情報を取得する
   *
   * @param startPage 取得する開始ページ番号
   * @param pageCount 取得するページ数
   * @returns ブックマーク情報の配列、次のページがあるか
   */
  private async bulkGatherBookmarks(startPage: number, pageCount: number) {
    const promises = [];
    for (let page = startPage; page < startPage + pageCount; page++) {
      promises.push(this.gatherBookmarks(page));
    }
    const bookmarksPagesResponse = await Promise.all(promises);

    const bookmarks: Bookmark[] = [];
    let hasNextPage = false;
    for (const bookmarksPageResponse of bookmarksPagesResponse) {
      bookmarks.push(...bookmarksPageResponse.item.bookmarks);
      hasNextPage = !!bookmarksPageResponse.pager.next;
      if (!hasNextPage) {
        break;
      }
    }

    return {
      bookmarks,
      hasNextPage,
    };
  }

  /**
   * YYYY-MM-DD形式に変換する
   * @param dateString
   * @returns
   */
  private formatDateString(dateString: string): string {
    // 文字列をDateオブジェクトに変換
    const originalDate = new Date(dateString);

    // 年月日を取得
    const year = originalDate.getFullYear();
    const month = (originalDate.getMonth() + 1).toString().padStart(2, "0"); // 月は0から始まるため+1
    const day = originalDate.getDate().toString().padStart(2, "0");
    const date = `${year}-${month}-${day}`;
    return date;
  }

  private buildCommentURL(bookmark: Bookmark, date: string) {
    return `https://b.hatena.ne.jp/${this.username}/${date}#bookmark-${bookmark.location_id}`;
  }

  private async getStarCounts(bookmarkResults: { [eid: number]: IBookmark }) {
    const commentURLs = Object.values(bookmarkResults).map((bookmark) => bookmark.commentURL);

    const promises: Promise<Response>[] = [];
    for (let i = 0; i < commentURLs.length; i += BOOKMARKS_PER_PAGE) {
      const sliceUris = commentURLs.slice(i, i + BOOKMARKS_PER_PAGE);
      const entriesURL = this.buildURL(entriesEndpoint, sliceUris);
      promises.push(fetch(entriesURL));
    }

    const entries = [];
    const responses = await Promise.all(promises);
    for (const response of responses) {
      const entriesData: StarPageResponse = await response.json();
      if (entriesData.entries?.length > 0) {
        entries.push(...entriesData.entries);
      }
    }

    return entries;
  }

  getInProgressBookmarkerData() {
    return { bookmarkerData: this.bookmarkerData, progress: this.progress };
  }

  private calcTotalStarCount(starCount: IStarCount): number {
    return Object.values(starCount).reduce((acc, cur) => acc + cur);
  }

  private calcProgress(): number {
    const currentBookmarks = this.currentPage * BOOKMARKS_PER_PAGE;
    const progress = currentBookmarks / this.bookmarkerData.totalBookmarks;
    console.log(`${this.currentPage} page ${progress} progress`);
    return progress > 1 ? 1 : progress;
  }

  private sortBookmarksByStarCount() {
    this.bookmarkerData.bookmarks.sort((a, b) => b.star.yellow - a.star.yellow);
  }

  private excludeProtocolFromURL(url: string) {
    return url.replace("http://", "").replace("https://", "");
  }

  private buildBookmarksURL(bookmark: Bookmark) {
    const urlWithoutHTTP = this.excludeProtocolFromURL(bookmark.url);
    return `https://b.hatena.ne.jp/entry/s/${urlWithoutHTTP}`;
  }

  private extractEIDFromURL(url: string): string | null {
    // #bookmark-のインデックスを取得
    const keyword = "#bookmark-";
    const index = url.indexOf(keyword);

    // #bookmark-が見つかった場合
    if (index !== -1) {
      return url.substring(index + keyword.length);
    }

    return null;
  }

  async main() {
    console.log("start");
    let hasNextPage = true;

    // ブックマーカーの基礎情報を取得
    const totalBookmarks = await this.fetchTotalBookmarks();
    this.bookmarkerData = {
      bookmarks: [],
      totalBookmarks,
      totalStars: 0,
    };

    let loopCount = 1;
    while (hasNextPage) {
      console.log(this.currentPage);

      // 一度に最大で fetchPageChunk * BOOKMARKS_PER_PAGE のブックマークを取得する
      const bulkResult = await this.bulkGatherBookmarks(this.currentPage, FETCH_PAGE_CHUNK);
      const bookmarks = bulkResult.bookmarks;
      hasNextPage = bulkResult.hasNextPage;

      // この後の処理のため、配列でなくeidをkeyにしたdictでブックマーク情報を保持する
      const bookmarkResults: { [eid: string]: IBookmark } = {};
      for (const bookmark of bookmarks) {
        const dateString = this.formatDateString(bookmark.created);
        const commentURL = this.buildCommentURL(bookmark, dateString.replaceAll("-", ""));
        const bookmarksURL = this.buildBookmarksURL(bookmark);

        bookmarkResults[bookmark.location_id] = {
          eid: bookmark.location_id,
          title: bookmark.entry.title,
          bookmarkCount: bookmark.entry.total_bookmarks,
          category: bookmark.entry.category.path,
          entryURL: bookmark.url,
          bookmarkDate: dateString,
          comment: bookmark.comment,
          image: bookmark.entry.image,
          star: initalStarCount,
          bookmarksURL,
          commentURL,
        };
      }

      const starData = await this.getStarCounts(bookmarkResults);

      for (const entry of starData) {
        const starCount: IStarCount = {
          yellow: 0,
          green: 0,
          red: 0,
          blue: 0,
          purple: 0,
        };

        for (const star of entry.stars) {
          if (typeof star === "number") {
            starCount.yellow += star;
          } else {
            starCount.yellow++;
          }
        }

        if (entry.colored_stars) {
          for (const colorStar of entry.colored_stars) {
            for (const star of colorStar.stars) {
              if (typeof star === "number") {
                starCount[colorStar.color] += star;
              } else {
                starCount[colorStar.color]++;
              }
            }
          }
        }

        const eid = this.extractEIDFromURL(entry.uri);
        if (eid !== null) {
          bookmarkResults[eid] = { ...bookmarkResults[eid], star: starCount };
          this.bookmarkerData.totalStars += this.calcTotalStarCount(starCount);
        }
      }

      Object.values(bookmarkResults).forEach((bookmarkResult) => {
        this.bookmarkerData.bookmarks.push(bookmarkResult);
      });

      if (!hasNextPage || this.currentPage >= 20) {
        this.progress = 1;
        break;
      }

      // 5ループごとにブックマークをソートする
      if (loopCount % 5 === 0) {
        this.sortBookmarksByStarCount();
      }

      loopCount += 1;
      this.currentPage += FETCH_PAGE_CHUNK;
      this.progress = this.calcProgress();
    }

    // ソートはフロントで常にやるという手もあるか？
    this.sortBookmarksByStarCount();
    return this.bookmarkerData;
  }
}
