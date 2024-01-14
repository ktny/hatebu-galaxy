import {
  type IBookmark,
  type Bookmark,
  type BookmarksPageResponse,
  initalAllColorStarCount,
  type AllColorStarCount,
  type StarPageResponse,
  StarPageEntry,
  BookmarksMap,
  StarCount,
  YearlyBookmarks,
} from "@/app/lib/models";
import { getAsiaTokyoDate, deepCopy, extractEIDFromURL, formatDateString } from "@/app/lib/util";
import { BOOKMARKS_PER_PAGE } from "@/app/constants";
import { setTimeout } from "timers/promises";
import { downloadFromCloudFront, putItemToDynamo, uploadToS3 } from "./aws";

const starPageAPIEndpoint = `https://s.hatena.ne.jp/entry.json`;

export class BookmarkStarGatherer {
  username: string;
  yearlyBookmarks: YearlyBookmarks = {};
  hasNextPage = false;
  firstBookmarkCreated = 0;

  constructor(username: string) {
    this.username = username;
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
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000), // 30sにtimoutを伸ばす
    });
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
    const bookmarksPagesResponse = await Promise.allSettled(promises);

    // ブックマークコメント単体のURLを生成する
    const buildCommentURL = (eid: string, date: string) =>
      `https://b.hatena.ne.jp/${this.username}/${date}#bookmark-${eid}`;

    // ブックマークページAPIのレスポンスからブックマーク情報を整理する
    for (const bookmarksPageResponse of bookmarksPagesResponse) {
      if (bookmarksPageResponse.status === "rejected") {
        continue;
      }
      const bookmarks = bookmarksPageResponse.value.item.bookmarks;

      for (const bookmark of bookmarks) {
        const createdDate = getAsiaTokyoDate(bookmark.created);
        const dateString = formatDateString(createdDate);
        const createdUnixTime = createdDate.getTime();

        const bookmarkResult: IBookmark = {
          eid: bookmark.location_id,
          title: bookmark.entry.title,
          bookmarkCount: bookmark.entry.total_bookmarks,
          category: bookmark.entry.category.path,
          entryURL: bookmark.url,
          created: createdUnixTime,
          comment: bookmark.comment,
          image: bookmark.entry.image,
          star: deepCopy(initalAllColorStarCount),
          commentURL: buildCommentURL(bookmark.location_id, dateString.replaceAll("-", "")),
        };

        const yyyy = dateString.replace("-", "").slice(0, 4);
        if (yyyy in this.yearlyBookmarks) {
          this.yearlyBookmarks[yyyy].push(bookmarkResult);
        } else {
          this.yearlyBookmarks[yyyy] = [bookmarkResult];
        }

        this.firstBookmarkCreated = createdUnixTime;
      }

      // 次ページがなければブックマーク情報の整理を終了する
      this.hasNextPage = !!bookmarksPageResponse.value.pager.next;
      if (!this.hasNextPage) {
        break;
      }
    }
  }

  /**
   * ブックマークのスター数を取得してブックマーク情報と紐づける
   */
  private async bulkGatherStarCount() {
    const bookmarks = Object.values(this.yearlyBookmarks).flat();
    const commentURLList = bookmarks.map(bookmark => bookmark.commentURL);
    const promises: Promise<Response>[] = [];

    // Promise.all用の配列にスター取得用のリクエストを追加
    for (let i = 0; i < commentURLList.length; i += BOOKMARKS_PER_PAGE) {
      const commentURLListForStar = commentURLList.slice(i, i + BOOKMARKS_PER_PAGE);
      const starPageRequestURL = this.buildStarPageRequestURL(commentURLListForStar);
      promises.push(
        fetch(starPageRequestURL, {
          signal: AbortSignal.timeout(30000), // 30sにtimoutを伸ばす
        })
      );
    }

    // ブックマークごとにつけられたスターを一度に取得
    const responses = await Promise.allSettled(promises);

    const bookmarksMapByEid: BookmarksMap = bookmarks.reduce((acc, bookmark) => {
      acc[bookmark.eid] = bookmark;
      return acc;
    }, {} as BookmarksMap);

    // スター数を集計してブックマーク情報と紐づける
    for (const response of responses) {
      if (response.status === "rejected") {
        continue;
      }
      const starPageResponse: StarPageResponse = await response.value.json();

      for (const starPageEntry of starPageResponse.entries) {
        const eid = extractEIDFromURL(starPageEntry.uri);
        if (eid !== null) {
          const starCount = this.totalizeAllColorStarCountByEntry(bookmarksMapByEid[eid].star, starPageEntry);
          bookmarksMapByEid[eid].star = starCount;
        }
      }
    }
  }

  private incrementStarCount(allColorStarCount: AllColorStarCount, color: keyof AllColorStarCount, count: StarCount) {
    if (typeof count === "number") {
      allColorStarCount[color] += count;
    } else {
      allColorStarCount[color]++;
    }
  }

  /**
   * ブックマークごとの全色のスター数を集計する
   * @param starCount ックマークごとのスター集計用変数
   * @param entry スター集計用エントリー
   */
  private totalizeAllColorStarCountByEntry(starCount: AllColorStarCount, entry: StarPageEntry): AllColorStarCount {
    // 黄色スターを集計する
    for (const star of entry.stars) {
      this.incrementStarCount(starCount, "yellow", star);
    }

    // カラースターを集計する
    if (entry.colored_stars) {
      for (const colorStar of entry.colored_stars) {
        for (const star of colorStar.stars) {
          this.incrementStarCount(starCount, colorStar.color, star);
        }
      }
    }

    return starCount;
  }

  private async uploadBookmarksToS3() {
    for (const yyyy of Object.keys(this.yearlyBookmarks)) {
      const yearlyBookmarks = this.yearlyBookmarks[yyyy];
      const key = `${this.username}/${yyyy}.json`;
      let cachedBookmarks: IBookmark[];

      try {
        // CloudFrontから取得すると初回にその時点のS3ファイルでキャッシュしてしまい不整合が生まれるのでS3から取得する
        //
        const timestamp = new Date().getTime();
        cachedBookmarks = await downloadFromCloudFront(key, timestamp);

        // すでに年ファイルがある場合
        // そのファイルのブックマークと重複する場合は今回ので上書き、ない場合は追加を行う
        // そのファイルのtotalStarに追加を行う
        for (const newBookmark of yearlyBookmarks) {
          const foundIndex = cachedBookmarks.findIndex(bookmark => bookmark.eid === newBookmark.eid);
          if (foundIndex === -1) {
            cachedBookmarks.push(newBookmark);
          } else {
            cachedBookmarks[foundIndex] = newBookmark;
          }
        }
      } catch (err) {
        cachedBookmarks = yearlyBookmarks;
      }

      // 取得したデータはファイルに保存してキャッシュする
      await uploadToS3(key, cachedBookmarks);
    }
  }

  async gather(startPage: number, pageChunk: number) {
    // 1s sleep
    await setTimeout(1000);

    try {
      // 一度に最大で fetchPageChunk * BOOKMARKS_PER_PAGE のブックマークを取得する
      await this.bulkGatherBookmarks(startPage, pageChunk);

      // 各ブックマークのスターを取得
      await this.bulkGatherStarCount();

      // 年ごとのブックマークデータをS3にアップロードする
      await this.uploadBookmarksToS3();

      // 次ページがなければ全取得完了のファイルをS3にアップロードする
      if (!this.hasNextPage) {
        putItemToDynamo(this.username, this.firstBookmarkCreated);
      }

      return {
        bookmarks: Object.values(this.yearlyBookmarks).flat(),
        hasNextPage: this.hasNextPage,
      };
    } catch (e) {
      console.error(e);

      // いったん現時点のブックマークを返す
      // TODO: リトライ対応
      return {
        bookmarks: Object.values(this.yearlyBookmarks).flat(),
        hasNextPage: this.hasNextPage,
      };
    }
  }
}
