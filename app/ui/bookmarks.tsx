"use client";

import { IBookmark, AllColorStarCount, initalAllColorStarCount, BookmarksMap } from "@/app/lib/models";
import Bookmark from "./bookmark";
import StarList from "./starList";
import { BOOKMARKS_PER_PAGE, STAR_COLOR_TYPES } from "@/app/constants";
import { useState, useEffect, useCallback } from "react";
import { deepCopy } from "@/app/lib/util";
import { fetchBookmarksFromFile, fetchBookmarksFromHatena, listBookmarkFileName } from "@/app/api/api";

const pageChunk = 20;

export default function Bookmarks({ username, totalBookmarks }: { username: string; totalBookmarks: number }) {
  const completedFileName = `${username}/completed`;

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
   * 個々のスター数を総計数に合算する
   * @param starCountList 個々のスター数のリスト
   */
  function calcTotalStarCount(starCountList: AllColorStarCount[]) {
    setTotalStars(totalStars => {
      const copiedTotalStars = deepCopy(totalStars);
      for (const starCount of starCountList) {
        for (const color of STAR_COLOR_TYPES) {
          copiedTotalStars[color] += starCount[color];
        }
      }
      return copiedTotalStars;
    });
  }

  /**
   * 新しく取得したブックマーク分との差分を更新する
   * @param newBookmarks
   */
  function updateBookmarkDiff(newBookmarks: IBookmark[]) {
    setBookmarks(bookmarks => {
      const bookmarksMapByEid: BookmarksMap = bookmarks.reduce((acc, bookmark) => {
        acc[bookmark.eid] = bookmark;
        return acc;
      }, {} as BookmarksMap);

      const totalStarCountDiff = deepCopy(initalAllColorStarCount);

      for (const newBookmark of newBookmarks) {
        // キャッシュから取得した星の数と、直近更新した星の数の差を更新する
        const oldBookmark = bookmarksMapByEid[newBookmark.eid];

        for (const color of STAR_COLOR_TYPES) {
          if (oldBookmark === undefined) {
            totalStarCountDiff[color] += newBookmark.star[color];
          } else {
            totalStarCountDiff[color] += newBookmark.star[color] - oldBookmark.star[color];
          }
        }

        // 直近取得したブックマークのみ、キャッシュのものから置き換える
        bookmarksMapByEid[newBookmark.eid] = newBookmark;
      }

      calcTotalStarCount([totalStarCountDiff]);

      return Object.values(bookmarksMapByEid);
    });
  }

  /**
   * ブックマークを再取得する
   * @param cache
   */
  async function reloadBookmarks(cached: boolean = false) {
    if (!cached) {
      initState();
    }

    // キャッシュがあれば直近20ページの更新のみ行う
    if (cached) {
      // 数ページ分のブックマークデータを取得する
      const newBookmarks = await fetchBookmarksFromHatena(username, 1, 5, "no-store");

      updateBookmarkDiff(newBookmarks.bookmarks);
      setProgress(100);

      // キャッシュがなければ全ブックマークの取得を行う（通常は初回）
    } else {
      let loopCount = 0;

      while (true) {
        const startPage = loopCount * pageChunk + 1;

        // 数ページ分のブックマークデータを取得する
        const newBookmarks = await fetchBookmarksFromHatena(username, startPage, pageChunk, "no-store");
        setBookmarks(bookmarks => bookmarks.concat(newBookmarks.bookmarks));
        calcTotalStarCount(newBookmarks.bookmarks.map(b => b.star));

        loopCount += 1;
        updateProgressByFetchBookmarkCount(loopCount);

        // 次のページがない場合は終了
        if (!newBookmarks.hasNextPage) {
          setProgress(100);
          break;
        }
      }
    }
  }

  /**
   * キャッシュ済のブックマークを取得する
   */
  async function fetchCachedBookmarks(): Promise<boolean> {
    // S3バケットからファイル名を取得し、completedファイルがなければ全キャッシュ済でないとして返す
    const fileNames = await listBookmarkFileName(username);
    if (!fileNames.includes(completedFileName)) {
      return false;
    }

    // ブックマークが0件であれば全キャッシュ済でないとして返す
    const allFetchedBookmarks = await fetchBookmarksFromFile(
      fileNames.filter(fileName => fileName !== completedFileName)
    );
    if (allFetchedBookmarks.length === 0) {
      return false;
    }

    setBookmarks(allFetchedBookmarks);
    calcTotalStarCount(allFetchedBookmarks.map(b => b.star));
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
    initState();

    // 過去のキャッシュ済ブックマークがあれば取得する
    fetchCachedBookmarks().then(cached => {
      // 直近のブックマークを更新する
      reloadBookmarks(cached);
    });

    document.addEventListener("scroll", handleScroll, { passive: true });
    return () => document.removeEventListener("scroll", handleScroll);
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
                reloadBookmarks(false);
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
