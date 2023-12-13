"use client";

import { IBookmark, AllColorStarCount, initalAllColorStarCount, IBookmarker } from "@/app/lib/models";
import Bookmark from "./bookmark";
import StarList from "./starList";
import { BOOKMARKS_PER_PAGE, STAR_COLOR_TYPES } from "@/app/constants";
import { useState, useEffect, useCallback } from "react";
import { deepCopy } from "@/app/lib/util";

const pageChunk = 10;

async function fetchBookmarkData(
  username: string,
  page: number,
  pageChunk: number,
  cache: RequestCache
): Promise<IBookmarker> {
  const res = await fetch(`/api/gather?username=${username}&page=${page}&pageChunk=${pageChunk}`, { cache });
  const data = await res.json();
  return data;
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
   * 進捗バーを更新する
   * @param loopCount
   * @param hasNextPage
   */
  function updateProgress(loopCount: number, hasNextPage: boolean) {
    const bookmarkCountFetched = loopCount * BOOKMARKS_PER_PAGE * pageChunk;
    const progress =
      !hasNextPage || bookmarkCountFetched > totalBookmarks
        ? 100
        : Math.floor((bookmarkCountFetched / totalBookmarks) * 100);
    setProgress(progress);
  }

  /**
   * ブックマークを再取得する
   * @param cache
   */
  async function reloadBookmarks(cache: RequestCache = "force-cache") {
    initState();
    let loopCount = 0;
    let hasNextPage = true;

    while (hasNextPage) {
      const startPage = loopCount * pageChunk + 1;
      const data = await fetchBookmarkData(username, startPage, pageChunk, cache);
      hasNextPage = data.hasNextPage;
      setBookmarks(bookmarks => bookmarks.concat(data.bookmarks));
      setTotalStars(totalStars => {
        const _totalStars = deepCopy(totalStars);
        STAR_COLOR_TYPES.forEach(starType => {
          _totalStars[starType] += data.totalStars[starType];
        });
        return _totalStars;
      });

      loopCount += 1;
      updateProgress(loopCount, hasNextPage);
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

  useEffect(() => {
    reloadBookmarks();
    document.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (progress === 0) {
    return (
      <section className="flex justify-center mt-4">
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

      <ul className="mt-4">
        {bookmarks
          .sort((a, b) => b.star.yellow - a.star.yellow)
          .slice(0, bookmarkCountForDisplay)
          .map(bookmark => (
            <li key={bookmark.eid}>
              <Bookmark username={username} bookmark={bookmark}></Bookmark>
            </li>
          ))}
      </ul>
    </section>
  );
}
