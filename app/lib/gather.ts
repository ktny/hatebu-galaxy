import {
  type IBookmark,
  type Bookmark,
  type BookmarksPageResponse,
  initalAllColorStarCount,
  type AllColorStarCount,
  type StarPageResponse,
  IBookmarker,
  StarPageEntry,
  BookmarksMap,
} from "@/app/lib/models";
import { deepCopy, excludeProtocolFromURL, extractEIDFromURL, formatUTC2AsiaTokyoDateString } from "@/app/lib/util";
import { BOOKMARKS_PER_PAGE } from "@/app/constants";
import { setTimeout } from "timers/promises";

const starPageAPIEndpoint = `https://s.hatena.ne.jp/entry.json`;

export class BookmarkStarGatherer {
  username: string;
  result: IBookmarker = {
    bookmarks: [],
    totalStars: deepCopy(initalAllColorStarCount),
    hasNextPage: false,
  };

  constructor(username: string) {
    this.username = username;
  }

  /**
   * エントリのブックマーク一覧のURLを返す
   * @param bookmark
   * @returns
   */
  private buildEntryBookmarkURL(bookmark: Bookmark): string {
    const urlWithoutHTTP = excludeProtocolFromURL(bookmark.url);
    return `https://b.hatena.ne.jp/entry/s/${urlWithoutHTTP}`;
  }

  /**
   * スター取得用APIのリクエストURLを返す
   * @param commentURLList
   * @returns スター取得用APIのリクエストURL
   */
  private buildStarPageRequestURL(commentURLList: string[]): string {
    const url = new URL(starPageAPIEndpoint);
    const params = new URLSearchParams();
    for (const commentURL of commentURLList) {
      params.append("uri", commentURL);
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
  private async gatherBookmarks(page: number = 1): Promise<BookmarksPageResponse> {
    const url = `https://b.hatena.ne.jp/api/users/${this.username}/bookmarks?page=${page}`;
    const response = await fetch(url);
    const data: BookmarksPageResponse = await response.json();
    return data;
  }

  /**
   * ユーザーの複数ページのブックマーク情報を取得する
   *
   * @param startPage 取得する開始ページ番号
   * @param pageChunk 取得するページ数
   * @returns ブックマーク情報の配列、次のページがあるか
   */
  private async bulkGatherBookmarks(startPage: number, pageChunk: number) {
    const promises: Promise<BookmarksPageResponse>[] = [];

    // Promise.all用の配列にブックマーク取得用のリクエストを追加;
    for (let page = startPage; page < startPage + pageChunk; page++) {
      try {
        promises.push(this.gatherBookmarks(page));
      } catch (e) {
        console.error(`gatherBookmarks(${page})`);
        console.error(e);
      }
    }

    // ブックマークページAPIのレスポンスを取得する
    const bookmarksPagesResponse = await Promise.all(promises);

    // ブックマークコメント単体のURLを生成する
    const buildCommentURL = (eid: string, date: string) =>
      `https://b.hatena.ne.jp/${this.username}/${date}#bookmark-${eid}`;

    // ブックマークページAPIのレスポンスからブックマーク情報を整理する
    for (const bookmarksPageResponse of bookmarksPagesResponse) {
      for (const bookmark of bookmarksPageResponse.item.bookmarks) {
        const dateString = formatUTC2AsiaTokyoDateString(bookmark.created);
        const bookmarkResult: IBookmark = {
          eid: bookmark.location_id,
          title: bookmark.entry.title,
          bookmarkCount: bookmark.entry.total_bookmarks,
          category: bookmark.entry.category.path,
          entryURL: bookmark.url,
          bookmarkDate: dateString,
          comment: bookmark.comment,
          image: bookmark.entry.image,
          star: initalAllColorStarCount,
          entryBookmarkURL: this.buildEntryBookmarkURL(bookmark),
          commentURL: buildCommentURL(bookmark.location_id, dateString.replaceAll("-", "")),
        };

        this.result.bookmarks.push(bookmarkResult);
      }

      // 次ページがなければブックマーク情報の整理を終了する
      this.result.hasNextPage = !!bookmarksPageResponse.pager.next;
      if (!this.result.hasNextPage) {
        break;
      }
    }
  }

  /**
   * ブックマークのスター数を取得してブックマーク情報と紐づける
   */
  private async bulkGatherStarCount() {
    const commentURLList = this.result.bookmarks.map(bookmark => bookmark.commentURL);
    const promises: Promise<Response>[] = [];

    // Promise.all用の配列にスター取得用のリクエストを追加
    for (let i = 0; i < commentURLList.length; i += BOOKMARKS_PER_PAGE) {
      const commentURLListForStar = commentURLList.slice(i, i + BOOKMARKS_PER_PAGE);
      const starPageRequestURL = this.buildStarPageRequestURL(commentURLListForStar);
      promises.push(fetch(starPageRequestURL));
    }

    // ブックマークごとにつけられたスターを一度に取得
    const responses = await Promise.all(promises);

    const bookmarksMapByEid: BookmarksMap = this.result.bookmarks.reduce((acc, bookmark) => {
      acc[bookmark.eid] = bookmark;
      return acc;
    }, {} as BookmarksMap);

    // スター数を集計してブックマーク情報と紐づける
    for (const response of responses) {
      const starPageResponse: StarPageResponse = await response.json();

      for (const starPageEntry of starPageResponse.entries) {
        const starCount = this.totalizeAllColorStarCountByEntry(starPageEntry);
        const eid = extractEIDFromURL(starPageEntry.uri);
        if (eid !== null) {
          bookmarksMapByEid[eid]["star"] = starCount;
        }
      }
    }
  }

  /**
   * ブックマークごとの全色のスター数を集計し最終結果にも追加する
   * @param entry スター集計用エントリー
   */
  private totalizeAllColorStarCountByEntry(entry: StarPageEntry): AllColorStarCount {
    // ブックマークごとのスター集計用の変数を作成
    const starCount: AllColorStarCount = deepCopy(initalAllColorStarCount);

    // 黄色スターを集計する
    for (const star of entry.stars) {
      if (typeof star === "number") {
        starCount.yellow += star;
        this.result.totalStars.yellow += star;
      } else {
        starCount.yellow++;
        this.result.totalStars.yellow++;
      }
    }

    // カラースターを集計する
    if (entry.colored_stars) {
      for (const colorStar of entry.colored_stars) {
        for (const star of colorStar.stars) {
          if (typeof star === "number") {
            starCount[colorStar.color] += star;
            this.result.totalStars[colorStar.color] += star;
          } else {
            starCount[colorStar.color]++;
            this.result.totalStars[colorStar.color]++;
          }
        }
      }
    }

    return starCount;
  }

  async gather(startPage: number, pageChunk: number) {
    // 1s sleep
    await setTimeout(1000);

    // 一度に最大で fetchPageChunk * BOOKMARKS_PER_PAGE のブックマークを取得する
    await this.bulkGatherBookmarks(startPage, pageChunk);

    // 各ブックマークのスターを取得
    await this.bulkGatherStarCount();

    return this.result;
  }
}
