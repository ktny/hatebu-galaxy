import {
  type IBookmark,
  type Bookmark,
  type BookmarksPageResponse,
  initalStarCount,
  type IStarCount,
  type StarPageResponse,
  ColorTypes,
} from "@/app/lib/models";
import { deepCopy, excludeProtocolFromURL, extractEIDFromURL, formatDateString } from "@/app/lib/util";
import { BOOKMARKS_PER_PAGE } from "@/app/constants";

const entriesEndpoint = `https://s.hatena.ne.jp/entry.json`;

export class BookmarkStarGatherer {
  username: string;

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

  private buildBookmarksURL(bookmark: Bookmark) {
    const urlWithoutHTTP = excludeProtocolFromURL(bookmark.url);
    return `https://b.hatena.ne.jp/entry/s/${urlWithoutHTTP}`;
  }

  async gather(page: number, pageChunk: number) {
    // 一度に最大で fetchPageChunk * BOOKMARKS_PER_PAGE のブックマークを取得する
    const bulkResult = await this.bulkGatherBookmarks(page, pageChunk);
    const bookmarks = bulkResult.bookmarks;
    const result: {
      bookmarks: IBookmark[];
      totalStars: IStarCount;
      hasNextPage: boolean;
    } = {
      bookmarks: [],
      totalStars: deepCopy(initalStarCount),
      hasNextPage: bulkResult.hasNextPage,
    };

    // この後の処理のため、配列でなくeidをkeyにしたdictでブックマーク情報を保持する
    const bookmarkResults: { [eid: string]: IBookmark } = {};
    for (const bookmark of bookmarks) {
      const dateString = formatDateString(bookmark.created);
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
        star: deepCopy(initalStarCount),
        bookmarksURL,
        commentURL,
      };
    }

    const starData = await this.getStarCounts(bookmarkResults);

    for (const entry of starData) {
      const starCount: IStarCount = deepCopy(initalStarCount);

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

      const eid = extractEIDFromURL(entry.uri);
      if (eid !== null) {
        bookmarkResults[eid] = { ...bookmarkResults[eid], star: starCount };
        ColorTypes.forEach((starType) => {
          result.totalStars[starType] += starCount[starType];
        });
      }
    }

    Object.values(bookmarkResults).forEach((bookmarkResult) => {
      result.bookmarks.push(bookmarkResult);
    });

    return result;
  }
}
