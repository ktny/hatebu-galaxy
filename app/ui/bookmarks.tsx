"use client";

import { IBookmark, AllColorStarCount, initalAllColorStarCount, BookmarksMap } from "@/app/lib/models";
import Bookmark from "./bookmark";
import StarList from "./starList";
import { BOOKMARKS_PER_PAGE, STAR_COLOR_TYPES } from "@/app/constants";
import { useState, useEffect, useCallback } from "react";
import { deepCopy, getAsiaTokyoDate } from "@/app/lib/util";
import {
  fetchBookmarksFromFile,
  fetchBookmarksFromHatena,
  fetchFirstBookmarkCreated,
  fetchUserInfo,
} from "@/app/api/api";
import { useDebounce } from "use-debounce";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

const pageChunk = 20;

export default function Bookmarks({ username }: { username: string }) {
  const [bookmarks, setBookmarks] = useState<IBookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<IBookmark[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalStars, setTotalStars] = useState<AllColorStarCount>(deepCopy(initalAllColorStarCount));
  const [bookmarkCountForDisplay, setBookmarkCountForDisplay] = useState(20);

  const [keyword, setKeyword] = useState("");
  const [debounceKeyword] = useDebounce(keyword, 500);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  /**
   * 再取得用にstateを初期化する
   */
  function initState() {
    setBookmarks([]);
    setFilteredBookmarks([]);
    setProgress(0);
    setTotalStars(deepCopy(initalAllColorStarCount));
    setBookmarkCountForDisplay(20);
  }

  /**
   * 現在のブックマーク取得回数から進捗バーを更新する
   * @param loopCount
   */
  function updateProgressByFetchBookmarkCount(loopCount: number, totalBookmarks: number) {
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
  async function reloadBookmarks(cache: RequestCache) {
    // キャッシュがあれば直近20ページの更新のみ行う
    if (cache === "no-store") {
      // 数ページ分のブックマークデータを取得する
      const newBookmarks = await fetchBookmarksFromHatena(username, 1, pageChunk, cache);

      updateBookmarkDiff(newBookmarks.bookmarks);
      setProgress(100);

      // キャッシュがなければ全ブックマークの取得を行う（通常は初回）
    } else {
      initState();

      const user = await fetchUserInfo(username);
      if (user === null) {
        window.location.href = "/not-found";
      }

      let loopCount = 0;

      while (user?.total_bookmarks) {
        try {
          const startPage = loopCount * pageChunk + 1;
          loopCount += 1;

          // 数ページ分のブックマークデータを取得する
          const newBookmarks = await fetchBookmarksFromHatena(username, startPage, pageChunk, cache);
          setBookmarks(bookmarks => bookmarks.concat(newBookmarks.bookmarks));
          calcTotalStarCount(newBookmarks.bookmarks.map(b => b.star));

          updateProgressByFetchBookmarkCount(loopCount, user.total_bookmarks);

          // 次のページがない場合は終了
          if (!newBookmarks.hasNextPage) {
            setProgress(100);
            break;
          }
        } catch (e) {
          console.error(e);
        }

        // 念のためのフォールバック
        if (loopCount > 10000) {
          break;
        }
      }
    }
  }

  /**
   * ブックマークファイル名リストを取得する
   * @returns
   */
  async function listBookmarkFileNames(): Promise<string[]> {
    // 最初にブックマークした日付を元に最初の開始年を求める
    const firstBookmarkCreated = await fetchFirstBookmarkCreated(username);
    if (firstBookmarkCreated <= 0) {
      return [];
    }

    const startYear = getAsiaTokyoDate(firstBookmarkCreated).getFullYear();
    const endYear = getAsiaTokyoDate().getFullYear();
    const fileNames = [];

    for (let year = startYear; year <= endYear; year++) {
      fileNames.push(`${username}/${year}.json`);
    }

    return fileNames;
  }

  /**
   * キャッシュ済のブックマークを取得する
   * @returns キャッシュ済のブックマークがあるか
   */
  async function fetchCachedBookmarks(): Promise<boolean> {
    try {
      // キャッシュ用ファイル名の取得を試みる
      const fileNames = await listBookmarkFileNames();
      if (fileNames.length === 0) {
        return false;
      }

      // ブックマークが0件であれば全キャッシュ済でないとして返す
      const allFetchedBookmarks = await fetchBookmarksFromFile(fileNames);
      if (allFetchedBookmarks.length === 0) {
        return false;
      }

      setBookmarks(allFetchedBookmarks);
      calcTotalStarCount(allFetchedBookmarks.map(b => b.star));
      setProgress(99);

      return true;
    } catch (e) {
      return false;
    }
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

  // ページ遷移時にブックマークを取得する
  useEffect(() => {
    initState();

    // 過去のキャッシュ済ブックマークがあれば取得する
    fetchCachedBookmarks().then(cached => {
      // 直近のブックマークを更新する
      reloadBookmarks(cached ? "no-store" : "force-cache");
    });

    document.addEventListener("scroll", handleScroll, { passive: true });
    return () => document.removeEventListener("scroll", handleScroll);
  }, []);

  // ブックマークにフィルターをかける
  useEffect(() => {
    const filteredBookmarks = bookmarks.filter(bookmark => {
      // 開始日～終了日にブックマークコメントが入っている
      const dateFromUnix = dayjs.unix(bookmark.created / 1000);
      const isAfterStartDate = startDate === null || startDate?.isBefore(dateFromUnix);
      const isBeforeEndDate = endDate === null || endDate?.isAfter(dateFromUnix);

      // コメントかタイトルのどちらかにキーワードが入っている
      const includesKeywordInComment = bookmark.comment.includes(debounceKeyword);
      const includesKeywordInTitle = bookmark.title.includes(debounceKeyword);

      return (includesKeywordInComment || includesKeywordInTitle) && isAfterStartDate && isBeforeEndDate;
    });

    setFilteredBookmarks(filteredBookmarks);
  }, [bookmarks, debounceKeyword, startDate, endDate]);

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
            className="btn btn-secondary btn-sm shrink-0"
            onClick={() => {
              if (confirm("再取得には時間がかかる可能性があります。再取得しますか？")) {
                reloadBookmarks("reload");
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

      <div className="flex items-center gap-4 mt-4 flex-wrap md:flex-nowrap">
        <input
          name="keyword"
          placeholder="キーワードで検索"
          className="input input-bordered input-secondary"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <div className="flex gap-2 items-center">
            <DatePicker
              className="bg-base-content rounded-md"
              value={startDate}
              onChange={date => setStartDate(date)}
            />
            <span>～</span>
            <DatePicker className="bg-base-content rounded-md" value={endDate} onChange={date => setEndDate(date)} />
          </div>
        </LocalizationProvider>
      </div>
      <div className="flex justify-end">{filteredBookmarks.length}件</div>

      <ul className="mt-4">
        {filteredBookmarks
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
