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
  MonthlyBookmarks,
} from "@/app/lib/models";
import {
  convertUTC2AsiaTokyo,
  deepCopy,
  excludeProtocolFromURL,
  extractEIDFromURL,
  formatDateString,
} from "@/app/lib/util";
import { BOOKMARKS_PER_PAGE } from "@/app/constants";
import { setTimeout } from "timers/promises";
import { downloadFromS3, uploadToS3 } from "./aws";

const starPageAPIEndpoint = `https://s.hatena.ne.jp/entry.json`;

export class BookmarkStarGatherer {
  username: string;
  monthlyBookmarks: MonthlyBookmarks = {};
  hasNextPage = false;

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
    const bookmarksPagesResponse = await Promise.allSettled(promises);

    // ブックマークコメント単体のURLを生成する
    const buildCommentURL = (eid: string, date: string) =>
      `https://b.hatena.ne.jp/${this.username}/${date}#bookmark-${eid}`;

    // ブックマークページAPIのレスポンスからブックマーク情報を整理する
    for (const bookmarksPageResponse of bookmarksPagesResponse) {
      if (bookmarksPageResponse.status === "rejected") {
        continue;
      }
      for (const bookmark of bookmarksPageResponse.value.item.bookmarks) {
        const createdDate = convertUTC2AsiaTokyo(bookmark.created);
        const dateString = formatDateString(createdDate);

        const bookmarkResult: IBookmark = {
          eid: bookmark.location_id,
          title: bookmark.entry.title,
          bookmarkCount: bookmark.entry.total_bookmarks,
          category: bookmark.entry.category.path,
          entryURL: bookmark.url,
          created: createdDate.getTime(),
          comment: bookmark.comment,
          image: bookmark.entry.image,
          star: deepCopy(initalAllColorStarCount),
          entryBookmarkURL: this.buildEntryBookmarkURL(bookmark),
          commentURL: buildCommentURL(bookmark.location_id, dateString.replaceAll("-", "")),
        };

        const yyyymm = dateString.replace("-", "").slice(0, 6);
        if (yyyymm in this.monthlyBookmarks) {
          this.monthlyBookmarks[yyyymm].push(bookmarkResult);
        } else {
          this.monthlyBookmarks[yyyymm] = [bookmarkResult];
        }
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
    const bookmarks = Object.values(this.monthlyBookmarks).flat();
    const commentURLList = bookmarks.map(bookmark => bookmark.commentURL);
    const promises: Promise<Response>[] = [];

    // Promise.all用の配列にスター取得用のリクエストを追加
    for (let i = 0; i < commentURLList.length; i += BOOKMARKS_PER_PAGE) {
      const commentURLListForStar = commentURLList.slice(i, i + BOOKMARKS_PER_PAGE);
      const starPageRequestURL = this.buildStarPageRequestURL(commentURLListForStar);
      promises.push(fetch(starPageRequestURL));
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

  private async uploadMonthlyBookmarksToS3() {
    for (const yyyymm of Object.keys(this.monthlyBookmarks)) {
      const monthlyBookmarks = this.monthlyBookmarks[yyyymm];
      const key = `${this.username}/${yyyymm}.json`;
      let cachedBookmarks: IBookmark[];

      try {
        // CloudFrontから取得すると初回にその時点のS3ファイルでキャッシュしてしまい不整合が生まれるのでS3から取得する
        cachedBookmarks = await downloadFromS3(key);

        // すでに月ファイルがある場合
        // そのファイルのブックマークと重複する場合は今回ので上書き、ない場合は追加を行う
        // そのファイルのtotalStarに追加を行う
        for (const newBookmark of monthlyBookmarks) {
          const foundIndex = cachedBookmarks.findIndex(bookmark => bookmark.eid === newBookmark.eid);
          if (foundIndex === -1) {
            cachedBookmarks.push(newBookmark);
          } else {
            cachedBookmarks[foundIndex] = newBookmark;
          }
        }
      } catch (err) {
        console.error(`not found s3 file: ${key}`);
        cachedBookmarks = monthlyBookmarks;
      }

      // 取得したデータはファイルに保存してキャッシュする
      uploadToS3(key, cachedBookmarks);
    }
  }

  async gather(startPage: number, pageChunk: number) {
    // 1s sleep
    await setTimeout(1000);

    // 一度に最大で fetchPageChunk * BOOKMARKS_PER_PAGE のブックマークを取得する
    await this.bulkGatherBookmarks(startPage, pageChunk);

    // 各ブックマークのスターを取得
    await this.bulkGatherStarCount();

    // 月ごとのブックマークデータをS3にアップロードする
    await this.uploadMonthlyBookmarksToS3();

    // 次ページがなければ全取得完了のファイルをS3にアップロードする
    if (!this.hasNextPage) {
      await uploadToS3(`${this.username}/completed`);
    }

    return {
      bookmarks: Object.values(this.monthlyBookmarks).flat(),
      hasNextPage: this.hasNextPage,
    };
  }
}
