"use client";

import { ColorTypes, IBookmark, IStarCount, initalStarCount } from "@/app/lib/models";
import Bookmark from "./bookmark";
import StarList from "./starList";
import { BOOKMARKS_PER_PAGE } from "@/app/constants";
import { useState, useEffect, useRef } from "react";
import { deepCopy } from "../lib/util";

const pageChunk = 10;

async function fetchBookmarkData(username: string, page: number, pageChunk: number, cache: RequestCache) {
  const res = await fetch(`/api/gather?username=${username}&page=${page}&pageChunk=${pageChunk}`, { cache });
  const data = await res.json();
  return data;
}

export default function Bookmarks({ username, totalBookmarks }: { username: string; totalBookmarks: number }) {
  const effectRan = useRef(false);
  const [bookmarks, setBookmarks] = useState<IBookmark[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalStars, setTotalStars] = useState<IStarCount>(deepCopy(initalStarCount));
  const [bookmarkCountForDisplay, setBookmarkCountForDisplay] = useState(20);

  /**
   * 再取得用にstateを初期化する
   */
  function initState() {
    setBookmarks([]);
    setProgress(0);
    setTotalStars(deepCopy(initalStarCount));
    setBookmarkCountForDisplay(20);
  }

  /**
   * 進捗バーを更新する
   * @param loopCount
   * @param hasNextPage
   */
  function updateProgress(loopCount: number, hasNextPage: boolean) {
    const bookmarkCountFetched = loopCount * BOOKMARKS_PER_PAGE * pageChunk;
    const progress = !hasNextPage || bookmarkCountFetched > totalBookmarks ? 100 : (bookmarkCountFetched / totalBookmarks) * 100;
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
      setBookmarks((bookmarks) => bookmarks.concat(data.bookmarks));
      setTotalStars((totalStars) => {
        const _totalStars = deepCopy(totalStars);
        ColorTypes.forEach((starType) => {
          _totalStars[starType] += data.totalStars[starType];
        });
        return _totalStars;
      });

      loopCount += 1;
      updateProgress(loopCount, hasNextPage);
    }
  }

  useEffect(() => {
    if (effectRan.current) {
      reloadBookmarks();
    }

    return () => {
      effectRan.current = true;
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
          <StarList starsCount={totalStars} displayIfZero={true}></StarList>
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
        <progress className="progress progress-primary w-full" value={progress == null ? 0 : progress} max="100"></progress>
      </div>
      <ul className="mt-4">
        {bookmarks
          .sort((a, b) => b.star.yellow - a.star.yellow)
          .slice(0, bookmarkCountForDisplay)
          .map((bookmark) => (
            <li key={bookmark.eid}>
              <Bookmark username={username} bookmark={bookmark}></Bookmark>
            </li>
          ))}
      </ul>
    </section>
  );
}
