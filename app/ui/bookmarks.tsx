"use client";

import { IBookmark, AllColorStarCount, initalAllColorStarCount, BookmarkData, BookmarksMap } from "@/app/lib/models";
import Bookmark from "./bookmark";
import StarList from "./starList";
import { BOOKMARKS_PER_PAGE, STAR_COLOR_TYPES } from "@/app/constants";
import { useState, useEffect, useCallback, cache } from "react";
import { deepCopy } from "@/app/lib/util";

const pageChunk = 20;

/**
 * はてなからユーザーの月ごとのブックマークを取得する
 * @param username
 * @param startPage
 * @param pageChunk
 * @param cache
 * @returns
 */
async function fetchBookmarksFromHatena(
  username: string,
  startPage: number,
  pageChunk: number
): Promise<BookmarkData | undefined> {
  const res = await fetch(`/api/gather?username=${username}&startPage=${startPage}&pageChunk=${pageChunk}`, {
    cache: "no-store",
  });

  if (res.status < 400) {
    return await res.json();
  }
}

/**
 * ブックマーク結果ファイル一覧を取得する
 * @param username
 * @returns
 */
async function listBookmarkFileName(username: string): Promise<string[]> {
  const res = await fetch(`/api/listFile?username=${username}`);

  if (res.status < 400) {
    return await res.json();
  }
  return [];
}

/**
 * ファイルからユーザーの月ごとのブックマークを取得する
 * @param fileName
 * @returns
 */
async function fetchBookmarksFromFile(fileNames: string[]): Promise<IBookmark[]> {
  const promises: Promise<Response>[] = [];

  // Promise.all用の配列にブックマーク取得用のリクエストを追加;
  for (const fileName of fileNames) {
    try {
      promises.push(fetch(`/api/fetchFile?key=${fileName}`, { cache: "force-cache" }));
    } catch (e) {
      console.error(`/api/fetchFile?key=${fileName}`);
      console.error(e);
    }
  }

  // ブックマークページAPIのレスポンスを取得する
  const responses = await Promise.all(promises);

  let result: IBookmark[] = [];
  for (const response of responses) {
    const data = await response.json();
    result = result.concat(data.bookmarks);
  }

  return result;
}

export default function Bookmarks({ username, totalBookmarks }: { username: string; totalBookmarks: number }) {
  const [bookmarks, setBookmarks] = useState<IBookmark[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalStars, setTotalStars] = useState<AllColorStarCount>(deepCopy(initalAllColorStarCount));
  const [bookmarkCountForDisplay, setBookmarkCountForDisplay] = useState(20);

  /**
   * 再取得用にstateを初期化する
   */
  function initState() {
    setBookmarks([]);
    setProgress(0);
    setTotalStars(deepCopy(initalAllColorStarCount));
    setBookmarkCountForDisplay(20);
  }

  /**
   * 現在のブックマーク取得回数から進捗バーを更新する
   * @param loopCount
   */
  function updateProgressByFetchBookmarkCount(loopCount: number) {
    const bookmarkCountFetched = loopCount * BOOKMARKS_PER_PAGE * pageChunk;
    const progress =
      bookmarkCountFetched > totalBookmarks ? 100 : Math.floor((bookmarkCountFetched / totalBookmarks) * 100);
    setProgress(progress);
  }

  /**
   * ブックマークを再取得する
   * @param cache
   */
  async function reloadBookmarks(cached: boolean = false) {
    // initState();
    let loopCount = 0;

    // キャッシュがあれば直近20ページの更新のみ行う
    if (cached) {
      // 数ページ分のブックマークデータを取得する
      const data = await fetchBookmarksFromHatena(username, 1, pageChunk);
      if (data == undefined) {
        return;
      }

      setBookmarks(bookmarks => {
        const bookmarksMapByEid: BookmarksMap = bookmarks.reduce((acc, bookmark) => {
          acc[bookmark.eid] = bookmark;
          return acc;
        }, {} as BookmarksMap);

        const totalStarCountDiff = deepCopy(initalAllColorStarCount);

        for (const newBookmark of data.bookmarks) {
          // キャッシュから取得した星の数と、直近更新した星の数の差を更新する
          const oldBookmark = bookmarksMapByEid[newBookmark.eid];

          //
          if (oldBookmark === undefined) {
            console.log(newBookmark.eid);
            console.log(oldBookmark);
            continue;
          }

          for (const color of STAR_COLOR_TYPES) {
            const diff = newBookmark.star[color] - oldBookmark.star[color];
            totalStarCountDiff[color] += diff;
          }

          // 直近取得したブックマークのみ、キャッシュのものから置き換える
          bookmarksMapByEid[newBookmark.eid] = newBookmark;
        }

        setTotalStars(totalStars => {
          const _totalStars = deepCopy(totalStars);
          STAR_COLOR_TYPES.forEach(starType => {
            _totalStars[starType] += totalStarCountDiff[starType];
          });
          return _totalStars;
        });

        return Object.values(bookmarksMapByEid);
      });

      setProgress(100);

      // キャッシュがなければ全ブックマークの取得を行う
    } else {
      while (true) {
        const startPage = loopCount * pageChunk + 1;

        // 数ページ分のブックマークデータを取得する
        const data = await fetchBookmarksFromHatena(username, startPage, pageChunk);
        if (data == undefined) {
          break;
        }

        setBookmarks(bookmarks => bookmarks.concat(data.bookmarks));

        setTotalStars(totalStars => {
          const _totalStars = deepCopy(totalStars);
          for (const bookmark of data.bookmarks) {
            STAR_COLOR_TYPES.forEach(starType => {
              _totalStars[starType] += bookmark.star[starType];
            });
          }
          return _totalStars;
        });

        loopCount += 1;
        updateProgressByFetchBookmarkCount(loopCount);

        // ブックマークが取得上限に満たない場合は終了
        if (data.bookmarks.length < 400) {
          setProgress(100);
          break;
        }
      }
    }
  }

  /**
   * キャッシュ済のブックマークを取得する
   */
  async function fetchCachedBookmarks() {
    initState();

    const fileNames = await listBookmarkFileName(username);
    const allFetchedBookmarks = await fetchBookmarksFromFile(fileNames);
    if (allFetchedBookmarks.length === 0) {
      return false;
    }

    setBookmarks(allFetchedBookmarks);
    setTotalStars(totalStars => {
      const _totalStars = deepCopy(totalStars);
      for (const bookmark of allFetchedBookmarks) {
        STAR_COLOR_TYPES.forEach(starType => (_totalStars[starType] += bookmark.star[starType]));
      }
      return _totalStars;
    });

    // キャッシュ済ブックマークが存在したかどうかを返す
    setProgress(99);
    return true;
  }

  /**
   * スクロール時に下端付近までいったら最大表示数を増やす
   */
  const handleScroll = useCallback(() => {
    const documentElement = document.documentElement;
    requestAnimationFrame(() => {
      if (documentElement.scrollHeight - (documentElement.scrollTop + documentElement.clientHeight) < 100) {
        setBookmarkCountForDisplay(count => count + 20);
      }
    });
  }, []);

  useEffect(() => {
    // 過去のキャッシュ済ブックマークがあれば取得する
    fetchCachedBookmarks().then(cached => {
      console.log(cached);
      // 直近のブックマークを更新する
      reloadBookmarks(cached);
    });

    document.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (progress === 0) {
    return (
      <section className="w-full flex justify-center mt-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </section>
    );
  }

  return (
    <section className="mt-4">
      <div>
        <div className="flex items-center gap-4">
          <StarList allColorStarCount={totalStars} forceCountDisplay={true}></StarList>
          <button
            className="btn btn-primary btn-sm shrink-0"
            onClick={() => {
              if (confirm("再取得には時間がかかる可能性があります。再取得しますか？")) {
                reloadBookmarks();
              }
            }}
            disabled={progress < 100}
          >
            再取得
          </button>
        </div>
        <div className="flex items-center gap-2">
          <progress
            className="progress progress-primary w-full"
            value={progress == null ? 0 : progress}
            max="100"
          ></progress>
          <span>{progress}%</span>
        </div>
      </div>

      <ul className="mt-4">
        {bookmarks
          .sort((a, b) => b.star.yellow - a.star.yellow)
          .slice(0, bookmarkCountForDisplay)
          .map((bookmark, i) => (
            <li key={bookmark.eid}>
              <Bookmark username={username} bookmark={bookmark} rank={i + 1}></Bookmark>
            </li>
          ))}
      </ul>
    </section>
  );
}
